/**
 * Why the gap figure is what it is — against real PostgreSQL.
 *
 * WHAT THIS GUARDS
 * ----------------
 * `findGaps` returns an empty array for reasons that are not the same fact,
 * and returns a full one for reasons that are not the same fact either. Slice
 * 12 separated "nothing declared" from "everything satisfied". Slice 25 found
 * the register itself was never considered, which produced two OPPOSITE
 * failures on a workspace where nothing had been entered:
 *
 *   · an ENTITY-scoped declaration with no licences reported HAS_GAPS —
 *     telling a customer who had just ticked two boxes that they were missing
 *     two things they had not yet had the chance to enter;
 *
 *   · a SITE-scoped declaration with no sites reported ALL_SATISFIED, because
 *     findGaps loops over sites and a loop over zero sites pushes nothing —
 *     a VACUOUS ALL-CLEAR on a completely empty workspace, which is the exact
 *     class Slice 12 removed and Slice 17's registry exists to prevent.
 *
 * The second was found by measurement, not from the bug report, and is the
 * more dangerous of the two: the first is alarming, the second is reassuring
 * and false.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { CoverageService } from './coverage.service';
import { LicensesService } from '../licenses/licenses.service';
import { RemindersService } from '../reminders/reminders.service';
import { SitesService } from '../sites/sites.service';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

describe('coverage states (integration)', () => {
  let prisma: PrismaService;
  let coverage: CoverageService;
  let licenses: LicensesService;
  let sites: SitesService;
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
    coverage = new CoverageService(prisma, audit);
    sites = new SitesService(prisma, audit);
    licenses = new LicensesService(prisma, audit, new RemindersService(prisma));

    const authority = await prisma.authority.upsert({
      where: { name: `Cov Authority ${suffix}` },
      update: {},
      create: { name: `Cov Authority ${suffix}`, nameAr: 'هيئة' },
    });
    entityTypeId = (
      await prisma.licenseType.create({
        data: {
          name: `Cov Entity ${suffix}`,
          nameAr: 'كيان',
          scope: 'ENTITY',
          authorityId: authority.id,
        },
      })
    ).id;
    siteTypeId = (
      await prisma.licenseType.create({
        data: {
          name: `Cov Site ${suffix}`,
          nameAr: 'موقع',
          scope: 'SITE',
          authorityId: authority.id,
        },
      })
    ).id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.licenseType
        .deleteMany({ where: { id: { in: [entityTypeId, siteTypeId] } } })
        .catch(() => undefined);
      await prisma.authority
        .deleteMany({ where: { name: `Cov Authority ${suffix}` } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  /** A workspace of its own per case, so no case can be polluted by another. */
  async function freshTenant(tag: string) {
    const tenant = await prisma.tenant.create({
      data: { name: `cov-${tag}-${suffix}`, timeZone: 'Asia/Riyadh' },
    });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `${tag}-${suffix}@example.test`,
        name: 'Owner',
        role: 'OWNER',
      },
    });
    return { tenantId: tenant.id, userId: user.id };
  }

  const declare = (tenantId: string, licenseTypeId: string) =>
    prisma.tenantLicenseRequirement.create({ data: { tenantId, licenseTypeId } });

  it('nothing declared → NOT_CONFIGURED, unchanged', async () => {
    const { tenantId } = await freshTenant('notconf');
    const result = await coverage.findCoverage(tenantId);
    expect(result.state).toBe('NOT_CONFIGURED');
    expect(result.gaps).toEqual([]);
  });

  it('ENTITY type declared, register empty → NOTHING_ENTERED, not a gap count', async () => {
    const { tenantId } = await freshTenant('entityempty');
    await declare(tenantId, entityTypeId);

    const result = await coverage.findCoverage(tenantId);
    expect(result.state).toBe('NOTHING_ENTERED');
    // The declaration is NOT hidden — they told us, and should see that.
    expect(result.requirementCount).toBe(1);
  });

  /**
   * The vacuous all-clear. This is the case the bug report did not contain.
   */
  it('SITE type declared, no sites, register empty → NOTHING_ENTERED, never ALL_SATISFIED', async () => {
    const { tenantId } = await freshTenant('siteempty');
    await declare(tenantId, siteTypeId);

    const result = await coverage.findCoverage(tenantId);
    expect(result.state).toBe('NOTHING_ENTERED');
    expect(result.state).not.toBe('ALL_SATISFIED');
  });

  it('a site but still no licences → still NOTHING_ENTERED', async () => {
    const { tenantId, userId } = await freshTenant('siteonly');
    await declare(tenantId, siteTypeId);
    await sites.create(tenantId, userId, { name: 'Riyadh HQ' });

    expect((await coverage.findCoverage(tenantId)).state).toBe('NOTHING_ENTERED');
  });

  it('licences on record with one declared type missing → HAS_GAPS, unchanged', async () => {
    const { tenantId, userId } = await freshTenant('hasgaps');
    await declare(tenantId, entityTypeId);
    await declare(tenantId, siteTypeId);
    const site = await sites.create(tenantId, userId, { name: 'Jeddah Branch' });

    // Satisfies the SITE type at that site; the ENTITY type stays missing.
    await licenses.create(tenantId, userId, {
      name: 'Site Licence',
      authority: `Cov Authority ${suffix}`,
      scope: 'SITE',
      siteId: site.id,
      licenseTypeId: siteTypeId,
      expiryDate: '2027-05-01',
    } as never);

    const result = await coverage.findCoverage(tenantId);
    expect(result.state).toBe('HAS_GAPS');
    expect(result.gaps.map((g) => g.licenseTypeId)).toContain(entityTypeId);
  });

  it('everything declared satisfied → ALL_SATISFIED, scoped to its count', async () => {
    const { tenantId, userId } = await freshTenant('allsat');
    await declare(tenantId, entityTypeId);

    await licenses.create(tenantId, userId, {
      name: 'Entity Licence',
      authority: `Cov Authority ${suffix}`,
      scope: 'ENTITY',
      licenseTypeId: entityTypeId,
      expiryDate: '2027-05-01',
    } as never);

    const result = await coverage.findCoverage(tenantId);
    expect(result.state).toBe('ALL_SATISFIED');
    expect(result.requirementCount).toBe(1);
    expect(result.gaps).toEqual([]);
  });

  /**
   * MY FIRST IMPLEMENTATION GOT THIS WRONG and an existing test caught it.
   *
   * Counting only ACTIVE licences made "archive your only licence" report
   * NOTHING_ENTERED. compliance.integration.spec.ts has asserted since Slice
   * 12 that archiving brings the gap back — archiving means out of scope —
   * and that decision is right: somebody who entered a licence and archived
   * it has had the chance to enter something, so "nothing has been entered
   * yet" would be a false statement about their history.
   *
   * NOTHING_ENTERED is about whether the workspace has EVER entered a
   * licence, not whether it holds one now.
   */
  it('a licence that was entered and then archived is a gap, not NOTHING_ENTERED', async () => {
    const { tenantId, userId } = await freshTenant('archived');
    await declare(tenantId, entityTypeId);

    const licence = await licenses.create(tenantId, userId, {
      name: 'Archived Licence',
      authority: `Cov Authority ${suffix}`,
      scope: 'ENTITY',
      licenseTypeId: entityTypeId,
      expiryDate: '2027-05-01',
    } as never);
    expect((await coverage.findCoverage(tenantId)).state).toBe('ALL_SATISFIED');

    await prisma.license.update({
      where: { id: licence.id },
      data: { lifecycle: 'ARCHIVED' },
    });

    expect((await coverage.findCoverage(tenantId)).state).toBe('HAS_GAPS');
  });
});
