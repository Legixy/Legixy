'use client';

import Link from 'next/link';
import { Building2, MoveDown } from 'lucide-react';
import type { License } from '@/lib/api';
import { formatDate, formatRemaining, formatRemainingShort } from '../../lib/format';
import { LICENSES_COPY } from '../../lib/licenses-copy';
import { ICON } from '../../lib/tokens';
import { StatusBadge } from '../StatusBadge';

/**
 * The licence list — exemplar only.
 *
 * The shared LicenseTable is untouched: it is imported by the site detail
 * screen, and this slice may not repaint that.
 *
 * WHAT CHANGED FROM THE SHARED ONE
 * --------------------------------
 * 1. The sort statement moved onto the Expiry header. It used to live in a
 *    subtitle above the whole screen, 100px away from the column it
 *    describes, costing a line of prose plus its margin.
 * 2. Row padding 14px → var(--row-py) (10px). Six rows now fit in the space
 *    five used to, and the list still reads as rows rather than a wall.
 * 3. The header is sticky inside the scroller, so the column meanings
 *    survive scrolling a hundred licences.
 * 4. Every colour, size, radius and space is a var(). There is no literal
 *    px or hex in this file.
 *
 * ORDERING
 * --------
 * Rows arrive sorted by expiry ascending from the API. Deliberately no sort
 * controls: whatever is closest to lapsing is already at the top, and a
 * client who re-sorts by name has hidden the one thing this screen exists
 * to show them.
 */
export function LicenseList({ licenses }: { licenses: License[] }) {
  return (
    <>
      {/* ── Desktop: a real table, because this is tabular data ─────────── */}
      {/*
        `motion-enter` on the table body, keyed by the row set, so a filter
        change reads as "these are different rows" rather than as a silent
        swap. Opacity plus a 4px rise — the smallest movement that registers.
      */}
      <div
        className="motion-enter hidden overflow-hidden md:block"
        style={{
          background: 'var(--surface)',
          border: 'var(--hairline) solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            <caption className="sr-only">{LICENSES_COPY.tableCaption}</caption>
            <thead>
              <tr style={{ background: 'var(--surface-sunken)' }}>
                <Th>{LICENSES_COPY.colLicence}</Th>
                <Th>{LICENSES_COPY.colSite}</Th>
                <Th>{LICENSES_COPY.colOwner}</Th>
                {/*
                  The sort lives here, on the column that is sorted, where
                  someone wondering about the order is already looking.
                  aria-sort makes it a real announcement rather than an arrow.
                */}
                <Th sorted>
                  <span
                    className="inline-flex items-center"
                    style={{ gap: 'var(--space-1)' }}
                  >
                    {LICENSES_COPY.colExpiry}
                    <MoveDown
                      size={ICON.sm}
                      aria-hidden="true"
                      style={{ color: 'var(--primary)' }}
                    />
                    <span className="sr-only">
                      {LICENSES_COPY.sortedByFull}
                    </span>
                  </span>
                </Th>
                <Th align="right">{LICENSES_COPY.colStatus}</Th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((licence) => (
                <tr
                  key={licence.id}
                  className="transition-colors hover:bg-[var(--surface-hover)]"
                  style={{ borderTop: 'var(--hairline) solid var(--border)' }}
                >
                  <td
                    style={{
                      paddingInline: 'var(--row-px)',
                      paddingBlock: 'var(--row-py)',
                    }}
                  >
                    <Link
                      href={`/dashboard/licenses/${licence.id}`}
                      className="underline-offset-2 hover:underline"
                      style={{
                        color: 'var(--foreground)',
                        fontWeight: 500,
                        lineHeight: 'var(--leading-snug)',
                      }}
                    >
                      {licence.name}
                    </Link>
                    {licence.authority ? (
                      <p
                        style={{
                          color: 'var(--muted-foreground)',
                          fontSize: 'var(--text-xs)',
                          lineHeight: 'var(--leading-snug)',
                        }}
                      >
                        {licence.authority}
                      </p>
                    ) : null}
                  </td>

                  <Td>
                    {licence.site ? (
                      licence.site.name
                    ) : (
                      <span
                        className="inline-flex items-center"
                        style={{ gap: 'var(--space-1)' }}
                      >
                        <Building2 size={ICON.sm} aria-hidden="true" />
                        {LICENSES_COPY.companyWide}
                      </span>
                    )}
                  </Td>

                  <Td>
                    {licence.owner?.name ?? licence.owner?.email ?? (
                      /*
                        Unassigned is not decoration. Nobody responsible means
                        no reminder can reach anyone, which is the one failure
                        this product exists to prevent.
                      */
                      <span style={{ color: 'var(--status-critical-fg)' }}>
                        {LICENSES_COPY.unassigned}
                      </span>
                    )}
                  </Td>

                  <td
                    className="tnum whitespace-nowrap"
                    style={{
                      paddingInline: 'var(--row-px)',
                      paddingBlock: 'var(--row-py)',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--foreground)',
                        lineHeight: 'var(--leading-snug)',
                      }}
                    >
                      {formatDate(licence.expiryDate)}
                    </span>
                    <p
                      style={{
                        color: 'var(--muted-foreground)',
                        fontSize: 'var(--text-xs)',
                        lineHeight: 'var(--leading-snug)',
                      }}
                    >
                      {formatRemaining(licence.daysUntilExpiry)}
                    </p>
                  </td>

                  <td
                    className="text-right"
                    style={{
                      paddingInline: 'var(--row-px)',
                      paddingBlock: 'var(--row-py)',
                    }}
                  >
                    <StatusBadge status={licence.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Narrow: stacked cards. A five-column table at 375px is not a
             table, it is a puzzle. ─────────────────────────────────────── */}
      <ul
        className="motion-enter flex flex-col md:hidden"
        style={{ gap: 'var(--space-2)' }}
      >
        {licenses.map((licence) => (
          <li key={licence.id}>
            <Link
              href={`/dashboard/licenses/${licence.id}`}
              className="block"
              style={{
                background: 'var(--surface)',
                border: 'var(--hairline) solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xs)',
                padding: 'var(--space-3)',
                /* The whole card is the target, comfortably past 44px. */
                minHeight: 'var(--space-16)',
              }}
            >
              <div
                className="flex items-start justify-between"
                style={{ gap: 'var(--space-2)' }}
              >
                <div className="min-w-0">
                  <p
                    className="truncate"
                    style={{
                      color: 'var(--foreground)',
                      fontWeight: 500,
                      fontSize: 'var(--text-base)',
                      lineHeight: 'var(--leading-snug)',
                    }}
                  >
                    {licence.name}
                  </p>
                  <p
                    className="truncate"
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: 'var(--text-xs)',
                      lineHeight: 'var(--leading-snug)',
                    }}
                  >
                    {licence.site?.name ?? LICENSES_COPY.companyWide}
                    {licence.authority ? ` · ${licence.authority}` : ''}
                  </p>
                </div>
                <StatusBadge status={licence.status} />
              </div>

              <div
                className="tnum flex items-center justify-between"
                style={{
                  borderTop: 'var(--hairline) solid var(--border)',
                  marginTop: 'var(--space-2)',
                  paddingTop: 'var(--space-2)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--muted-foreground)',
                }}
              >
                <span>{formatDate(licence.expiryDate)}</span>
                <span style={{ fontWeight: 500 }}>
                  {formatRemainingShort(licence.daysUntilExpiry)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Th({
  children,
  align = 'left',
  sorted = false,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  sorted?: boolean;
}) {
  return (
    <th
      scope="col"
      aria-sort={sorted ? 'ascending' : undefined}
      className={align === 'right' ? 'text-right' : 'text-left'}
      style={{
        color: 'var(--muted-foreground)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        textTransform: 'uppercase',
        lineHeight: 'var(--leading-tight)',
        paddingInline: 'var(--row-px)',
        paddingBlock: 'var(--thead-py)',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        color: 'var(--muted-foreground)',
        lineHeight: 'var(--leading-snug)',
        paddingInline: 'var(--row-px)',
        paddingBlock: 'var(--row-py)',
      }}
    >
      {children}
    </td>
  );
}
