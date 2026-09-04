/**
 * Every user-facing string on the licences list.
 *
 * Centralised so the honesty scan can read it, for the same reason
 * dashboard-copy.ts and renewal-workflow-copy.ts exist. This screen is the
 * one a client looks at longest, so it is the one where a claim about their
 * compliance state would do the most damage.
 */

export const LICENSES_COPY = {
  title: 'Licences',

  /**
   * The subtitle is gone.
   *
   * It read "Every licence across every site, soonest expiry first." Three
   * facts, none of which needed a line of prose:
   *   - "every licence"  — the sidebar item already says Licences.
   *   - "across every site" — the Site column shows it.
   *   - "soonest expiry first" — belongs on the Expiry column, where someone
   *     wondering about the order is actually looking.
   * Moving the sort statement onto the column header cost 24px of prose and
   * 34px of the margin under it, and put the fact where it is needed.
   */
  sortedBy: 'Soonest first',
  sortedByFull: 'Sorted by expiry date, soonest first',

  // ── Counts ───────────────────────────────────────────────────────────────
  countTracked: (n: number) =>
    n === 1 ? '1 licence on record' : `${n} licences on record`,
  /**
   * Status filters are applied to the DERIVED status after the query, so
   * meta.total is the unfiltered count. "3 of 40" would read as pagination.
   */
  countFiltered: (shown: number) =>
    shown === 1 ? 'Showing 1 licence' : `Showing ${shown} licences`,
  countOfTotal: (shown: number, total: number) =>
    `Showing ${shown} of ${total}`,

  // ── Controls ─────────────────────────────────────────────────────────────
  searchPlaceholder: 'Search name, authority or number',
  searchLabel: 'Search licences',
  filterGroupLabel: 'Filter licences by status',
  clearFilters: 'Clear filters',

  // ── Columns ──────────────────────────────────────────────────────────────
  colLicence: 'Licence',
  colSite: 'Site',
  colOwner: 'Owner',
  colExpiry: 'Expiry',
  colStatus: 'Status',
  tableCaption: 'Licences on record, ordered by expiry date with the soonest first',
  companyWide: 'Company-wide',
  unassigned: 'Unassigned',
  noExpiry: 'No expiry recorded',

  // ── Actions ──────────────────────────────────────────────────────────────
  import: 'Import from a spreadsheet',
  importShort: 'Import',
  addOne: 'Add one licence',
  addOneShort: 'Add one',

  // ── Empty: nothing on record ─────────────────────────────────────────────
  /**
   * States a fact about the RECORD, never about the business. "No licences
   * yet" is fine; "You have no licences" is a claim about the customer that
   * this system has no way to know.
   */
  emptyTitle: 'No licences on record yet',
  emptyBody:
    'Bring in the spreadsheet you already keep — you will match up your '
    + 'columns and check every row before anything is saved. If you only '
    + 'have one, add it by hand instead.',
  emptyAside:
    'Nothing here yet means nothing has been entered — not that nothing is '
    + 'due.',

  // ── Empty: filtered ──────────────────────────────────────────────────────
  noMatchTitle: 'Nothing matches those filters',
  noMatchBody: 'Try a different term, or clear the filters to see everything.',

  // ── States ───────────────────────────────────────────────────────────────
  loadingLabel: 'Loading licences',
  errorResource: 'licences',
} as const;

export const LICENSE_FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'ATTENTION', label: 'Needs attention' },
  { key: 'EXPIRING_SOON', label: 'Expiring soon' },
  { key: 'ACTIVE', label: 'Current' },
  { key: 'EXPIRED', label: 'Expired' },
] as const;

export type LicenseFilterKey = (typeof LICENSE_FILTERS)[number]['key'];

/** Every fixed string, plus the functions on representative inputs. */
export function allLicensesCopy(): string[] {
  const fixed = Object.values(LICENSES_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  return [
    ...fixed,
    ...LICENSE_FILTERS.map((f) => f.label),
    LICENSES_COPY.countTracked(1),
    LICENSES_COPY.countTracked(24),
    LICENSES_COPY.countFiltered(1),
    LICENSES_COPY.countFiltered(6),
    LICENSES_COPY.countOfTotal(6, 24),
  ];
}
