import { ReminderStatus } from 'generated/prisma/client';
/**
 * Compliance domain — integration tests against a real PostgreSQL database.
 *
 * These exercise the actual Prisma queries, the actual constraints, and the
 * actual tenant-scoping logic. Mocking Prisma here would prove nothing: the
 * isolation guarantees this file exists to verify live in the `where` clauses,
 * and a mock would happily return whatever it was told to.
 *
 * SAFETY: refuses to run against any database whose name does not end in
 * `_test`. Set TEST_DATABASE_URL in .env.
 */

import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceAuditService } from './audit/compliance-audit.service';
import { LicensesService } from './licenses/licenses.service';
import { SitesService } from './sites/sites.service';
import { RemindersService } from './reminders/reminders.service';
import { CoverageService } from './coverage/coverage.service';
import { DashboardService } from './dashboard/dashboard.service';
import { ComplianceNotificationsService } from './notifications/compliance-notifications.service';
import { addDays, todayIn } from './domain/plain-date';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';

// ── Guard rail ─────────────────────────────────────────────────────────────
// A misconfigured URL here would run destructive cleanup against real data.
if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL is not set. Integration tests need a dedicated database.\n' +
      '  createdb onyxlegal_test && DATABASE_URL=<test-url> npx prisma migrate deploy',
  );
}
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error(
    `Refusing to run integration tests against "${new URL(TEST_DATABASE_URL).pathname}". ` +
      'The database name must end in "_test".',
  );
}

describe('Compliance domain (integration)', () => {
  let prisma: PrismaService;
  let sites: SitesService;
  let licenses: LicensesService;
  let reminders: RemindersService;
  let coverage: CoverageService;
  let dashboard: DashboardService;
  let notifications: ComplianceNotificationsService;

  // Two fully independent tenants. Tenant B exists solely to be inaccessible.
  let tenantA: string;
  let tenantB: string;
  let userA: string;
  let userB: string;
  let siteA: string;
  let siteB: string;

  const today = todayIn('Asia/Riyadh');
  const suffix = Date.now();

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    const audit = new ComplianceAuditService(prisma);
    reminders = new RemindersService(prisma);
    coverage = new CoverageService(prisma, audit);
    dashboard = new DashboardService(prisma, coverage);
    notifications = new ComplianceNotificationsService(prisma, audit);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, reminders);

    const makeTenant = async (name: string) => {
      const tenant = await prisma.tenant.create({
        data: { name: `${name}-${suffix}`, timeZone: 'Asia/Riyadh' },
      });
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `${name}-${suffix}@example.test`,
          name: `${name} owner`,
          role: 'OWNER',
        },
      });
      return { tenantId: tenant.id, userId: user.id };
    };

    const a = await makeTenant('tenant-a');
    const b = await makeTenant('tenant-b');
    tenantA = a.tenantId;
    userA = a.userId;
    tenantB = b.tenantId;
    userB = b.userId;

    siteA = (await sites.create(tenantA, userA, { name: 'Riyadh HQ' })).id;
    siteB = (await sites.create(tenantB, userB, { name: 'Jeddah Branch' })).id;
  });

  afterAll(async () => {
    // Tenant cascade removes sites, licences and audit rows.
    if (prisma) {
      await prisma.tenant
        .deleteMany({ where: { id: { in: [tenantA, tenantB] } } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  // ── 1. Creation ──────────────────────────────────────────────────────────
  describe('licence creation', () => {
    it('creates a site-level licence and derives its status', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Municipality Licence',
        siteId: siteA,
        ownerUserId: userA,
        authority: 'Riyadh Municipality',
        licenseNumber: 'TEST-0001',
        issueDate: addDays(today, -300),
        expiryDate: addDays(today, 14),
      });

      expect(licence.id).toBeDefined();
      expect(licence.siteId).toBe(siteA);
      expect(licence.tenantId).toBe(tenantA);
      expect(licence.status).toBe('CRITICAL');
      expect(licence.daysUntilExpiry).toBe(14);
      expect(licence.lifecycle).toBe('ACTIVE');
    });

    it('creates a COMPANY-LEVEL licence when siteId is omitted', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Commercial Registration',
        expiryDate: addDays(today, 200),
      });

      expect(licence.siteId).toBeNull();
      expect(licence.status).toBe('ACTIVE');
    });

    it('creates a licence with no expiry date', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Perpetual Registration',
      });

      expect(licence.expiryDate).toBeNull();
      expect(licence.status).toBe('NO_EXPIRY');
      expect(licence.daysUntilExpiry).toBeNull();
    });

    it('stores expiry as a calendar date, unshifted by timezone', async () => {
      const expiry = addDays(today, 45);
      const licence = await licenses.create(tenantA, userA, {
        name: 'Date Fidelity Check',
        expiryDate: expiry,
      });

      const raw = await prisma.license.findUnique({
        where: { id: licence.id },
        select: { expiryDate: true },
      });
      // Must be exactly midnight UTC on the requested day — no drift.
      expect(raw?.expiryDate?.toISOString()).toBe(`${expiry}T00:00:00.000Z`);
      expect(licence.daysUntilExpiry).toBe(45);
    });
  });

  // ── 2. Retrieval ─────────────────────────────────────────────────────────
  describe('licence retrieval', () => {
    it('returns a licence with its site and owner', async () => {
      const created = await licenses.create(tenantA, userA, {
        name: 'Retrievable Licence',
        siteId: siteA,
        ownerUserId: userA,
        expiryDate: addDays(today, 100),
      });

      const found = await licenses.findOne(tenantA, created.id);
      expect(found.id).toBe(created.id);
      expect(found.site?.id).toBe(siteA);
      expect(found.owner?.id).toBe(userA);
      expect(found.status).toBe('ACTIVE');
    });

    it('filters to company-level licences with siteId="none"', async () => {
      const result = await licenses.findAll(tenantA, { siteId: 'none' });
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every((l) => l.siteId === null)).toBe(true);
    });

    it('filters by derived expiry status', async () => {
      const result = await licenses.findAll(tenantA, {
        expiryStatus: 'CRITICAL',
      });
      expect(result.data.every((l) => l.status === 'CRITICAL')).toBe(true);
    });

    it('never returns another tenant’s licences in a list', async () => {
      await licenses.create(tenantB, userB, {
        name: 'Tenant B Private Licence',
        siteId: siteB,
        expiryDate: addDays(today, 10),
      });

      const result = await licenses.findAll(tenantA, {});
      expect(result.data.every((l) => l.tenantId === tenantA)).toBe(true);
      expect(
        result.data.some((l) => l.name === 'Tenant B Private Licence'),
      ).toBe(false);
    });
  });

  // ── 3. Update ────────────────────────────────────────────────────────────
  describe('licence update', () => {
    it('updates fields and recomputes derived status', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Updatable Licence',
        expiryDate: addDays(today, 200),
      });
      expect(licence.status).toBe('ACTIVE');

      const updated = await licenses.update(tenantA, userA, licence.id, {
        expiryDate: addDays(today, 5),
      });

      expect(updated.status).toBe('CRITICAL');
      expect(updated.daysUntilExpiry).toBe(5);
    });

    it('records an expiry change in the audit log with from/to', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Audited Licence',
        expiryDate: addDays(today, 100),
      });

      await licenses.update(tenantA, userA, licence.id, {
        expiryDate: addDays(today, 120),
      });

      const entries = await prisma.complianceAuditLog.findMany({
        where: { tenantId: tenantA, entityId: licence.id },
        orderBy: { createdAt: 'asc' },
      });

      const actions = entries.map((e) => e.action);
      expect(actions).toContain('license.created');
      expect(actions).toContain('license.expiry_changed');

      const change = entries.find((e) => e.action === 'license.expiry_changed');
      expect((change?.changes as Record<string, unknown>).expiryDate).toEqual({
        from: addDays(today, 100),
        to: addDays(today, 120),
      });
    });

    it('can move a licence from site-level to company-level', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Scope Change Licence',
        siteId: siteA,
      });
      expect(licence.siteId).toBe(siteA);

      const updated = await licenses.update(tenantA, userA, licence.id, {
        siteId: null,
      });
      expect(updated.siteId).toBeNull();
    });
  });

  // ── 4. TENANT ISOLATION — the security requirement, made executable ──────
  describe('tenant isolation', () => {
    let licenceOfB: string;

    beforeAll(async () => {
      const licence = await licenses.create(tenantB, userB, {
        name: 'Tenant B Confidential Licence',
        siteId: siteB,
        ownerUserId: userB,
        licenseNumber: 'B-SECRET-001',
        expiryDate: addDays(today, 30),
      });
      licenceOfB = licence.id;
    });

    it('tenant A CAN read its own licence', async () => {
      const own = await licenses.create(tenantA, userA, {
        name: 'A owns this',
      });
      await expect(licenses.findOne(tenantA, own.id)).resolves.toMatchObject({
        id: own.id,
      });
    });

    it('tenant A CANNOT read tenant B’s licence', async () => {
      await expect(licenses.findOne(tenantA, licenceOfB)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('tenant A CANNOT update tenant B’s licence', async () => {
      await expect(
        licenses.update(tenantA, userA, licenceOfB, { name: 'hijacked' }),
      ).rejects.toThrow(NotFoundException);

      const untouched = await prisma.license.findUnique({
        where: { id: licenceOfB },
      });
      expect(untouched?.name).toBe('Tenant B Confidential Licence');
    });

    it('tenant A CANNOT archive tenant B’s licence', async () => {
      await expect(
        licenses.archive(tenantA, userA, licenceOfB),
      ).rejects.toThrow(NotFoundException);

      const untouched = await prisma.license.findUnique({
        where: { id: licenceOfB },
      });
      expect(untouched?.lifecycle).toBe('ACTIVE');
    });

    it('tenant A CANNOT read tenant B’s site', async () => {
      await expect(sites.findOne(tenantA, siteB)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('tenant A CANNOT update tenant B’s site', async () => {
      await expect(
        sites.update(tenantA, userA, siteB, { name: 'hijacked' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('tenant A CANNOT deactivate tenant B’s site', async () => {
      await expect(sites.deactivate(tenantA, userA, siteB)).rejects.toThrow(
        NotFoundException,
      );

      const untouched = await prisma.site.findUnique({ where: { id: siteB } });
      expect(untouched?.status).toBe('ACTIVE');
    });

    it('tenant A’s site list excludes tenant B’s sites', async () => {
      const result = await sites.findAll(tenantA, {});
      expect(result.data.every((s) => s.tenantId === tenantA)).toBe(true);
      expect(result.data.some((s) => s.id === siteB)).toBe(false);
    });
  });

  // ── 5. Cross-tenant reference rejection ──────────────────────────────────
  describe('cross-tenant reference rejection', () => {
    it('rejects attaching tenant A’s licence to tenant B’s site', async () => {
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Cross-tenant attempt',
          siteId: siteB,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects MOVING a licence onto another tenant’s site', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Move attempt',
        siteId: siteA,
      });

      await expect(
        licenses.update(tenantA, userA, licence.id, { siteId: siteB }),
      ).rejects.toThrow(BadRequestException);

      const unchanged = await prisma.license.findUnique({
        where: { id: licence.id },
      });
      expect(unchanged?.siteId).toBe(siteA);
    });

    it('rejects assigning ownership to a user in another tenant', async () => {
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Cross-tenant owner attempt',
          ownerUserId: userB,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── 6. Date validation ───────────────────────────────────────────────────
  describe('date validation', () => {
    it('rejects an expiry date earlier than the issue date', async () => {
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Backwards dates',
          issueDate: addDays(today, 10),
          expiryDate: addDays(today, 5),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts issue and expiry on the same day', async () => {
      const sameDay = addDays(today, 5);
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Same-day dates',
          issueDate: sameDay,
          expiryDate: sameDay,
        }),
      ).resolves.toBeDefined();
    });

    it('rejects a partial update that would invert the date order', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Partial update guard',
        issueDate: addDays(today, -10),
        expiryDate: addDays(today, 100),
      });

      // Only issueDate supplied, but the resulting pair would be invalid.
      await expect(
        licenses.update(tenantA, userA, licence.id, {
          issueDate: addDays(today, 200),
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── 7. Site / licence relationship ───────────────────────────────────────
  describe('site → licence relationship', () => {
    it('counts licences per site', async () => {
      const site = await sites.create(tenantA, userA, { name: 'Counted Site' });
      await licenses.create(tenantA, userA, { name: 'L1', siteId: site.id });
      await licenses.create(tenantA, userA, { name: 'L2', siteId: site.id });

      const found = await sites.findOne(tenantA, site.id);
      expect(found._count.licenses).toBe(2);
    });

    it('lists only the licences of the requested site', async () => {
      const site = await sites.create(tenantA, userA, {
        name: 'Filtered Site',
      });
      await licenses.create(tenantA, userA, {
        name: 'Only Mine',
        siteId: site.id,
      });

      const result = await licenses.findAll(tenantA, { siteId: site.id });
      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toBe('Only Mine');
    });

    it('REFUSES to delete a site that still holds licences (onDelete: Restrict)', async () => {
      const site = await sites.create(tenantA, userA, {
        name: 'Protected Site',
      });
      await licenses.create(tenantA, userA, {
        name: 'Holder',
        siteId: site.id,
      });

      // Compliance history must not vanish because a location was tidied up.
      await expect(
        prisma.site.delete({ where: { id: site.id } }),
      ).rejects.toThrow();
    });

    it('rejects two sites with the same name in one tenant', async () => {
      await sites.create(tenantA, userA, { name: 'Duplicate Name Site' });
      await expect(
        sites.create(tenantA, userA, { name: 'Duplicate Name Site' }),
      ).rejects.toThrow(/already exists/);
    });

    it('ALLOWS the same site name in a different tenant', async () => {
      await expect(
        sites.create(tenantB, userB, { name: 'Duplicate Name Site' }),
      ).resolves.toBeDefined();
    });
  });

  // ── 8. Archiving ─────────────────────────────────────────────────────────
  describe('archiving', () => {
    it('archives instead of deleting, preserving the row', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'To Be Archived',
        expiryDate: addDays(today, 50),
      });

      const archived = await licenses.archive(tenantA, userA, licence.id);
      expect(archived.lifecycle).toBe('ARCHIVED');

      // Still present, still auditable.
      const row = await prisma.license.findUnique({
        where: { id: licence.id },
      });
      expect(row).not.toBeNull();
    });

    it('is idempotent', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Twice Archived',
      });
      await licenses.archive(tenantA, userA, licence.id);
      const second = await licenses.archive(tenantA, userA, licence.id);
      expect(second.lifecycle).toBe('ARCHIVED');
    });

    it('keeps expiry status independent of lifecycle', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Archived But Expired',
        expiryDate: addDays(today, -5),
      });
      const archived = await licenses.archive(tenantA, userA, licence.id);

      // Two orthogonal axes: archived AND expired are both true.
      expect(archived.lifecycle).toBe('ARCHIVED');
      expect(archived.status).toBe('EXPIRED');
      expect(archived.daysUntilExpiry).toBe(-5);
    });
  });

  // ── Site compliance rollup (server-derived, single source of truth) ──────
  describe('site compliance rollup', () => {
    it('counts licence statuses on the site detail endpoint', async () => {
      const site = await sites.create(tenantA, userA, { name: 'Rollup Site' });
      await licenses.create(tenantA, userA, {
        name: 'Expired one',
        siteId: site.id,
        expiryDate: addDays(today, -5),
      });
      await licenses.create(tenantA, userA, {
        name: 'Critical one',
        siteId: site.id,
        expiryDate: addDays(today, 10),
      });
      await licenses.create(tenantA, userA, {
        name: 'Healthy one',
        siteId: site.id,
        expiryDate: addDays(today, 300),
      });

      const found = await sites.findOne(tenantA, site.id);
      expect(found.compliance).toMatchObject({
        total: 3,
        expired: 1,
        critical: 1,
        active: 1,
        needsAttention: 2,
      });
    });

    it('excludes ARCHIVED licences from the rollup', async () => {
      const site = await sites.create(tenantA, userA, {
        name: 'Archive Rollup',
      });
      const licence = await licenses.create(tenantA, userA, {
        name: 'Soon archived',
        siteId: site.id,
        expiryDate: addDays(today, -1),
      });

      expect((await sites.findOne(tenantA, site.id)).compliance.expired).toBe(
        1,
      );

      await licenses.archive(tenantA, userA, licence.id);

      const after = await sites.findOne(tenantA, site.id);
      expect(after.compliance.total).toBe(0);
      expect(after.compliance.needsAttention).toBe(0);
    });

    it('does not leak raw licence rows into the sites list', async () => {
      const result = await sites.findAll(tenantA, {});
      expect(result.data.length).toBeGreaterThan(0);
      for (const site of result.data) {
        expect(site).toHaveProperty('compliance');
        expect(site).not.toHaveProperty('licenses');
      }
    });
  });

  // ── Reminder obligations (persistence only — no scheduler, no delivery) ──
  describe('reminder obligations', () => {
    it('generates exactly 5 obligations when a licence is created', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Reminder Generation',
        expiryDate: addDays(today, 365),
      });

      const timeline = await reminders.findForLicense(tenantA, licence.id);
      expect(timeline).toHaveLength(5);
      expect(timeline.map((r) => r.offsetDays)).toEqual([90, 60, 30, 14, 7]);
      expect(timeline.every((r) => r.status === 'PENDING')).toBe(true);
    });

    it('dates each obligation back from the expiry', async () => {
      const expiry = addDays(today, 365);
      const licence = await licenses.create(tenantA, userA, {
        name: 'Reminder Dates',
        expiryDate: expiry,
      });

      const timeline = await reminders.findForLicense(tenantA, licence.id);
      for (const reminder of timeline) {
        expect(reminder.dueOn).toBe(addDays(expiry, -reminder.offsetDays));
      }
    });

    it('generates none for a licence with no expiry date', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'No Expiry No Reminders',
      });
      expect(await reminders.findForLicense(tenantA, licence.id)).toHaveLength(
        0,
      );
    });

    it('is idempotent — reconciling repeatedly creates no duplicates', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Idempotent Reconcile',
        expiryDate: addDays(today, 200),
      });

      await reminders.reconcile(licence.id);
      await reminders.reconcile(licence.id);
      await reminders.reconcile(licence.id);

      const rows = await prisma.licenseReminder.findMany({
        where: { licenseId: licence.id },
      });
      expect(rows).toHaveLength(5);
    });

    it('marks windows that had already passed as SKIPPED, not PENDING', async () => {
      // Added 45 days before expiry: 90 and 60 can never be honoured.
      const licence = await licenses.create(tenantA, userA, {
        name: 'Late Entry',
        expiryDate: addDays(today, 45),
      });

      const timeline = await reminders.findForLicense(tenantA, licence.id);
      const byOffset = Object.fromEntries(
        timeline.map((r) => [r.offsetDays, r.status]),
      );
      expect(byOffset[90]).toBe('SKIPPED');
      expect(byOffset[60]).toBe('SKIPPED');
      expect(byOffset[30]).toBe('PENDING');
      expect(byOffset[7]).toBe('PENDING');
    });

    it('reconciles obligations when the expiry date changes', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Expiry Moves',
        expiryDate: addDays(today, 300),
      });
      const before = await reminders.findForLicense(tenantA, licence.id);

      const newExpiry = addDays(today, 400);
      await licenses.update(tenantA, userA, licence.id, {
        expiryDate: newExpiry,
      });
      const after = await reminders.findForLicense(tenantA, licence.id);

      // Old obligations retired, new ones created and dated from the new expiry.
      const live = after.filter((r) => r.status === 'PENDING');
      expect(live).toHaveLength(5);
      for (const reminder of live) {
        expect(reminder.dueOn).toBe(addDays(newExpiry, -reminder.offsetDays));
      }

      const cancelled = after.filter((r) => r.status === 'CANCELLED');
      expect(cancelled).toHaveLength(5);
      expect(cancelled.map((r) => r.dueOn).sort()).toEqual(
        before.map((r) => r.dueOn).sort(),
      );
    });

    it('PRESERVES delivered history when the expiry date changes', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Delivered History',
        expiryDate: addDays(today, 300),
      });

      // Simulate what the future scheduler will do to one obligation.
      const target = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 90 },
      });
      await prisma.licenseReminder.update({
        where: { id: target!.id },
        data: { status: 'SENT' },
      });

      await licenses.update(tenantA, userA, licence.id, {
        expiryDate: addDays(today, 500),
      });

      const stillSent = await prisma.licenseReminder.findUnique({
        where: { id: target!.id },
      });
      // A date edit must never rewrite the record of something that actually
      // reached a person.
      expect(stillSent?.status).toBe('SENT');
    });

    it('revives a cancelled obligation if the expiry is changed back', async () => {
      const original = addDays(today, 300);
      const licence = await licenses.create(tenantA, userA, {
        name: 'Expiry Round Trip',
        expiryDate: original,
      });

      await licenses.update(tenantA, userA, licence.id, {
        expiryDate: addDays(today, 400),
      });
      await licenses.update(tenantA, userA, licence.id, {
        expiryDate: original,
      });

      const timeline = await reminders.findForLicense(tenantA, licence.id);
      const live = timeline.filter((r) => r.status === 'PENDING');
      expect(live).toHaveLength(5);
      // No duplicate rows were created by the round trip.
      const forOriginal = timeline.filter(
        (r) => r.dueOn === addDays(original, -r.offsetDays),
      );
      expect(forOriginal).toHaveLength(5);
    });

    it('does not reconcile when a non-expiry field changes', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Rename Only',
        expiryDate: addDays(today, 250),
      });
      const before = await reminders.findForLicense(tenantA, licence.id);

      await licenses.update(tenantA, userA, licence.id, { name: 'Renamed' });

      const after = await reminders.findForLicense(tenantA, licence.id);
      expect(after).toEqual(before);
    });

    it('retires all outstanding obligations when a licence is archived', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Archived No Reminders',
        expiryDate: addDays(today, 300),
      });
      expect(
        (await reminders.findForLicense(tenantA, licence.id)).filter(
          (r) => r.status === 'PENDING',
        ),
      ).toHaveLength(5);

      await licenses.archive(tenantA, userA, licence.id);

      const after = await reminders.findForLicense(tenantA, licence.id);
      expect(after.filter((r) => r.status === 'PENDING')).toHaveLength(0);
      expect(after.every((r) => r.status === 'CANCELLED')).toBe(true);
    });

    it('scopes the timeline to the owning tenant', async () => {
      const licenceOfB = await licenses.create(tenantB, userB, {
        name: 'Tenant B Reminders',
        expiryDate: addDays(today, 300),
      });

      // Tenant B can see its own.
      expect(
        await reminders.findForLicense(tenantB, licenceOfB.id),
      ).toHaveLength(5);

      // Tenant A cannot, even with the correct licence id.
      expect(
        await reminders.findForLicense(tenantA, licenceOfB.id),
      ).toHaveLength(0);
    });

    it('stores due dates as calendar dates, unshifted by timezone', async () => {
      const expiry = addDays(today, 120);
      const licence = await licenses.create(tenantA, userA, {
        name: 'Reminder Date Fidelity',
        expiryDate: expiry,
      });

      const row = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 30 },
      });
      const expected = addDays(expiry, -30);
      // Exactly midnight UTC on the intended day — no drift in either direction.
      expect(row?.dueOn.toISOString()).toBe(`${expected}T00:00:00.000Z`);
    });
  });

  // ── Owner assignment (prerequisite for reminders reaching a person) ───────
  describe('licence ownership', () => {
    it('assigns an owner from the same tenant', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Owned Licence',
        ownerUserId: userA,
      });
      expect(licence.ownerUserId).toBe(userA);
      expect((licence as { owner?: { id: string } }).owner?.id ?? userA).toBe(
        userA,
      );
    });

    it('rejects assigning an owner from another tenant on update', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Owner Change Attempt',
      });

      await expect(
        licenses.update(tenantA, userA, licence.id, { ownerUserId: userB }),
      ).rejects.toThrow(BadRequestException);

      const unchanged = await prisma.license.findUnique({
        where: { id: licence.id },
      });
      expect(unchanged?.ownerUserId).toBeNull();
    });

    it('allows an owner to be explicitly unassigned', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Unassignable Licence',
        ownerUserId: userA,
      });
      expect(licence.ownerUserId).toBe(userA);

      const updated = await licenses.update(tenantA, userA, licence.id, {
        ownerUserId: null,
      });
      expect(updated.ownerUserId).toBeNull();
    });

    it('treats an unassigned owner as valid, not an error', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'No Owner Licence',
        expiryDate: addDays(today, 300),
      });
      expect(licence.ownerUserId).toBeNull();
      // Obligations still exist — they simply have nobody to reach yet.
      expect(await reminders.findForLicense(tenantA, licence.id)).toHaveLength(
        5,
      );
    });

    it('records an owner change in the audit trail', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Owner Audited',
      });
      await licenses.update(tenantA, userA, licence.id, {
        ownerUserId: userA,
      });

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: licence.id, action: 'license.updated' },
      });
      expect(Object.keys(entry?.changes as object)).toContain('ownerUserId');
    });
  });

  // ── Slice 4: taxonomy, scope invariant, filtering, coverage ──────────────
  describe('expiry-status filtering is a database predicate', () => {
    let filterTenant: string;
    let filterUser: string;

    beforeAll(async () => {
      const tenant = await prisma.tenant.create({
        data: { name: `filter-${suffix}`, timeZone: 'Asia/Riyadh' },
      });
      filterTenant = tenant.id;
      const user = await prisma.user.create({
        data: {
          tenantId: filterTenant,
          email: `filter-${suffix}@example.test`,
          name: 'Filter Owner',
          role: 'OWNER',
        },
      });
      filterUser = user.id;

      // 12 licences spread across every status band.
      const offsets = [-40, -5, 3, 12, 28, 45, 70, 88, 120, 300, 400, null];
      for (const [index, offset] of offsets.entries()) {
        await licenses.create(filterTenant, filterUser, {
          name: `Filter Licence ${index}`,
          expiryDate: offset === null ? undefined : addDays(today, offset),
        });
      }
    });

    /**
     * THE REGRESSION TEST.
     *
     * Before the fix, `skip`/`take` ran in SQL and the status filter ran on the
     * returned page, so a small page size returned rows that had been filtered
     * down to nothing while `meta.total` still reported the unfiltered count.
     * Measured on real data: limit=3 gave meta.total=12 and a list of length 0.
     *
     * This asserts agreement at page sizes far smaller than the result set,
     * which is exactly the condition the old implementation failed.
     */
    it.each([1, 2, 3, 5, 100])(
      'count equals list length at limit=%i, for every status',
      async (limit) => {
        for (const status of [
          'EXPIRED',
          'CRITICAL',
          'EXPIRING_SOON',
          'ACTIVE',
          'NO_EXPIRY',
        ] as const) {
          const page = await licenses.findAll(filterTenant, {
            expiryStatus: status,
            limit,
            page: 1,
          });

          // Every returned row genuinely has the requested status.
          expect(page.data.every((row) => row.status === status)).toBe(true);

          // And the total is the count of MATCHING rows, not of all rows.
          const all = await licenses.findAll(filterTenant, {
            expiryStatus: status,
            limit: 100,
          });
          expect(page.meta.total).toBe(all.data.length);
          expect(page.data.length).toBe(Math.min(limit, all.data.length));
        }
      },
    );

    it('every status bucket sums to the unfiltered total', async () => {
      const unfiltered = await licenses.findAll(filterTenant, { limit: 100 });
      let summed = 0;
      for (const status of [
        'EXPIRED',
        'CRITICAL',
        'EXPIRING_SOON',
        'ACTIVE',
        'NO_EXPIRY',
      ] as const) {
        const bucket = await licenses.findAll(filterTenant, {
          expiryStatus: status,
          limit: 100,
        });
        summed += bucket.meta.total;
      }
      expect(summed).toBe(unfiltered.meta.total);
    });

    it('needsAttention returns exactly the expired and critical licences', async () => {
      const attention = await licenses.findAll(filterTenant, {
        needsAttention: true,
        limit: 100,
      });
      expect(
        attention.data.every(
          (row) => row.status === 'EXPIRED' || row.status === 'CRITICAL',
        ),
      ).toBe(true);
      expect(attention.meta.total).toBe(attention.data.length);
    });
  });

  describe('licence scope invariant', () => {
    let entityTypeId: string;
    let siteTypeId: string;

    beforeAll(async () => {
      const authority = await prisma.authority.upsert({
        where: { name: `Test Authority ${suffix}` },
        update: {},
        create: { name: `Test Authority ${suffix}`, nameAr: 'جهة اختبار' },
      });
      const entityType = await prisma.licenseType.upsert({
        where: { name: `Entity Type ${suffix}` },
        update: {},
        create: {
          name: `Entity Type ${suffix}`,
          nameAr: 'نوع كيان',
          authorityId: authority.id,
          scope: 'ENTITY',
        },
      });
      const siteType = await prisma.licenseType.upsert({
        where: { name: `Site Type ${suffix}` },
        update: {},
        create: {
          name: `Site Type ${suffix}`,
          nameAr: 'نوع موقع',
          authorityId: authority.id,
          scope: 'SITE',
        },
      });
      entityTypeId = entityType.id;
      siteTypeId = siteType.id;
    });

    it('rejects a SITE-scoped licence with no site', async () => {
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Missing site',
          licenseTypeId: siteTypeId,
        }),
      ).rejects.toThrow(/must be assigned to a site/);
    });

    it('rejects an ENTITY-scoped licence attached to a site', async () => {
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Wrongly sited',
          licenseTypeId: entityTypeId,
          siteId: siteA,
        }),
      ).rejects.toThrow(/cannot be assigned to a site/);
    });

    it('accepts each scope in its correct shape', async () => {
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Correct entity',
          licenseTypeId: entityTypeId,
        }),
      ).resolves.toBeDefined();
      await expect(
        licenses.create(tenantA, userA, {
          name: 'Correct site',
          licenseTypeId: siteTypeId,
          siteId: siteA,
        }),
      ).resolves.toBeDefined();
    });

    it('enforces the invariant on update, not just create', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Scope change target',
        licenseTypeId: siteTypeId,
        siteId: siteA,
      });
      // Removing the site from a SITE-scoped licence must fail.
      await expect(
        licenses.update(tenantA, userA, licence.id, { siteId: null }),
      ).rejects.toThrow(/must be assigned to a site/);
    });

    it('leaves untyped licences unconstrained', async () => {
      // Legacy rows have no catalogued type and must keep working.
      await expect(
        licenses.create(tenantA, userA, { name: 'No type at all' }),
      ).resolves.toBeDefined();
    });
  });

  describe('coverage gaps', () => {
    let gapTenant: string;
    let gapUser: string;
    let gapSite: string;
    let requiredSiteType: string;
    let requiredEntityType: string;

    beforeAll(async () => {
      const tenant = await prisma.tenant.create({
        data: { name: `gap-${suffix}`, timeZone: 'Asia/Riyadh' },
      });
      gapTenant = tenant.id;
      gapUser = (
        await prisma.user.create({
          data: {
            tenantId: gapTenant,
            email: `gap-${suffix}@example.test`,
            role: 'OWNER',
          },
        })
      ).id;
      gapSite = (await sites.create(gapTenant, gapUser, { name: 'Gap Site' }))
        .id;

      const authority = await prisma.authority.upsert({
        where: { name: `Gap Authority ${suffix}` },
        update: {},
        create: { name: `Gap Authority ${suffix}`, nameAr: 'جهة' },
      });
      requiredSiteType = (
        await prisma.licenseType.create({
          data: {
            name: `Gap Site Type ${suffix}`,
            nameAr: 'موقع',
            authorityId: authority.id,
            scope: 'SITE',
          },
        })
      ).id;
      requiredEntityType = (
        await prisma.licenseType.create({
          data: {
            name: `Gap Entity Type ${suffix}`,
            nameAr: 'كيان',
            authorityId: authority.id,
            scope: 'ENTITY',
          },
        })
      ).id;

      for (const licenseTypeId of [requiredSiteType, requiredEntityType]) {
        await prisma.tenantLicenseRequirement.create({
          data: { tenantId: gapTenant, licenseTypeId },
        });
      }
    });

    it('reports a site missing a required SITE type', async () => {
      const gaps = await coverage.findGaps(gapTenant);
      const siteGap = gaps.find((g) => g.licenseTypeId === requiredSiteType);
      expect(siteGap).toBeDefined();
      expect(siteGap?.siteId).toBe(gapSite);
      expect(siteGap?.siteName).toBe('Gap Site');
      expect(siteGap?.authorityName).toContain('Gap Authority');
    });

    it('reports a missing required ENTITY type with no site attached', async () => {
      const gaps = await coverage.findGaps(gapTenant);
      const entityGap = gaps.find(
        (g) => g.licenseTypeId === requiredEntityType,
      );
      expect(entityGap).toBeDefined();
      expect(entityGap?.siteId).toBeNull();
      expect(entityGap?.scope).toBe('ENTITY');
    });

    it('reports NO gap once an active licence of that type exists', async () => {
      await licenses.create(gapTenant, gapUser, {
        name: 'Closes the gap',
        licenseTypeId: requiredSiteType,
        siteId: gapSite,
        expiryDate: addDays(today, 200),
      });

      const gaps = await coverage.findGaps(gapTenant);
      expect(
        gaps.find((g) => g.licenseTypeId === requiredSiteType),
      ).toBeUndefined();
    });

    it('an ARCHIVED licence does NOT close a gap', async () => {
      const licence = await licenses.create(gapTenant, gapUser, {
        name: 'Will be archived',
        licenseTypeId: requiredEntityType,
      });
      expect(
        (await coverage.findGaps(gapTenant)).find(
          (g) => g.licenseTypeId === requiredEntityType,
        ),
      ).toBeUndefined();

      await licenses.archive(gapTenant, gapUser, licence.id);

      // The requirement is unmet again — an archived licence is not coverage.
      expect(
        (await coverage.findGaps(gapTenant)).find(
          (g) => g.licenseTypeId === requiredEntityType,
        ),
      ).toBeDefined();
    });

    it('deactivating a type removes it from gaps without hiding its licences', async () => {
      const before = await licenses.findAll(gapTenant, { limit: 100 });
      await prisma.licenseType.update({
        where: { id: requiredSiteType },
        data: { isActive: false },
      });

      const gaps = await coverage.findGaps(gapTenant);
      expect(
        gaps.find((g) => g.licenseTypeId === requiredSiteType),
      ).toBeUndefined();

      // The licences that use it are untouched and still listed.
      const after = await licenses.findAll(gapTenant, { limit: 100 });
      expect(after.meta.total).toBe(before.meta.total);

      await prisma.licenseType.update({
        where: { id: requiredSiteType },
        data: { isActive: true },
      });
    });

    it('never leaks another tenant’s gaps', async () => {
      const gaps = await coverage.findGaps(tenantA);
      expect(gaps.every((g) => g.siteId !== gapSite)).toBe(true);
    });
  });

  describe('ownership concentration', () => {
    it('counts active licences per owner and includes an unassigned bucket', async () => {
      const load = await coverage.findOwnerLoad(tenantA);
      expect(load.some((row) => row.ownerUserId === null)).toBe(true);
      // Sorted heaviest first — the key-person risk is the top row.
      for (let i = 1; i < load.length; i += 1) {
        expect(load[i - 1].licenseCount).toBeGreaterThanOrEqual(
          load[i].licenseCount,
        );
      }
    });

    it('respects the tenant boundary', async () => {
      const loadA = await coverage.findOwnerLoad(tenantA);
      const loadB = await coverage.findOwnerLoad(tenantB);
      expect(loadA.some((row) => row.ownerUserId === userB)).toBe(false);
      expect(loadB.some((row) => row.ownerUserId === userA)).toBe(false);
    });

    it('totals match the tenant’s active licence count', async () => {
      const load = await coverage.findOwnerLoad(tenantA);
      const summed = load.reduce((total, row) => total + row.licenseCount, 0);
      const active = await prisma.license.count({
        where: { tenantId: tenantA, lifecycle: 'ACTIVE' },
      });
      expect(summed).toBe(active);
    });
  });

  describe('site counts separate the two populations', () => {
    it('a site rollup excludes entity-level licences', async () => {
      const site = await sites.create(tenantA, userA, {
        name: 'Population Site',
      });
      await licenses.create(tenantA, userA, {
        name: 'At the site',
        siteId: site.id,
        expiryDate: addDays(today, 100),
      });
      await licenses.create(tenantA, userA, {
        name: 'Company wide',
        expiryDate: addDays(today, 100),
      });

      const detail = await sites.findOne(tenantA, site.id);
      expect(detail.compliance.total).toBe(1);
      // And the entity ones are reported separately rather than lost.
      expect(detail.entityCompliance.total).toBeGreaterThanOrEqual(1);
    });

    it('entity licences remain visible in tenant-wide totals', async () => {
      const all = await licenses.findAll(tenantA, { limit: 100 });
      const entityOnly = await licenses.findAll(tenantA, {
        siteId: 'none',
        limit: 100,
      });
      expect(entityOnly.meta.total).toBeGreaterThan(0);
      expect(all.meta.total).toBeGreaterThanOrEqual(entityOnly.meta.total);
    });
  });

  // ── 9. Audit trail ───────────────────────────────────────────────────────
  describe('audit trail', () => {
    it('is scoped to the acting tenant', async () => {
      const entries = await prisma.complianceAuditLog.findMany({
        where: { tenantId: tenantA },
      });
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.every((e) => e.tenantId === tenantA)).toBe(true);
    });

    it('records only changed fields, not whole rows', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'Selective Audit',
        authority: 'Original Authority',
      });

      await licenses.update(tenantA, userA, licence.id, {
        authority: 'New Authority',
      });

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: licence.id, action: 'license.updated' },
      });

      expect(Object.keys(entry?.changes as object)).toEqual(['authority']);
    });

    it('writes no audit entry when an update changes nothing', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: 'No-op Update',
      });

      await licenses.update(tenantA, userA, licence.id, {
        name: 'No-op Update',
      });

      const updates = await prisma.complianceAuditLog.count({
        where: { entityId: licence.id, action: 'license.updated' },
      });
      expect(updates).toBe(0);
    });
  });

  describe('dashboard — every figure is a count of something real', () => {
    it("reports totals that match a direct count of the tenant's licences", async () => {
      const overview = await dashboard.overview(tenantA);

      const actual = await prisma.license.count({
        where: { tenantId: tenantA, lifecycle: 'ACTIVE' },
      });
      expect(overview.licences.total).toBe(actual);
    });

    it('splits site-scoped and company-wide so the two screens reconcile', async () => {
      // The sites page counts only site-scoped licences. Presenting the total
      // without the split is what makes a client subtract across screens.
      const overview = await dashboard.overview(tenantA);

      const atSites = await prisma.license.count({
        where: {
          tenantId: tenantA,
          lifecycle: 'ACTIVE',
          siteId: { not: null },
        },
      });
      const entityWide = await prisma.license.count({
        where: { tenantId: tenantA, lifecycle: 'ACTIVE', siteId: null },
      });

      expect(overview.licences.atSites).toBe(atSites);
      expect(overview.licences.entityWide).toBe(entityWide);
      // The split must account for the whole portfolio, with nothing lost.
      expect(atSites + entityWide).toBe(overview.licences.total);
    });

    it('expiry buckets sum to the total', async () => {
      const { licences } = await dashboard.overview(tenantA);
      const summed =
        licences.active +
        licences.expiringSoon +
        licences.critical +
        licences.expired +
        licences.noExpiry;
      expect(summed).toBe(licences.total);
    });

    it('coverage gaps match the gaps page for the same tenant', async () => {
      const overview = await dashboard.overview(tenantA);
      const gaps = await coverage.findGaps(tenantA);
      expect(overview.coverageGaps).toBe(gaps.length);
    });

    it('ownership numbers reconcile with the licence count', async () => {
      const { ownership, licences } = await dashboard.overview(tenantA);
      const listed = ownership.top.reduce((n, o) => n + o.licenseCount, 0);

      // Everything assigned is either listed or disclosed as remainder.
      expect(listed + ownership.otherLicenceCount).toBe(ownership.assigned);
      // And assigned plus unassigned is the whole portfolio.
      expect(ownership.assigned + ownership.unassigned).toBe(licences.total);
    });

    it('DISCLOSES the truncated remainder rather than implying a full list', async () => {
      // Slice 5 found a panel showing 3 of 4 owners beside a sentence that
      // read as though it showed all of them.
      const site = await sites.create(tenantA, userA, { name: 'Owner Spread' });
      const extraOwners = [];
      for (let i = 0; i < 6; i += 1) {
        const u = await prisma.user.create({
          data: {
            tenantId: tenantA,
            email: `spread-${i}-${Date.now()}@example.test`,
            name: `Spread Owner ${i}`,
            role: 'MEMBER',
          },
        });
        extraOwners.push(u.id);
        await licenses.create(tenantA, userA, {
          name: `Spread Licence ${i}`,
          siteId: site.id,
          ownerUserId: u.id,
          expiryDate: addDays(todayIn('Asia/Riyadh'), 200),
        });
      }

      const { ownership } = await dashboard.overview(tenantA);

      expect(ownership.top.length).toBeLessThanOrEqual(4);
      expect(ownership.otherOwners).toBeGreaterThan(0);
      expect(ownership.otherLicenceCount).toBeGreaterThan(0);
      // The remainder is never silently dropped.
      expect(
        ownership.top.reduce((n, o) => n + o.licenseCount, 0) +
          ownership.otherLicenceCount,
      ).toBe(ownership.assigned);
    });

    it('lists only PENDING reminders as upcoming', async () => {
      // A SENT reminder already went; SKIPPED, CANCELLED, FAILED and
      // UNDELIVERABLE all describe something that will not happen. Listing
      // any of them under "upcoming" promises a message that is not coming.
      const { reminders } = await dashboard.overview(tenantA);
      const ids = reminders.upcoming.map((r) => r.id);
      if (ids.length > 0) {
        const rows = await prisma.licenseReminder.findMany({
          where: { id: { in: ids } },
          select: { status: true },
        });
        expect(rows.every((r) => r.status === 'PENDING')).toBe(true);
      }
      expect(reminders.upcomingCount).toBe(reminders.upcoming.length);
    });

    it("ISOLATES tenants — B never sees A's figures", async () => {
      const a = await dashboard.overview(tenantA);
      const b = await dashboard.overview(tenantB);

      const bCount = await prisma.license.count({
        where: { tenantId: tenantB, lifecycle: 'ACTIVE' },
      });
      expect(b.licences.total).toBe(bCount);
      expect(b.licences.total).not.toBe(a.licences.total);

      // No reminder on B's dashboard may belong to a licence of A's.
      const bLicenceIds = new Set(
        (
          await prisma.license.findMany({
            where: { tenantId: tenantB },
            select: { id: true },
          })
        ).map((l) => l.id),
      );
      for (const reminder of b.reminders.upcoming) {
        expect(bLicenceIds.has(reminder.licenseId)).toBe(true);
      }
    });

    it('returns a coherent shape for a tenant with nothing at all', async () => {
      const empty = await prisma.tenant.create({
        data: { name: `Empty ${Date.now()}`, timeZone: 'Asia/Riyadh' },
      });
      try {
        const overview = await dashboard.overview(empty.id);
        expect(overview.licences.total).toBe(0);
        expect(overview.coverageGaps).toBe(0);
        expect(overview.ownership.top).toEqual([]);
        expect(overview.ownership.unassigned).toBe(0);
        expect(overview.reminders.upcoming).toEqual([]);
        expect(overview.sites.total).toBe(0);
      } finally {
        await prisma.tenant.delete({ where: { id: empty.id } });
      }
    });
  });

  describe('in-app notifications — a due reminder is never invisible', () => {
    const today = todayIn('Asia/Riyadh');

    /** A licence whose 90-day reminder is already due. */
    const dueLicence = async (name: string, ownerUserId: string | null) => {
      const licence = await licenses.create(tenantA, userA, {
        name,
        ownerUserId,
        // Exactly 90 days out, so the 90-day obligation falls due TODAY and
        // is created PENDING. At 89 days it would already have passed and be
        // created SKIPPED, which this list correctly excludes.
        expiryDate: addDays(today, 90),
      });
      return licence;
    };

    it('shows a due reminder for a licence with NO owner', async () => {
      // The case that matters most: an unassigned licence is the likeliest to
      // lapse, and a per-owner inbox would make it the only invisible one.
      const licence = await dueLicence(`Unowned notify ${Date.now()}`, null);

      const list = await notifications.list(tenantA, userA);
      const entry = list.find((n) => n.licenseId === licence.id);

      expect(entry).toBeDefined();
      expect(entry!.ownerUserId).toBeNull();
      expect(entry!.ownerName).toBeNull();
    });

    it('shows a due reminder for a licence owned by SOMEONE ELSE', async () => {
      const other = await prisma.user.create({
        data: {
          tenantId: tenantA,
          email: `other-${Date.now()}@example.test`,
          name: 'Other Person',
          role: 'MEMBER',
        },
      });
      const licence = await dueLicence(`Owned notify ${Date.now()}`, other.id);

      // userA is not the owner, but the obligation belongs to the business.
      const list = await notifications.list(tenantA, userA);
      expect(list.some((n) => n.licenseId === licence.id)).toBe(true);
    });

    it('shows it regardless of whether any channel is configured', async () => {
      // This surface never consults a sender. Nothing about SMTP can hide it.
      const licence = await dueLicence(`No channel ${Date.now()}`, userA);
      const list = await notifications.list(tenantA, userA);
      expect(list.some((n) => n.licenseId === licence.id)).toBe(true);
    });

    it('passes the delivery status through WITHOUT modifying it', async () => {
      const licence = await dueLicence(`Status passthru ${Date.now()}`, null);
      const reminder = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 90 },
      });
      await prisma.licenseReminder.update({
        where: { id: reminder!.id },
        data: { status: ReminderStatus.UNDELIVERABLE },
      });

      const entry = (await notifications.list(tenantA, userA)).find(
        (n) => n.id === reminder!.id,
      );
      expect(entry!.deliveryStatus).toBe(ReminderStatus.UNDELIVERABLE);

      // And reading the list changed nothing about the reminder itself.
      const after = await prisma.licenseReminder.findUnique({
        where: { id: reminder!.id },
      });
      expect(after!.status).toBe(ReminderStatus.UNDELIVERABLE);
      expect(after!.sentAt).toBeNull();
      expect(after!.attemptCount).toBe(0);
    });

    it('excludes CANCELLED and SKIPPED — neither is actionable', async () => {
      const list = await notifications.list(tenantA, userA);
      const statuses = new Set(list.map((n) => n.deliveryStatus));
      expect(statuses.has(ReminderStatus.CANCELLED)).toBe(false);
      expect(statuses.has(ReminderStatus.SKIPPED)).toBe(false);
    });

    it('excludes reminders that are not due yet', async () => {
      const licence = await licenses.create(tenantA, userA, {
        name: `Far future ${Date.now()}`,
        ownerUserId: userA,
        expiryDate: addDays(today, 300),
      });
      const list = await notifications.list(tenantA, userA);
      expect(list.some((n) => n.licenseId === licence.id)).toBe(false);
    });

    describe('read state is per user', () => {
      it('one user reading does NOT mark it read for another', async () => {
        const reader = await prisma.user.create({
          data: {
            tenantId: tenantA,
            email: `reader-${Date.now()}@example.test`,
            name: 'Reader',
            role: 'MEMBER',
          },
        });
        const licence = await dueLicence(`Per user ${Date.now()}`, userA);
        const reminder = await prisma.licenseReminder.findFirst({
          where: { licenseId: licence.id, offsetDays: 90 },
        });

        await notifications.markRead(tenantA, userA, reminder!.id);

        const forA = (await notifications.list(tenantA, userA)).find(
          (n) => n.id === reminder!.id,
        );
        const forReader = (await notifications.list(tenantA, reader.id)).find(
          (n) => n.id === reminder!.id,
        );

        expect(forA!.read).toBe(true);
        expect(forA!.readAt).not.toBeNull();
        expect(forReader!.read).toBe(false);
        expect(forReader!.readAt).toBeNull();
      });

      it('marking read twice is idempotent, not an error', async () => {
        const licence = await dueLicence(`Twice ${Date.now()}`, userA);
        const reminder = await prisma.licenseReminder.findFirst({
          where: { licenseId: licence.id, offsetDays: 90 },
        });

        await notifications.markRead(tenantA, userA, reminder!.id);
        await expect(
          notifications.markRead(tenantA, userA, reminder!.id),
        ).resolves.toEqual({ read: true });

        const marks = await prisma.reminderRead.count({
          where: { userId: userA, reminderId: reminder!.id },
        });
        expect(marks).toBe(1);
      });

      it('unread count drops as this user reads, and only for them', async () => {
        const counter = await prisma.user.create({
          data: {
            tenantId: tenantA,
            email: `counter-${Date.now()}@example.test`,
            name: 'Counter',
            role: 'MEMBER',
          },
        });

        const before = await notifications.unreadCount(tenantA, counter.id);
        expect(before.unreadCount).toBeGreaterThan(0);

        const list = await notifications.list(tenantA, counter.id);
        await notifications.markRead(tenantA, counter.id, list[0].id);

        const after = await notifications.unreadCount(tenantA, counter.id);
        expect(after.unreadCount).toBe(before.unreadCount - 1);
      });

      it('markAllRead clears this user only', async () => {
        const bulk = await prisma.user.create({
          data: {
            tenantId: tenantA,
            email: `bulk-${Date.now()}@example.test`,
            name: 'Bulk',
            role: 'MEMBER',
          },
        });
        const untouched = await prisma.user.create({
          data: {
            tenantId: tenantA,
            email: `untouched-${Date.now()}@example.test`,
            name: 'Untouched',
            role: 'MEMBER',
          },
        });

        const result = await notifications.markAllRead(tenantA, bulk.id);
        expect(result.updated).toBeGreaterThan(0);

        expect(
          (await notifications.unreadCount(tenantA, bulk.id)).unreadCount,
        ).toBe(0);
        expect(
          (await notifications.unreadCount(tenantA, untouched.id)).unreadCount,
        ).toBeGreaterThan(0);
      });
    });

    describe('tenant isolation', () => {
      it("B never sees A's reminders", async () => {
        const listB = await notifications.list(tenantB, userB);
        const aLicenceIds = new Set(
          (
            await prisma.license.findMany({
              where: { tenantId: tenantA },
              select: { id: true },
            })
          ).map((l) => l.id),
        );
        for (const entry of listB) {
          expect(aLicenceIds.has(entry.licenseId)).toBe(false);
        }
      });

      it("B cannot mark A's reminder read", async () => {
        const licence = await dueLicence(`Cross tenant ${Date.now()}`, userA);
        const reminder = await prisma.licenseReminder.findFirst({
          where: { licenseId: licence.id, offsetDays: 90 },
        });

        // 404, not 403 — a foreign id must not be confirmed to exist.
        await expect(
          notifications.markRead(tenantB, userB, reminder!.id),
        ).rejects.toThrow(/not found/i);

        const marks = await prisma.reminderRead.count({
          where: { reminderId: reminder!.id, userId: userB },
        });
        expect(marks).toBe(0);
      });
    });

    it('writes a compliance audit entry naming the channel', async () => {
      const licence = await dueLicence(`Audited read ${Date.now()}`, userA);
      const reminder = await prisma.licenseReminder.findFirst({
        where: { licenseId: licence.id, offsetDays: 90 },
      });

      await notifications.markRead(tenantA, userA, reminder!.id);

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { entityId: reminder!.id, action: 'reminder.read' },
      });
      expect(entry).not.toBeNull();
      expect(entry!.actorUserId).toBe(userA);
      expect(JSON.stringify(entry!.changes)).toContain('IN_APP');
    });
  });

  describe('coverage state — "nothing declared" is not "nothing missing"', () => {
    /** A tenant that has been told nothing about the business. */
    const emptyTenant = async () => {
      const tenant = await prisma.tenant.create({
        data: {
          name: `Empty ${Date.now()}-${Math.random()}`,
          timeZone: 'Asia/Riyadh',
        },
      });
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: `empty-${Date.now()}-${Math.random()}@example.test`,
          role: 'OWNER',
        },
      });
      return { tenantId: tenant.id, userId: user.id };
    };

    it('reports NOT_CONFIGURED for a tenant that has declared nothing', async () => {
      // The defect this slice exists to fix: zero gaps because nothing was
      // declared was rendered identically to zero gaps because everything is
      // covered, and the customer was told they were fully covered.
      const { tenantId } = await emptyTenant();
      try {
        const coverageState = await coverage.findCoverage(tenantId);
        expect(coverageState.state).toBe('NOT_CONFIGURED');
        expect(coverageState.requirementCount).toBe(0);
        expect(coverageState.gaps).toEqual([]);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('reports HAS_GAPS once a requirement has no matching licence', async () => {
      const { tenantId, userId } = await emptyTenant();
      try {
        const type = await prisma.licenseType.findFirst({
          where: { scope: 'ENTITY', isActive: true },
          select: { id: true },
        });
        await coverage.setRequirement(tenantId, userId, type!.id, true);

        const coverageState = await coverage.findCoverage(tenantId);
        expect(coverageState.state).toBe('HAS_GAPS');
        expect(coverageState.requirementCount).toBe(1);
        expect(coverageState.gaps).toHaveLength(1);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('reports ALL_SATISFIED only once a real licence covers it', async () => {
      const { tenantId, userId } = await emptyTenant();
      try {
        const type = await prisma.licenseType.findFirst({
          where: { scope: 'ENTITY', isActive: true },
          select: { id: true },
        });
        await coverage.setRequirement(tenantId, userId, type!.id, true);
        await licenses.create(tenantId, userId, {
          name: 'Satisfies it',
          licenseTypeId: type!.id,
        });

        const coverageState = await coverage.findCoverage(tenantId);
        expect(coverageState.state).toBe('ALL_SATISFIED');
        // The count IS the honesty: an all-clear is only ever scoped to it.
        expect(coverageState.requirementCount).toBe(1);
        expect(coverageState.gaps).toEqual([]);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('an ARCHIVED licence does NOT satisfy a requirement', async () => {
      const { tenantId, userId } = await emptyTenant();
      try {
        const type = await prisma.licenseType.findFirst({
          where: { scope: 'ENTITY', isActive: true },
          select: { id: true },
        });
        await coverage.setRequirement(tenantId, userId, type!.id, true);
        const licence = await licenses.create(tenantId, userId, {
          name: 'Then archived',
          licenseTypeId: type!.id,
        });
        expect((await coverage.findCoverage(tenantId)).state).toBe(
          'ALL_SATISFIED',
        );

        await licenses.archive(tenantId, userId, licence.id);

        // Archiving means out of scope, so the gap returns.
        expect((await coverage.findCoverage(tenantId)).state).toBe('HAS_GAPS');
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('removing a requirement removes its gap', async () => {
      const { tenantId, userId } = await emptyTenant();
      try {
        const type = await prisma.licenseType.findFirst({
          where: { scope: 'ENTITY', isActive: true },
          select: { id: true },
        });
        await coverage.setRequirement(tenantId, userId, type!.id, true);
        expect((await coverage.findCoverage(tenantId)).gaps).toHaveLength(1);

        await coverage.setRequirement(tenantId, userId, type!.id, false);

        const after = await coverage.findCoverage(tenantId);
        expect(after.gaps).toEqual([]);
        // And back to "we cannot say", not to "you are covered".
        expect(after.state).toBe('NOT_CONFIGURED');
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });
  });

  describe('requirement management', () => {
    it('lists the whole catalogue, flagging what this tenant declared', async () => {
      const { tenantId, userId } = await emptyTenantForRequirements();
      try {
        const before = await coverage.listRequirements(tenantId);
        expect(before.length).toBeGreaterThan(0);
        // A tenant that has declared nothing sees the whole catalogue, all
        // unticked — which is what makes the surface usable from empty.
        expect(before.every((row) => row.required === false)).toBe(true);

        await coverage.setRequirement(
          tenantId,
          userId,
          before[0].licenseTypeId,
          true,
        );

        const after = await coverage.listRequirements(tenantId);
        expect(after.filter((row) => row.required)).toHaveLength(1);
        expect(after[0].licenseTypeId).toBe(before[0].licenseTypeId);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('is idempotent in both directions', async () => {
      const { tenantId, userId } = await emptyTenantForRequirements();
      try {
        const type = await prisma.licenseType.findFirst({
          select: { id: true },
        });
        await coverage.setRequirement(tenantId, userId, type!.id, true);
        await coverage.setRequirement(tenantId, userId, type!.id, true);
        expect(
          await prisma.tenantLicenseRequirement.count({ where: { tenantId } }),
        ).toBe(1);

        await coverage.setRequirement(tenantId, userId, type!.id, false);
        await coverage.setRequirement(tenantId, userId, type!.id, false);
        expect(
          await prisma.tenantLicenseRequirement.count({ where: { tenantId } }),
        ).toBe(0);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('audits a declaration and a withdrawal, but not a no-op', async () => {
      const { tenantId, userId } = await emptyTenantForRequirements();
      try {
        const type = await prisma.licenseType.findFirst({
          select: { id: true, name: true },
        });
        await coverage.setRequirement(tenantId, userId, type!.id, true);
        await coverage.setRequirement(tenantId, userId, type!.id, true); // no-op
        await coverage.setRequirement(tenantId, userId, type!.id, false);

        const entries = await prisma.complianceAuditLog.findMany({
          where: { tenantId, entityId: type!.id },
          orderBy: { createdAt: 'asc' },
        });
        // Two real changes, not three: an audit log full of no-ops hides the
        // changes that matter.
        expect(entries.map((e) => e.action)).toEqual([
          'requirement.added',
          'requirement.removed',
        ]);
        expect(entries[0].actorUserId).toBe(userId);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });

    it('rejects an unknown licence type', async () => {
      await expect(
        coverage.setRequirement(tenantA, userA, 'no-such-type', true),
      ).rejects.toThrow(/not found/i);
    });

    it('ISOLATES tenants — B declaring does not change A', async () => {
      const { tenantId, userId } = await emptyTenantForRequirements();
      try {
        const type = await prisma.licenseType.findFirst({
          select: { id: true },
        });
        const beforeA = await coverage.findCoverage(tenantA);

        await coverage.setRequirement(tenantId, userId, type!.id, true);

        const afterA = await coverage.findCoverage(tenantA);
        expect(afterA.requirementCount).toBe(beforeA.requirementCount);
        // B's declaration landed only against B.
        expect(
          await prisma.tenantLicenseRequirement.count({ where: { tenantId } }),
        ).toBe(1);
      } finally {
        await prisma.tenant.delete({ where: { id: tenantId } });
      }
    });
  });

  /** A throwaway tenant for requirement tests. */
  async function emptyTenantForRequirements() {
    const tenant = await prisma.tenant.create({
      data: {
        name: `Req ${Date.now()}-${Math.random()}`,
        timeZone: 'Asia/Riyadh',
      },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `req-${Date.now()}-${Math.random()}@example.test`,
        role: 'OWNER',
      },
    });
    return { tenantId: tenant.id, userId: user.id };
  }
});
