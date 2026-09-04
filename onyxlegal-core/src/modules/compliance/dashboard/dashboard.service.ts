import { Injectable } from '@nestjs/common';
import { LicenseLifecycle, ReminderStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CoverageService } from '../coverage/coverage.service';
import { ComplianceSummary, summariseLicenses } from '../domain/license-status';
import {
  addDays,
  fromPrismaDate,
  PlainDate,
  todayIn,
} from '../domain/plain-date';

/** How far ahead the dashboard looks for upcoming reminders. */
export const UPCOMING_REMINDER_DAYS = 30;
/** How many owners the concentration list shows before summarising the rest. */
export const OWNER_LIST_LIMIT = 4;

export interface UpcomingReminder {
  id: string;
  licenseId: string;
  licenseName: string;
  siteName: string | null;
  ownerName: string | null;
  offsetDays: number;
  dueOn: PlainDate;
}

export interface OwnerConcentration {
  ownerUserId: string | null;
  ownerName: string | null;
  licenseCount: number;
}

export interface DashboardOverview {
  /** The tenant's own calendar date — every figure below is relative to it. */
  today: PlainDate;

  /**
   * Every ACTIVE licence in the tenant, site-scoped and entity-level alike.
   *
   * COUNT COHERENCE
   * ---------------
   * The sites page counts only site-scoped licences, because a page about
   * locations cannot show a licence that belongs to no location. That is
   * correct there and confusing here, so this figure is the whole portfolio
   * and the split is reported alongside it rather than left for a client to
   * discover by subtracting two numbers on different screens.
   */
  licences: ComplianceSummary & {
    atSites: number;
    entityWide: number;
  };

  sites: {
    total: number;
    withLicences: number;
  };

  /** Licence types expected but with no record at all. */
  coverageGaps: number;

  ownership: {
    /** Owners holding the most licences, longest first. */
    top: OwnerConcentration[];
    /**
     * Owners NOT shown in `top`, and how many licences they hold between
     * them. Slice 5 found a list that showed 3 of 4 owners while the
     * accompanying sentence implied it showed all of them.
     */
    otherOwners: number;
    otherLicenceCount: number;
    /** Licences with nobody responsible. Nobody to remind. */
    unassigned: number;
    /** Licences that DO have an owner — the denominator for concentration. */
    assigned: number;
  };

  reminders: {
    /** Scheduled and due within the next 30 days. */
    upcoming: UpcomingReminder[];
    upcomingCount: number;
  };
}

/**
 * The compliance dashboard.
 *
 * WHAT THIS DELIBERATELY DOES NOT PRODUCE
 * ---------------------------------------
 * No compliance score, no risk rating, no AI-derived judgment. This system
 * cannot grade a client's compliance posture, because a score would have to
 * treat "everything we track is current" as "you are compliant" — and the
 * coverage-gaps feature exists precisely to admit that what is tracked is not
 * everything. A green score next to three unrecorded licences would be the
 * most confident lie the product could tell.
 *
 * So every figure here is a count of something in the database, and the
 * dashboard reports what it holds rather than what it concludes.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coverage: CoverageService,
  ) {}

  async overview(tenantId: string): Promise<DashboardOverview> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timeZone: true },
    });
    const today = todayIn(tenant?.timeZone ?? 'Asia/Riyadh');

    // Every query below is scoped by tenantId. No figure on this page can be
    // reached from another tenant's data.
    const licences = await this.prisma.license.findMany({
      where: { tenantId, lifecycle: LicenseLifecycle.ACTIVE },
      select: { expiryDate: true, siteId: true, ownerUserId: true },
    });

    const summary = summariseLicenses(
      licences.map((l) => (l.expiryDate ? fromPrismaDate(l.expiryDate) : null)),
      today,
    );

    const [siteTotal, sitesWithLicences, gaps, ownerLoad, upcoming] =
      await Promise.all([
        this.prisma.site.count({ where: { tenantId } }),
        this.prisma.site.count({
          where: {
            tenantId,
            licenses: { some: { lifecycle: LicenseLifecycle.ACTIVE } },
          },
        }),
        this.coverage.findGaps(tenantId),
        this.coverage.findOwnerLoad(tenantId),
        this.upcomingReminders(tenantId, today),
      ]);

    // findOwnerLoad returns the unassigned bucket as a null ownerUserId row.
    const assignedOwners = ownerLoad.filter((row) => row.ownerUserId !== null);
    const unassignedRow = ownerLoad.find((row) => row.ownerUserId === null);

    const ranked = [...assignedOwners].sort(
      (a, b) => b.licenseCount - a.licenseCount,
    );
    const top = ranked.slice(0, OWNER_LIST_LIMIT).map((row) => ({
      ownerUserId: row.ownerUserId,
      ownerName: row.ownerName ?? row.ownerEmail,
      licenseCount: row.licenseCount,
    }));
    const remainder = ranked.slice(OWNER_LIST_LIMIT);

    return {
      today,
      licences: {
        ...summary,
        atSites: licences.filter((l) => l.siteId !== null).length,
        entityWide: licences.filter((l) => l.siteId === null).length,
      },
      sites: { total: siteTotal, withLicences: sitesWithLicences },
      coverageGaps: gaps.length,
      ownership: {
        top,
        otherOwners: remainder.length,
        otherLicenceCount: remainder.reduce(
          (sum, row) => sum + row.licenseCount,
          0,
        ),
        unassigned: unassignedRow?.licenseCount ?? 0,
        assigned: assignedOwners.reduce(
          (sum, row) => sum + row.licenseCount,
          0,
        ),
      },
      reminders: {
        upcoming,
        upcomingCount: upcoming.length,
      },
    };
  }

  /**
   * Reminders scheduled to go out in the next 30 days.
   *
   * PENDING only. A SENT reminder already went, and SKIPPED, CANCELLED,
   * FAILED and UNDELIVERABLE all describe something that will not happen —
   * listing any of them under "upcoming" would promise a message that is not
   * coming.
   */
  private async upcomingReminders(
    tenantId: string,
    today: PlainDate,
  ): Promise<UpcomingReminder[]> {
    const rows = await this.prisma.licenseReminder.findMany({
      where: {
        tenantId,
        status: ReminderStatus.PENDING,
        dueOn: {
          gte: new Date(`${today}T00:00:00.000Z`),
          lte: new Date(
            `${addDays(today, UPCOMING_REMINDER_DAYS)}T00:00:00.000Z`,
          ),
        },
      },
      orderBy: [{ dueOn: 'asc' }],
      select: {
        id: true,
        offsetDays: true,
        dueOn: true,
        licenseId: true,
        license: {
          select: {
            name: true,
            site: { select: { name: true } },
            owner: { select: { name: true, email: true } },
          },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      licenseId: row.licenseId,
      licenseName: row.license.name,
      siteName: row.license.site?.name ?? null,
      ownerName: row.license.owner?.name ?? row.license.owner?.email ?? null,
      offsetDays: row.offsetDays,
      dueOn: fromPrismaDate(row.dueOn),
    }));
  }
}
