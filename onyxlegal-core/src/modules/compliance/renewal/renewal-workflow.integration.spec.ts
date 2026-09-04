/**
 * Renewal workflow — integration tests against a real PostgreSQL database.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { RenewalStatus, ReminderStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { LicensesService } from '../licenses/licenses.service';
import { SitesService } from '../sites/sites.service';
import { RemindersService } from '../reminders/reminders.service';
import { RenewalWorkflowService } from './renewal-workflow.service';
import { addDays, fromPrismaDate, todayIn } from '../domain/plain-date';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

describe('Renewal workflow (integration)', () => {
  let prisma: PrismaService;
  let workflow: RenewalWorkflowService;
  let licenses: LicensesService;
  let sites: SitesService;
  let tenantA: string;
  let userA: string;
  let tenantB: string;
  let userB: string;
  let siteA: string;
  const suffix = Date.now();
  const today = todayIn('Asia/Riyadh');

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    const audit = new ComplianceAuditService(prisma);
    const reminders = new RemindersService(prisma);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, reminders);
    workflow = new RenewalWorkflowService(prisma, reminders, audit);

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

    const a = await makeTenant('renewal-a');
    const b = await makeTenant('renewal-b');
    tenantA = a.tenantId;
    userA = a.userId;
    tenantB = b.tenantId;
    userB = b.userId;
    siteA = (await sites.create(tenantA, userA, { name: 'Renewal Site' })).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant
        .deleteMany({ where: { id: { in: [tenantA, tenantB] } } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  /** A licence with a full reminder ladder, 60 days from expiry. */
  const makeLicence = async (name: string, expiry = addDays(today, 60)) =>
    licenses.create(tenantA, userA, {
      name: `${name} ${suffix}`,
      siteId: siteA,
      ownerUserId: userA,
      expiryDate: expiry,
    });

  /** Walks a renewal to the point where it can be completed. */
  const toAwaiting = async (licenseId: string) => {
    const renewal = await workflow.start(tenantA, userA, licenseId);
    return workflow.transition(
      tenantA,
      userA,
      renewal.id,
      RenewalStatus.AWAITING_AUTHORITY,
    );
  };

  describe('starting a renewal', () => {
    it('captures the expiry as it stood when the renewal began', async () => {
      // Once the licence is updated that value is gone from the licence
      // itself, and the change becomes unprovable.
      const expiry = addDays(today, 45);
      const licence = await makeLicence('Capture', expiry);

      const renewal = await workflow.start(tenantA, userA, licence.id);

      expect(renewal.status).toBe(RenewalStatus.PREPARING);
      // The service returns plain "YYYY-MM-DD", not a Date — the boundary
      // converts so the client type is true.
      expect(renewal.previousExpiry).toBe(expiry);
      expect(renewal.startedById).toBe(userA);
    });

    it('allows only ONE active renewal per licence', async () => {
      const licence = await makeLicence('OnlyOne');
      await workflow.start(tenantA, userA, licence.id);

      await expect(workflow.start(tenantA, userA, licence.id)).rejects.toThrow(
        /already under way/i,
      );
    });

    it('allows a new renewal once the previous one is closed', async () => {
      const licence = await makeLicence('AfterClose');
      const first = await workflow.start(tenantA, userA, licence.id);
      await workflow.transition(
        tenantA,
        userA,
        first.id,
        RenewalStatus.CLOSED,
        { outcome: 'Abandoned' },
      );

      const second = await workflow.start(tenantA, userA, licence.id);
      expect(second.id).not.toBe(first.id);
    });

    it('REFUSES to renew an archived licence', async () => {
      const licence = await makeLicence('Archived');
      await licenses.archive(tenantA, userA, licence.id);

      await expect(workflow.start(tenantA, userA, licence.id)).rejects.toThrow(
        /archived/i,
      );
    });
  });

  describe('transitions', () => {
    it('records that a PERSON filed it, with who and when', async () => {
      const licence = await makeLicence('WhoFiled');
      const renewal = await toAwaiting(licence.id);

      expect(renewal.status).toBe(RenewalStatus.AWAITING_AUTHORITY);
      expect(renewal.submittedById).toBe(userA);
      expect(renewal.submittedAt).not.toBeNull();
    });

    it('rejects an illegal move with a message naming what IS possible', async () => {
      const licence = await makeLicence('Illegal');
      const renewal = await workflow.start(tenantA, userA, licence.id);

      await expect(
        workflow.transition(
          tenantA,
          userA,
          renewal.id,
          RenewalStatus.COMPLETED,
        ),
      ).rejects.toThrow(/needs the new expiry date/i);
    });

    it('refuses to close without a reason', async () => {
      const licence = await makeLicence('NoReason');
      const renewal = await workflow.start(tenantA, userA, licence.id);

      await expect(
        workflow.transition(tenantA, userA, renewal.id, RenewalStatus.CLOSED),
      ).rejects.toThrow(/needs a reason/i);
    });

    it('refuses any further move once terminal', async () => {
      const licence = await makeLicence('Terminal');
      const renewal = await workflow.start(tenantA, userA, licence.id);
      await workflow.transition(
        tenantA,
        userA,
        renewal.id,
        RenewalStatus.CLOSED,
        { outcome: 'Not needed' },
      );

      await expect(
        workflow.transition(tenantA, userA, renewal.id, RenewalStatus.READY),
      ).rejects.toThrow(/cannot be changed/i);
    });
  });

  describe('COMPLETION — the point of the slice', () => {
    it('writes the new expiry onto the licence', async () => {
      const licence = await makeLicence('Completes');
      const renewal = await toAwaiting(licence.id);
      const newExpiry = addDays(today, 425);

      await workflow.complete(tenantA, userA, renewal.id, { newExpiry });

      const updated = await prisma.license.findUnique({
        where: { id: licence.id },
        select: { expiryDate: true },
      });
      expect(fromPrismaDate(updated!.expiryDate!)).toBe(newExpiry);
    });

    it('REGENERATES a full reminder ladder against the NEW expiry', async () => {
      // Without this the register drifts: reminders keep firing against a date
      // already past until they lapse to SKIPPED, and no reminders exist for
      // the real expiry at all.
      const licence = await makeLicence('Regenerates');
      const renewal = await toAwaiting(licence.id);
      const newExpiry = addDays(today, 400);

      await workflow.complete(tenantA, userA, renewal.id, { newExpiry });

      const live = await prisma.licenseReminder.findMany({
        where: { licenseId: licence.id, status: ReminderStatus.PENDING },
        orderBy: { offsetDays: 'desc' },
      });

      expect(live.map((r) => r.offsetDays)).toEqual([90, 60, 30, 14, 7]);
      // Every one of them sits the right distance before the NEW date.
      for (const reminder of live) {
        expect(fromPrismaDate(reminder.dueOn)).toBe(
          addDays(newExpiry, -reminder.offsetDays),
        );
      }
    });

    it('retires the old obligations, leaving one live row per offset', async () => {
      const licence = await makeLicence('Retires');
      // Only PENDING rows are retirable. A SKIPPED row describes a window
      // that had already closed and is preserved, per Slices 3 and 7.
      const before = await prisma.licenseReminder.findMany({
        where: { licenseId: licence.id, status: ReminderStatus.PENDING },
        select: { id: true, dueOn: true },
      });
      const renewal = await toAwaiting(licence.id);

      await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 500),
      });

      const old = await prisma.licenseReminder.findMany({
        where: { id: { in: before.map((r) => r.id) } },
        select: { status: true },
      });
      expect(old.every((r) => r.status === ReminderStatus.CANCELLED)).toBe(
        true,
      );

      const live = await prisma.licenseReminder.findMany({
        where: { licenseId: licence.id, status: ReminderStatus.PENDING },
      });
      const perOffset = new Map<number, number>();
      for (const row of live) {
        perOffset.set(row.offsetDays, (perOffset.get(row.offsetDays) ?? 0) + 1);
      }
      for (const [offset, count] of perOffset) {
        expect({ offset, count }).toEqual({ offset, count: 1 });
      }
    });

    it('NEVER rewrites a SENT or SKIPPED reminder', async () => {
      // The Slice 3 and 7 preservation rules. SENT is a delivery that actually
      // reached someone; SKIPPED is a fact about a window that had passed.
      const licence = await makeLicence('Preserves', addDays(today, 20));
      const sent = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, status: ReminderStatus.PENDING },
      });
      await prisma.licenseReminder.update({
        where: { id: sent!.id },
        data: { status: ReminderStatus.SENT, sentAt: new Date() },
      });
      const skipped = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, status: ReminderStatus.SKIPPED },
      });

      const renewal = await toAwaiting(licence.id);
      await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 380),
      });

      const afterSent = await prisma.licenseReminder.findUnique({
        where: { id: sent!.id },
      });
      expect(afterSent!.status).toBe(ReminderStatus.SENT);
      expect(afterSent!.sentAt).not.toBeNull();

      if (skipped) {
        const afterSkipped = await prisma.licenseReminder.findUnique({
          where: { id: skipped.id },
        });
        expect(afterSkipped!.status).toBe(ReminderStatus.SKIPPED);
      }
    });

    it('updates the licence number when one is given', async () => {
      const licence = await makeLicence('NewNumber');
      const renewal = await toAwaiting(licence.id);

      await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 400),
        newLicenseNumber: 'NEW-2027-001',
      });

      const updated = await prisma.license.findUnique({
        where: { id: licence.id },
        select: { licenseNumber: true },
      });
      expect(updated!.licenseNumber).toBe('NEW-2027-001');
    });

    it('completes WITHOUT a document, leaving the checklist to show the gap', async () => {
      // Someone who has the new expiry but not yet the PDF must still be able
      // to close the loop. The missing document surfaces where it already did.
      const licence = await makeLicence('NoDocument');
      const renewal = await toAwaiting(licence.id);

      const completed = await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 400),
      });

      expect(completed.status).toBe(RenewalStatus.COMPLETED);
      const documents = await prisma.licenseDocument.count({
        where: { licenseId: licence.id, deletedAt: null },
      });
      expect(documents).toBe(0);
    });

    it('cannot complete twice', async () => {
      const licence = await makeLicence('Twice');
      const renewal = await toAwaiting(licence.id);
      await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 400),
      });

      await expect(
        workflow.complete(tenantA, userA, renewal.id, {
          newExpiry: addDays(today, 500),
        }),
      ).rejects.toThrow(/cannot be changed/i);
    });
  });

  describe('the new expiry faces the same date rule as every other date', () => {
    it.each([
      '01/02/2026',
      '2026-13-45',
      '2026-02-30',
      'next year',
      '',
      '15/09/2027',
    ])('rejects %j', async (bad) => {
      const licence = await makeLicence(`Bad ${bad || 'empty'}`);
      const renewal = await toAwaiting(licence.id);

      await expect(
        workflow.complete(tenantA, userA, renewal.id, { newExpiry: bad }),
      ).rejects.toThrow(/YYYY-MM-DD/);
    });

    it('leaves the licence untouched when the date is refused', async () => {
      const original = addDays(today, 60);
      const licence = await makeLicence('Untouched', original);
      const renewal = await toAwaiting(licence.id);

      await expect(
        workflow.complete(tenantA, userA, renewal.id, {
          newExpiry: '01/02/2026',
        }),
      ).rejects.toThrow();

      const after = await prisma.license.findUnique({
        where: { id: licence.id },
        select: { expiryDate: true },
      });
      expect(fromPrismaDate(after!.expiryDate!)).toBe(original);
    });
  });

  describe('closing without completing', () => {
    it('leaves the licence expiry exactly as it was', async () => {
      const original = addDays(today, 60);
      const licence = await makeLicence('ClosedUntouched', original);
      const renewal = await workflow.start(tenantA, userA, licence.id);

      await workflow.transition(
        tenantA,
        userA,
        renewal.id,
        RenewalStatus.CLOSED,
        { outcome: 'Authority rejected the application' },
      );

      const after = await prisma.license.findUnique({
        where: { id: licence.id },
        select: { expiryDate: true },
      });
      expect(fromPrismaDate(after!.expiryDate!)).toBe(original);
    });

    it('keeps the reason on the record', async () => {
      const licence = await makeLicence('Reason');
      const renewal = await workflow.start(tenantA, userA, licence.id);
      const closed = await workflow.transition(
        tenantA,
        userA,
        renewal.id,
        RenewalStatus.CLOSED,
        { outcome: 'Superseded by a new premises licence' },
      );
      expect(closed.outcome).toMatch(/Superseded/);
    });
  });

  describe('tenant isolation', () => {
    it("B cannot see, move or complete A's renewal", async () => {
      const licence = await makeLicence('Isolated');
      const renewal = await workflow.start(tenantA, userA, licence.id);

      // 404, not 403 — a foreign id must not be confirmed to exist.
      await expect(
        workflow.transition(tenantB, userB, renewal.id, RenewalStatus.READY),
      ).rejects.toThrow(/not found/i);
      await expect(
        workflow.complete(tenantB, userB, renewal.id, {
          newExpiry: addDays(today, 400),
        }),
      ).rejects.toThrow(/not found/i);
      expect(await workflow.findActive(tenantB, licence.id)).toBeNull();
    });

    it("B cannot start a renewal on A's licence", async () => {
      const licence = await makeLicence('CrossStart');
      await expect(workflow.start(tenantB, userB, licence.id)).rejects.toThrow(
        /not found/i,
      );
    });
  });

  describe('audit', () => {
    it('records every transition with actor, from and to', async () => {
      const licence = await makeLicence('Audited');
      const renewal = await workflow.start(tenantA, userA, licence.id);
      await workflow.transition(
        tenantA,
        userA,
        renewal.id,
        RenewalStatus.READY,
      );

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: renewal.id, action: 'renewal.transitioned' },
        orderBy: { createdAt: 'desc' },
      });
      expect(entry).not.toBeNull();
      expect(entry!.actorUserId).toBe(userA);

      const changes = JSON.stringify(entry!.changes);
      expect(changes).toContain('PREPARING');
      expect(changes).toContain('READY');
    });

    it('records BOTH the previous and the new expiry on completion', async () => {
      // How an expiry date changed is itself the evidence a compliance review
      // asks for.
      const original = addDays(today, 60);
      const newExpiry = addDays(today, 425);
      const licence = await makeLicence('AuditExpiry', original);
      const renewal = await toAwaiting(licence.id);

      await workflow.complete(tenantA, userA, renewal.id, { newExpiry });

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: renewal.id, action: 'renewal.completed' },
      });
      const changes = JSON.stringify(entry!.changes);
      expect(changes).toContain(original);
      expect(changes).toContain(newExpiry);
    });

    it('records the start with the captured previous expiry', async () => {
      const original = addDays(today, 33);
      const licence = await makeLicence('AuditStart', original);
      const renewal = await workflow.start(tenantA, userA, licence.id);

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: renewal.id, action: 'renewal.started' },
      });
      expect(JSON.stringify(entry!.changes)).toContain(original);
    });
  });

  describe('the period boundary', () => {
    it('is null for a licence that has never been renewed', async () => {
      const licence = await makeLicence('NeverRenewed');
      expect(await workflow.findPeriodStart(tenantA, licence.id)).toBeNull();
    });

    it('is the completion date, as a calendar date in the TENANT timezone', async () => {
      const licence = await makeLicence('BoundaryDate');
      const renewal = await toAwaiting(licence.id);
      await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 400),
      });

      const boundary = await workflow.findPeriodStart(tenantA, licence.id);
      // Completed just now, so the boundary is today in Asia/Riyadh.
      expect(boundary).toBe(todayIn('Asia/Riyadh'));
      expect(boundary).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('a renewal CLOSED without completing creates NO boundary', async () => {
      const licence = await makeLicence('ClosedNoBoundary');
      const renewal = await workflow.start(tenantA, userA, licence.id);
      await workflow.transition(
        tenantA,
        userA,
        renewal.id,
        RenewalStatus.CLOSED,
        { outcome: 'Not needed' },
      );

      // Nothing was renewed, so the licence is still in the same period.
      expect(await workflow.findPeriodStart(tenantA, licence.id)).toBeNull();
    });

    it('uses the MOST RECENT completion when there are several', async () => {
      const licence = await makeLicence('TwoRenewals');

      const first = await toAwaiting(licence.id);
      await workflow.complete(tenantA, userA, first.id, {
        newExpiry: addDays(today, 300),
      });
      const second = await toAwaiting(licence.id);
      await workflow.complete(tenantA, userA, second.id, {
        newExpiry: addDays(today, 700),
      });

      const rows = await prisma.licenseRenewal.findMany({
        where: { licenseId: licence.id, status: RenewalStatus.COMPLETED },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      });
      expect(rows).toHaveLength(2);

      const boundary = await workflow.findPeriodStart(tenantA, licence.id);
      expect(boundary).toBe(todayIn('Asia/Riyadh', rows[0].completedAt!));
    });

    it('is scoped to the tenant', async () => {
      const licence = await makeLicence('BoundaryIsolated');
      const renewal = await toAwaiting(licence.id);
      await workflow.complete(tenantA, userA, renewal.id, {
        newExpiry: addDays(today, 400),
      });

      // B asking about A's licence gets nothing, not A's boundary.
      expect(await workflow.findPeriodStart(tenantB, licence.id)).toBeNull();
    });
  });

});
