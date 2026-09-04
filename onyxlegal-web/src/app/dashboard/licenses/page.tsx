'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Upload } from 'lucide-react';
import { useLicenses } from '@/features/compliance/api/compliance';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { LicenseList } from '@/features/compliance/components/exemplar/LicenseList';
import { EmptyState } from '@/features/compliance/components/EmptyState';
import { ListSkeleton } from '@/features/compliance/components/exemplar/ListSkeleton';
import {
  LICENSES_COPY,
  LICENSE_FILTERS,
  type LicenseFilterKey,
} from '@/features/compliance/lib/licenses-copy';
import { ICON } from '@/features/compliance/lib/tokens';
import { LICENSE_EXPIRY_STATUSES, type LicenseExpiryStatus } from '@/lib/api';

/**
 * All licences across every site. THE DESIGN EXEMPLAR.
 *
 * Search and status filtering are both applied SERVER-SIDE: the API already
 * supports `search` and `expiryStatus`, and status in particular must be
 * filtered there, since it is derived from the tenant's timezone and the
 * browser has no authority to recompute it.
 *
 * ── THE DENSITY PROBLEM ──────────────────────────────────────────────────
 * At 1440×900 the first row of data used to sit at y=280. On a 900px screen
 * that is 31% of the viewport spent before a single licence appears, and it
 * is the reason this screen felt like a brochure about licences rather than
 * a list of them. 88px of that is the app shell (header 56 + main padding
 * 32) and belongs to every screen. The other 192px was this page's, and it
 * broke down as:
 *
 *     36  h1, 30px Instrument Serif
 *     24  subtitle
 *     34  margin under the header block (mb-7) plus gap
 *     40  search + filter row (h-10 input)
 *     21  margin under that row (mb-5) plus the table's top border
 *     36  thead (py-2.5 around 11px text)
 *
 * Two thirds of it was whitespace and restatement. The fixes, in order of
 * how much they returned:
 *
 *   1. The subtitle went. It said "Every licence across every site, soonest
 *      expiry first" — the sidebar already says Licences, the Site column
 *      already says which site, and the sort belongs on the Expiry header,
 *      which is where it now lives. −24px of prose, −22px of the margin that
 *      only existed to separate it.
 *   2. The h1 dropped from 30px serif to 21px sans. A display line is worth
 *      one per screen and this screen already spends it on the data. The
 *      element is still an h1; only its size changed, so nothing about the
 *      document outline moved.
 *   3. Search moved up onto the title row. At ≥768px there is room for a
 *      title, a search field and the import button on one line, and putting
 *      them there removes a whole band plus its gap.
 *   4. Gaps went from 28/20px to 8px. Search, filters and the table are one
 *      control surface; spacing them like unrelated sections was what made
 *      the top of this page read as three separate widgets.
 *
 * ── WHAT DENSITY IS NOT ALLOWED TO COST ──────────────────────────────────
 * Import stays discoverable: primary and alone on the empty state, secondary
 * but always visible on the populated one. Filters stay visible as chips —
 * never folded into a dropdown, because a filter you cannot see is a filter
 * nobody uses. Search is reachable on first paint at every width, not behind
 * an icon.
 */
export default function LicensesPage() {
  /*
    THE URL IS THE FILTER. Not a seed for it — the filter itself.

    Slice 19 found five dead affordances sharing one cause: the dashboard's
    Expired / Action needed / Coming up figures, the delivery screen's
    "Assign someone" and the year-ahead's "See which" all link here with a
    query string, and this page read its filter from useState alone. Every one
    landed on a completely unfiltered list — and the dashboard figures are the
    first thing anyone clicks in a demo.

    Seeding useState from the URL fixed the first click and not the second:
    `useState(initial)` evaluates on mount, and Next's client-side navigation
    between two query strings on the SAME route reuses the component. Going
    dashboard → Expired → back → Action needed showed the Expired list.

    Deriving on every render removes the class rather than the instance, and
    it makes the filtered view linkable and back-button correct for free.
  */
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  /*
    Any VALID STATUS is accepted, not only the ones that have a chip.

    The chips are a shortlist — All, Needs attention, Expiring soon, Current,
    Expired — but the product has five statuses and links to two the chips do
    not offer: the dashboard's "Action needed" figure is CRITICAL alone, and
    the year-ahead's "See which" is NO_EXPIRY. An earlier fix accepted only
    chip keys and silently dropped both, which is the same dead affordance
    wearing a different hat.

    When the active status has no chip, none is pressed. That is correct: the
    list IS filtered, and pressing "All" would be a lie about what is shown.
    The count line says "Showing 2 licences" rather than "2 of 17", so the
    number always matches the figure that was clicked.
  */
  const filter = ((): LicenseFilterKey | LicenseExpiryStatus => {
    const status = params.get('expiryStatus');
    if (status && (LICENSE_EXPIRY_STATUSES as readonly string[]).includes(status)) {
      return status as LicenseExpiryStatus;
    }
    if (params.get('needsAttention') === 'true') return 'ATTENTION';
    return 'ALL';
  })();

  /** Set only by a link; the chips cannot produce it. */
  const ownerFilter = params.get('ownerUserId');

  const setFilter = (next: LicenseFilterKey) => {
    const query = new URLSearchParams();
    if (next === 'ATTENTION') query.set('needsAttention', 'true');
    else if (next !== 'ALL') query.set('expiryStatus', next);
    // A chip clears an owner filter that arrived by link: the chips describe
    // expiry, and leaving a hidden owner constraint applied would make the
    // count disagree with the chip for no visible reason.
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [rawSearch, setRawSearch] = useState('');
  const [search, setSearch] = useState('');

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(rawSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const query = useMemo(
    () => ({
      limit: 100,
      ...(search ? { search } : {}),
      ...(ownerFilter ? { ownerUserId: ownerFilter } : {}),
      ...(filter === 'ATTENTION'
        ? { needsAttention: true }
        : filter !== 'ALL'
          ? { expiryStatus: filter }
          : {}),
    }),
    [search, filter, ownerFilter],
  );

  const { data, isLoading, isError, error, refetch, isFetching } =
    useLicenses(query);

  const rows = data?.data ?? [];
  const isFiltered = filter !== 'ALL' || search.length > 0;
  /** Status filters resolve against the derived status, applied post-query. */
  const isStatusFiltered = filter !== 'ALL';
  /** Suppressed only when the list is genuinely empty, never when filtered. */
  const showHeaderActions = isLoading || isError || rows.length > 0 || isFiltered;

  return (
    <div data-exemplar className="flex w-full flex-col">
      {/* ── Band 1 · identity, search, action ─────────────────────────── */}
      <div
        className="flex flex-col md:flex-row md:items-center"
        style={{ gap: 'var(--space-3)' }}
      >
        {/*
          On mobile the title and the import button share a line — the title
          is short and the button is small, so giving each its own band cost
          44px for no reason. At md the wrapper becomes `display: contents`
          and dissolves, so h1, search and import become direct children of
          the outer flex row and sit on one line in explicit order.
        */}
        <div className="flex items-center justify-between md:contents">
        <h1
          className="shrink-0 md:order-1"
          style={{
            color: 'var(--foreground)',
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            letterSpacing: 'var(--tracking-tight)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {LICENSES_COPY.title}
        </h1>

        {/*
          Secondary here, primary on the empty state. On a populated list,
          import is a thing you do occasionally; the licences are the point.
          On an empty one it is the only way in, so it takes the weight.
        */}
        {/*
          Hidden on the true-empty state. The empty card already offers both
          paths with the right priority; repeating them here put two primary
          buttons on one screen, which means neither is the primary.
          Kept on the FILTERED empty state, where the card offers only "clear
          filters" and these are still the way out.
        */}
        {showHeaderActions ? (
        <>
        <Link
          href="/dashboard/licenses/import"
          /*
            The label shortens to "Import" below lg, so the accessible name is
            pinned here rather than left to whichever span is displayed. A
            screen-reader user should not hear a different button at a
            different window width.
          */
          aria-label={LICENSES_COPY.import}
          className="inline-flex shrink-0 items-center justify-center transition-colors hover:bg-[var(--surface-hover)] md:order-3"
          style={{
            background: 'var(--surface)',
            border: 'var(--hairline) solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--foreground)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            gap: 'var(--space-2)',
            height: 'var(--space-8)',
            paddingInline: 'var(--space-3)',
          }}
        >
          <Upload size={ICON.md} aria-hidden="true" />
          <span className="hidden lg:inline">{LICENSES_COPY.import}</span>
          <span className="lg:hidden">{LICENSES_COPY.importShort}</span>
        </Link>

        <Link
          href="/dashboard/licenses/new"
          className="inline-flex shrink-0 items-center justify-center md:order-4"
          style={{
            background: 'var(--primary)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-foreground)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            gap: 'var(--space-2)',
            height: 'var(--space-8)',
            paddingInline: 'var(--space-3)',
          }}
        >
          <Plus size={ICON.md} aria-hidden="true" />
          <span className="hidden lg:inline">{LICENSES_COPY.addOne}</span>
          <span className="lg:hidden">{LICENSES_COPY.addOneShort}</span>
        </Link>
        </>
        ) : null}

        </div>

        <div className="relative min-w-0 flex-1 md:order-2 md:max-w-xs">
          <Search
            size={ICON.md}
            className="pointer-events-none absolute top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)', left: 'var(--space-2)' }}
            aria-hidden="true"
          />
          {/*
            A bare input, not the shared <Input>: that one is h-8 with a
            focus shadow tuned for forms. Here the field sits in a toolbar
            next to a 32px button and has to match its height exactly, or the
            whole band looks misaligned at every width.
          */}
          <input
            type="search"
            value={rawSearch}
            onChange={(event) => setRawSearch(event.target.value)}
            placeholder={LICENSES_COPY.searchPlaceholder}
            aria-label={LICENSES_COPY.searchLabel}
            className="w-full"
            style={{
              background: 'var(--surface)',
              border: 'var(--hairline) solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-sm)',
              height: 'var(--space-8)',
              paddingLeft: 'var(--space-6)',
              paddingRight: 'var(--space-2)',
            }}
          />
        </div>

      </div>

      {/* ── Band 2 · filters and count ────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between"
        style={{ gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}
      >
        {/*
          A scroll strip below sm, wrapping above it. Five chips at a 44px
          touch height wrap to two rows on a phone and eat 100px of a 812px
          screen; scrolling keeps them to one row and, critically, keeps them
          VISIBLE. A dropdown would save the same space and lose the thing
          that matters — a filter nobody can see is a filter nobody uses.
        */}
        <div
          className="chip-strip flex flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible"
          role="group"
          aria-label={LICENSES_COPY.filterGroupLabel}
          style={{ gap: 'var(--space-1)' }}
        >
          {LICENSE_FILTERS.map((option) => {
            const active = filter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                aria-pressed={active}
                className="chip shrink-0 transition-colors"
                style={{
                  background: active ? 'var(--primary-wash)' : 'var(--surface)',
                  border: `var(--hairline) solid ${active ? 'var(--primary-edge)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  lineHeight: 'var(--leading-tight)',
                  paddingInline: 'var(--space-2)',
                  paddingBlock: 'var(--space-1)',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/*
          The count is here rather than under the table, where it used to be:
          a reader who wants to know how many there are asks before scrolling,
          not after. It is also the live region, so a filter change is
          announced instead of silently repainting.
        */}
        {/*
          Hidden when there is nothing to count. "Showing 0 of 0" beside a
          heading that already says "No licences on record yet" is the same
          fact twice, and the second telling is the one that sounds broken.
        */}
        {!isLoading && !isError && rows.length > 0 ? (
          <p
            aria-live="polite"
            className="tnum"
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-xs)',
            }}
          >
            {isStatusFiltered
              ? LICENSES_COPY.countFiltered(rows.length)
              : LICENSES_COPY.countOfTotal(
                  rows.length,
                  data?.meta.total ?? rows.length,
                )}
          </p>
        ) : null}
      </div>

      {/* ── The data ──────────────────────────────────────────────────── */}
      <div aria-busy={isFetching} style={{ marginTop: 'var(--space-2)' }}>
        {isLoading ? (
          <div aria-label={LICENSES_COPY.loadingLabel}>
            <ListSkeleton rows={6} />
          </div>
        ) : isError ? (
          <ErrorState
            error={error}
            resource={LICENSES_COPY.errorResource}
            onRetry={() => void refetch()}
          />
        ) : rows.length === 0 ? (
          isFiltered ? (
            <EmptyState
              title={LICENSES_COPY.noMatchTitle}
              description={LICENSES_COPY.noMatchBody}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setFilter('ALL');
                    setRawSearch('');
                  }}
                  className="inline-flex items-center justify-center transition-colors hover:bg-[var(--surface-hover)]"
                  style={{
                    background: 'var(--surface)',
                    border: 'var(--hairline) solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--foreground)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    height: 'var(--space-8)',
                    paddingInline: 'var(--space-3)',
                  }}
                >
                  {LICENSES_COPY.clearFilters}
                </button>
              }
            />
          ) : (
            <EmptyState
              title={LICENSES_COPY.emptyTitle}
              description={LICENSES_COPY.emptyBody}
              aside={LICENSES_COPY.emptyAside}
              action={
                /*
                  Import stays primary: a real customer arrives with a
                  spreadsheet of dozens, and Slice 12's first-run ordering
                  put import at step 2 for that reason. Adding one by hand
                  is the secondary path, present because until Slice 14 it
                  did not exist at all and the product was absurd in the
                  small case.
                */
                <div
                  className="flex flex-wrap items-center"
                  style={{ gap: 'var(--space-2)' }}
                >
                  <Link
                    href="/dashboard/licenses/import"
                    className="inline-flex items-center justify-center"
                    style={{
                      background: 'var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--primary-foreground)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      gap: 'var(--space-2)',
                      height: 'var(--space-10)',
                      paddingInline: 'var(--space-5)',
                    }}
                  >
                    <Upload size={ICON.lg} aria-hidden="true" />
                    {LICENSES_COPY.import}
                  </Link>
                  <Link
                    href="/dashboard/licenses/new"
                    className="inline-flex items-center justify-center"
                    style={{
                      background: 'var(--surface)',
                      border: 'var(--hairline) solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--foreground)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      gap: 'var(--space-2)',
                      height: 'var(--space-10)',
                      paddingInline: 'var(--space-4)',
                    }}
                  >
                    <Plus size={ICON.lg} aria-hidden="true" />
                    {LICENSES_COPY.addOne}
                  </Link>
                </div>
              }
            />
          )
        ) : (
          <LicenseList licenses={rows} />
        )}
      </div>
    </div>
  );
}
