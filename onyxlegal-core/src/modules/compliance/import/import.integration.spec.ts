/**
 * Licence import — integration tests against a real PostgreSQL database.
 *
 * SAFETY: refuses to run against a database whose name does not end in `_test`.
 */

import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { LicensesService } from '../licenses/licenses.service';
import { SitesService } from '../sites/sites.service';
import { RemindersService } from '../reminders/reminders.service';
import { ImportService } from './import.service';
import { proposeMapping } from './domain/fields';
import { parseCsv } from './domain/csv';
import { readWorkbook } from './domain/read-workbook';

dotenv.config();

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
if (!TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set.');
if (!/_test(\?|$)/.test(new URL(TEST_DATABASE_URL).pathname + '?')) {
  throw new Error('Refusing to run: database name must end in "_test".');
}

const HEADER =
  'Licence name,Licence type,Issuing authority,Site,Licence number,Issue date,Expiry date,Responsible person (email),Notes';

describe('Licence import (integration)', () => {
  let prisma: PrismaService;
  let imports: ImportService;
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
    imports = new ImportService(prisma, licenses, sites, audit);

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

    const a = await makeTenant('import-a');
    const b = await makeTenant('import-b');
    tenantA = a.tenantId;
    userA = a.userId;
    tenantB = b.tenantId;
    userB = b.userId;
    siteA = (await sites.create(tenantA, userA, { name: 'Riyadh HQ' })).id;

    const authority = await prisma.authority.upsert({
      where: { name: `Import Authority ${suffix}` },
      update: {},
      create: { name: `Import Authority ${suffix}`, nameAr: 'جهة' },
    });
    entityTypeId = (
      await prisma.licenseType.create({
        data: {
          name: `Import Entity Type ${suffix}`,
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
          name: `Import Site Type ${suffix}`,
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
        .deleteMany({ where: { name: `Import Authority ${suffix}` } })
        .catch(() => undefined);
      await prisma.onModuleDestroy();
    }
  });

  /** Parses CSV text the way the controller would, then previews it. */
  const previewCsv = async (
    csv: string,
    resolutions = {},
    tenant = tenantA,
  ) => {
    const grid = parseCsv(csv);
    return imports.preview(tenant, {
      headers: grid.headers,
      rows: grid.rows,
      mapping: proposeMapping(grid.headers),
      resolutions,
    });
  };

  const commitCsv = async (
    csv: string,
    resolutions = {},
    tenant = tenantA,
    actor = userA,
  ) => {
    const grid = parseCsv(csv);
    return imports.commit(tenant, actor, {
      filename: 'test.csv',
      headers: grid.headers,
      rows: grid.rows,
      mapping: proposeMapping(grid.headers),
      resolutions,
    });
  };

  describe('a valid CSV', () => {
    it('creates the licences it describes', async () => {
      const result = await commitCsv(
        `${HEADER}\nImported Alpha ${suffix},,Balady,,ALPHA-1,2025-09-15,2026-09-15,,First\n`,
      );

      expect(result.created).toBe(1);
      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name: `Imported Alpha ${suffix}` },
      });
      expect(licence).not.toBeNull();
      expect(licence!.licenseNumber).toBe('ALPHA-1');
      expect(licence!.authority).toBe('Balady');
      expect(licence!.notes).toBe('First');
    });

    it('GENERATES REMINDER OBLIGATIONS for every imported licence', async () => {
      // The Slice 5 lesson: a seed wrote licences with prisma.license.create,
      // bypassing the service, and left 18 licences with zero reminders. An
      // import that did the same would silently produce a register that
      // reminds nobody about anything — the exact failure this product exists
      // to prevent.
      const name = `Imported Reminders ${suffix}`;
      await commitCsv(`${HEADER}\n${name},,,,,,2027-06-30,,\n`);

      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name },
        select: { id: true },
      });
      const reminders = await prisma.licenseReminder.findMany({
        where: { licenseId: licence!.id },
        select: { offsetDays: true },
        orderBy: { offsetDays: 'desc' },
      });

      expect(reminders.map((r) => r.offsetDays)).toEqual([90, 60, 30, 14, 7]);
    });

    it('stores the date exactly as written', async () => {
      const name = `Imported Date ${suffix}`;
      await commitCsv(`${HEADER}\n${name},,,,,,2026-09-15,,\n`);

      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name },
        select: { expiryDate: true },
      });
      // Stored as a DATE at UTC midnight. Reading the UTC components back
      // must give the fifteenth, on any machine timezone.
      expect(licence!.expiryDate!.toISOString().slice(0, 10)).toBe(
        '2026-09-15',
      );
    });
  });

  describe('XLSX imports equivalently', () => {
    it('reads an .xlsx and creates the same licence a CSV would', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Licences');
      sheet.addRow(HEADER.split(','));
      sheet.addRow([
        `Imported Xlsx ${suffix}`,
        '',
        'Qiwa',
        '',
        'XL-1',
        '',
        '2026-10-20',
        '',
        '',
      ]);
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const grid = await readWorkbook(buffer, 'xlsx');
      const result = await imports.commit(tenantA, userA, {
        filename: 'test.xlsx',
        headers: grid.headers,
        rows: grid.rows,
        mapping: proposeMapping(grid.headers),
      });

      expect(result.created).toBe(1);
      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name: `Imported Xlsx ${suffix}` },
      });
      expect(licence!.expiryDate!.toISOString().slice(0, 10)).toBe(
        '2026-10-20',
      );
    });

    it('reads a real date-typed cell as the day the spreadsheet shows', async () => {
      // Excel stores 20 October 2026 as midnight LOCAL time, whose UTC instant
      // is the 19th in any positive-offset zone. Reading it as UTC would move
      // every date in the file back a day.
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('S');
      sheet.addRow(HEADER.split(','));
      sheet.addRow([
        `Imported DateCell ${suffix}`,
        '',
        '',
        '',
        '',
        '',
        new Date(2026, 9, 20),
        '',
        '',
      ]);
      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

      const grid = await readWorkbook(buffer, 'xlsx');
      expect(grid.rows[0][6]).toBe('2026-10-20');
    });
  });

  describe('THE DATE RULE, end to end', () => {
    it('refuses an ambiguous date in the preview, before anything is written', async () => {
      const preview = await previewCsv(
        `${HEADER}\nAmbiguous ${suffix},,,,,,01/02/2026,,\n`,
      );

      expect(preview.summary.willCreate).toBe(0);
      expect(preview.summary.willFail).toBe(1);
      expect(preview.rows[0].issues[0].message).toMatch(/ambiguous/i);
      expect(preview.rows[0].issues[0].message).toMatch(/YYYY-MM-DD/);

      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name: `Ambiguous ${suffix}` },
      });
      expect(licence).toBeNull();
    });

    it('names the row number of an impossible date', async () => {
      const preview = await previewCsv(
        `${HEADER}\nGood ${suffix},,,,,,2026-01-01,,\nBad ${suffix},,,,,,2026-13-45,,\n`,
      );
      const failed = preview.rows.filter((r) => r.outcome === 'FAIL');
      expect(failed).toHaveLength(1);
      // Header is row 1, so the second data row is row 3.
      expect(failed[0].rowNumber).toBe(3);
    });

    it('refuses to commit a file whose rows all fail', async () => {
      await expect(
        commitCsv(`${HEADER}\nAllBad ${suffix},,,,,,01/02/2026,,\n`),
      ).rejects.toThrow(/none of the rows/i);
    });

    it('preview and commit agree on the date', async () => {
      const name = `Agreement ${suffix}`;
      const csv = `${HEADER}\n${name},,,,,,2026-12-01,,\n`;

      const preview = await previewCsv(csv);
      expect(preview.rows[0].expiryDate).toBe('2026-12-01');

      await commitCsv(csv);
      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name },
        select: { expiryDate: true },
      });
      expect(licence!.expiryDate!.toISOString().slice(0, 10)).toBe(
        preview.rows[0].expiryDate,
      );
    });
  });

  describe('the scope invariant', () => {
    it('rejects an entity-scoped type given a site', async () => {
      const preview = await previewCsv(
        `${HEADER}\nEntityWithSite ${suffix},SomeType,,Riyadh HQ,,,2026-09-15,,\n`,
        {
          licenseTypes: { sometype: entityTypeId },
          sites: { 'riyadh hq': siteA },
        },
      );
      expect(preview.rows[0].outcome).toBe('FAIL');
      expect(preview.rows[0].issues.at(-1)!.message).toMatch(
        /company-wide licence type/i,
      );
    });

    it('rejects a site-scoped type with no site', async () => {
      const preview = await previewCsv(
        `${HEADER}\nSiteNoSite ${suffix},SomeType,,,,,2026-09-15,,\n`,
        { licenseTypes: { sometype: siteTypeId } },
      );
      expect(preview.rows[0].outcome).toBe('FAIL');
      expect(preview.rows[0].issues.at(-1)!.message).toMatch(
        /must belong to a site/i,
      );
    });
  });

  describe('resolution is per distinct value, not per row', () => {
    it('forty rows of one type need ONE confirmation', async () => {
      const rows = Array.from(
        { length: 40 },
        (_, i) => `Bulk${i} ${suffix},Municipality Licence,,,,,2027-01-01,,`,
      ).join('\n');

      const preview = await previewCsv(`${HEADER}\n${rows}\n`);

      expect(preview.rows).toHaveLength(40);
      expect(preview.proposals.licenseTypes).toHaveLength(1);
      expect(preview.proposals.licenseTypes[0].rowCount).toBe(40);
    });

    it('applies one decision to every row using that value', async () => {
      const rows = Array.from(
        { length: 3 },
        (_, i) => `Applied${i} ${suffix},SomeType,,,,,2027-02-02,,`,
      ).join('\n');

      const preview = await previewCsv(`${HEADER}\n${rows}\n`, {
        licenseTypes: { sometype: entityTypeId },
      });
      expect(preview.rows.every((r) => r.licenseTypeId === entityTypeId)).toBe(
        true,
      );
    });

    it('never auto-applies a fuzzy type match', async () => {
      // A wrong type gives the wrong renewal cycle and the wrong coverage gap,
      // both silently. So even a match is only ever proposed.
      const preview = await previewCsv(
        `${HEADER}\nFuzzy ${suffix},Import Entity Type ${suffix},,,,,2027-03-03,,\n`,
      );
      expect(preview.proposals.licenseTypes[0].matchId).toBe(entityTypeId);
      // Proposed, but not applied without a resolution.
      expect(preview.rows[0].licenseTypeId).toBeNull();
    });

    it('leaves an unmatched type untyped rather than failing', async () => {
      const name = `Untyped ${suffix}`;
      const result = await commitCsv(
        `${HEADER}\n${name},Something Nobody Has,,,,,2027-04-04,,\n`,
      );
      expect(result.created).toBe(1);
      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name },
        select: { licenseTypeId: true },
      });
      expect(licence!.licenseTypeId).toBeNull();
    });

    it('leaves an unmatched owner unassigned rather than failing', async () => {
      const name = `NoOwner ${suffix}`;
      const result = await commitCsv(
        `${HEADER}\n${name},,,,,,2027-05-05,nobody@example.test,\n`,
      );
      expect(result.created).toBe(1);
      const licence = await prisma.license.findFirst({
        where: { tenantId: tenantA, name },
        select: { ownerUserId: true },
      });
      expect(licence!.ownerUserId).toBeNull();
    });

    it('matches an owner by email', async () => {
      const email = `import-a-${suffix}@example.test`;
      const preview = await previewCsv(
        `${HEADER}\nOwned ${suffix},,,,,,2027-06-06,${email},\n`,
      );
      expect(preview.proposals.owners[0].matchId).toBe(userA);
    });
  });

  describe('site creation is explicit', () => {
    it('does NOT create a site unless it was confirmed', async () => {
      const name = `NoSiteCreate ${suffix}`;
      await commitCsv(
        `${HEADER}\n${name},,,Warehouse ${suffix},,,2027-07-07,,\n`,
      );

      const site = await prisma.site.findFirst({
        where: { tenantId: tenantA, name: `Warehouse ${suffix}` },
      });
      expect(site).toBeNull();
    });

    it('REFUSES to create a site whose name already exists', async () => {
      // Found in browser QA: choosing "create" for an existing name was
      // accepted by the preview, then rejected by SitesService at commit,
      // rolling the whole import back with a generic message. The clash
      // belongs in the preview, where it can still be fixed.
      const preview = await previewCsv(
        `${HEADER}\nClashRow ${suffix},,,Riyadh HQ,,,2027-08-01,,\n`,
        { sites: { 'riyadh hq': 'CREATE' } },
      );

      expect(preview.rows[0].outcome).toBe('FAIL');
      expect(preview.rows[0].issues.at(-1)!.message).toMatch(
        /already exists.*Choose it instead/i,
      );
    });

    it('creates it once when confirmed, however many rows use it', async () => {
      const siteName = `NewSite ${suffix}`;
      const rows = Array.from(
        { length: 3 },
        (_, i) => `SiteRow${i} ${suffix},,,${siteName},,,2027-08-08,,`,
      ).join('\n');

      const result = await commitCsv(`${HEADER}\n${rows}\n`, {
        sites: { [siteName.toLowerCase()]: 'CREATE' },
      });

      expect(result.created).toBe(3);
      expect(result.sitesCreated).toBe(1);
      const made = await prisma.site.findMany({
        where: { tenantId: tenantA, name: siteName },
      });
      expect(made).toHaveLength(1);

      const attached = await prisma.license.findMany({
        where: { tenantId: tenantA, siteId: made[0].id },
      });
      expect(attached).toHaveLength(3);
    });
  });

  describe('duplicates are flagged, not blocked', () => {
    it('flags a matching licence number and says why', async () => {
      const name = `DupNumber ${suffix}`;
      await commitCsv(`${HEADER}\n${name},,,,DUP-777,,2027-09-09,,\n`);

      const preview = await previewCsv(
        `${HEADER}\nDifferent Name ${suffix},,,,DUP-777,,2027-09-09,,\n`,
      );
      expect(preview.duplicates).toHaveLength(1);
      expect(preview.duplicates[0].reason).toMatch(/already exists/i);
      // Flagged, but still creatable — the person decides.
      expect(preview.rows[0].outcome).toBe('CREATE');
    });

    it('flags the same name at the same site', async () => {
      const name = `DupName ${suffix}`;
      await commitCsv(`${HEADER}\n${name},,,,,,2027-10-10,,\n`);

      const preview = await previewCsv(
        `${HEADER}\n${name},,,,,,2027-10-10,,\n`,
      );
      expect(preview.duplicates).toHaveLength(1);
      expect(preview.duplicates[0].existingLicenseName).toBe(name);
    });
  });

  describe('limits and empty files', () => {
    it('rejects a file with no usable rows', async () => {
      await expect(
        imports.parse(Buffer.from(`${HEADER}\n`), 'csv'),
      ).rejects.toThrow(/no rows were found/i);
    });

    it('rejects an empty file', async () => {
      await expect(imports.parse(Buffer.from(''), 'csv')).rejects.toThrow(
        /empty/i,
      );
    });

    it('rejects an oversized file before parsing it', async () => {
      const huge = Buffer.alloc(6 * 1024 * 1024, 'a');
      await expect(imports.parse(huge, 'csv')).rejects.toThrow(
        /5MB or smaller/i,
      );
    });

    it('rejects more rows than the limit', async () => {
      const rows = Array.from(
        { length: 1001 },
        (_, i) => `Row${i},,,,,,2027-01-01,,`,
      ).join('\n');
      await expect(
        imports.parse(Buffer.from(`${HEADER}\n${rows}\n`), 'csv'),
      ).rejects.toThrow(/limited to 1000 rows/i);
    });

    it('requires the mandatory column to be mapped', async () => {
      await expect(
        imports.preview(tenantA, {
          headers: ['Colour', 'Size'],
          rows: [['red', 'large']],
          mapping: { 0: null, 1: null },
        }),
      ).rejects.toThrow(/must be mapped/i);
    });
  });

  describe('atomicity', () => {
    it('writes NOTHING when a later row fails during the commit', async () => {
      // Row 1 is valid and row 2 is not, in a way validation cannot foresee:
      // its owner belongs to another tenant, which only LicensesService knows.
      // A non-atomic import would leave row 1 behind, and the person would
      // have no way to tell what landed before re-running.
      const good = `AtomicGood ${suffix}`;
      const bad = `AtomicBad ${suffix}`;
      const foreignEmail = `import-b-${suffix}@example.test`;

      const csv =
        `${HEADER}\n` +
        `${good},,,,,,2027-11-11,,\n` +
        `${bad},,,,,,2027-11-12,${foreignEmail},\n`;
      const grid = parseCsv(csv);

      await expect(
        imports.commit(tenantA, userA, {
          filename: 'atomic.csv',
          headers: grid.headers,
          rows: grid.rows,
          mapping: proposeMapping(grid.headers),
          // userB is tenant B's, so create() rejects it on the second row.
          resolutions: { owners: { [foreignEmail]: userB } },
        }),
      ).rejects.toThrow(/nothing was saved/i);

      const survivors = await prisma.license.findMany({
        where: { tenantId: tenantA, name: { in: [good, bad] } },
      });
      expect(survivors).toEqual([]);
    });

    it('rolls back a site it created during a failed import', async () => {
      const siteName = `RollbackSite ${suffix}`;
      const foreignEmail = `import-b-${suffix}@example.test`;
      const csv =
        `${HEADER}\n` +
        `RbGood ${suffix},,,${siteName},,,2027-11-14,,\n` +
        `RbBad ${suffix},,,${siteName},,,2027-11-15,${foreignEmail},\n`;
      const grid = parseCsv(csv);

      await expect(
        imports.commit(tenantA, userA, {
          filename: 'atomic.csv',
          headers: grid.headers,
          rows: grid.rows,
          mapping: proposeMapping(grid.headers),
          resolutions: {
            sites: { [siteName.toLowerCase()]: 'CREATE' },
            owners: { [foreignEmail]: userB },
          },
        }),
      ).rejects.toThrow(/nothing was saved/i);

      const site = await prisma.site.findFirst({
        where: { tenantId: tenantA, name: siteName },
      });
      expect(site).toBeNull();
    });
  });

  describe('tenant isolation', () => {
    it("imports into the caller's tenant only", async () => {
      const name = `TenantScoped ${suffix}`;
      await commitCsv(
        `${HEADER}\n${name},,,,,,2027-12-12,,\n`,
        {},
        tenantB,
        userB,
      );

      const inB = await prisma.license.findFirst({
        where: { tenantId: tenantB, name },
      });
      const inA = await prisma.license.findFirst({
        where: { tenantId: tenantA, name },
      });
      expect(inB).not.toBeNull();
      expect(inA).toBeNull();
    });

    it('cannot resolve a site belonging to another tenant', async () => {
      // siteA is tenant A's. Tenant B naming it must not attach to it.
      await expect(
        commitCsv(
          `${HEADER}\nCrossSite ${suffix},,,Riyadh HQ,,,2028-01-01,,\n`,
          { sites: { 'riyadh hq': siteA } },
          tenantB,
          userB,
        ),
      ).rejects.toThrow();
    });

    it("proposes only sites from the caller's own tenant", async () => {
      const preview = await previewCsv(
        `${HEADER}\nX ${suffix},,,Riyadh HQ,,,2028-02-02,,\n`,
        {},
        tenantB,
      );
      // Tenant B has no site called Riyadh HQ, so nothing is proposed.
      expect(preview.proposals.sites[0].matchId).toBeNull();
    });
  });

  describe('audit', () => {
    it('records who imported what, and the counts', async () => {
      const name = `Audited ${suffix}`;
      await commitCsv(
        `${HEADER}\n${name},,,,,,2028-03-03,,\nBadRow ${suffix},,,,,,01/02/2026,,\n`,
      );

      const entry = await prisma.complianceAuditLog.findFirst({
        where: { tenantId: tenantA, action: 'licenses.imported' },
        orderBy: { createdAt: 'desc' },
      });
      expect(entry).not.toBeNull();
      expect(entry!.actorUserId).toBe(userA);

      const changes = JSON.stringify(entry!.changes);
      expect(changes).toContain('test.csv');
      expect(changes).toContain('"to":1');
    });

    it('reports failed rows after commit rather than dropping them', async () => {
      const result = await commitCsv(
        `${HEADER}\nReported ${suffix},,,,,,2028-04-04,,\nDropped ${suffix},,,,,,01/02/2026,,\n`,
      );
      expect(result.created).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].rowNumber).toBe(3);
    });
  });
});
