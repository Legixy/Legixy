/**
 * The demo reset, tested as the recovery mechanism it is.
 *
 * WHY THIS IS WORTH A TEST
 * ------------------------
 * Fifteen slices of QA restored demo state by hand — a psql UPDATE here, a
 * DELETE there, and a note in a report about what had been changed back. That
 * works until the ten minutes before a client meeting, which is exactly when
 * it will not.
 *
 * The property that matters is not "it seeds data". It is "it produces the
 * SAME state from ANY state", including from a half-mutated one. So this runs
 * the real script, mutates the result destructively, runs it again, and
 * compares.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

const TENANT_ID = 'demo-masar-al-khaleej';
/** The core application root, from which the reset script is run. */
const ROOT = join(__dirname, '..', '..', '..');

/** Run the real script against the test database. */
function runReset(): string {
  return execFileSync(
    'npx',
    ['ts-node', '-r', 'tsconfig-paths/register', 'prisma/demo-reset.ts'],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
}

interface Snapshot {
  sites: number;
  licences: number;
  reminders: number;
  requirements: number;
  gaps: number;
  unassigned: number;
  expired: number;
  withoutLadder: number;
  names: string[];
}

describe('demo reset (integration)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: TEST_DATABASE_URL }),
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: TENANT_ID } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  async function snapshot(): Promise<Snapshot> {
    const licences = await prisma.license.findMany({
      where: { tenantId: TENANT_ID },
      select: { name: true, expiryDate: true, ownerUserId: true },
      orderBy: { name: 'asc' },
    });
    const requirements = await prisma.tenantLicenseRequirement.findMany({
      where: { tenantId: TENANT_ID },
      select: { licenseTypeId: true },
    });
    const heldTypes = await prisma.license.findMany({
      where: { tenantId: TENANT_ID },
      select: { licenseTypeId: true },
    });
    const held = new Set(heldTypes.map((l) => l.licenseTypeId));
    const today = new Date();

    return {
      sites: await prisma.site.count({ where: { tenantId: TENANT_ID } }),
      licences: licences.length,
      reminders: await prisma.licenseReminder.count({
        where: { license: { tenantId: TENANT_ID } },
      }),
      requirements: requirements.length,
      gaps: requirements.filter((r) => !held.has(r.licenseTypeId)).length,
      unassigned: licences.filter((l) => l.ownerUserId === null).length,
      expired: licences.filter((l) => l.expiryDate !== null && l.expiryDate < today).length,
      withoutLadder: await prisma.license.count({
        where: { tenantId: TENANT_ID, expiryDate: { not: null }, reminders: { none: {} } },
      }),
      names: licences.map((l) => l.name),
    };
  }

  // ── 11 ───────────────────────────────────────────────────────────────────
  it('builds the demo tenant from nothing', async () => {
    await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });
    expect(await prisma.tenant.count({ where: { id: TENANT_ID } })).toBe(0);

    runReset();
    const state = await snapshot();

    expect(state.sites).toBeGreaterThan(0);
    expect(state.licences).toBeGreaterThan(0);
    expect(state.requirements).toBeGreaterThan(0);
  }, 120_000);

  // ── 13 ───────────────────────────────────────────────────────────────────
  /**
   * The Slice 4 bug, permanently. A seed that writes rows with
   * prisma.license.create instead of going through LicensesService.create
   * produces licences with ZERO reminder obligations. Nothing looks wrong.
   * Nothing is ever sent.
   */
  it('gives every licence with an expiry a full reminder ladder', async () => {
    const state = await snapshot();
    expect(state.withoutLadder).toBe(0);

    const withExpiry = await prisma.license.findMany({
      where: { tenantId: TENANT_ID, expiryDate: { not: null } },
      select: { id: true, name: true },
    });
    expect(withExpiry.length).toBeGreaterThan(0);

    for (const licence of withExpiry) {
      const offsets = await prisma.licenseReminder.findMany({
        where: { licenseId: licence.id },
        select: { offsetDays: true },
        orderBy: { offsetDays: 'desc' },
      });
      expect({
        licence: licence.name,
        offsets: offsets.map((o) => o.offsetDays),
      }).toEqual({ licence: licence.name, offsets: [90, 60, 30, 14, 7] });
    }
  }, 120_000);

  /** The spread is the point. A demo where nothing needs attention shows nothing. */
  it('produces a spread worth showing', async () => {
    const state = await snapshot();

    // At least one already expired, or "Expired" is a hypothetical.
    expect(state.expired).toBeGreaterThanOrEqual(1);
    // At least one genuine coverage gap — the product's differentiator.
    expect(state.gaps).toBeGreaterThanOrEqual(1);
    // At least one licence nobody is responsible for, so "no reminder can
    // reach anyone" is visible rather than theoretical.
    expect(state.unassigned).toBeGreaterThanOrEqual(1);
    // At least one delivered reminder, so a timeline is not all "Scheduled".
    const sent = await prisma.licenseReminder.count({
      where: { license: { tenantId: TENANT_ID }, status: 'SENT' },
    });
    expect(sent).toBeGreaterThanOrEqual(1);
  }, 120_000);

  it('reads as a real company, not as scaffolding', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
    const licences = await prisma.license.findMany({
      where: { tenantId: TENANT_ID },
      select: { name: true, licenseNumber: true },
    });

    // The old seed shipped "Demo Workspace" and DEMO-BAL-201. A client reads
    // that as a prototype, correctly.
    expect(tenant!.name).not.toMatch(/demo|test|workspace|sample/i);
    for (const licence of licences) {
      expect({ name: licence.name, looksFake: /DEMO|TEST|SAMPLE|FOO/i.test(licence.licenseNumber ?? '') })
        .toEqual({ name: licence.name, looksFake: false });
    }
  }, 120_000);

  // ── 12 ───────────────────────────────────────────────────────────────────
  /**
   * The property that actually matters. Not "it seeds" but "it recovers".
   */
  it('restores identical state from a destructively mutated tenant', async () => {
    const before = await snapshot();

    // Mutate the way a demo goes wrong: rename things, wipe expiry dates,
    // delete reminders, unassign owners, drop a site's licences.
    await prisma.licenseReminder.deleteMany({
      where: { license: { tenantId: TENANT_ID } },
    });
    await prisma.license.updateMany({
      where: { tenantId: TENANT_ID },
      data: { name: 'MUTATED', expiryDate: null, ownerUserId: null },
    });
    await prisma.tenantLicenseRequirement.deleteMany({ where: { tenantId: TENANT_ID } });

    const broken = await snapshot();
    expect(broken.reminders).toBe(0);
    expect(broken.requirements).toBe(0);

    runReset();
    const after = await snapshot();

    expect(after).toEqual(before);
  }, 180_000);
});
