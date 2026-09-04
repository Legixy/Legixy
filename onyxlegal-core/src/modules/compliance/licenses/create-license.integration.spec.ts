/**
 * The single-licence create path — integration tests against real PostgreSQL.
 *
 * WHAT THIS FILE IS GUARDING
 * --------------------------
 * Until Slice 14 the only way to create a licence was bulk import. The
 * dashboard offered "or add one by hand" and linked to a list with no add
 * path — an interface advertising a capability that did not exist.
 *
 * The create path itself is not new: `LicensesService.create` has existed
 * since Slice 2 and import commits through it. What is new is a second
 * caller, and the thing most likely to go wrong with a second caller is that
 * it quietly bypasses `reconcile()` — which is precisely the bug Slice 5
 * found in a seed script, where every licence existed with zero reminder
 * obligations and nothing looked broken until nothing was ever sent.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { RemindersService } from '../reminders/reminders.service';
import { SitesService } from '../sites/sites.service';
import { LicensesService } from './licenses.service';
import { validateRow } from '../import/domain/validate';
import { addDays, todayIn } from '../domain/plain-date';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

describe('Create one licence (integration)', () => {
  let prisma: PrismaService;
  let licenses: LicensesService;
  let sites: SitesService;
  let tenantA: string;
  let userA: string;
  let tenantB: string;
  let userB: string;
  let siteA: string;
  let entityTypeId: string;
  let siteTypeId: string;
  const suffix = Date.now();

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: string) =>
        key === 'DATABASE_URL' ? TEST_DATABASE_URL : fallback,
    } as unknown as ConfigService;

    prisma = new PrismaService(config);
    await prisma.onModuleInit();

    const audit = new ComplianceAuditService(prisma);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, new RemindersService(prisma));

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

    const a = await makeTenant('create-a');
    const b = await makeTenant('create-b');
    tenantA = a.tenantId;
    userA = a.userId;
    tenantB = b.tenantId;
    userB = b.userId;
    siteA = (await sites.create(tenantA, userA, { name: 'Riyadh HQ' })).id;

    const authority = await prisma.authority.upsert({
      where: { name: `Create Authority ${suffix}` },
      update: {},
      create: { name: `Create Authority ${suffix}`, nameAr: 'جهة' },
    });
    entityTypeId = (
      await prisma.licenseType.create({
        data: {
          name: `Create Entity Type ${suffix}`,
          nameAr: 'نوع',
          authorityId: authority.id,
          scope: 'ENTITY',
          defaultCycleMonths: 12,
        },
      })
    ).id;
    siteTypeId = (
      await prisma.licenseType.create({
        data: {
          name: `Create Site Type ${suffix}`,
          nameAr: 'نوع',
          authorityId: authority.id,
          scope: 'SITE',
          defaultCycleMonths: 12,
        },
      })
    ).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant
        .deleteMany({ where: { id: { in: [tenantA, tenantB] } } })
        .catch(() => undefined);
      await prisma.licenseType
        .deleteMany({ where: { id: { in: [entityTypeId, siteTypeId] } } })
        .catch(() => undefined);
      await prisma.authority
        .deleteMany({ where: { name: `Create Authority ${suffix}` } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  /** Far enough out that every one of 90/60/30/14/7 is still ahead. */
  const futureExpiry = () => addDays(todayIn('Asia/Riyadh'), 200);

  // ── 1 ────────────────────────────────────────────────────────────────────
  it('creates a licence with the entered values', async () => {
    const created = await licenses.create(tenantA, userA, {
      name: 'Balady Municipal Licence',
      siteId: siteA,
      licenseTypeId: siteTypeId,
      licenseNumber: 'BLD-4471',
      expiryDate: futureExpiry(),
    });

    const row = await prisma.license.findFirst({
      where: { id: created.id, tenantId: tenantA },
    });
    expect(row).not.toBeNull();
    expect(row!.name).toBe('Balady Municipal Licence');
    expect(row!.licenseNumber).toBe('BLD-4471');
    expect(row!.siteId).toBe(siteA);
  });

  // ── 2 ────────────────────────────────────────────────────────────────────
  it('generates the full reminder ladder, proving create() was used', async () => {
    const created = await licenses.create(tenantA, userA, {
      name: 'Ladder Check',
      licenseTypeId: entityTypeId,
      expiryDate: futureExpiry(),
    });

    const reminders = await prisma.licenseReminder.findMany({
      where: { licenseId: created.id },
      orderBy: { offsetDays: 'desc' },
    });

    // This is the assertion that catches a caller writing rows directly.
    expect(reminders.map((r) => r.offsetDays)).toEqual([90, 60, 30, 14, 7]);
  });

  // ── 3 ────────────────────────────────────────────────────────────────────
  it('rejects an ambiguous date and names the required format', () => {
    const row = validateRow(1, { name: 'X', expiryDate: '01/02/2027' });

    expect(row.outcome).toBe('FAIL');
    const message = row.issues.map((i) => i.message).join(' ');
    expect(message).toMatch(/ambiguous/i);
    expect(message).toMatch(/YYYY-MM-DD/);
    expect(row.expiryDate).toBeNull();
  });

  // ── 4 ────────────────────────────────────────────────────────────────────
  it('rejects an impossible calendar date with a distinct message', () => {
    const row = validateRow(1, { name: 'X', expiryDate: '2027-02-30' });

    expect(row.outcome).toBe('FAIL');
    const message = row.issues.map((i) => i.message).join(' ');
    expect(message).toMatch(/not a real calendar date/i);
    // Distinct from the ambiguity message, because the fix is different.
    expect(message).not.toMatch(/ambiguous/i);
  });

  // ── 5 ────────────────────────────────────────────────────────────────────
  it('rejects an ENTITY-scoped type given a site', async () => {
    await expect(
      licenses.create(tenantA, userA, {
        name: 'Entity type with a site',
        licenseTypeId: entityTypeId,
        siteId: siteA,
      }),
    ).rejects.toThrow();
  });

  // ── 6 ────────────────────────────────────────────────────────────────────
  it('rejects a SITE-scoped type with no site', async () => {
    await expect(
      licenses.create(tenantA, userA, {
        name: 'Site type without a site',
        licenseTypeId: siteTypeId,
      }),
    ).rejects.toThrow();
  });

  // ── 7 ────────────────────────────────────────────────────────────────────
  it('accepts a name alone, and creates no reminders without an expiry', async () => {
    const created = await licenses.create(tenantA, userA, {
      name: 'Name only',
    });

    expect(created.id).toBeTruthy();
    expect(created.expiryDate).toBeNull();

    const reminders = await prisma.licenseReminder.count({
      where: { licenseId: created.id },
    });
    // No expiry means no obligation. Inventing one would be worse than none.
    expect(reminders).toBe(0);
  });

  // ── 8 ────────────────────────────────────────────────────────────────────
  it('leaves the licence unassigned rather than failing when no owner is given', async () => {
    const created = await licenses.create(tenantA, userA, {
      name: 'No owner',
      expiryDate: futureExpiry(),
    });

    expect(created.ownerUserId).toBeNull();

    // The reminders still exist; they simply have nobody to reach yet.
    const reminders = await prisma.licenseReminder.count({
      where: { licenseId: created.id },
    });
    expect(reminders).toBe(5);
  });

  // ── 9 ────────────────────────────────────────────────────────────────────
  it('respects tenant isolation on every referenced record', async () => {
    // A site belonging to tenant A cannot be attached by tenant B.
    await expect(
      licenses.create(tenantB, userB, {
        name: 'Cross-tenant site',
        siteId: siteA,
      }),
    ).rejects.toThrow();

    // Nor can an owner from tenant A.
    await expect(
      licenses.create(tenantB, userB, {
        name: 'Cross-tenant owner',
        ownerUserId: userA,
      }),
    ).rejects.toThrow();
  });

  // ── 10 ───────────────────────────────────────────────────────────────────
  it('writes a license.created entry to the audit log', async () => {
    const created = await licenses.create(tenantA, userA, {
      name: 'Audited licence',
    });

    const entries = await prisma.complianceAuditLog.findMany({
      where: {
        tenantId: tenantA,
        entityType: 'license',
        entityId: created.id,
      },
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].action).toBe('license.created');
    expect(entries[0].actorUserId).toBe(userA);
  });

  // ── 11 ───────────────────────────────────────────────────────────────────
  /**
   * The date round-trip, across zones on both sides of UTC.
   *
   * Four date bugs have shipped in this project and every one was a calendar
   * date briefly becoming an instant. `@db.Date` stores midnight UTC; reading
   * it with local getters renders the previous day west of Greenwich and the
   * same day east of it, so a test that only runs in one zone proves nothing.
   */
  it('round-trips an expiry date unchanged in zones either side of UTC', async () => {
    const zones = [
      'Pacific/Kiritimati', // UTC+14
      'Asia/Riyadh', //       UTC+3
      'UTC', //               UTC+0
      'America/Los_Angeles', // UTC-8
      'Pacific/Midway', //    UTC-11
    ];
    const original = process.env.TZ;

    try {
      for (const zone of zones) {
        process.env.TZ = zone;

        const created = await licenses.create(tenantA, userA, {
          name: `Round trip ${zone}`,
          expiryDate: '2027-09-15',
        });

        const readBack = await licenses.findOne(tenantA, created.id);

        // Straight off the database, unmediated by any serialiser.
        const raw = await prisma.license.findFirst({
          where: { id: created.id },
          select: { expiryDate: true },
        });

        expect(raw!.expiryDate!.toISOString().slice(0, 10)).toBe('2027-09-15');
        expect(readBack.id).toBe(created.id);

        // The derived ladder must agree: a date that shifted by a day would
        // move every reminder with it.
        const earliest = await prisma.licenseReminder.findFirst({
          where: { licenseId: created.id },
          orderBy: { offsetDays: 'desc' },
          select: { dueOn: true, offsetDays: true },
        });
        expect(earliest!.offsetDays).toBe(90);
        expect(earliest!.dueOn.toISOString().slice(0, 10)).toBe('2027-06-17');
      }
    } finally {
      process.env.TZ = original;
    }
  });
});
