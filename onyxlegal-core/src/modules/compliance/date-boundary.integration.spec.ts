/**
 * The date boundary — the last known bug of a class that has shipped four times.
 *
 * WHAT THIS GUARDS
 * ----------------
 * Seven columns in this schema are `@db.Date`: a licence's issue and expiry,
 * a renewal's previous and new expiry, a reminder's due date, and a
 * document's issued and expires dates. Every one is a CALENDAR DATE — true
 * for the whole of that day in the tenant's timezone, with no instant and no
 * offset attached.
 *
 * Prisma maps `@db.Date` to a JavaScript `Date` at midnight UTC. The moment
 * one of those reaches JSON it becomes "2026-09-15T00:00:00.000Z", and the
 * next person to format it with local-time getters renders the 14th west of
 * Greenwich. That is the bug, four times over.
 *
 * `licenses.service.ts` was the last service still doing it: `withStatus`
 * converted the expiry to compute status, then spread the raw row back over
 * the result. It was invisible because every frontend formatter pins
 * `timeZone: 'UTC'` — the guard was a comment on a type in another repo.
 *
 * WHY THIS TEST AND NOT ONLY THE TYPE
 * -----------------------------------
 * `SerialisedDates<T>` now makes the mistake a compile error, which is the
 * real fix. This test is the belt to that pair of braces: it exercises the
 * services for real and asserts over what actually comes back, so a future
 * `as any`, a hand-written DTO, or a raw Prisma row returned from a new
 * method is caught even though it typechecks.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceAuditService } from './audit/compliance-audit.service';
import { LicensesService } from './licenses/licenses.service';
import { RemindersService } from './reminders/reminders.service';
import { SitesService } from './sites/sites.service';
import { addDays, todayIn } from './domain/plain-date';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

/** Every `@db.Date` column in the schema, by the field name it serialises to. */
const CALENDAR_DATE_FIELDS = [
  'issueDate',
  'expiryDate',
  'previousExpiry',
  'newExpiry',
  'dueOn',
  'issuedOn',
  'expiresOn',
];

const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Walk anything a service returned and collect every calendar-date field
 * whose value is not a bare "YYYY-MM-DD" string.
 *
 * Checks the value BEFORE JSON serialisation (so a `Date` is still a `Date`)
 * and the shape AFTER, because both failure modes exist: returning a `Date`,
 * and returning a string that carries a time.
 */
function findRawDates(value: unknown, path = '$'): string[] {
  const bad: string[] = [];

  const visit = (node: unknown, where: string): void => {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${where}[${i}]`));
      return;
    }
    if (node instanceof Date) return; // only flagged when at a date field
    if (typeof node !== 'object') return;

    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const here = `${where}.${key}`;
      if (CALENDAR_DATE_FIELDS.includes(key)) {
        if (child === null) continue;
        if (child instanceof Date) {
          bad.push(`${here} is a raw Date (${child.toISOString()})`);
          continue;
        }
        if (typeof child !== 'string' || !PLAIN_DATE.test(child)) {
          bad.push(`${here} is not a PlainDate: ${JSON.stringify(child)}`);
        }
        continue;
      }
      visit(child, here);
    }
  };

  visit(value, path);
  return bad;
}

describe('date boundary (integration)', () => {
  let prisma: PrismaService;
  let licenses: LicensesService;
  let reminders: RemindersService;
  let sites: SitesService;
  let tenantId: string;
  let userId: string;
  let licenceId: string;
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
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, reminders);

    const tenant = await prisma.tenant.create({
      data: { name: `boundary-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    tenantId = tenant.id;
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `boundary-${suffix}@example.test`,
        name: 'Boundary owner',
        role: 'OWNER',
      },
    });
    userId = user.id;
    const site = await sites.create(tenantId, userId, { name: 'Riyadh HQ' });

    const licence = await licenses.create(tenantId, userId, {
      name: 'Boundary Licence',
      siteId: site.id,
      ownerUserId: userId,
      issueDate: '2026-01-15',
      expiryDate: addDays(todayIn('Asia/Riyadh'), 200),
    });
    licenceId = licence.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.tenant.deleteMany({ where: { id: tenantId } }).catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  // ── 1 ────────────────────────────────────────────────────────────────────
  it('emits no raw Date from any licence read path', async () => {
    const one = await licenses.findOne(tenantId, licenceId);
    expect(findRawDates(one, 'findOne')).toEqual([]);

    const many = await licenses.findAll(tenantId, { limit: 50 });
    expect(findRawDates(many, 'findAll')).toEqual([]);

    // create() returns through the same serialiser.
    const created = await licenses.create(tenantId, userId, {
      name: 'Second Boundary Licence',
      expiryDate: '2028-03-01',
      issueDate: '2027-03-01',
    });
    expect(findRawDates(created, 'create')).toEqual([]);

    const updated = await licenses.update(tenantId, userId, licenceId, {
      licenseNumber: 'BND-1',
    });
    expect(findRawDates(updated, 'update')).toEqual([]);
  });

  it('emits no raw Date from reminders, sites or the reminder timeline', async () => {
    expect(
      findRawDates(await reminders.findForLicense(tenantId, licenceId), 'reminders'),
    ).toEqual([]);
    expect(findRawDates(await sites.findAll(tenantId, {}), 'sites.findAll')).toEqual([]);
  });

  /**
   * The detector must be able to fail, or the tests above prove nothing.
   * This is the exact shape the bug produced.
   */
  it('the detector is not vacuous', () => {
    const raw = { id: 'x', expiryDate: new Date('2026-09-15T00:00:00.000Z') };
    expect(findRawDates(raw)).toHaveLength(1);
    expect(findRawDates(raw)[0]).toMatch(/raw Date/);

    const instantString = { nested: { dueOn: '2026-09-15T00:00:00.000Z' } };
    expect(findRawDates(instantString)).toHaveLength(1);
    expect(findRawDates(instantString)[0]).toMatch(/not a PlainDate/);

    // And must pass on the correct shape.
    expect(findRawDates({ expiryDate: '2026-09-15', issuedOn: null })).toEqual([]);
  });

  // ── 2 ────────────────────────────────────────────────────────────────────
  /**
   * The round trip, across zones on both sides of UTC.
   *
   * A test that only runs in one zone proves nothing about this bug class:
   * midnight UTC renders as the same day east of Greenwich and the previous
   * day west of it, so a single-zone run passes with the bug present.
   */
  it('round-trips licence dates unchanged across five timezones', async () => {
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

        const licence = await licenses.create(tenantId, userId, {
          name: `Zone ${zone}`,
          issueDate: '2026-01-15',
          expiryDate: '2027-09-15',
        });

        expect(`${zone}:${licence.issueDate}`).toBe(`${zone}:2026-01-15`);
        expect(`${zone}:${licence.expiryDate}`).toBe(`${zone}:2027-09-15`);

        const readBack = await licenses.findOne(tenantId, licence.id);
        expect(`${zone}:${readBack.issueDate}`).toBe(`${zone}:2026-01-15`);
        expect(`${zone}:${readBack.expiryDate}`).toBe(`${zone}:2027-09-15`);
        expect(findRawDates(readBack, zone)).toEqual([]);

        // The derived ladder must agree — a date that shifted by a day would
        // move all five reminders with it.
        const ladder = await reminders.findForLicense(tenantId, licence.id);
        expect({ zone, offsets: ladder.map((r) => r.offsetDays) }).toEqual({ zone, offsets: [90, 60, 30, 14, 7] });
        expect(`${zone}:${ladder[0].dueOn}`).toBe(`${zone}:2027-06-17`);
        expect(findRawDates(ladder, zone)).toEqual([]);
      }
    } finally {
      process.env.TZ = original;
    }
  });

  // ── 3 ────────────────────────────────────────────────────────────────────
  /** Status is still derived correctly now that the field is a string. */
  it('leaves derived expiry status unchanged', async () => {
    const past = await licenses.create(tenantId, userId, {
      name: 'Already expired',
      expiryDate: addDays(todayIn('Asia/Riyadh'), -5),
    });
    expect(past.status).toBe('EXPIRED');
    expect(past.daysUntilExpiry).toBe(-5);

    const soon = await licenses.create(tenantId, userId, {
      name: 'Action needed',
      expiryDate: addDays(todayIn('Asia/Riyadh'), 10),
    });
    expect(soon.status).toBe('CRITICAL');
    expect(soon.daysUntilExpiry).toBe(10);

    const none = await licenses.create(tenantId, userId, { name: 'No expiry' });
    expect(none.status).toBe('NO_EXPIRY');
    expect(none.daysUntilExpiry).toBeNull();
  });
});
