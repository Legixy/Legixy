import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LicenseScope } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { LicensesService } from '../licenses/licenses.service';
import { SitesService } from '../sites/sites.service';
import { ImportField, proposeMapping, REQUIRED_FIELDS } from './domain/fields';
import {
  ImportFormat,
  MAX_IMPORT_ROWS,
  readWorkbook,
} from './domain/read-workbook';
import { distinctValues, ResolvedRow, validateRow } from './domain/validate';

/**
 * Sentinel site resolution meaning "make this one".
 *
 * Not expressible as a union member: `string | 'CREATE'` collapses to `string`
 * in TypeScript, so a type that listed it would claim a constraint it does not
 * enforce. Naming the constant is honest about where the check actually lives.
 */
export const CREATE_SITE = 'CREATE';

/** How the person resolved each distinct free-text value. */
export interface Resolutions {
  /** lower-cased raw value -> LicenseType id, or null to leave untyped. */
  licenseTypes?: Record<string, string | null>;
  /** lower-cased raw value -> site id, or CREATE_SITE to make one. */
  sites?: Record<string, string | null>;
  /** lower-cased email -> user id, or null to leave unassigned. */
  owners?: Record<string, string | null>;
}

export interface ValueProposal {
  /** The value exactly as it appears in the file. */
  value: string;
  /** How many rows use it — the reason confirming once is enough. */
  rowCount: number;
  /** A candidate record, when one matches confidently. */
  matchId: string | null;
  matchName: string | null;
  /** Why it matched, shown so the person can judge the proposal. */
  matchReason: string | null;
}

export interface DuplicateFlag {
  rowNumber: number;
  existingLicenseId: string;
  existingLicenseName: string;
  reason: string;
}

export interface PreviewRow extends ResolvedRow {
  /** Resolved ids, after applying the person's decisions. */
  licenseTypeId: string | null;
  siteId: string | null;
  ownerUserId: string | null;
  /** Set when this row would create a site as a side effect. */
  createsSite: string | null;
}

export interface ImportPreview {
  headers: string[];
  mapping: Record<number, ImportField | null>;
  rows: PreviewRow[];
  proposals: {
    licenseTypes: ValueProposal[];
    sites: ValueProposal[];
    owners: ValueProposal[];
  };
  duplicates: DuplicateFlag[];
  summary: { total: number; willCreate: number; willFail: number };
}

/**
 * Bulk import.
 *
 * WHY THIS EXISTS
 * ---------------
 * The product's promise is that one person no longer has to hold every licence
 * and every date in their head. Requiring that same person to key all of it in
 * by hand at setup would rebuild the single point of failure before the system
 * had been used once.
 *
 * WHAT IT REFUSES TO DO
 * ---------------------
 * Guess. A misread expiry date produces a confidently wrong reminder ladder,
 * which is the precise failure this product exists to prevent — so ambiguous
 * dates are rejected, fuzzy type matches are proposed but never auto-applied,
 * and nothing is written until a person has seen the whole preview.
 *
 * Create-only. No update, no upsert, no merge.
 */
@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly licenses: LicensesService,
    private readonly sites: SitesService,
    private readonly audit: ComplianceAuditService,
  ) {}

  /** Parse an uploaded file into headers plus a proposed mapping. */
  async parse(data: Buffer, format: ImportFormat) {
    const grid = await readWorkbook(data, format);

    if (grid.headers.length === 0 || grid.rows.length === 0) {
      throw new BadRequestException(
        'No rows were found in that file. It needs a header row and at least ' +
          'one row of data.',
      );
    }
    if (grid.rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `That file has ${grid.rows.length} rows. Imports are limited to ` +
          `${MAX_IMPORT_ROWS} rows at a time.`,
      );
    }

    return {
      headers: grid.headers,
      rows: grid.rows,
      mapping: proposeMapping(grid.headers),
    };
  }

  /**
   * Everything that would happen, computed without writing anything.
   *
   * The preview is not skippable. It is the only point at which a person can
   * see that row 12's date was refused, or that "Muncipality Licence" matched
   * nothing, before any of it becomes a record.
   */
  async preview(
    tenantId: string,
    input: {
      headers: string[];
      rows: string[][];
      mapping: Record<number, ImportField | null>;
      resolutions?: Resolutions;
    },
  ): Promise<ImportPreview> {
    const mapped = Object.values(input.mapping).filter(Boolean);
    const missing = REQUIRED_FIELDS.filter((field) => !mapped.includes(field));
    if (missing.length > 0) {
      throw new BadRequestException(
        `These columns must be mapped before continuing: ${missing.join(', ')}.`,
      );
    }
    if (input.rows.length > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `Imports are limited to ${MAX_IMPORT_ROWS} rows at a time.`,
      );
    }

    // Row 1 is the header, so data starts at 2 — the number the person sees.
    const validated = input.rows.map((cells, index) => {
      const values: Partial<Record<ImportField, string>> = {};
      Object.entries(input.mapping).forEach(([column, field]) => {
        if (!field) return;
        values[field] = cells[Number(column)] ?? '';
      });
      return validateRow(index + 2, values);
    });

    const resolutions = input.resolutions ?? {};
    const [types, tenantSites, users] = await Promise.all([
      this.prisma.licenseType.findMany({
        select: { id: true, name: true, nameAr: true, scope: true },
      }),
      this.prisma.site.findMany({
        where: { tenantId },
        select: { id: true, name: true },
      }),
      this.prisma.user.findMany({
        where: { tenantId },
        select: { id: true, email: true, name: true },
      }),
    ]);

    const proposals = {
      licenseTypes: this.proposeTypes(validated, types),
      sites: this.proposeSites(validated, tenantSites),
      owners: this.proposeOwners(validated, users),
    };

    const typeById = new Map(types.map((t) => [t.id, t]));
    const rows: PreviewRow[] = validated.map((row) => {
      const typeKey = row.rawLicenseType?.toLowerCase() ?? '';
      const siteKey = row.rawSite?.toLowerCase() ?? '';
      const ownerKey = row.rawOwnerEmail?.toLowerCase() ?? '';

      const licenseTypeId = resolutions.licenseTypes?.[typeKey] ?? null;
      const siteChoice = resolutions.sites?.[siteKey] ?? null;
      const ownerUserId = resolutions.owners?.[ownerKey] ?? null;

      const siteId = siteChoice === CREATE_SITE ? null : siteChoice;
      const createsSite =
        siteChoice === CREATE_SITE ? (row.rawSite as string) : null;

      const issues = [...row.issues];

      // Choosing "create" for a name that already exists would be rejected by
      // SitesService at commit time, rolling the whole import back with a
      // generic message. Catching it here names the actual problem, at the
      // step where it can still be fixed.
      if (createsSite) {
        const clash = tenantSites.find(
          (site) => site.name.toLowerCase() === createsSite.toLowerCase(),
        );
        if (clash) {
          issues.push({
            field: 'site',
            message: `A site called "${clash.name}" already exists. Choose it instead of creating a new one.`,
          });
        }
      }

      // The Slice 4 scope invariant, enforced here so a violation is visible
      // in the preview rather than thrown halfway through a commit.
      const type = licenseTypeId ? typeById.get(licenseTypeId) : null;
      const willHaveSite = !!siteId || !!createsSite;
      if (type?.scope === LicenseScope.ENTITY && willHaveSite) {
        issues.push({
          field: 'site',
          message: `"${type.name}" is a company-wide licence type, so it cannot be attached to a site.`,
        });
      }
      if (type?.scope === LicenseScope.SITE && !willHaveSite) {
        issues.push({
          field: 'site',
          message: `"${type.name}" must belong to a site, and this row has none.`,
        });
      }

      return {
        ...row,
        issues,
        outcome: issues.length > 0 ? 'FAIL' : 'CREATE',
        licenseTypeId,
        siteId,
        ownerUserId,
        createsSite,
      };
    });

    const duplicates = await this.findDuplicates(tenantId, rows);

    return {
      headers: input.headers,
      mapping: input.mapping,
      rows,
      proposals,
      duplicates,
      summary: {
        total: rows.length,
        willCreate: rows.filter((r) => r.outcome === 'CREATE').length,
        willFail: rows.filter((r) => r.outcome === 'FAIL').length,
      },
    };
  }

  /**
   * Writes the valid rows.
   *
   * ATOMICITY
   * ---------
   * All valid rows land, or none do. A partial import is the worst outcome:
   * the person cannot tell what arrived, and re-running duplicates whatever
   * did.
   *
   * This is a COMPENSATING rollback, not a database transaction. Every licence
   * goes through LicensesService.create so that reconcile() runs and reminders
   * generate — the Slice 5 lesson, where a seed wrote licences directly and
   * left every one of them with no obligations at all. That service holds its
   * own Prisma client and cannot be handed a transaction without changing a
   * signature 335 tests depend on. So on failure, everything created in this
   * run is deleted again; the cascade removes its reminders with it.
   *
   * The honest limit: a process crash between creating and compensating would
   * leave partial data. The audit entry is written last, so its absence is the
   * signal that an import did not complete.
   */
  async commit(
    tenantId: string,
    actorUserId: string,
    input: {
      filename: string;
      headers: string[];
      rows: string[][];
      mapping: Record<number, ImportField | null>;
      resolutions?: Resolutions;
    },
  ) {
    const preview = await this.preview(tenantId, input);
    const creatable = preview.rows.filter((row) => row.outcome === 'CREATE');

    if (creatable.length === 0) {
      throw new BadRequestException(
        'None of the rows in that file can be imported. Fix the problems ' +
          'listed and try again.',
      );
    }

    const createdLicenceIds: string[] = [];
    const createdSiteIds: string[] = [];
    // Sites are created once per distinct name, not once per row.
    const siteIdByName = new Map<string, string>();

    try {
      for (const row of creatable) {
        let siteId = row.siteId;

        if (row.createsSite) {
          const key = row.createsSite.toLowerCase();
          if (!siteIdByName.has(key)) {
            const site = await this.sites.create(tenantId, actorUserId, {
              name: row.createsSite,
            });
            siteIdByName.set(key, site.id);
            createdSiteIds.push(site.id);
          }
          siteId = siteIdByName.get(key) as string;
        }

        const licence = await this.licenses.create(tenantId, actorUserId, {
          name: row.name,
          siteId: siteId ?? undefined,
          ownerUserId: row.ownerUserId ?? undefined,
          licenseTypeId: row.licenseTypeId ?? undefined,
          licenseNumber: row.licenseNumber ?? undefined,
          authority: row.authority ?? undefined,
          issueDate: row.issueDate ?? undefined,
          expiryDate: row.expiryDate ?? undefined,
          notes: row.notes ?? undefined,
        });
        createdLicenceIds.push(licence.id);
      }
    } catch (error) {
      await this.rollback(createdLicenceIds, createdSiteIds);
      this.logger.error(
        `Import rolled back after ${createdLicenceIds.length} licence(s): ` +
          `${error instanceof Error ? error.message : 'unknown error'}`,
      );
      throw new BadRequestException(
        'The import failed part-way through and nothing was saved. ' +
          'Please try again.',
      );
    }

    // How records entered the register is itself compliance evidence.
    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'licenses.imported',
      entityType: 'license',
      entityId: `${createdLicenceIds.length} licences`,
      changes: {
        // Metadata only — never row contents.
        filename: { from: null, to: input.filename },
        created: { from: null, to: createdLicenceIds.length },
        failed: { from: null, to: preview.summary.willFail },
        sitesCreated: { from: null, to: createdSiteIds.length },
      },
    });

    // The filename is deliberately NOT logged. A client's spreadsheet is
    // routinely named after the company and its commercial registration
    // number, and a log aggregator is a copy of everything it ingests, kept
    // somewhere nobody audited for as long as the default retention says.
    // It is recorded on the audit entry above instead: tenant-scoped,
    // access-controlled, and readable by the people it belongs to.
    this.logger.log(
      `Imported ${createdLicenceIds.length} licence(s) into tenant ${tenantId} ` +
        `(${preview.summary.willFail} row(s) failed)`,
    );

    return {
      created: createdLicenceIds.length,
      sitesCreated: createdSiteIds.length,
      // Failures are reported, never silently dropped.
      failed: preview.rows
        .filter((row) => row.outcome === 'FAIL')
        .map((row) => ({ rowNumber: row.rowNumber, issues: row.issues })),
    };
  }

  private async rollback(licenceIds: string[], siteIds: string[]) {
    if (licenceIds.length > 0) {
      // Reminders and documents cascade from the licence.
      await this.prisma.license
        .deleteMany({ where: { id: { in: licenceIds } } })
        .catch(() => undefined);
    }
    if (siteIds.length > 0) {
      await this.prisma.site
        .deleteMany({ where: { id: { in: siteIds } } })
        .catch(() => undefined);
    }
  }

  // ── Proposals ────────────────────────────────────────────────────────────

  private countRows(
    rows: ResolvedRow[],
    pick: (r: ResolvedRow) => string | null,
  ) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const value = pick(row)?.trim().toLowerCase();
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return counts;
  }

  /**
   * Licence types are PROPOSED, never auto-applied.
   *
   * Misclassifying a type gives a licence the wrong renewal cycle and moves it
   * into the wrong coverage-gap bucket. Both are silent. So even an exact
   * name match is offered for confirmation rather than assumed.
   */
  private proposeTypes(
    rows: ResolvedRow[],
    types: { id: string; name: string; nameAr: string }[],
  ): ValueProposal[] {
    const counts = this.countRows(rows, (r) => r.rawLicenseType);
    return distinctValues(rows, (r) => r.rawLicenseType).map((value) => {
      const key = value.toLowerCase();
      const exact = types.find(
        (t) => t.name.toLowerCase() === key || t.nameAr === value,
      );
      const contains = types.find(
        (t) =>
          t.name.toLowerCase().includes(key) ||
          key.includes(t.name.toLowerCase()),
      );
      const match = exact ?? contains;
      return {
        value,
        rowCount: counts.get(key) ?? 0,
        matchId: match?.id ?? null,
        matchName: match?.name ?? null,
        matchReason: exact
          ? 'Exact name match'
          : contains
            ? 'Similar name — check this one'
            : null,
      };
    });
  }

  private proposeSites(
    rows: ResolvedRow[],
    sites: { id: string; name: string }[],
  ): ValueProposal[] {
    const counts = this.countRows(rows, (r) => r.rawSite);
    return distinctValues(rows, (r) => r.rawSite).map((value) => {
      const key = value.toLowerCase();
      const exact = sites.find((s) => s.name.toLowerCase() === key);
      return {
        value,
        rowCount: counts.get(key) ?? 0,
        matchId: exact?.id ?? null,
        matchName: exact?.name ?? null,
        matchReason: exact ? 'Exact name match' : null,
      };
    });
  }

  private proposeOwners(
    rows: ResolvedRow[],
    users: { id: string; email: string; name: string | null }[],
  ): ValueProposal[] {
    const counts = this.countRows(rows, (r) => r.rawOwnerEmail);
    return distinctValues(rows, (r) => r.rawOwnerEmail).map((value) => {
      const key = value.toLowerCase();
      // Email only. Matching a person by display name would be a guess about
      // identity, and assigning the wrong owner sends reminders to the wrong
      // person while the right one hears nothing.
      const match = users.find((u) => u.email.toLowerCase() === key);
      return {
        value,
        rowCount: counts.get(key) ?? 0,
        matchId: match?.id ?? null,
        matchName: match?.name ?? match?.email ?? null,
        matchReason: match ? 'Email matches a user in your organisation' : null,
      };
    });
  }

  /**
   * Flags rows that look like licences already on record.
   *
   * Flagged, never blocked: a business genuinely can hold two licences of the
   * same name at different sites, and the person importing knows which.
   */
  private async findDuplicates(
    tenantId: string,
    rows: PreviewRow[],
  ): Promise<DuplicateFlag[]> {
    const existing = await this.prisma.license.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        licenseNumber: true,
        siteId: true,
      },
    });
    if (existing.length === 0) return [];

    const flags: DuplicateFlag[] = [];
    for (const row of rows) {
      if (row.outcome !== 'CREATE') continue;

      // A matching licence number is the strongest signal — it is the
      // authority's own identifier.
      const byNumber = row.licenseNumber
        ? existing.find(
            (e) =>
              e.licenseNumber &&
              e.licenseNumber.toLowerCase() ===
                row.licenseNumber?.toLowerCase(),
          )
        : undefined;

      const byNameAndSite = existing.find(
        (e) =>
          e.name.toLowerCase() === row.name.toLowerCase() &&
          e.siteId === row.siteId,
      );

      const match = byNumber ?? byNameAndSite;
      if (!match) continue;

      flags.push({
        rowNumber: row.rowNumber,
        existingLicenseId: match.id,
        existingLicenseName: match.name,
        reason: byNumber
          ? `A licence with number "${row.licenseNumber}" already exists.`
          : 'A licence with this name already exists at the same site.',
      });
    }
    return flags;
  }
}
