/**
 * The demo tenant. One command, repeatable, from nothing or from anything.
 *
 * WHY THIS REPLACES THE OLD SEED
 * ------------------------------
 * The previous seed produced a tenant called "Demo Workspace" holding
 * licences numbered DEMO-BAL-201. A client reads that as a prototype, and
 * they are right to — it is scaffolding wearing a product's clothes. This
 * one produces a company whose register looks like a register.
 *
 * EVERYTHING HERE IS SYNTHETIC
 * ----------------------------
 * No real company, no real person, no real registration number. The
 * identifiers below are formatted the way Saudi identifiers are formatted —
 * because a demo where the CR number reads "DEMO-CR-1010" is a demo about
 * software rather than about a business — but every one is invented. The
 * sequence blocks used (CR 40xx-xxxx-xx, GOSI 5xx-xxxxxx) are chosen so a
 * reader comparing them against a real registry finds nothing.
 *
 * Deliberately NOT modelled on the actual prospect. Inventing a real client's
 * compliance position and showing it back to them in a meeting is a bad way
 * to be wrong.
 *
 * WHAT MAKES IT WORTH SHOWING
 * ---------------------------
 * The spread is designed to make each screen say something true and
 * uncomfortable:
 *
 *   · one licence already expired, so "Expired" is not a hypothetical
 *   · two inside thirty days, so "Action needed" has occupants
 *   · a genuine coverage gap — a licence type the company has declared it
 *     must hold, with no record at all. That is the differentiator, and on
 *     the old seed it was empty for any tenant but one.
 *   · ownership concentrated on one person, plus one licence assigned to
 *     nobody, so "no reminder can reach anyone" is visible rather than theoretical
 *   · documents in all three checklist states
 *   · reminders including one already delivered, so the timeline is not all
 *     "Scheduled"
 *
 * THE SLICE 4 BUG
 * ---------------
 * Licences are created through LicensesService.create, NOT prisma.license
 * .create. That is the whole reason this file constructs services rather than
 * writing rows: a seed that writes directly produces licences with zero
 * reminder obligations, everything looks correct, and nothing is ever sent.
 * The old seed wrote rows and then called reconcile() to compensate. Going
 * through the service means it cannot be forgotten.
 */

import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/database/prisma.service';
import { ComplianceAuditService } from '../src/modules/compliance/audit/compliance-audit.service';
import { LicensesService } from '../src/modules/compliance/licenses/licenses.service';
import { RemindersService } from '../src/modules/compliance/reminders/reminders.service';
import { SitesService } from '../src/modules/compliance/sites/sites.service';
import { addDays, todayIn, type PlainDate } from '../src/modules/compliance/domain/plain-date';
import { ensureCatalogue } from './catalogue';

const TENANT_ID = 'demo-masar-al-khaleej';
const TIME_ZONE = 'Asia/Riyadh';
const DEMO_PASSWORD = 'Demo2026!legixy';

/** Everyone signs in with the same password; this is a demo, not an account. */
const PEOPLE = [
  { key: 'nadia', email: 'nadia@masaralkhaleej.example', name: 'Nadia Al-Otaibi', role: 'OWNER' },
  { key: 'faisal', email: 'faisal@masaralkhaleej.example', name: 'Faisal Al-Harbi', role: 'MEMBER' },
  { key: 'huda', email: 'huda@masaralkhaleej.example', name: 'Huda Al-Zahrani', role: 'MEMBER' },
] as const;

const SITES = [
  { key: 'hq', name: 'Riyadh Head Office', city: 'Riyadh', code: 'RUH-HO', address: 'Al Olaya District, Riyadh' },
  { key: 'showroom', name: 'Exit 9 Showroom', city: 'Riyadh', code: 'RUH-S9', address: 'Eastern Ring Road, Riyadh' },
  { key: 'warehouse', name: 'Al-Khumrah Warehouse', city: 'Jeddah', code: 'JED-KHW', address: 'Al-Khumrah Industrial Area, Jeddah' },
  { key: 'plant', name: 'Second Industrial City Plant', city: 'Dammam', code: 'DMM-2IC', address: 'Second Industrial City, Dammam' },
] as const;

type SiteKey = (typeof SITES)[number]['key'];
type PersonKey = (typeof PEOPLE)[number]['key'];

/**
 * The register.
 *
 * `days` is relative to today, so the spread stays meaningful whenever the
 * demo is run rather than drifting into "everything expired" a month later.
 * That is the single most important property of this file.
 */
interface LicenceSpec {
  name: string;
  type: string;
  number: string;
  site: SiteKey | null;
  owner: PersonKey | null;
  /** Days from today. Null means no expiry recorded. */
  days: number | null;
  issuedDaysAgo?: number;
  notes?: string;
}

const LICENCES: LicenceSpec[] = [
  // ── Company-wide ────────────────────────────────────────────────────────
  //
  // THESE FOUR CLUSTER, AND THAT IS THE REALISTIC SHAPE.
  //
  // A Saudi company's commercial registration, chamber membership, Qiwa and
  // GOSI registrations are normally obtained together at formation and renew
  // on or near the same anniversary every year. An even spread across twelve
  // months — which is what this file had first — is the LESS realistic
  // arrangement, and it also happened to make the year-ahead view show a flat
  // year with nothing to notice.
  //
  // Corrected because it is more truthful, not because it flatters a screen.
  // The consequence is that April carries five renewals, which is exactly the
  // kind of thing a compliance owner needs to see coming and cannot see in a
  // list sorted by date.
  { name: 'Commercial Registration', type: 'Commercial Registration', number: '4030 2288 61', site: null, owner: 'nadia', days: 214, issuedDaysAgo: 151 },
  { name: 'Chamber of Commerce Membership', type: 'Chamber of Commerce Membership', number: 'CC-RUH-71 4482', site: null, owner: 'faisal', days: 218, issuedDaysAgo: 147 },
  { name: 'GOSI Registration', type: 'GOSI Registration', number: '512 884 073', site: null, owner: 'faisal', days: 221, issuedDaysAgo: 144 },
  { name: 'Qiwa Establishment Certificate', type: 'Qiwa Establishment Certificate', number: 'QW-884 2210', site: null, owner: 'faisal', days: 224, issuedDaysAgo: 141 },
  {
    name: 'Industrial Licence',
    type: 'Industrial Licence',
    number: 'IL-2C 40 8817',
    site: null,
    owner: 'nadia',
    days: 622,
    issuedDaysAgo: 473,
    notes: 'Three-year cycle. Renewed with the Dammam plant expansion.',
  },

  // ── The expired one. Someone has to see this. ───────────────────────────
  {
    name: 'Signage Permit',
    type: 'Signage Permit',
    number: 'SGN-RUH 55 1902',
    site: 'showroom',
    owner: 'huda',
    days: -23,
    issuedDaysAgo: 753,
    notes: 'Lapsed while the showroom frontage was being rebuilt.',
  },

  // ── Inside thirty days ──────────────────────────────────────────────────
  { name: 'Balady Municipal Licence', type: 'Balady Municipal Licence', number: 'BL-RUH 22 7741', site: 'showroom', owner: 'faisal', days: 12, issuedDaysAgo: 353 },
  {
    name: 'Civil Defence Certificate',
    type: 'Civil Defence Certificate',
    number: 'CD-JED 09 3318',
    site: 'warehouse',
    // Nobody responsible. The dashboard must be able to say that a reminder
    // for this licence has nowhere to go.
    owner: null,
    days: 26,
    issuedDaysAgo: 339,
  },

  // ── Inside ninety ───────────────────────────────────────────────────────
  { name: 'Balady Municipal Licence', type: 'Balady Municipal Licence', number: 'BL-JED 41 2087', site: 'warehouse', owner: 'faisal', days: 58, issuedDaysAgo: 307 },
  { name: 'Ejar Lease Registration', type: 'Ejar Lease Registration', number: 'EJ-RUH 88 4013', site: 'showroom', owner: 'faisal', days: 74, issuedDaysAgo: 291 },
  { name: 'Civil Defence Certificate', type: 'Civil Defence Certificate', number: 'CD-DMM 17 6620', site: 'plant', owner: 'faisal', days: 81, issuedDaysAgo: 284 },

  // ── Comfortable ─────────────────────────────────────────────────────────
  { name: 'Balady Municipal Licence', type: 'Balady Municipal Licence', number: 'BL-DMM 63 9925', site: 'plant', owner: 'faisal', days: 176, issuedDaysAgo: 189 },
  { name: 'Ejar Lease Registration', type: 'Ejar Lease Registration', number: 'EJ-JED 30 7756', site: 'warehouse', owner: 'faisal', days: 203, issuedDaysAgo: 162 },
  { name: 'Balady Municipal Licence', type: 'Balady Municipal Licence', number: 'BL-RUH 10 5534', site: 'hq', owner: 'faisal', days: 226, issuedDaysAgo: 139 },
  { name: 'Ejar Lease Registration', type: 'Ejar Lease Registration', number: 'EJ-RUH 12 8890', site: 'hq', owner: 'faisal', days: 268, issuedDaysAgo: 97 },
  { name: 'Civil Defence Certificate', type: 'Civil Defence Certificate', number: 'CD-RUH 44 1176', site: 'hq', owner: 'huda', days: 299, issuedDaysAgo: 66 },

  // ── No expiry recorded. A real register has these. ──────────────────────
  {
    name: 'Signage Permit',
    type: 'Signage Permit',
    number: 'SGN-JED 71 3345',
    site: 'warehouse',
    owner: 'faisal',
    days: null,
    notes: 'Permanent frontage signage. Municipality confirmed no renewal cycle applies.',
  },
];

/**
 * Types the company declares it must hold.
 *
 * Muqeem is declared and deliberately has NO licence record — that is the
 * coverage gap. It is the single most persuasive screen in the product and it
 * needs a real occupant, because a gaps page reading "nothing missing" proves
 * nothing about whether the feature works.
 */
const REQUIRED_TYPES = [
  'Commercial Registration',
  'GOSI Registration',
  'Qiwa Establishment Certificate',
  'Chamber of Commerce Membership',
  'Muqeem Establishment Registration', // ← the gap
  'Balady Municipal Licence',
  'Civil Defence Certificate',
  'Ejar Lease Registration',
];

async function main(): Promise<void> {
  const config = {
    get: (key: string, fallback?: string) => process.env[key] ?? fallback,
  } as unknown as ConfigService;

  const prisma = new PrismaService(config);
  await prisma.onModuleInit();

  const audit = new ComplianceAuditService(prisma);
  const reminders = new RemindersService(prisma);
  const sites = new SitesService(prisma, audit);
  const licences = new LicensesService(prisma, audit, reminders);

  const today = todayIn(TIME_ZONE);
  const at = (offset: number): PlainDate => addDays(today, offset);

  // ── Wipe, then rebuild ──────────────────────────────────────────────────
  // Deleting the tenant cascades to everything beneath it, which is what
  // makes this repeatable from ANY state rather than only from empty. Scoped
  // to this one tenant id: nothing else in the database is touched.
  await prisma.tenant.deleteMany({ where: { id: TENANT_ID } });

  const tenant = await prisma.tenant.create({
    data: { id: TENANT_ID, name: 'Masar Al-Khaleej Trading Co.', timeZone: TIME_ZONE },
  });

  const password = await bcrypt.hash(DEMO_PASSWORD, 12);
  const people: Record<string, string> = {};
  for (const person of PEOPLE) {
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: person.email,
        name: person.name,
        password,
        role: person.role,
      },
    });
    people[person.key] = user.id;
  }
  const actor = people.nadia;

  const siteIds: Record<string, string> = {};
  for (const site of SITES) {
    const created = await sites.create(tenant.id, actor, {
      name: site.name,
      city: site.city,
      code: site.code,
      address: site.address,
    });
    siteIds[site.key] = created.id;
  }

  // ── Catalogue ───────────────────────────────────────────────────────────
  // Idempotent upsert, so this works on a database that has never been
  // seeded as well as one that has. Without it, `demo:reset` on a fresh
  // database failed with "run the catalogue seed first" — a two-command
  // recovery, which is the thing a one-command reset exists to eliminate.
  await ensureCatalogue(prisma);

  // ── Requirements ────────────────────────────────────────────────────────
  const types = await prisma.licenseType.findMany({ select: { id: true, name: true } });
  const typeByName = new Map(types.map((t) => [t.name, t.id]));

  for (const name of REQUIRED_TYPES) {
    const licenseTypeId = typeByName.get(name);
    if (!licenseTypeId) {
      throw new Error(
        `Licence type "${name}" is not in the catalogue. Run the catalogue seed first.`,
      );
    }
    await prisma.tenantLicenseRequirement.create({
      data: { tenantId: tenant.id, licenseTypeId },
    });
  }

  // ── Licences, through the service ───────────────────────────────────────
  const created: { id: string; spec: LicenceSpec }[] = [];
  for (const spec of LICENCES) {
    const licenseTypeId = typeByName.get(spec.type);
    if (!licenseTypeId) throw new Error(`Unknown licence type "${spec.type}"`);

    const licence = await licences.create(tenant.id, actor, {
      name: spec.name,
      licenseTypeId,
      siteId: spec.site ? siteIds[spec.site] : null,
      ownerUserId: spec.owner ? people[spec.owner] : null,
      licenseNumber: spec.number,
      expiryDate: spec.days === null ? undefined : at(spec.days),
      issueDate: spec.issuedDaysAgo ? at(-spec.issuedDaysAgo) : undefined,
      notes: spec.notes,
    });
    created.push({ id: licence.id, spec });
  }

  // ── One delivered reminder ──────────────────────────────────────────────
  // Without this every timeline reads "Scheduled", and the product's central
  // claim — that something actually goes out — is never demonstrated on
  // screen. Marked SENT directly because there is no delivery channel in a
  // demo environment; the dispatcher path itself is covered by 30 integration
  // tests.
  const expiring = created.find((c) => c.spec.days === 12);
  if (expiring) {
    const due = await prisma.licenseReminder.findFirst({
      where: { licenseId: expiring.id, offsetDays: 30 },
    });
    if (due) {
      await prisma.licenseReminder.update({
        where: { id: due.id },
        data: {
          status: 'SENT',
          sentAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          channel: 'EMAIL',
        },
      });
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────
  const counts = {
    tenant: tenant.name,
    sites: await prisma.site.count({ where: { tenantId: tenant.id } }),
    licences: await prisma.license.count({ where: { tenantId: tenant.id } }),
    reminders: await prisma.licenseReminder.count({
      where: { license: { tenantId: tenant.id } },
    }),
    requirements: REQUIRED_TYPES.length,
    withoutLadder: await prisma.license.count({
      where: { tenantId: tenant.id, expiryDate: { not: null }, reminders: { none: {} } },
    }),
  };

  console.log('\nDemo tenant rebuilt.\n');
  console.log(`  Company       ${counts.tenant}`);
  console.log(`  Sites         ${counts.sites}`);
  console.log(`  Licences      ${counts.licences}`);
  console.log(`  Reminders     ${counts.reminders}`);
  console.log(`  Declared      ${counts.requirements} licence types (one has no record — the gap)`);
  console.log(`  Sign in as    ${PEOPLE[0].email}`);
  console.log(`  Password      ${DEMO_PASSWORD}\n`);

  if (counts.withoutLadder > 0) {
    // The Slice 4 failure, caught here rather than in front of a client.
    console.error(
      `  WARNING: ${counts.withoutLadder} licence(s) have an expiry but no reminders.\n`,
    );
    process.exitCode = 1;
  }

  await prisma.onModuleDestroy();
}

main().catch((error) => {
  console.error(`\nDemo reset failed: ${(error as Error).message}\n`);
  process.exitCode = 1;
});
