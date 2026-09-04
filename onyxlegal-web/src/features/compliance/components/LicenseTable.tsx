'use client';

import Link from 'next/link';
import { Building2, ChevronRight } from 'lucide-react';
import type { License } from '@/lib/api';
import {
  formatDate,
  formatRemaining,
  formatRemainingShort,
  statusPresentation,
} from '../lib/format';
import { StatusBadge } from './StatusBadge';

/**
 * Licence list.
 *
 * RESPONSIVE STRATEGY
 * -------------------
 * Not a shrunken desktop table. Two purpose-built renderings:
 *   ≥ md  a real <table>, which is what this data is — column headers give
 *         screen-reader users the relationship between cell and meaning.
 *   < md  a stacked card list, because a 6-column table on a phone is
 *         unreadable at any font size.
 * Only one is in the accessibility tree at a time (`hidden` removes it).
 *
 * ORDERING
 * --------
 * Rows arrive already sorted by expiry ascending (nulls last) from the API.
 * Whatever needs attention is at the top without the user sorting anything,
 * so this component deliberately has no sort controls.
 *
 * NAVIGATION
 * ----------
 * The licence name is a real <Link>. Not an onClick on the row: an anchor is
 * keyboard-focusable, announced as a link, and can be opened in a new tab.
 */
export function LicenseTable({
  licenses,
  showSite = true,
}: {
  licenses: License[];
  showSite?: boolean;
}) {
  return (
    <>
      {/* ── Desktop ─────────────────────────────────────────── */}
      <div
        className="hidden overflow-hidden rounded-xl border bg-[var(--surface)] md:block"
        style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">
              Licences, ordered by expiry date with the soonest first
            </caption>
            <thead>
              <tr style={{ background: 'var(--secondary)' }}>
                <Th>Licence</Th>
                {showSite ? <Th>Site</Th> : null}
                <Th>Owner</Th>
                <Th>Expiry</Th>
                <Th align="right">Status</Th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {licenses.map((licence) => (
                <tr
                  key={licence.id}
                  className="border-t transition-colors hover:bg-[var(--secondary)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/dashboard/licenses/${licence.id}`}
                      className="font-medium underline-offset-2 hover:underline focus-visible:underline"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {licence.name}
                    </Link>
                    {licence.authority ? (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {licence.authority}
                      </p>
                    ) : null}
                  </td>

                  {showSite ? (
                    <td
                      className="px-4 py-3.5"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {licence.site ? (
                        licence.site.name
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 size={13} aria-hidden="true" />
                          Company-wide
                        </span>
                      )}
                    </td>
                  ) : null}

                  <td
                    className="px-4 py-3.5"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {licence.owner?.name ?? licence.owner?.email ?? (
                      <span style={{ color: 'var(--status-critical-fg)' }}>Unassigned</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className="tabular-nums"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {formatDate(licence.expiryDate)}
                    </span>
                    <p
                      className="mt-0.5 text-xs tabular-nums"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {formatRemaining(licence.daysUntilExpiry)}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <StatusBadge status={licence.status} />
                  </td>

                  <td className="pr-3 text-right">
                    <ChevronRight
                      size={15}
                      style={{ color: 'var(--muted-foreground)' }}
                      aria-hidden="true"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Narrow ──────────────────────────────────────────── */}
      <ul className="flex flex-col gap-3 md:hidden">
        {licenses.map((licence) => {
          const { tone } = statusPresentation(licence.status);
          return (
            <li key={licence.id}>
              <Link
                href={`/dashboard/licenses/${licence.id}`}
                className="block rounded-xl border bg-[var(--surface)] p-4 transition-shadow hover:shadow-[var(--shadow-sm)]"
                style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate font-medium"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {licence.name}
                    </p>
                    <p
                      className="mt-0.5 truncate text-xs"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {licence.site?.name ?? 'Company-wide'}
                      {licence.authority ? ` · ${licence.authority}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={licence.status} size="sm" />
                </div>

                <div
                  className="mt-3 flex items-center justify-between border-t pt-3 text-xs"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span style={{ color: 'var(--muted-foreground)' }}>
                    {formatDate(licence.expiryDate)}
                  </span>
                  <span
                    className="font-medium tabular-nums"
                    style={{
                      color:
                        tone === 'critical'
                          ? 'var(--danger)'
                          : tone === 'warning'
                            ? 'var(--warning)'
                            : 'var(--muted-foreground)',
                    }}
                  >
                    {formatRemainingShort(licence.daysUntilExpiry)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-2.5 text-[11px] font-semibold tracking-wide uppercase ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      style={{ color: 'var(--muted-foreground)' }}
    >
      {children}
    </th>
  );
}
