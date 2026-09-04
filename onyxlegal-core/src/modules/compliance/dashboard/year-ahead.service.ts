import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { LicenseLifecycle } from '../../../../generated/prisma/enums';
import {
  addDays,
  fromPrismaDate,
  toPrismaDate,
  todayIn,
  type PlainDate,
} from '../domain/plain-date';
import { assessExpiry } from '../domain/license-status';
import type { LicenseExpiryStatus } from '../domain/license-status';

/**
 * The year ahead.
 *
 * WHY A SEPARATE QUERY AND NOT THE DASHBOARD'S
 * --------------------------------------------
 * The dashboard already loads every active licence, but projects only
 * `expiryDate, siteId, ownerUserId` — enough to count, not enough to render
 * an entry that names a licence and links to it. Widening that projection
 * would make every dashboard load carry fields it does not use.
 *
 * WHAT THE LIST CANNOT ANSWER
 * ---------------------------
 * A list answers "what is next". It cannot answer "when is my difficult
 * month", because the answer is a shape rather than a row. Twelve licences
 * spread evenly and twelve landing in one month look identical in a list
 * sorted by date — you have to count to tell them apart, and nobody counts.
 *
 * MONTH BOUNDARIES ARE CALENDAR BOUNDARIES
 * ----------------------------------------
 * The window is twelve CALENDAR months beginning with the current one, and
 * its end is derived from the last bucket rather than stated separately — see
 * the comment on `to` for the off-by-one that forced this.
 *
 * Every boundary is computed from `todayIn(tenant.timeZone)`, never from the
 * server clock, because a licence expiring on the 1st belongs to a different
 * month for a tenant in Riyadh than for a server in UTC during the three
 * hours they disagree.
 */

export interface YearAheadEntry {
  licenseId: string;
  name: string;
  expiryDate: PlainDate;
  daysUntilExpiry: number;
  status: LicenseExpiryStatus;
  siteName: string | null;
  authority: string | null;
  ownerName: string | null;
}

export interface YearAheadMonth {
  /** "YYYY-MM". */
  month: string;
  entries: YearAheadEntry[];
}

export interface YearAhead {
  /** First day covered — today, in the tenant's zone. */
  from: PlainDate;
  /** Last day covered, inclusive. */
  to: PlainDate;
  /** Twelve months, always. Empty months are present and empty. */
  months: YearAheadMonth[];
  /** Every entry, flat, for the callers that want a plain list. */
  total: number;
  /**
   * Active licences that have NO expiry date recorded.
   *
   * Surfaced rather than silently omitted. A licence with no date is
   * invisible to every forward-looking view in this product, and a customer
   * looking at a calm year should know how many of their records simply
   * cannot appear on it.
   */
  withoutExpiry: number;
  /** Active licences in total, so "none in the window" can be qualified. */
  activeTotal: number;
}

/** Add whole calendar months to a PlainDate, clamping to the month's length. */
function addMonths(date: PlainDate, months: number): PlainDate {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));

  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  // 31 January + 1 month is 28 or 29 February, not 3 March.
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const safeDay = Math.min(day, lastDay);

  const result = new Date(Date.UTC(targetYear, targetMonth, safeDay));
  return fromPrismaDate(result);
}

@Injectable()
export class YearAheadService {
  constructor(private readonly prisma: PrismaService) {}

  async forTenant(tenantId: string): Promise<YearAhead> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timeZone: true },
    });
    const timeZone = tenant?.timeZone ?? 'Asia/Riyadh';
    const today = todayIn(timeZone);

    /*
      The window is TWELVE CALENDAR MONTHS, starting with the one we are in.

      An earlier version ran from today to the same date next year minus a
      day. That is also twelve months, but it does not line up with calendar
      month buckets: from 2026-09-03 it ended on 2027-09-02, while the twelve
      buckets covered 2026-09 through 2027-08. A licence expiring 2027-09-02
      was inside the window and inside no bucket — counted in the total,
      rendered nowhere. The integration test caught it.

      So the end of the window is defined BY the buckets: the last day of the
      twelfth month. The two can no longer disagree because one is derived
      from the other.
    */
    const firstMonth = `${today.slice(0, 7)}-01`;
    const lastMonth = addMonths(firstMonth, 11);
    const to = addDays(addMonths(lastMonth, 1), -1);

    const [rows, withoutExpiry, activeTotal] = await Promise.all([
      this.prisma.license.findMany({
        where: {
          tenantId,
          lifecycle: LicenseLifecycle.ACTIVE,
          expiryDate: { gte: toPrismaDate(today), lte: toPrismaDate(to) },
        },
        select: {
          id: true,
          name: true,
          expiryDate: true,
          authority: true,
          site: { select: { name: true } },
          owner: { select: { name: true, email: true } },
        },
        orderBy: { expiryDate: 'asc' },
      }),
      this.prisma.license.count({
        where: { tenantId, lifecycle: LicenseLifecycle.ACTIVE, expiryDate: null },
      }),
      this.prisma.license.count({
        where: { tenantId, lifecycle: LicenseLifecycle.ACTIVE },
      }),
    ]);

    const entries: YearAheadEntry[] = rows.map((row) => {
      // Non-null by the query's own predicate, but converted through the one
      // sanctioned conversion point rather than asserted into a string.
      const expiryDate = fromPrismaDate(row.expiryDate!);
      const assessment = assessExpiry(expiryDate, today);
      return {
        licenseId: row.id,
        name: row.name,
        expiryDate,
        daysUntilExpiry: assessment.daysUntilExpiry ?? 0,
        status: assessment.status,
        siteName: row.site?.name ?? null,
        authority: row.authority,
        ownerName: row.owner?.name ?? row.owner?.email ?? null,
      };
    });

    // Twelve buckets, always — an empty month must be visible as empty, or
    // "there is nothing in March" reads the same as "March is not shown".
    // That absence is exactly the shape the view exists to reveal.
    const months: YearAheadMonth[] = [];
    for (let index = 0; index < 12; index += 1) {
      const monthStart = addMonths(firstMonth, index);
      const key = monthStart.slice(0, 7);
      months.push({
        month: key,
        entries: entries.filter((entry) => entry.expiryDate.slice(0, 7) === key),
      });
    }

    return {
      from: today,
      to,
      months,
      total: entries.length,
      withoutExpiry,
      activeTotal,
    };
  }
}
