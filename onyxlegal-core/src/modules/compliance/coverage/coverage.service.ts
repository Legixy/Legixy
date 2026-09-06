import { Injectable, NotFoundException } from '@nestjs/common';
import { LicenseLifecycle, LicenseScope } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';

/**
 * Coverage gaps and ownership concentration.
 *
 * WHAT A GAP IS
 * -------------
 * A gap is an ABSENCE: a licence type the organisation is expected to hold, for
 * which no active record exists. It is NOT an expiry state.
 *
 * This is why gaps are computed here and never folded into `assessExpiry`. An
 * expired licence exists and has lapsed; a gap means nobody has recorded one at
 * all. Merging them would make the dashboard claim a licence is "expired" when
 * the truth is that the system has never seen it — a materially different, and
 * more alarming, fact. Same reasoning that kept the unassigned-owner prompt out
 * of the status enum in Slice 3.
 *
 * WHAT DEFINES "EXPECTED"
 * -----------------------
 * `TenantLicenseRequirement` — an explicit per-tenant list. Not "every active
 * type", which would report a factory licence as missing at a furniture
 * showroom and produce false gaps that destroy trust in the feature on sight.
 */

export interface CoverageGap {
  licenseTypeId: string;
  licenseTypeName: string;
  licenseTypeNameAr: string;
  scope: LicenseScope;
  authorityName: string;
  authorityNameAr: string;
  /** Null for an entity-level gap, which belongs to the company, not a site. */
  siteId: string | null;
  siteName: string | null;
}

export interface OwnerLoad {
  /** Null represents the unassigned bucket. */
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  licenseCount: number;
}

/**
 * Why a coverage figure is what it is.
 *
 * NOT_CONFIGURED is the state that must never read as reassurance: zero gaps
 * because nothing was declared is the opposite of zero gaps because everything
 * declared is covered.
 */
export type CoverageState =
  | 'NOT_CONFIGURED'
  | 'NOTHING_ENTERED'
  | 'ALL_SATISFIED'
  | 'HAS_GAPS';

export interface CoverageOverview {
  /** How many licence types the tenant declared they are expected to hold. */
  requirementCount: number;
  gaps: CoverageGap[];
  state: CoverageState;
}

@Injectable()
export class CoverageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ComplianceAuditService,
  ) {}

  /**
   * Every expected licence type with no active record.
   *
   * Only ACTIVE licences close a gap. An archived licence is one the business
   * has stopped tracking, so it must not silently satisfy a requirement — that
   * would hide a real hole in coverage.
   *
   * Inactive types are skipped: a retired requirement is not a gap.
   */
  /**
   * Coverage, including WHY there are no gaps.
   *
   * `findGaps` returns an empty array both when the tenant has configured
   * nothing and when everything configured is satisfied. Those are completely
   * different facts, and rendering them identically told a brand-new tenant
   * that every licence they are expected to hold has a record — an all-clear
   * about a business the system knew nothing about.
   *
   * So the state is named rather than inferred from a count:
   *
   *   NOT_CONFIGURED  nothing has been declared; we cannot say what is missing
   *   NOTHING_ENTERED declared, but the register is empty — nothing to compare
   *   ALL_SATISFIED   everything declared has a record — scoped to that number
   *   HAS_GAPS        some declared types have no record
   *
   * WHY NOTHING_ENTERED EXISTS (Slice 25)
   * -------------------------------------
   * The first three states all reason about the DECLARATION. None of them ever
   * asked whether the REGISTER is empty, and that single omission produced two
   * opposite failures on a workspace where nothing had been entered yet:
   *
   *   · Declare an ENTITY-scoped type with no licences → HAS_GAPS. A customer
   *     who ticked two boxes and had not yet had the chance to enter anything
   *     was told they were missing two things. True by the letter, and the
   *     wrong thing to say: at that moment EVERYTHING is missing by definition.
   *
   *   · Declare a SITE-scoped type with no sites → ALL_SATISFIED, because
   *     `findGaps` loops over sites and a loop over zero sites pushes nothing.
   *     That is a VACUOUS ALL-CLEAR on a completely empty workspace — the
   *     precise failure Slice 12 removed and the Slice 17 population registry
   *     exists to prevent. It survived because the guard was built around
   *     `requirementCount === 0`, not around the register being empty.
   *
   * The second is the more dangerous of the two and was found by measuring
   * rather than from the report. One condition closes both, because both are
   * the same missing question: is there anything to compare a declaration to?
   *
   * This is a fourth VALUE in the existing union, not a fourth pattern. The
   * union answers one question — why is the gap figure what it is — and this
   * is another answer to it. The wording follows the year-ahead's, which has
   * said the same thing correctly since Slice 16: "an empty year here means
   * nothing has been entered, not that nothing is due."
   */
  async findCoverage(tenantId: string): Promise<CoverageOverview> {
    const [requirementCount, gaps, recordCount] = await Promise.all([
      this.prisma.tenantLicenseRequirement.count({
        where: { tenantId, licenseType: { isActive: true } },
      }),
      this.findGaps(tenantId),
      /*
        EVERY licence, whatever its lifecycle — deliberately NOT filtered to
        ACTIVE, which is what this counted first.

        The question is "has this workspace ever entered anything", not "does
        it hold anything now". Somebody who entered a licence and archived it
        has had the chance and made a decision; telling them "nothing has been
        entered yet" would be false, and an existing test has asserted since
        Slice 12 that archiving your only licence brings the gap BACK —
        archiving means out of scope, and that decision stands.

        The active-only version broke that test, which is how the error was
        found. The state exists to protect somebody who has not yet had the
        opportunity to enter anything, and that is a fact about history.
      */
      this.prisma.license.count({ where: { tenantId } }),
    ]);

    return {
      requirementCount,
      gaps,
      state:
        requirementCount === 0
          ? 'NOT_CONFIGURED'
          : // Checked BEFORE the gap count, because an empty register produces
            // both a full gap list and an empty one depending only on the
            // scope of what was declared. Neither is worth saying.
            recordCount === 0
            ? 'NOTHING_ENTERED'
            : gaps.length === 0
              ? 'ALL_SATISFIED'
              : 'HAS_GAPS',
    };
  }

  async findGaps(tenantId: string): Promise<CoverageGap[]> {
    const requirements = await this.prisma.tenantLicenseRequirement.findMany({
      where: { tenantId, licenseType: { isActive: true } },
      select: {
        licenseType: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            scope: true,
            authority: { select: { name: true, nameAr: true } },
          },
        },
      },
    });

    if (requirements.length === 0) return [];

    const [sites, activeLicences] = await Promise.all([
      this.prisma.site.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.license.findMany({
        where: {
          tenantId,
          lifecycle: LicenseLifecycle.ACTIVE,
          licenseTypeId: { not: null },
        },
        select: { licenseTypeId: true, siteId: true },
      }),
    ]);

    // Fast membership tests rather than a nested scan per requirement.
    const coveredAtSite = new Set(
      activeLicences
        .filter((licence) => licence.siteId)
        .map((licence) => `${licence.licenseTypeId}:${licence.siteId}`),
    );
    const coveredAtEntity = new Set(
      activeLicences
        .filter((licence) => !licence.siteId)
        .map((licence) => licence.licenseTypeId as string),
    );

    const gaps: CoverageGap[] = [];

    for (const { licenseType: type } of requirements) {
      if (type.scope === LicenseScope.ENTITY) {
        if (!coveredAtEntity.has(type.id)) {
          gaps.push({
            licenseTypeId: type.id,
            licenseTypeName: type.name,
            licenseTypeNameAr: type.nameAr,
            scope: type.scope,
            authorityName: type.authority.name,
            authorityNameAr: type.authority.nameAr,
            siteId: null,
            siteName: null,
          });
        }
        continue;
      }

      // A SITE-scoped requirement is a gap at every site that lacks it.
      for (const site of sites) {
        if (!coveredAtSite.has(`${type.id}:${site.id}`)) {
          gaps.push({
            licenseTypeId: type.id,
            licenseTypeName: type.name,
            licenseTypeNameAr: type.nameAr,
            scope: type.scope,
            authorityName: type.authority.name,
            authorityNameAr: type.authority.nameAr,
            siteId: site.id,
            siteName: site.name,
          });
        }
      }
    }

    // Entity gaps first, then grouped by site — the order a person reads them.
    return gaps.sort((a, b) => {
      if (a.siteName === b.siteName) {
        return a.licenseTypeName.localeCompare(b.licenseTypeName);
      }
      if (a.siteName === null) return -1;
      if (b.siteName === null) return 1;
      return a.siteName.localeCompare(b.siteName);
    });
  }

  /**
   * How active licences are distributed across the people responsible for them.
   *
   * The unassigned bucket is always present, even at zero, because its absence
   * would read as "nothing to worry about" rather than "we checked". A licence
   * nobody owns is a licence nobody will be reminded about.
   *
   * Sorted heaviest first: one person holding most of the licences is the
   * client's key-person risk stated as a number.
   */
  async findOwnerLoad(tenantId: string): Promise<OwnerLoad[]> {
    const grouped = await this.prisma.license.groupBy({
      by: ['ownerUserId'],
      where: { tenantId, lifecycle: LicenseLifecycle.ACTIVE },
      _count: { _all: true },
    });

    const ownerIds = grouped
      .map((row) => row.ownerUserId)
      .filter((id): id is string => id !== null);

    const owners = ownerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: ownerIds }, tenantId },
          select: { id: true, name: true, email: true },
        })
      : [];
    const byId = new Map(owners.map((owner) => [owner.id, owner]));

    const rows: OwnerLoad[] = grouped.map((row) => {
      const owner = row.ownerUserId ? byId.get(row.ownerUserId) : undefined;
      return {
        ownerUserId: row.ownerUserId,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        licenseCount: row._count._all,
      };
    });

    if (!rows.some((row) => row.ownerUserId === null)) {
      rows.push({
        ownerUserId: null,
        ownerName: null,
        ownerEmail: null,
        licenseCount: 0,
      });
    }

    return rows.sort((a, b) => b.licenseCount - a.licenseCount);
  }

  /**
   * The licence types this tenant has declared they are expected to hold.
   *
   * TENANT-WIDE, NOT PER-SITE — because that is what the model says. A
   * TenantLicenseRequirement is unique on (tenantId, licenseTypeId) and has no
   * siteId, so a SITE-scoped type declared here is expected at EVERY active
   * site, and findGaps fans it out accordingly. Per-site overrides would be a
   * schema change, and the requirement was to report the model rather than
   * bend it to the UI.
   */
  async listRequirements(tenantId: string) {
    const [types, requirements] = await Promise.all([
      this.prisma.licenseType.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          nameAr: true,
          scope: true,
          authority: { select: { name: true, nameAr: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.tenantLicenseRequirement.findMany({
        where: { tenantId },
        select: { licenseTypeId: true },
      }),
    ]);

    const required = new Set(requirements.map((r) => r.licenseTypeId));
    return types.map((type) => ({
      licenseTypeId: type.id,
      name: type.name,
      nameAr: type.nameAr,
      scope: type.scope,
      authorityName: type.authority.name,
      authorityNameAr: type.authority.nameAr,
      required: required.has(type.id),
    }));
  }

  /**
   * Declare or withdraw a requirement.
   *
   * Idempotent in both directions: declaring twice is not two declarations,
   * and withdrawing something never declared is not an error. The person is
   * expressing a desired state, not issuing a command.
   */
  async setRequirement(
    tenantId: string,
    actorUserId: string,
    licenseTypeId: string,
    required: boolean,
  ) {
    const type = await this.prisma.licenseType.findUnique({
      where: { id: licenseTypeId },
      select: { id: true, name: true, isActive: true },
    });
    if (!type || !type.isActive) {
      throw new NotFoundException('Licence type not found');
    }

    const existing = await this.prisma.tenantLicenseRequirement.findUnique({
      where: { tenantId_licenseTypeId: { tenantId, licenseTypeId } },
      select: { id: true },
    });

    if (required && !existing) {
      await this.prisma.tenantLicenseRequirement.create({
        data: { tenantId, licenseTypeId },
      });
    } else if (!required && existing) {
      await this.prisma.tenantLicenseRequirement.delete({
        where: { id: existing.id },
      });
    } else {
      // Already in the requested state. Nothing changed, so nothing is
      // audited — an audit log full of no-ops hides the real changes.
      return { licenseTypeId, required };
    }

    await this.audit.record({
      tenantId,
      actorUserId,
      action: required ? 'requirement.added' : 'requirement.removed',
      entityType: 'license',
      entityId: licenseTypeId,
      changes: {
        // What the business declared about itself is the reason a gap exists
        // or stops existing, so the change is evidence in its own right.
        licenseType: { from: null, to: type.name },
        required: { from: !required, to: required },
      },
    });

    return { licenseTypeId, required };
  }
}
