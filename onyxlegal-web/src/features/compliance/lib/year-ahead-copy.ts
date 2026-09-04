/**
 * Every user-facing string on the year-ahead view.
 *
 * THE RISK ON THIS SCREEN
 * -----------------------
 * A calendar of the next twelve months invites exactly one dishonest
 * sentence: "you're all clear for the year". Rule 6 forbids it, and this is
 * the easiest place in the product to write it by accident — a quiet year
 * genuinely looks like good news.
 *
 * It is not. A quiet year means nothing is DUE, which is a fact about dates
 * on record. It says nothing about licences with no date, licences nobody has
 * entered, or requirements never declared. Every empty state here is phrased
 * to be a fact about the window, never about the business.
 */

export const YEAR_AHEAD_COPY = {
  title: 'The year ahead',
  subtitle:
    'Every licence on record with an expiry date in the next twelve months, '
    + 'by the month it falls in.',

  // ── Counts ───────────────────────────────────────────────────────────────
  total: (n: number) =>
    n === 1 ? '1 licence expires in this window' : `${n} licences expire in this window`,
  inMonth: (n: number) => (n === 1 ? '1 licence' : `${n} licences`),
  monthEmpty: 'Nothing due',

  /** The busiest month, named rather than left to be counted. */
  busiest: (month: string, n: number) =>
    `${month} is the heaviest month, with ${n} expiring.`,

  // ── The three empty states ───────────────────────────────────────────────
  /**
   * 1. No licences at all. There is nothing to plot, and the reason is that
   *    nothing has been entered — not that nothing is due.
   */
  noLicencesTitle: 'Nothing to show yet',
  noLicencesBody:
    'No licences are on record, so there is nothing to plot. Add or import '
    + 'them and this fills in from their expiry dates.',
  noLicencesAside:
    'An empty year here means nothing has been entered, not that nothing is due.',

  /**
   * 2. Licences exist, none expiring in the window. A fact about twelve
   *    months, phrased so it cannot be read as an all-clear.
   */
  noneInWindowTitle: 'Nothing expires in the next twelve months',
  noneInWindowBody: (n: number) =>
    n === 1
      ? 'The 1 licence on record expires after this window.'
      : `All ${n} licences on record expire after this window.`,
  noneInWindowAside:
    'This is about dates already on record. It is not a statement that '
    + 'nothing needs doing.',

  /**
   * 3. Licences with no expiry recorded. Surfaced wherever it applies,
   *    because a licence with no date cannot appear on any forward view and
   *    a calm year could be hiding several.
   */
  withoutExpiry: (n: number) =>
    n === 1
      ? '1 licence has no expiry date recorded, so it cannot appear here.'
      : `${n} licences have no expiry date recorded, so they cannot appear here.`,
  withoutExpiryCta: 'See which',

  // ── Entries ──────────────────────────────────────────────────────────────
  companyWide: 'Company-wide',
  unassigned: 'Nobody assigned',

  // ── States ───────────────────────────────────────────────────────────────
  loading: 'Loading the year ahead',
  errorResource: 'the year ahead',
} as const;

/** Every fixed string, plus the functions on representative inputs. */
export function allYearAheadCopy(): string[] {
  const fixed = Object.values(YEAR_AHEAD_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  return [
    ...fixed,
    YEAR_AHEAD_COPY.total(1),
    YEAR_AHEAD_COPY.total(9),
    YEAR_AHEAD_COPY.inMonth(1),
    YEAR_AHEAD_COPY.inMonth(4),
    YEAR_AHEAD_COPY.busiest('September 2027', 5),
    YEAR_AHEAD_COPY.noneInWindowBody(1),
    YEAR_AHEAD_COPY.noneInWindowBody(12),
    YEAR_AHEAD_COPY.withoutExpiry(1),
    YEAR_AHEAD_COPY.withoutExpiry(3),
  ];
}
