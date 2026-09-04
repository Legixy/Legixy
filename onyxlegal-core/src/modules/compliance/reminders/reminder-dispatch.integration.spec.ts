/**
 * Reminder delivery — integration tests against a real PostgreSQL database.
 *
 * The claim mechanism cannot be verified with a mocked Prisma: the guarantee is
 * a conditional UPDATE evaluated by Postgres. A mock would return whatever it
 * was told to and prove nothing.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { ReminderChannel, ReminderStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { LicensesService } from '../licenses/licenses.service';
import { SitesService } from '../sites/sites.service';
import { RemindersService } from './reminders.service';
import { ReminderDispatchService } from './reminder-dispatch.service';
import {
  ReminderMessage,
  ReminderSender,
  SendResult,
} from '../delivery/channel';
import {
  addDays,
  fromPrismaDate,
  todayIn,
  toPrismaDate,
} from '../domain/plain-date';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

/** A sender that records what it was asked to send, and can be made to fail. */
class RecordingSender extends ReminderSender {
  readonly channel = ReminderChannel.EMAIL;
  available = true;
  failWith: string | null = null;
  sent: ReminderMessage[] = [];

  isAvailable(): boolean {
    return this.available;
  }

  send(message: ReminderMessage): Promise<SendResult> {
    if (this.failWith) {
      return Promise.resolve({ ok: false, reason: this.failWith });
    }
    this.sent.push(message);
    return Promise.resolve({ ok: true, channel: this.channel });
  }
}

// A Monday, 11:00 Riyadh — inside the send window.
const INSIDE_WINDOW = new Date(Date.UTC(2026, 8, 7, 8, 0, 0));

describe('Reminder dispatch (integration)', () => {
  let prisma: PrismaService;
  let licenses: LicensesService;
  let sites: SitesService;
  let reminders: RemindersService;
  let sender: RecordingSender;
  let dispatch: ReminderDispatchService;
  let audit: ComplianceAuditService;

  let tenantId: string;
  let otherTenantId: string;
  let ownerId: string;
  let otherOwnerId: string;
  let siteId: string;
  const suffix = Date.now();

  /** Force a reminder's due date so the sweep will pick it up. */
  const makeDue = (reminderId: string, daysAgo = 0) =>
    prisma.licenseReminder.update({
      where: { id: reminderId },
      data: { dueOn: toPrismaDate(addDays('2026-09-07', -daysAgo)) },
    });

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    audit = new ComplianceAuditService(prisma);
    reminders = new RemindersService(prisma);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, reminders);
    sender = new RecordingSender();
    dispatch = new ReminderDispatchService(prisma, sender, audit);

    const makeTenant = async (label: string) => {
      const tenant = await prisma.tenant.create({
        data: { name: `${label}-${suffix}`, timeZone: 'Asia/Riyadh' },
      });
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `${label}-${suffix}@example.test`,
          name: `${label} owner`,
          role: 'OWNER',
        },
      });
      return { tenantId: tenant.id, userId: user.id };
    };

    const a = await makeTenant('dispatch-a');
    const b = await makeTenant('dispatch-b');
    tenantId = a.tenantId;
    ownerId = a.userId;
    otherTenantId = b.tenantId;
    otherOwnerId = b.userId;
    siteId = (await sites.create(tenantId, ownerId, { name: 'Dispatch Site' }))
      .id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant
        .deleteMany({ where: { id: { in: [tenantId, otherTenantId] } } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  beforeEach(() => {
    sender.sent = [];
    sender.failWith = null;
    sender.available = true;
  });

  /** A licence with one reminder forced due, owned unless stated otherwise. */
  const seedDueLicence = async (opts: {
    name: string;
    owner?: string | null;
    daysAgo?: number;
  }) => {
    const licence = await licenses.create(tenantId, ownerId, {
      name: opts.name,
      siteId,
      ownerUserId: opts.owner === undefined ? ownerId : opts.owner,
      expiryDate: addDays('2026-09-07', 200),
    });
    const rows = await prisma.licenseReminder.findMany({
      where: { licenseId: licence.id },
      orderBy: { offsetDays: 'asc' },
    });
    await makeDue(rows[0].id, opts.daysAgo ?? 0);
    return { licence, reminderId: rows[0].id };
  };

  it('selects reminders due on or BEFORE today, not only exactly today', async () => {
    const { reminderId } = await seedDueLicence({
      name: `Overdue ${suffix}`,
      daysAgo: 3, // scheduler was down for three days
    });

    await dispatch.sweep(INSIDE_WINDOW);

    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    // A missed run must not lose the obligation.
    expect(row?.status).toBe(ReminderStatus.SENT);
  });

  it('records sentAt and channel on a real delivery', async () => {
    const { reminderId } = await seedDueLicence({ name: `Sent ${suffix}` });
    await dispatch.sweep(INSIDE_WINDOW);

    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    expect(row?.status).toBe(ReminderStatus.SENT);
    expect(row?.sentAt).toBeInstanceOf(Date);
    expect(row?.channel).toBe(ReminderChannel.EMAIL);
    expect(row?.lockedUntil).toBeNull();
  });

  it('EXACTLY ONE of many concurrent claims on a row succeeds', async () => {
    // THE load-bearing concurrency proof.
    //
    // Racing two whole sweeps is not sufficient: Node is single-threaded, so
    // they may serialise and pass even with the guarantee removed (verified —
    // that version of this test passed with the compare-and-swap disabled).
    // Firing claims concurrently at ONE row tests the actual invariant.
    const { reminderId } = await seedDueLicence({ name: `Claimed ${suffix}` });

    const contenders = Array.from({ length: 8 }, () =>
      dispatch.claim(reminderId, INSIDE_WINDOW),
    );
    const results = await Promise.all(contenders);

    // Without the conditional UPDATE, every contender would win and the
    // reminder would be sent eight times.
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('a claim already held by a live lock cannot be taken again', async () => {
    const { reminderId } = await seedDueLicence({ name: `Locked ${suffix}` });

    expect(await dispatch.claim(reminderId, INSIDE_WINDOW)).toBe(true);
    expect(await dispatch.claim(reminderId, INSIDE_WINDOW)).toBe(false);
  });

  it('an EXPIRED claim is reclaimable, so a dead process strands nothing', async () => {
    const { reminderId } = await seedDueLicence({ name: `Stranded ${suffix}` });

    // A process claims the row and then dies mid-send.
    expect(await dispatch.claim(reminderId, INSIDE_WINDOW)).toBe(true);

    // Ten minutes later the lock has expired; another sweep picks it up.
    const later = new Date(INSIDE_WINDOW.getTime() + 10 * 60 * 1000);
    expect(await dispatch.claim(reminderId, later)).toBe(true);
  });

  it('two concurrent sweeps do not double-send (end to end)', async () => {
    await seedDueLicence({ name: `Concurrent ${suffix}` });

    // Two dispatchers sharing one database, started simultaneously — the
    // shape of two Core instances whose cron fires on the same tick.
    const second = new ReminderDispatchService(prisma, sender, audit);
    await Promise.all([
      dispatch.sweep(INSIDE_WINDOW),
      second.sweep(INSIDE_WINDOW),
    ]);

    const delivered = sender.sent.flatMap((m) => m.lines);
    const forThisLicence = delivered.filter((line) =>
      line.licenseName.startsWith('Concurrent'),
    );
    expect(forThisLicence).toHaveLength(1);
  });

  it('never re-sends a reminder that is already SENT', async () => {
    const { reminderId } = await seedDueLicence({ name: `Once ${suffix}` });
    await dispatch.sweep(INSIDE_WINDOW);
    sender.sent = [];

    // A second sweep, as would happen an hour later or after a crash-restart.
    await dispatch.sweep(INSIDE_WINDOW);
    expect(
      sender.sent
        .flatMap((m) => m.lines)
        .filter((l) => l.licenseName.startsWith('Once')),
    ).toHaveLength(0);

    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    expect(row?.status).toBe(ReminderStatus.SENT);
  });

  it('a failure records the reason, releases the claim, and stays sendable', async () => {
    const { reminderId } = await seedDueLicence({ name: `Failing ${suffix}` });
    sender.failWith = 'SMTP connection refused';

    await dispatch.sweep(INSIDE_WINDOW);

    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    expect(row?.status).toBe(ReminderStatus.PENDING); // retryable
    expect(row?.attemptCount).toBe(1);
    expect(row?.lastError).toContain('SMTP connection refused');
    expect(row?.lockedUntil).toBeNull(); // claim released
  });

  it('retry exhaustion produces a visible terminal FAILED state', async () => {
    const { reminderId } = await seedDueLicence({
      name: `Exhausted ${suffix}`,
    });
    sender.failWith = 'permanent outage';

    await dispatch.sweep(INSIDE_WINDOW);
    await dispatch.sweep(INSIDE_WINDOW);
    await dispatch.sweep(INSIDE_WINDOW);

    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    expect(row?.status).toBe(ReminderStatus.FAILED);
    expect(row?.attemptCount).toBe(3);
    expect(row?.lastError).toContain('permanent outage');
  });

  it('an unassigned licence becomes UNDELIVERABLE and is NEVER marked sent', async () => {
    const { reminderId } = await seedDueLicence({
      name: `Ownerless ${suffix}`,
      owner: null,
    });

    await dispatch.sweep(INSIDE_WINDOW);

    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    expect(row?.status).toBe(ReminderStatus.UNDELIVERABLE);
    expect(row?.sentAt).toBeNull();
    expect(row?.lastError).toMatch(/No owner assigned/);
  });

  it('catch-up sends only the most urgent overdue reminder per licence', async () => {
    const licence = await licenses.create(tenantId, ownerId, {
      name: `Backlog ${suffix}`,
      siteId,
      ownerUserId: ownerId,
      expiryDate: addDays('2026-09-07', 200),
    });
    // Force 90, 60 and 30 all overdue, as after a long outage.
    const rows = await prisma.licenseReminder.findMany({
      where: { licenseId: licence.id, offsetDays: { in: [90, 60, 30] } },
    });
    for (const row of rows) await makeDue(row.id, 5);

    await dispatch.sweep(INSIDE_WINDOW);

    const after = await prisma.licenseReminder.findMany({
      where: { licenseId: licence.id, offsetDays: { in: [90, 60, 30] } },
    });
    const sent = after.filter((r) => r.status === ReminderStatus.SENT);
    const skipped = after.filter((r) => r.status === ReminderStatus.SKIPPED);

    // One message about "30 days left", not three about 90, 60 and 30.
    expect(sent).toHaveLength(1);
    expect(sent[0].offsetDays).toBe(30);
    expect(skipped).toHaveLength(2);
  });

  it('batches one recipient’s due licences into a single message', async () => {
    for (const name of [
      `Batch A ${suffix}`,
      `Batch B ${suffix}`,
      `Batch C ${suffix}`,
    ]) {
      await seedDueLicence({ name });
    }
    await dispatch.sweep(INSIDE_WINDOW);

    const batched = sender.sent.filter((m) =>
      m.lines.some((l) => l.licenseName.startsWith('Batch ')),
    );
    // Five separate emails one morning trains people to ignore them.
    expect(batched).toHaveLength(1);
    expect(
      batched[0].lines.filter((l) => l.licenseName.startsWith('Batch ')),
    ).toHaveLength(3);
  });

  it('sends nothing outside the send window', async () => {
    await seedDueLicence({ name: `Windowed ${suffix}` });

    // Friday 11:00 Riyadh — the Saudi weekend.
    const friday = new Date(Date.UTC(2026, 8, 11, 8, 0, 0));
    await dispatch.sweep(friday);
    expect(sender.sent).toHaveLength(0);

    // 03:00 Riyadh Monday — the classic cron hour, outside business hours.
    const preDawn = new Date(Date.UTC(2026, 8, 7, 0, 0, 0));
    await dispatch.sweep(preDawn);
    expect(sender.sent).toHaveLength(0);
  });

  it('resolves the CURRENT owner, not a copy taken at generation time', async () => {
    const { licence, reminderId } = await seedDueLicence({
      name: `Reassigned ${suffix}`,
    });

    // Ownership changes between generation and delivery.
    const newOwner = await prisma.user.create({
      data: {
        tenantId,
        email: `new-owner-${suffix}@example.test`,
        name: 'New Owner',
        role: 'MEMBER',
      },
    });
    await licenses.update(tenantId, ownerId, licence.id, {
      ownerUserId: newOwner.id,
    });

    await dispatch.sweep(INSIDE_WINDOW);

    const message = sender.sent.find((m) =>
      m.lines.some((l) => l.licenseName.startsWith('Reassigned')),
    );
    expect(message?.recipientEmail).toBe(newOwner.email);
    expect(
      (await prisma.licenseReminder.findUnique({ where: { id: reminderId } }))
        ?.status,
    ).toBe(ReminderStatus.SENT);
  });

  it('never sends a reminder to a user in another tenant', async () => {
    await seedDueLicence({ name: `Isolated ${suffix}` });
    await dispatch.sweep(INSIDE_WINDOW);

    const otherUser = await prisma.user.findUnique({
      where: { id: otherOwnerId },
    });
    const recipients = sender.sent.map((m) => m.recipientEmail);
    expect(recipients).not.toContain(otherUser?.email);
    expect(recipients.every((email) => email.includes('dispatch-a'))).toBe(
      true,
    );
  });

  it('an archived licence has no sendable reminders', async () => {
    const { licence, reminderId } = await seedDueLicence({
      name: `Archived ${suffix}`,
    });
    await licenses.archive(tenantId, ownerId, licence.id);
    sender.sent = [];

    await dispatch.sweep(INSIDE_WINDOW);

    expect(
      sender.sent
        .flatMap((m) => m.lines)
        .filter((l) => l.licenseName.startsWith('Archived')),
    ).toHaveLength(0);
    const row = await prisma.licenseReminder.findUnique({
      where: { id: reminderId },
    });
    expect(row?.status).not.toBe(ReminderStatus.SENT);
  });

  describe('no delivery channel — defers, never fails', () => {
    // BEHAVIOUR CHANGE, deliberate.
    //
    // This used to record a failure and consume a retry. With no channel
    // configured and an hourly sweep, that drove EVERY reminder in the system
    // to terminal FAILED within three hours — converting an SMTP outage into
    // permanent data loss no later fix could undo. A missing channel is an
    // operational gap, not a delivery failure, so it now defers exactly as
    // being outside the send window does.

    it('records nothing as sent when no channel is available', async () => {
      const { reminderId } = await seedDueLicence({
        name: `NoChannel ${suffix}`,
      });
      sender.available = false;

      await dispatch.sweep(INSIDE_WINDOW);

      const row = await prisma.licenseReminder.findUnique({
        where: { id: reminderId },
      });
      // Never a silent success.
      expect(row?.status).not.toBe(ReminderStatus.SENT);
      expect(row?.sentAt).toBeNull();
    });

    it('does NOT consume a retry attempt', async () => {
      const { reminderId } = await seedDueLicence({
        name: `NoChannelAttempts ${suffix}`,
      });
      sender.available = false;

      // Three sweeps — enough to exhaust MAX_ATTEMPTS under the old behaviour.
      await dispatch.sweep(INSIDE_WINDOW);
      await dispatch.sweep(INSIDE_WINDOW);
      await dispatch.sweep(INSIDE_WINDOW);

      const row = await prisma.licenseReminder.findUnique({
        where: { id: reminderId },
      });
      expect(row?.attemptCount).toBe(0);
      expect(row?.status).toBe(ReminderStatus.PENDING);
      expect(row?.lastError).toBeNull();
    });

    it('leaves no claim behind, so work resumes the moment a channel returns', async () => {
      const { reminderId } = await seedDueLicence({
        name: `NoChannelResume ${suffix}`,
      });

      sender.available = false;
      await dispatch.sweep(INSIDE_WINDOW);

      const deferred = await prisma.licenseReminder.findUnique({
        where: { id: reminderId },
      });
      expect(deferred?.lockedUntil).toBeNull();
      expect(deferred?.lockedBy).toBeNull();

      sender.available = true;
      await dispatch.sweep(INSIDE_WINDOW);

      const afterwards = await prisma.licenseReminder.findUnique({
        where: { id: reminderId },
      });
      expect(afterwards?.status).toBe(ReminderStatus.SENT);
    });

    it('reports the deferral SEPARATELY from a send-window deferral', async () => {
      // Both mean "not attempted", but one is expected nightly and the other
      // is an outage. One counter for both would hide the outage.
      await seedDueLicence({ name: `NoChannelCounter ${suffix}` });

      sender.available = false;
      const noChannel = await dispatch.sweep(INSIDE_WINDOW);
      expect(noChannel.deferredNoChannel).toBeGreaterThan(0);
      expect(noChannel.deferred).toBe(0);

      sender.available = true;
      const OUTSIDE_WINDOW = new Date(Date.UTC(2026, 8, 7, 22, 0, 0));
      const outsideWindow = await dispatch.sweep(OUTSIDE_WINDOW);
      expect(outsideWindow.deferred).toBeGreaterThan(0);
      expect(outsideWindow.deferredNoChannel).toBe(0);
    });

    it('a CONFIGURED channel that errors still consumes an attempt', async () => {
      // The distinction must not weaken genuine failure handling: a broken
      // SMTP server is a real failure and must still become terminal.
      const { reminderId } = await seedDueLicence({
        name: `RealFailure ${suffix}`,
      });
      sender.available = true;
      sender.failWith = 'SMTP connection refused';

      await dispatch.sweep(INSIDE_WINDOW);

      const row = await prisma.licenseReminder.findUnique({
        where: { id: reminderId },
      });
      expect(row?.attemptCount).toBe(1);
      expect(row?.lastError).toMatch(/SMTP connection refused/);
    });
  });

  describe('reconcile retires obligations the schedule no longer has', () => {
    const today = todayIn('Asia/Riyadh');

    /** Reminders for a licence, newest offset first, as (offset, date, status). */
    const scheduleOf = async (licenseId: string) => {
      const rows = await prisma.licenseReminder.findMany({
        where: { licenseId },
        orderBy: [{ offsetDays: 'desc' }, { dueOn: 'asc' }],
        select: { offsetDays: true, dueOn: true, status: true },
      });
      return rows.map((r) => ({
        offsetDays: r.offsetDays,
        dueOn: fromPrismaDate(r.dueOn),
        status: r.status,
      }));
    };

    it('retires a FAILED reminder that no longer matches the expiry', async () => {
      // The exact sequence that produced the defect: create, fail a delivery,
      // move the expiry, reconcile. The failed row pointed at the old date and
      // survived, so the licence rendered two entries for the same offset.
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Retire failed',
        siteId,
        ownerUserId: ownerId,
        expiryDate: addDays(today, 30),
      });

      const target = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 7 },
      });
      expect(target).not.toBeNull();
      await prisma.licenseReminder.update({
        where: { id: target!.id },
        data: { status: ReminderStatus.FAILED, attemptCount: 3 },
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        expiryDate: addDays(today, 40),
      });

      const after = await scheduleOf(licence.id);
      const stale = after.find(
        (r) => r.dueOn === fromPrismaDate(target!.dueOn) && r.offsetDays === 7,
      );
      expect(stale?.status).toBe(ReminderStatus.CANCELLED);
    });

    it('leaves EXACTLY ONE live obligation per offset after the sequence', async () => {
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'One per offset',
        siteId,
        ownerUserId: ownerId,
        expiryDate: addDays(today, 30),
      });

      const target = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 14 },
      });
      await prisma.licenseReminder.update({
        where: { id: target!.id },
        data: { status: ReminderStatus.FAILED },
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        expiryDate: addDays(today, 45),
      });

      // "Obligation" means a row that can still act. PENDING is the only such
      // status: CANCELLED is retired, SENT already went, and SKIPPED/FAILED
      // are records of windows that closed. Exactly one sendable row per
      // offset is the guarantee that stops a licence being chased twice.
      const sendable = (await scheduleOf(licence.id)).filter(
        (r) => r.status === ReminderStatus.PENDING,
      );
      const perOffset = new Map<number, number>();
      for (const row of sendable) {
        perOffset.set(row.offsetDays, (perOffset.get(row.offsetDays) ?? 0) + 1);
      }
      expect(perOffset.size).toBeGreaterThan(0);
      for (const [offset, count] of perOffset) {
        expect({ offset, count }).toEqual({ offset, count: 1 });
      }

      // And no FAILED row survives pointing at a date the schedule dropped.
      const orphanedFailures = (await scheduleOf(licence.id)).filter(
        (r) => r.status === ReminderStatus.FAILED,
      );
      expect(orphanedFailures).toEqual([]);
    });

    it('KNOWN RESIDUAL: two SKIPPED rows can share an offset after a change', async () => {
      // Pinned deliberately rather than left to be rediscovered.
      //
      // With expiry at +30 days the "90 days before" date is already in the
      // past, so reconcile writes it SKIPPED. Move expiry to +45 and the new
      // "90 days before" date is a DIFFERENT past date, also SKIPPED — while
      // the preservation rule forbids rewriting the first.
      //
      // Nothing sends twice: SKIPPED rows are inert. But the licence timeline
      // renders both, so a user can still see two "90 days before" entries
      // with different dates. Resolving that means either relaxing the
      // preservation rule for SKIPPED (it records no delivery, unlike SENT and
      // FAILED) or collapsing them at render time. That is a product call, so
      // it is reported rather than decided here.
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Skipped residual',
        siteId,
        ownerUserId: ownerId,
        expiryDate: addDays(today, 30),
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        expiryDate: addDays(today, 45),
      });

      const skippedAt90 = (await scheduleOf(licence.id)).filter(
        (r) => r.offsetDays === 90 && r.status === ReminderStatus.SKIPPED,
      );

      // Two rows, two different past dates, both inert.
      expect(skippedAt90).toHaveLength(2);
      expect(new Set(skippedAt90.map((r) => r.dueOn)).size).toBe(2);

      // The guarantee that actually matters still holds: nothing can send.
      expect(
        skippedAt90.every((r) => r.status === ReminderStatus.SKIPPED),
      ).toBe(true);
    });

    it('PRESERVES a SENT reminder across the same sequence', async () => {
      // A delivery that actually reached someone is history. Rewriting it
      // would mean the timeline lies about what the user was told.
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Preserve sent',
        siteId,
        ownerUserId: ownerId,
        expiryDate: addDays(today, 30),
      });

      const sent = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 7 },
      });
      await prisma.licenseReminder.update({
        where: { id: sent!.id },
        data: {
          status: ReminderStatus.SENT,
          sentAt: new Date(),
          channel: ReminderChannel.EMAIL,
        },
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        expiryDate: addDays(today, 60),
      });

      const row = await prisma.licenseReminder.findUnique({
        where: { id: sent!.id },
      });
      expect(row!.status).toBe(ReminderStatus.SENT);
      expect(row!.sentAt).not.toBeNull();
    });

    it('PRESERVES a SKIPPED reminder across the same sequence', async () => {
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Preserve skipped',
        siteId,
        ownerUserId: ownerId,
        // Close expiry, so the far offsets are created already SKIPPED.
        expiryDate: addDays(today, 5),
      });

      const skipped = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, status: ReminderStatus.SKIPPED },
      });
      expect(skipped).not.toBeNull();

      await licenses.update(tenantId, ownerId, licence.id, {
        expiryDate: addDays(today, 6),
      });

      const row = await prisma.licenseReminder.findUnique({
        where: { id: skipped!.id },
      });
      expect(row!.status).toBe(ReminderStatus.SKIPPED);
    });
  });

  describe('UNDELIVERABLE revives when a licence finally gets an owner', () => {
    const today = todayIn('Asia/Riyadh');

    it('brings a future reminder back to PENDING on owner assignment', async () => {
      // The silent failure this fixes: the reminder was marked undeliverable
      // for want of a recipient, an owner was then assigned, and nothing ever
      // chased that licence again.
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Unassigned then owned',
        siteId,
        ownerUserId: null,
        expiryDate: addDays(today, 30),
      });

      const future = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, status: ReminderStatus.PENDING },
        orderBy: { dueOn: 'asc' },
      });
      await prisma.licenseReminder.update({
        where: { id: future!.id },
        data: {
          status: ReminderStatus.UNDELIVERABLE,
          lastError: 'No recipient',
        },
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        ownerUserId: ownerId,
      });

      const row = await prisma.licenseReminder.findUnique({
        where: { id: future!.id },
      });
      expect(row!.status).toBe(ReminderStatus.PENDING);
      expect(row!.lastError).toBeNull();
    });

    it('marks a reminder whose window has passed SKIPPED, not PENDING', async () => {
      // Sending a "90 days before" notice two months late would be noise and
      // would misrepresent the date it was meant to mark.
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Owned too late',
        siteId,
        ownerUserId: null,
        expiryDate: addDays(today, 30),
      });

      const passed = await prisma.licenseReminder.create({
        data: {
          tenantId,
          licenseId: licence.id,
          offsetDays: 90,
          dueOn: toPrismaDate(addDays(today, -10)),
          status: ReminderStatus.UNDELIVERABLE,
        },
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        ownerUserId: ownerId,
      });

      const row = await prisma.licenseReminder.findUnique({
        where: { id: passed.id },
      });
      expect(row!.status).toBe(ReminderStatus.SKIPPED);
    });

    it('does nothing when the licence still has no owner', async () => {
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Still unassigned',
        siteId,
        ownerUserId: null,
        expiryDate: addDays(today, 30),
      });
      const target = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, status: ReminderStatus.PENDING },
      });
      await prisma.licenseReminder.update({
        where: { id: target!.id },
        data: { status: ReminderStatus.UNDELIVERABLE },
      });

      await licenses.update(tenantId, ownerId, licence.id, {
        name: 'Renamed but still unassigned',
      });

      const row = await prisma.licenseReminder.findUnique({
        where: { id: target!.id },
      });
      expect(row!.status).toBe(ReminderStatus.UNDELIVERABLE);
    });

    it('revives after delivery genuinely marked it undeliverable', async () => {
      // End to end through the dispatcher rather than a hand-set status, so
      // the test exercises the real path that produces UNDELIVERABLE.
      const licence = await licenses.create(tenantId, ownerId, {
        name: 'Dispatcher undeliverable',
        siteId,
        ownerUserId: null,
        expiryDate: addDays(today, 7),
      });

      await dispatch.sweep(INSIDE_WINDOW);

      const undeliverable = await prisma.licenseReminder.findMany({
        where: {
          licenseId: licence.id,
          status: ReminderStatus.UNDELIVERABLE,
        },
      });
      expect(undeliverable.length).toBeGreaterThanOrEqual(1);

      await licenses.update(tenantId, ownerId, licence.id, {
        ownerUserId: ownerId,
      });

      const after = await prisma.licenseReminder.findMany({
        where: { id: { in: undeliverable.map((r) => r.id) } },
        select: { status: true },
      });
      expect(
        after.every((r) => r.status !== ReminderStatus.UNDELIVERABLE),
      ).toBe(true);
    });
  });
});
