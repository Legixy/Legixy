'use client';

import type { ComplianceSummary } from '@/lib/api';
import { TONE_STYLES } from '../lib/format';

/**
 * Compliance rollup for a site.
 *
 * Counts come straight from the server's summary — the browser never
 * recomputes them, so a site's totals can never disagree with the badges on
 * its own licence rows.
 *
 * Zero-value buckets are rendered muted rather than hidden: "0 Expired" is
 * reassuring information, and a row that changes shape as data changes is
 * harder to scan.
 */
export function ComplianceSummaryBar({
  summary,
}: {
  summary: ComplianceSummary;
}) {
  const cells = [
    { label: 'Current', value: summary.active, tone: 'positive' as const },
    { label: 'Expiring soon', value: summary.expiringSoon, tone: 'soon' as const },
    { label: 'Action needed', value: summary.critical, tone: 'warning' as const },
    { label: 'Expired', value: summary.expired, tone: 'critical' as const },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((cell) => {
        const isZero = cell.value === 0;
        const style = TONE_STYLES[cell.tone];
        return (
          <div
            key={cell.label}
            className="rounded-xl border bg-[var(--surface)] px-4 py-3"
            style={{
              borderColor: isZero ? 'var(--border)' : style.border,
              background: isZero ? 'var(--card)' : style.bg,
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <dt
              className="text-[11px] font-medium tracking-wide uppercase"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {cell.label}
            </dt>
            <dd
              className="mt-1 text-2xl font-semibold tabular-nums"
              style={{
                color: isZero ? 'var(--muted-foreground)' : style.fg,
                letterSpacing: '-0.02em',
              }}
            >
              {cell.value}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
