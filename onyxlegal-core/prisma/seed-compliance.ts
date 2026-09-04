/**
 * Compliance demo seed.
 *
 * PROVENANCE — read before showing this to anyone
 * -----------------------------------------------
 * Authorities and licence type NAMES are real Saudi institutions and real
 * licence categories: those are public facts.
 *
 * Everything else is SYNTHETIC: the tenant, its sites, every licence number,
 * every date, every person. Licence numbers are deliberately prefixed `DEMO-`
 * so no screenshot of this data can ever be mistaken for a real regulatory
 * record. Fees are indicative placeholders, not quoted government tariffs.
 *
 * This is not, and does not claim to be, any real company's compliance position.
 *
 * The data is shaped to look like a real organisation INCLUDING its problems:
 * coverage gaps, an expired licence, several expiring soon, ownership
 * concentrated on one person, and a handful of unassigned licences. A demo
 * where everything is tidy proves nothing.
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/seed-compliance.ts
 *
 * (tsconfig-paths is required: this script reaches into src/, which imports the
 * generated Prisma client via a baseUrl-relative path.)
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { AUTHORITIES, TYPES, ensureCatalogue } from './catalogue';

const rawUrl = process.env.DATABASE_URL || '';
let connectionString: string;
try {
  const url = new URL(rawUrl.replace('prisma+postgres://', 'http://'));
  const apiKey = url.searchParams.get('api_key') || '';
  connectionString = JSON.parse(
    Buffer.from(apiKey, 'base64').toString(),
  ).databaseUrl;
} catch {
  connectionString = rawUrl;
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/** Days from today, as a midnight-UTC Date — matching the @db.Date convention. */
function daysOut(days: number): Date {
  const now = new Date();
  const base = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return new Date(base + days * 86_400_000);
}

/**
 * SUBMISSION ROUTES — seeded from documented public evidence only.
 *
 * `API_ELIGIBLE` means a partner programme demonstrably EXISTS. It does not
 * mean anything is connected: no subscription is active, no credentials are
 * held, and no integration code exists in this repository. Every route still
 * results in a person submitting.
 *
 * Anything unproven defaults to PREPARE_ONLY. Assume a human submits until
 * shown otherwise, never the reverse.
 */
/*
  The catalogue moved to prisma/catalogue.ts in Slice 15.

  It lived here as two inline arrays, and `demo:reset` needed the same
  data. Copying them would have drifted — and in fact this file had
  ALREADY drifted from the development database, which held a Muqeem
  Establishment Registration type that this seed never created. A fresh
  deployment would have had a Muqeem authority with no types under it.
*/

async function main() {
  console.log('Seeding compliance taxonomy + demo data…\n');

  // ── Global reference data ──────────────────────────────────────────────
  const { authorityIds, typeIds } = await ensureCatalogue(prisma);
  console.log(`  authorities: ${AUTHORITIES.length}`);
  console.log(`  licence types: ${TYPES.length}`);

  console.log(`  licence types: ${TYPES.length}`);

  // ── Demo tenant ────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findFirst({
    where: { users: { some: { email: 'demo@onyxlegal.test' } } },
  });
  if (!tenant) {
    console.error(
      '\n  Demo tenant not found. Register demo@onyxlegal.test first.',
    );
    return;
  }

  const owners = await Promise.all(
    [
      { email: 'ahmed@onyxlegal.test', name: 'Ahmed Al-Rashid' },
      { email: 'mohammed@onyxlegal.test', name: 'Mohammed Al-Otaibi' },
      { email: 'sara@onyxlegal.test', name: 'Sara Al-Dosari' },
    ].map((person) =>
      prisma.user.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: person.email } },
        update: { name: person.name },
        create: {
          tenantId: tenant.id,
          email: person.email,
          name: person.name,
          role: 'MEMBER',
        },
      }),
    ),
  );
  const [ahmed, mohammed, sara] = owners;

  // What this organisation is expected to hold. Industrial Licence and Signage
  // Permit are deliberately NOT required — not every business needs them, which
  // is the whole point of an explicit requirement list.
  const required = [
    'Commercial Registration',
    'GOSI Registration',
    'Qiwa Establishment Certificate',
    'Chamber of Commerce Membership',
    'Balady Municipal Licence',
    'Civil Defence Certificate',
    'Ejar Lease Registration',
  ];
  for (const name of required) {
    await prisma.tenantLicenseRequirement.upsert({
      where: {
        tenantId_licenseTypeId: {
          tenantId: tenant.id,
          licenseTypeId: typeIds.get(name)!,
        },
      },
      update: {},
      create: { tenantId: tenant.id, licenseTypeId: typeIds.get(name)! },
    });
  }
  console.log(`  requirements: ${required.length}`);

  // ── Sites ──────────────────────────────────────────────────────────────
  const siteSpecs = [
    { name: 'Riyadh HQ', city: 'Riyadh', code: 'HQ-01' },
    { name: 'Sahara Mall', city: 'Riyadh', code: 'SM-02' },
    { name: 'Via Riyadh', city: 'Riyadh', code: 'VR-03' },
    { name: 'Jeddah Showroom', city: 'Jeddah', code: 'JD-04' },
    { name: 'Dammam Warehouse', city: 'Dammam', code: 'DM-05' },
  ];
  const sites = new Map<string, string>();
  for (const spec of siteSpecs) {
    const row = await prisma.site.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: spec.name } },
      update: { city: spec.city, code: spec.code },
      create: { tenantId: tenant.id, ...spec },
    });
    sites.set(spec.name, row.id);
  }
  console.log(`  sites: ${siteSpecs.length}`);

  // ── Licences ───────────────────────────────────────────────────────────
  // Ownership is deliberately lopsided: Ahmed holds most of them. That
  // concentration is the client's unspoken key-person risk, made visible.
  let created = 0;
  const add = async (opts: {
    type: string;
    site: string | null;
    owner: string | null;
    number: string;
    expiresInDays: number | null;
    hijri?: string;
  }) => {
    const typeId = typeIds.get(opts.type)!;
    const siteId = opts.site ? sites.get(opts.site)! : null;
    const existing = await prisma.license.findFirst({
      where: { tenantId: tenant.id, licenseNumber: opts.number },
    });
    if (existing) return;
    await prisma.license.create({
      data: {
        tenantId: tenant.id,
        licenseTypeId: typeId,
        siteId,
        ownerUserId: opts.owner,
        name: opts.type,
        authority: AUTHORITIES.find(
          (a) => a.name === TYPES.find((t) => t.name === opts.type)!.authority,
        )!.name,
        licenseNumber: opts.number,
        issueDate:
          opts.expiresInDays === null
            ? null
            : daysOut(opts.expiresInDays - 365),
        expiryDate:
          opts.expiresInDays === null ? null : daysOut(opts.expiresInDays),
        hijriExpiry: opts.hijri ?? null,
      },
    });
    created += 1;
  };

  // Entity level. Chamber of Commerce Membership is REQUIRED but absent → gap.
  await add({
    type: 'Commercial Registration',
    site: null,
    owner: ahmed.id,
    number: 'DEMO-CR-1010',
    expiresInDays: 210,
    hijri: '١٤٤٨/١٠/١٥',
  });
  await add({
    type: 'GOSI Registration',
    site: null,
    owner: ahmed.id,
    number: 'DEMO-GOSI-1011',
    expiresInDays: 48,
  });
  await add({
    type: 'Qiwa Establishment Certificate',
    site: null,
    owner: sara.id,
    number: 'DEMO-QIWA-1012',
    expiresInDays: 120,
  });

  const siteNames = siteSpecs.map((s) => s.name);
  // Balady at every site except Dammam → one gap.
  const baladyDays = [75, 14, 300, 190];
  siteNames.slice(0, 4).forEach(() => undefined);
  for (let i = 0; i < 4; i += 1) {
    await add({
      type: 'Balady Municipal Licence',
      site: siteNames[i],
      owner: ahmed.id,
      number: `DEMO-BAL-20${i}`,
      expiresInDays: baladyDays[i],
    });
  }
  // Civil Defence at every site except Jeddah → one gap. One already expired.
  const cdDays = [260, -6, 61, null, 150] as (number | null)[];
  for (let i = 0; i < 5; i += 1) {
    if (i === 3) continue;
    await add({
      type: 'Civil Defence Certificate',
      site: siteNames[i],
      owner: i === 1 ? mohammed.id : ahmed.id,
      number: `DEMO-CD-30${i}`,
      expiresInDays: cdDays[i] as number,
    });
  }
  // Ejar everywhere. Two left unassigned on purpose.
  const ejarDays = [400, 88, 25, 340, 500];
  for (let i = 0; i < 5; i += 1) {
    await add({
      type: 'Ejar Lease Registration',
      site: siteNames[i],
      owner: i >= 3 ? null : ahmed.id,
      number: `DEMO-EJAR-40${i}`,
      expiresInDays: ejarDays[i],
    });
  }
  // Signage: not a requirement, so extras here create no gaps.
  await add({
    type: 'Signage Permit',
    site: 'Sahara Mall',
    owner: mohammed.id,
    number: 'DEMO-SIGN-5001',
    expiresInDays: 500,
  });
  await add({
    type: 'Signage Permit',
    site: 'Via Riyadh',
    owner: null,
    number: 'DEMO-SIGN-5002',
    expiresInDays: 33,
  });

  // Licences above are created with prisma.license.create directly, which
  // BYPASSES LicensesService.create and therefore never runs reconcile().
  // Without this step seeded licences have no reminder obligations at all —
  // found during delivery QA, when a sweep had nothing to send.
  const { RemindersService } =
    await import('../src/modules/compliance/reminders/reminders.service');
  const reminders = new RemindersService(prisma as never);
  const allLicences = await prisma.license.findMany({
    where: { tenantId: tenant.id },
    select: { id: true },
  });
  for (const licence of allLicences) {
    await reminders.reconcile(licence.id);
  }

  console.log(`  licences created: ${created}`);
  console.log(
    `  reminder obligations generated for ${allLicences.length} licences`,
  );
  console.log('\nDone. Gaps are intentional: Chamber of Commerce (entity),');
  console.log('Balady at Dammam Warehouse, Civil Defence at Jeddah Showroom.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
