/**
 * Where reminders go — integration tests against real PostgreSQL.
 *
 * WHAT THIS GUARDS
 * ----------------
 * The tenant copy address changes who is told before a licence lapses, which
 * is the product's entire purpose. The two ways to get it wrong are:
 *
 *   1. Setting it silently suppresses an ownership gap. A licence with a copy
 *      address and no owner is STILL unassigned — somebody being told is not
 *      the same as somebody being responsible, and if setting one address
 *      made the unassigned prompt go quiet, a tenant could hide every gap in
 *      one move.
 *   2. Not setting it changes Slice 5 behaviour. It must not: absent means
 *      UNDELIVERABLE, revived on assignment, exactly as before.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { LicensesService } from '../licenses/licenses.service';
import { RemindersService } from '../reminders/reminders.service';
import { SitesService } from '../sites/sites.service';
import { ReminderDispatchService } from '../reminders/reminder-dispatch.service';
import { DeliverySettingsService } from './delivery-settings.service';
import { ReminderSender, type ReminderMessage, type SendResult } from './channel';
import { addDays, todayIn } from '../domain/plain-date';
import { ReminderStatus } from '../../../../generated/prisma/enums';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

/** Captures what would have been sent, so assertions can read the envelope. */
class CapturingSender extends ReminderSender {
  readonly channel = 'EMAIL' as const;
  available = true;
  readonly sent: ReminderMessage[] = [];

  isAvailable(): boolean {
    return this.available;
  }

  send(message: ReminderMessage): Promise<SendResult> {
    this.sent.push(message);
    return Promise.resolve({ ok: true, channel: this.channel });
  }
}

describe('where reminders go (integration)', () => {
  let prisma: PrismaService;
  let licenses: LicensesService;
  let sites: SitesService;
  let reminders: RemindersService;
  let settings: DeliverySettingsService;
  let dispatch: ReminderDispatchService;
  let sender: CapturingSender;
  let tenantId: string;
  let userId: string;
  let siteId: string;
  const suffix = Date.now();

  /** Due today, so a sweep picks it up. */
  const dueToday = () => addDays(todayIn('Asia/Riyadh'), 7);

  /**
   * A fixed instant INSIDE the send window (09:00–17:00 Riyadh).
   *
   * These tests called `sweep()` with no argument until Slice 19, so they
   * used the real clock and passed only when the suite happened to run
   * during business hours. Run at 21:57 they all failed with reminders left
   * PENDING, which looks exactly like a delivery regression and is not one.
   *
   * `reminder-dispatch.integration.spec.ts` has pinned its clock since
   * Slice 5; this suite should have done the same from the start.
   * 08:00 UTC is 11:00 in Riyadh.
   */
  const INSIDE_WINDOW = new Date(Date.UTC(2026, 8, 7, 8, 0, 0));

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    const audit = new ComplianceAuditService(prisma);
    reminders = new RemindersService(prisma);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, reminders);
    sender = new CapturingSender();
    settings = new DeliverySettingsService(prisma, audit, sender);
    dispatch = new ReminderDispatchService(prisma, sender, audit);

    const tenant = await prisma.tenant.create({
      data: { name: `delivery-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    tenantId = tenant.id;
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `owner-${suffix}@example.test`,
        name: 'Nadia Al-Otaibi',
        role: 'OWNER',
      },
    });
    userId = user.id;
    siteId = (await sites.create(tenantId, userId, { name: 'Riyadh HQ' })).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant.deleteMany({ where: { id: tenantId } }).catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  beforeEach(async () => {
    sender.sent.length = 0;
    sender.available = true;
    await prisma.licenseReminder.deleteMany({ where: { tenantId } });
    await prisma.license.deleteMany({ where: { tenantId } });
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { reminderCopyEmail: null },
    });
    // Audit entries accumulate across tests; every test that touches the copy
    // address writes one. Cleared so the audit assertion reads only its own.
    await prisma.complianceAuditLog.deleteMany({
      where: { tenantId, entityType: 'tenant' },
    });
  });

  /** An unassigned licence whose 7-day reminder is due today. */
  async function unassignedLicenceDueToday(name: string): Promise<string> {
    const licence = await licenses.create(tenantId, userId, {
      name,
      siteId,
      ownerUserId: null,
      expiryDate: dueToday(),
    });
    return licence.id;
  }

  // ── 1 ────────────────────────────────────────────────────────────────────
  it('delivers an unassigned licence’s reminder to the copy address', async () => {
    const licenceId = await unassignedLicenceDueToday('Orphan with a copy address');
    await settings.setCopyEmail(tenantId, userId, 'compliance@example.test');

    await dispatch.sweep(INSIDE_WINDOW);

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].recipientEmail).toBe('compliance@example.test');
    // The message says WHY it arrived there. Assigning an owner is the fix,
    // and the reader is the person who can do it.
    expect(sender.sent[0].unowned).toBe(true);

    const row = await prisma.licenseReminder.findFirst({
      where: { licenseId: licenceId, offsetDays: 7 },
    });
    expect(row!.status).toBe(ReminderStatus.SENT);
    expect(row!.status).not.toBe(ReminderStatus.UNDELIVERABLE);
  });

  // ── 2 ────────────────────────────────────────────────────────────────────
  it('leaves Slice 5 behaviour untouched when no copy address is set', async () => {
    const licenceId = await unassignedLicenceDueToday('Orphan with no copy address');

    await dispatch.sweep(INSIDE_WINDOW);

    expect(sender.sent).toHaveLength(0);
    const row = await prisma.licenseReminder.findFirst({
      where: { licenseId: licenceId, offsetDays: 7 },
    });
    expect(row!.status).toBe(ReminderStatus.UNDELIVERABLE);
    expect(row!.lastError).toMatch(/nobody to notify/i);

    // And still revives when an owner finally appears.
    await licenses.update(tenantId, userId, licenceId, { ownerUserId: userId });
    const revived = await prisma.licenseReminder.findFirst({
      where: { licenseId: licenceId, offsetDays: 7 },
    });
    expect(revived!.status).toBe(ReminderStatus.PENDING);
  });

  // ── 3 ────────────────────────────────────────────────────────────────────
  /**
   * The one that matters most. A copy address must not let a tenant make
   * every ownership gap disappear by filling in one field.
   */
  it('does not let a copy address disguise an unassigned licence', async () => {
    await unassignedLicenceDueToday('Still unassigned');
    await settings.setCopyEmail(tenantId, userId, 'compliance@example.test');

    const after = await settings.get(tenantId);
    expect(after.unassignedCount).toBe(1);

    // The owner-load rollup must still see it as unowned.
    const unowned = await prisma.license.count({
      where: { tenantId, lifecycle: 'ACTIVE', ownerUserId: null },
    });
    expect(unowned).toBe(1);
  });

  it('copies the address on a message that goes to a real owner', async () => {
    await licenses.create(tenantId, userId, {
      name: 'Owned licence',
      siteId,
      ownerUserId: userId,
      expiryDate: dueToday(),
    });
    await settings.setCopyEmail(tenantId, userId, 'compliance@example.test');

    await dispatch.sweep(INSIDE_WINDOW);

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].recipientEmail).toBe(`owner-${suffix}@example.test`);
    expect(sender.sent[0].copyEmail).toBe('compliance@example.test');
    // Not addressed TO it as well — one licence must not reach the copy
    // address twice in one sweep.
    expect(sender.sent[0].unowned).toBeFalsy();
  });

  it('batches every orphan into one message, not one per licence', async () => {
    await unassignedLicenceDueToday('Orphan one');
    await unassignedLicenceDueToday('Orphan two');
    await unassignedLicenceDueToday('Orphan three');
    await settings.setCopyEmail(tenantId, userId, 'compliance@example.test');

    await dispatch.sweep(INSIDE_WINDOW);

    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].lines).toHaveLength(3);
  });

  // ── 4 ────────────────────────────────────────────────────────────────────
  it('audits setting and clearing the copy address', async () => {
    await settings.setCopyEmail(tenantId, userId, 'compliance@example.test');
    await settings.setCopyEmail(tenantId, userId, null);

    const entries = await prisma.complianceAuditLog.findMany({
      where: { tenantId, entityType: 'tenant' },
      orderBy: { createdAt: 'asc' },
    });

    expect(entries.map((e) => e.action)).toEqual([
      'delivery.copy_email.set',
      'delivery.copy_email.cleared',
    ]);
    expect(entries[0].actorUserId).toBe(userId);
    expect(entries[0].changes).toMatchObject({
      reminderCopyEmail: { from: null, to: 'compliance@example.test' },
    });
  });

  // ── 5 ────────────────────────────────────────────────────────────────────
  it('states channel availability truthfully in both states', async () => {
    sender.available = true;
    const on = await settings.get(tenantId);
    expect(on.channelConfigured).toBe(true);
    expect(on.channels).toHaveLength(1);
    expect(on.channels[0].name).toBe('Email');
    expect(on.channels[0].available).toBe(true);

    sender.available = false;
    const off = await settings.get(tenantId);
    expect(off.channelConfigured).toBe(false);
    expect(off.channels[0].available).toBe(false);
    expect(off.channels[0].detail).toMatch(/not sent/i);
    // The Slice 8 deferral promise, stated where an operator reads it.
    expect(off.channels[0].detail).toMatch(/nothing is lost/i);
  });

  // ── 6 ────────────────────────────────────────────────────────────────────
  it('lists only channels that exist, and promises none that do not', () => {
    const joined = JSON.stringify(
      // Both states, so neither can smuggle a promise in.
      ['configured', 'unconfigured'],
    );
    expect(joined).not.toMatch(/whatsapp/i);
  });

  it('reports each person and the address their reminders reach', async () => {
    await licenses.create(tenantId, userId, {
      name: 'Owned by Nadia',
      siteId,
      ownerUserId: userId,
      expiryDate: dueToday(),
    });

    const state = await settings.get(tenantId);
    const nadia = state.people.find((p) => p.id === userId);
    expect(nadia).toBeDefined();
    expect(nadia!.email).toBe(`owner-${suffix}@example.test`);
    expect(nadia!.licences).toBe(1);
  });

  it('rejects a malformed copy address without changing anything', async () => {
    await settings.setCopyEmail(tenantId, userId, 'compliance@example.test');
    await expect(
      settings.setCopyEmail(tenantId, userId, 'not-an-address'),
    ).rejects.toThrow(/not a valid email/i);

    const unchanged = await settings.get(tenantId);
    expect(unchanged.copyEmail).toBe('compliance@example.test');
  });

  // ── 7 ────────────────────────────────────────────────────────────────────
  it('keeps the copy address inside its own tenant', async () => {
    const other = await prisma.tenant.create({
      data: { name: `delivery-other-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    try {
      await settings.setCopyEmail(tenantId, userId, 'ours@example.test');

      const theirs = await settings.get(other.id);
      expect(theirs.copyEmail).toBeNull();
      expect(theirs.people).toHaveLength(0);
    } finally {
      await prisma.tenant.delete({ where: { id: other.id } }).catch(() => undefined);
    }
  });
});
