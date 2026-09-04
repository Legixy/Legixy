'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useYearAhead } from '@/features/compliance/api/compliance';
import { EmptyState } from '@/features/compliance/components/EmptyState';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { StatusBadge } from '@/features/compliance/components/StatusBadge';
import { YEAR_AHEAD_COPY } from '@/features/compliance/lib/year-ahead-copy';
import { formatDate, statusPresentation, TONE_STYLES } from '@/features/compliance/lib/format';
import { ACTION_STYLE, PageHeader } from '@/shared/components/PageHeader';
import type { YearAhead } from '@/lib/api';

/**
 * The year ahead.
 *
 * WHY THIS EXISTS AND THE LICENCES LIST DOES NOT ANSWER IT
 * --------------------------------------------------------
 * A list answers "what is next" — it is sorted by date and the top row is the
 * answer. It cannot answer "when is my difficult month", because that answer
 * is a SHAPE rather than a row. Twelve licences spread evenly through a year
 * and twelve landing in one month produce identical lists; you have to count
 * to tell them apart, and nobody counts.
 *
 * THE STRIP IS THE POINT, NOT THE LIST BELOW IT
 * ---------------------------------------------
 * The density strip at the top is twelve bars, one per month, scaled to the
 * heaviest. A cluster is visible before anyone reads a word — which is the
 * test this view has to pass to earn its place. The month sections beneath
 * are the detail you go to AFTER the strip has told you where to look.
 *
 * HONESTY
 * -------
 * It plots the customer's own dates and asserts nothing. The one dishonest
 * sentence it invites is "you're all clear for the year", and every empty
 * state here is phrased as a fact about the WINDOW — see year-ahead-copy.ts.
 * Licences with no expiry date are surfaced rather than omitted, because they
 * cannot appear on any forward view and a calm year could be hiding them.
 */
export default function YearAheadPage() {
  const { data, isLoading, isError, error, refetch } = useYearAhead();

  const busiest = useMemo(() => {
    if (!data) return null;
    const top = [...data.months].sort((a, b) => b.entries.length - a.entries.length)[0];
    // Only worth naming when it is actually a cluster. "The heaviest month
    // has one" is noise.
    return top && top.entries.length >= 3 ? top : null;
  }, [data]);

  return (
    <div data-exemplar className="flex w-full flex-col">
      <PageHeader
        title={YEAR_AHEAD_COPY.title}
        subtitle={YEAR_AHEAD_COPY.subtitle}
      />

      {isLoading ? (
        <div aria-busy="true" aria-label={YEAR_AHEAD_COPY.loading}>
          <Skeleton />
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          resource={YEAR_AHEAD_COPY.errorResource}
          onRetry={() => void refetch()}
        />
      ) : !data ? null : data.activeTotal === 0 ? (
        /* ── Empty state 1: nothing on record at all ───────────────────── */
        <EmptyState
          title={YEAR_AHEAD_COPY.noLicencesTitle}
          description={YEAR_AHEAD_COPY.noLicencesBody}
          aside={YEAR_AHEAD_COPY.noLicencesAside}
          action={
            <Link href="/dashboard/licenses" style={ACTION_STYLE.primary}>
              Add licences
            </Link>
          }
        />
      ) : data.total === 0 ? (
        /* ── Empty state 2: licences exist, none in the window ─────────── */
        <>
          <EmptyState
            title={YEAR_AHEAD_COPY.noneInWindowTitle}
            description={YEAR_AHEAD_COPY.noneInWindowBody(data.activeTotal)}
            aside={YEAR_AHEAD_COPY.noneInWindowAside}
          />
          <WithoutExpiry count={data.withoutExpiry} />
        </>
      ) : (
        <div className="motion-fade flex flex-col" style={{ gap: 'var(--space-4)' }}>
          <Strip data={data} busiestMonth={busiest?.month ?? null} />

          {/* ── Empty state 3: recorded but undateable ──────────────────── */}
          <WithoutExpiry count={data.withoutExpiry} />

          <div className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
            {data.months
              .filter((month) => month.entries.length > 0)
              .map((month) => (
                <section
                  key={month.month}
                  style={{
                    background: 'var(--surface)',
                    border: 'var(--hairline) solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xs)',
                    overflow: 'hidden',
                  }}
                >
                  <header
                    className="flex flex-wrap items-baseline justify-between"
                    style={{
                      background: 'var(--surface-sunken)',
                      borderBottom: 'var(--hairline) solid var(--border)',
                      gap: 'var(--space-2)',
                      paddingBlock: 'var(--space-2)',
                      paddingInline: 'var(--row-px)',
                    }}
                  >
                    <h2
                      style={{
                        color: 'var(--foreground)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                      }}
                    >
                      {monthLabel(month.month)}
                    </h2>
                    <span
                      className="tnum"
                      style={{
                        color: 'var(--muted-foreground)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      {YEAR_AHEAD_COPY.inMonth(month.entries.length)}
                    </span>
                  </header>

                  <ul>
                    {month.entries.map((entry, index) => (
                      <li
                        key={entry.licenseId}
                        style={{
                          borderTop:
                            index === 0
                              ? undefined
                              : 'var(--hairline) solid var(--border)',
                        }}
                      >
                        <Link
                          href={`/dashboard/licenses/${entry.licenseId}`}
                          className="flex flex-wrap items-center justify-between transition-colors hover:bg-[var(--surface-hover)]"
                          style={{
                            gap: 'var(--space-2)',
                            paddingBlock: 'var(--row-py)',
                            paddingInline: 'var(--row-px)',
                          }}
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate"
                              style={{
                                color: 'var(--foreground)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 500,
                              }}
                            >
                              {entry.name}
                            </span>
                            <span
                              className="block truncate"
                              style={{
                                color: 'var(--muted-foreground)',
                                fontSize: 'var(--text-xs)',
                              }}
                            >
                              {entry.siteName ?? YEAR_AHEAD_COPY.companyWide}
                              {' · '}
                              {entry.ownerName ?? YEAR_AHEAD_COPY.unassigned}
                            </span>
                          </span>
                          <span
                            className="tnum shrink-0"
                            style={{
                              color: 'var(--muted-foreground)',
                              fontSize: 'var(--text-xs)',
                            }}
                          >
                            {formatDate(entry.expiryDate)}
                          </span>
                          <span className="shrink-0">
                            <StatusBadge status={entry.status} size="sm" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── The strip ──────────────────────────────────────────────────────────── */

/**
 * Twelve bars, one per calendar month, scaled to the heaviest.
 *
 * WHY THIS SURVIVES 375px WHEN A TWELVE-MONTH TABLE DOES NOT
 * ----------------------------------------------------------
 * A bar needs width for its VALUE, not for its content. Twelve bars at 18px
 * plus 4px gaps is 260px, which fits a 375px screen with room to spare — so
 * the shape of the year is the one thing that does NOT have to change on a
 * phone. What changes is the label: "Sep" becomes "S", because a three-letter
 * label needs 24px and a one-letter label needs 8px.
 *
 * The bars are decorative in the accessibility tree — every month's real
 * count is in the visible text beneath and in the sections below — so the
 * strip carries an accessible summary rather than twelve unlabelled boxes.
 */
function Strip({
  data,
  busiestMonth,
}: {
  data: YearAhead;
  busiestMonth: string | null;
}) {
  const peak = Math.max(...data.months.map((m) => m.entries.length), 1);

  return (
    <section
      style={{
        background: 'var(--surface)',
        border: 'var(--hairline) solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        padding: 'var(--space-5)',
      }}
    >
      <p
        className="tnum"
        style={{
          color: 'var(--foreground)',
          fontSize: 'var(--text-base)',
          fontWeight: 500,
        }}
      >
        {YEAR_AHEAD_COPY.total(data.total)}
      </p>
      {busiestMonth ? (
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 'var(--text-sm)',
            marginTop: 'var(--space-1)',
          }}
        >
          {YEAR_AHEAD_COPY.busiest(
            monthLabel(busiestMonth),
            data.months.find((m) => m.month === busiestMonth)?.entries.length ?? 0,
          )}
        </p>
      ) : null}

      <div
        className="flex items-end"
        style={{ gap: 'var(--space-1)', marginTop: 'var(--space-4)' }}
        role="img"
        aria-label={data.months
          .map((m) => `${monthLabel(m.month)}: ${m.entries.length}`)
          .join(', ')}
      >
        {data.months.map((month) => {
          const count = month.entries.length;
          // The dominant status in the month decides the bar's colour, so the
          // strip carries urgency as well as volume. Colour is never alone:
          // the count is printed under every bar.
          const tone = dominantTone(month.entries.map((e) => e.status));
          const height = count === 0 ? 4 : Math.round((count / peak) * 56) + 8;

          return (
            <div
              key={month.month}
              className="flex flex-1 flex-col items-center"
              style={{ gap: 'var(--space-1)' }}
            >
              <span
                className="tnum"
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: 'var(--text-2xs)',
                }}
              >
                {count === 0 ? '' : count}
              </span>
              <div
                aria-hidden="true"
                style={{
                  background:
                    count === 0 ? 'var(--surface-sunken)' : TONE_STYLES[tone].fg,
                  borderRadius: 'var(--radius-xs)',
                  height: `${height}px`,
                  width: '100%',
                }}
              />
              <span
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: 'var(--text-2xs)',
                }}
              >
                {/* Three letters where there is room, one where there is not. */}
                <span className="hidden sm:inline">{shortMonth(month.month)}</span>
                <span className="sm:hidden">{shortMonth(month.month).slice(0, 1)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WithoutExpiry({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        background: TONE_STYLES.neutral.bg,
        border: `var(--hairline) solid ${TONE_STYLES.neutral.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
      }}
    >
      <p
        style={{
          color: 'var(--foreground)',
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-normal)',
          maxWidth: '64ch',
        }}
      >
        {YEAR_AHEAD_COPY.withoutExpiry(count)}
      </p>
      <div style={{ marginTop: 'var(--space-3)' }}>
        <Link
          href="/dashboard/licenses?expiryStatus=NO_EXPIRY"
          style={ACTION_STYLE.secondary}
        >
          {YEAR_AHEAD_COPY.withoutExpiryCta}
        </Link>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="animate-pulse"
          style={{
            background: 'var(--surface)',
            border: 'var(--hairline) solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            height: index === 0 ? 'var(--space-32)' : 'var(--space-16)',
          }}
        />
      ))}
    </div>
  );
}

/* ── Formatting ─────────────────────────────────────────────────────────── */

/** "2026-09" → "September 2026". UTC-pinned, like every other date here. */
function monthLabel(month: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

/** "2026-09" → "Sep". */
function shortMonth(month: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    month: 'short',
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

/** The most urgent status present, so a month reads by its worst entry. */
function dominantTone(
  statuses: { length: number } & Iterable<Parameters<typeof statusPresentation>[0]>,
) {
  const order = ['critical', 'warning', 'info', 'positive', 'neutral'] as const;
  const present = new Set(
    [...statuses].map((status) => statusPresentation(status).tone),
  );
  return order.find((tone) => present.has(tone)) ?? 'neutral';
}
