/**
 * Deterministic licence expiry status.
 *
 * DERIVED, NEVER STORED
 * ---------------------
 * A persisted status is only as fresh as the last job that updated it. One
 * missed run and the dashboard confidently displays a stale answer to the
 * only question this product exists to answer. Deriving it from
 * (expiryDate, today) means it is correct on every read, by construction.
 *
 * The cost — you cannot index a derived column — is paid instead by
 * `@@index([tenantId, expiryDate])`, which lets the dashboard count each
 * bucket with an indexed date-range query rather than loading rows.
 *
 * No AI, no heuristics, no I/O, no clock. `today` is always a parameter.
 */

import {
  CRITICAL_WINDOW_DAYS,
  WARNING_WINDOW_DAYS,
} from './compliance.constants';
import { addDays, differenceInDays, PlainDate } from './plain-date';

export const LICENSE_EXPIRY_STATUSES = [
  'NO_EXPIRY',
  'ACTIVE',
  'EXPIRING_SOON',
  'CRITICAL',
  'EXPIRED',
] as const;

export type LicenseExpiryStatus = (typeof LICENSE_EXPIRY_STATUSES)[number];

export interface ExpiryAssessment {
  status: LicenseExpiryStatus;
  /**
   * Whole days from `today` until expiry.
   * Negative when already expired, 0 on the expiry day itself,
   * null when the licence has no expiry date.
   */
  daysUntilExpiry: number | null;
}

/**
 * Classify a licence by its expiry date.
 *
 * Boundary semantics — "expires on 2026-10-31" means the licence is valid
 * through the whole of 31 October in the tenant's timezone:
 *
 *   today = 2026-10-31  →  daysUntilExpiry  0  →  CRITICAL (not yet expired)
 *   today = 2026-11-01  →  daysUntilExpiry -1  →  EXPIRED
 */
export function assessExpiry(
  expiryDate: PlainDate | null,
  today: PlainDate,
): ExpiryAssessment {
  if (expiryDate === null) {
    return { status: 'NO_EXPIRY', daysUntilExpiry: null };
  }

  const daysUntilExpiry = differenceInDays(today, expiryDate);

  if (daysUntilExpiry < 0) {
    return { status: 'EXPIRED', daysUntilExpiry };
  }
  if (daysUntilExpiry <= CRITICAL_WINDOW_DAYS) {
    return { status: 'CRITICAL', daysUntilExpiry };
  }
  if (daysUntilExpiry <= WARNING_WINDOW_DAYS) {
    return { status: 'EXPIRING_SOON', daysUntilExpiry };
  }
  return { status: 'ACTIVE', daysUntilExpiry };
}

/** True for statuses a human needs to act on. Used by list filters and, later, the dashboard. */
export function needsAttention(status: LicenseExpiryStatus): boolean {
  return status === 'EXPIRED' || status === 'CRITICAL';
}

/** Rollup of licence statuses for a site (or a whole tenant). */
export interface ComplianceSummary {
  total: number;
  active: number;
  expiringSoon: number;
  critical: number;
  expired: number;
  noExpiry: number;
  /** critical + expired — the count a human must act on. */
  needsAttention: number;
}

/**
 * Summarise a set of licence expiry dates into status counts.
 *
 * Pure, and deliberately built on the same `assessExpiry` used for a single
 * licence: a site's rollup and its licences' individual badges can never
 * disagree, because there is only one classification function.
 */
export function summariseLicenses(
  expiryDates: readonly (PlainDate | null)[],
  today: PlainDate,
): ComplianceSummary {
  const summary: ComplianceSummary = {
    total: expiryDates.length,
    active: 0,
    expiringSoon: 0,
    critical: 0,
    expired: 0,
    noExpiry: 0,
    needsAttention: 0,
  };

  for (const expiryDate of expiryDates) {
    const { status } = assessExpiry(expiryDate, today);
    switch (status) {
      case 'ACTIVE':
        summary.active += 1;
        break;
      case 'EXPIRING_SOON':
        summary.expiringSoon += 1;
        break;
      case 'CRITICAL':
        summary.critical += 1;
        break;
      case 'EXPIRED':
        summary.expired += 1;
        break;
      case 'NO_EXPIRY':
        summary.noExpiry += 1;
        break;
    }
    if (needsAttention(status)) summary.needsAttention += 1;
  }

  return summary;
}

// ── Status as a database predicate ─────────────────────────────────────────

/**
 * A date-range description of an expiry status, expressed in calendar dates.
 *
 * WHY THIS EXISTS
 * ---------------
 * `assessExpiry` classifies ONE licence that has already been fetched. That is
 * useless for filtering a table: applying it after a paginated query filters
 * only the rows on the current page, so the list silently omits matches and
 * disagrees with its own total.
 *
 * This translates the same thresholds into bounds a database can index, so the
 * filter runs in SQL and counts and lists agree at any page size.
 *
 * Deliberately Prisma-agnostic — the domain layer stays free of ORM types. The
 * service turns this into a `where` clause.
 *
 * Bounds are INCLUSIVE on both ends. Calendar dates are discrete, so
 * `expiryDate < today` is exactly `expiryDate <= today - 1 day`, which avoids
 * mixing exclusive and inclusive comparisons.
 */
export interface ExpiryDateBounds {
  /** Match rows with no expiry date at all. Mutually exclusive with the bounds. */
  isNull?: true;
  gte?: PlainDate;
  lte?: PlainDate;
}

/**
 * The date bounds that select exactly the licences `assessExpiry` would give
 * `status` to, as of `today`.
 *
 * These MUST stay in lockstep with `assessExpiry`. A test asserts agreement
 * across a wide span of offsets rather than trusting that they were written to
 * match — two implementations of one rule is precisely how they drift.
 */
export function expiryStatusBounds(
  status: LicenseExpiryStatus,
  today: PlainDate,
): ExpiryDateBounds {
  switch (status) {
    case 'NO_EXPIRY':
      return { isNull: true };
    case 'EXPIRED':
      // expiryDate < today
      return { lte: addDays(today, -1) };
    case 'CRITICAL':
      return { gte: today, lte: addDays(today, CRITICAL_WINDOW_DAYS) };
    case 'EXPIRING_SOON':
      return {
        gte: addDays(today, CRITICAL_WINDOW_DAYS + 1),
        lte: addDays(today, WARNING_WINDOW_DAYS),
      };
    case 'ACTIVE':
      return { gte: addDays(today, WARNING_WINDOW_DAYS + 1) };
  }
}

/**
 * Bounds selecting everything a human must act on — EXPIRED plus CRITICAL.
 *
 * One contiguous range, so it is a single indexed predicate rather than an OR
 * of two. Excludes null expiry: a licence that never expires needs no action.
 */
export function needsAttentionBounds(today: PlainDate): ExpiryDateBounds {
  return { lte: addDays(today, CRITICAL_WINDOW_DAYS) };
}
