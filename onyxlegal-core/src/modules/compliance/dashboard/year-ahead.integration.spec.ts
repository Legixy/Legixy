/**
 * The year ahead — integration tests against real PostgreSQL.
 *
 * THE BUG CLASS THIS GUARDS
 * -------------------------
 * A twelve-month window is two date boundaries and twelve month boundaries,
 * and every one of them is a place a calendar date can become an instant.
 * Four such bugs have shipped in this project. A licence expiring on the 1st
 * belongs to a different month for a tenant in Riyadh than for a server in
 * UTC during the three hours they disagree, so a single-timezone test proves
 * nothing.
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
import { YearAheadService } from './year-ahead.service';
import { addDays, todayIn } from '../domain/plain-date';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

describe('year ahead (integration)', () => {
  let prisma: PrismaService;
  let licenses: LicensesService;
  let sites: SitesService;
  let yearAhead: YearAheadService;
  let tenantId: string;
  let userId: string;
  let siteId: string;
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
    yearAhead = new YearAheadService(prisma);

    const tenant = await prisma.tenant.create({
      data: { name: `year-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    tenantId = tenant.id;
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `year-${suffix}@example.test`,
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
    await prisma.licenseReminder.deleteMany({ where: { tenantId } });
    await prisma.license.deleteMany({ where: { tenantId } });
  });

  const today = () => todayIn('Asia/Riyadh');

  async function licence(name: string, offsetDays: number | null) {
    return licenses.create(tenantId, userId, {
      name,
      siteId,
      ownerUserId: userId,
      ...(offsetDays === null ? {} : { expiryDate: addDays(today(), offsetDays) }),
    });
  }

  // ── 8 ────────────────────────────────────────────────────────────────────
  it('includes every licence in the window exactly once', async () => {
    await licence('Due tomorrow', 1);
    await licence('Due in six months', 180);
    await licence('Due in eleven months', 330);

    const result = await yearAhead.forTenant(tenantId);

    expect(result.total).toBe(3);
    const flat = result.months.flatMap((m) => m.entries.map((e) => e.name));
    expect(flat).toHaveLength(3);
    expect(new Set(flat).size).toBe(3);
  });

  // ── 9 ────────────────────────────────────────────────────────────────────
  it('excludes a licence expiring outside the window', async () => {
    await licence('Inside, just', 300);
    await licence('Outside, just', 400);
    // Already expired: behind the window, not ahead of it.
    await licence('Expired last week', -7);

    const result = await yearAhead.forTenant(tenantId);
    const names = result.months.flatMap((m) => m.entries.map((e) => e.name));

    expect(names).toContain('Inside, just');
    expect(names).not.toContain('Outside, just');
    expect(names).not.toContain('Expired last week');
  });

  it('includes a licence expiring today', async () => {
    await licence('Expires today', 0);
    const result = await yearAhead.forTenant(tenantId);
    expect(result.months.flatMap((m) => m.entries.map((e) => e.name))).toContain(
      'Expires today',
    );
  });

  // ── 10 ───────────────────────────────────────────────────────────────────
  it('keeps a licence with no expiry out of the plot but surfaces the count', async () => {
    await licence('No expiry recorded', null);
    await licence('Has an expiry', 90);

    const result = await yearAhead.forTenant(tenantId);

    expect(result.total).toBe(1);
    expect(result.months.flatMap((m) => m.entries.map((e) => e.name))).not.toContain(
      'No expiry recorded',
    );
    // Surfaced, because a licence with no date is invisible to every
    // forward-looking view and a calm year could be hiding one.
    expect(result.withoutExpiry).toBe(1);
    expect(result.activeTotal).toBe(2);
  });

  it('always returns twelve months, including empty ones', async () => {
    await licence('One licence', 5);
    const result = await yearAhead.forTenant(tenantId);

    expect(result.months).toHaveLength(12);
    // An empty month must be present and empty. "Nothing in March" and
    // "March is not shown" must not look the same — the absence IS the shape
    // this view exists to reveal.
    expect(result.months.filter((m) => m.entries.length === 0).length).toBe(11);
    expect(result.months[0].month).toBe(today().slice(0, 7));
  });

  it('makes a cluster visible as a count, not just as rows', async () => {
    // Five in one month, one in another.
    for (let i = 0; i < 5; i += 1) await licence(`Cluster ${i}`, 100 + i);
    await licence('Lonely', 250);

    const result = await yearAhead.forTenant(tenantId);
    const busiest = [...result.months].sort(
      (a, b) => b.entries.length - a.entries.length,
    )[0];

    expect(busiest.entries.length).toBeGreaterThanOrEqual(5);
  });

  // ── 12 ───────────────────────────────────────────────────────────────────
  /**
   * Zones either side of UTC, and a year boundary.
   *
   * `2026-12-31` and `2027-01-01` are the interesting pair: a date that moves
   * by one day across a zone boundary also moves by one MONTH and one YEAR,
   * so a bucketing bug shows up here and nowhere else.
   */
  it('buckets correctly across five timezones and a year boundary', async () => {
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

        await prisma.licenseReminder.deleteMany({ where: { tenantId } });
        await prisma.license.deleteMany({ where: { tenantId } });

        // Fixed calendar dates either side of a year boundary.
        const a = await licenses.create(tenantId, userId, {
          name: 'New Year Eve',
          expiryDate: '2026-12-31',
        });
        const b = await licenses.create(tenantId, userId, {
          name: 'New Year Day',
          expiryDate: '2027-01-01',
        });

        const result = await yearAhead.forTenant(tenantId);
        const found = result.months.flatMap((m) =>
          m.entries.map((e) => ({ month: m.month, name: e.name, on: e.expiryDate })),
        );

        const eve = found.find((f) => f.name === 'New Year Eve');
        const day = found.find((f) => f.name === 'New Year Day');

        // Both are inside a twelve-month window from 2026-09-03.
        expect({ zone, eve: eve?.month, on: eve?.on }).toEqual({
          zone,
          eve: '2026-12',
          on: '2026-12-31',
        });
        expect({ zone, day: day?.month, on: day?.on }).toEqual({
          zone,
          day: '2027-01',
          on: '2027-01-01',
        });

        await prisma.license.deleteMany({ where: { id: { in: [a.id, b.id] } } });
      }
    } finally {
      process.env.TZ = original;
    }
  });

  // ── 13 ───────────────────────────────────────────────────────────────────
  it('carries the identifiers an entry needs to reach its licence', async () => {
    const created = await licence('Reachable', 60);
    const result = await yearAhead.forTenant(tenantId);
    const entry = result.months.flatMap((m) => m.entries)[0];

    expect(entry.licenseId).toBe(created.id);
    expect(entry.name).toBe('Reachable');
    expect(entry.siteName).toBe('Riyadh HQ');
    expect(entry.ownerName).toBe('Nadia Al-Otaibi');
    // 60 days is inside the 90-day window, so EXPIRING_SOON is correct.
    expect(entry.status).toBe('EXPIRING_SOON');
    expect(entry.daysUntilExpiry).toBe(60);
  });

  it('emits PlainDate strings, never raw Date objects', async () => {
    await licence('Shape check', 30);
    const result = await yearAhead.forTenant(tenantId);
    const entry = result.months.flatMap((m) => m.entries)[0];

    expect(typeof entry.expiryDate).toBe('string');
    expect(entry.expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('keeps one tenant’s year out of another’s', async () => {
    const other = await prisma.tenant.create({
      data: { name: `year-other-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    try {
      await licence('Ours', 30);
      const theirs = await yearAhead.forTenant(other.id);
      expect(theirs.total).toBe(0);
      expect(theirs.activeTotal).toBe(0);
      expect(theirs.months).toHaveLength(12);
    } finally {
      await prisma.tenant.delete({ where: { id: other.id } }).catch(() => undefined);
    }
  });
});
