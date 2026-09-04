'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/**
 * The page header. One definition, every screen.
 *
 * WHY THIS EXISTS
 * ---------------
 * Eight screens each wrote their own header: an `<h1>` at 30px Instrument
 * Serif, a subtitle in prose beneath it, and a 28-32px margin under the pair.
 * Because it was copied rather than shared, it drifted — three different
 * subtitle sizes, four different bottom margins, and on the preferences
 * screen a hardcoded `text-slate-900` that ignores the theme entirely.
 *
 * It also cost more vertical space than any other element in the product.
 * The licences exemplar measured it: 94px of header before the controls even
 * began, on a screen whose entire job is to show a list.
 *
 * THE PATTERN
 * -----------
 * Title and primary action share one row. No subtitle that restates what the
 * screen already says — the sidebar names the screen, the columns name the
 * data. A subtitle is for a fact the reader cannot get anywhere else, and
 * most of the old ones were not.
 *
 * WHERE IT DOES NOT FIT
 * ---------------------
 * Two places, both deliberate:
 *
 *   - The dashboard greeting ("Welcome back, Ahmed") is the one display line
 *     in the product. It is not a page title, it is a salutation, and it
 *     keeps Instrument Serif.
 *   - Detail screens (a licence, a site) carry a back link and a status
 *     badge alongside the title. Those use `backHref` and `meta` rather than
 *     a second header component.
 */
export function PageHeader({
  title,
  /**
   * Only pass this when it says something the screen does not already say.
   * "Every licence across every site, soonest expiry first" was none of
   * those things and was deleted rather than moved.
   */
  subtitle,
  backHref,
  backLabel,
  meta,
  actions,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  /** Status badges or counts that belong beside the title, not beneath it. */
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header style={{ marginBottom: 'var(--space-4)' }}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center"
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 'var(--text-sm)',
            gap: 'var(--space-1)',
            marginBottom: 'var(--space-2)',
          }}
        >
          <ArrowLeft size={14} aria-hidden="true" />
          {backLabel ?? 'Back'}
        </Link>
      ) : null}

      <div
        className="flex flex-wrap items-center justify-between"
        style={{ gap: 'var(--space-3)' }}
      >
        <div
          className="flex min-w-0 flex-wrap items-center"
          style={{ gap: 'var(--space-2)' }}
        >
          <h1
            className="min-w-0"
            style={{
              color: 'var(--foreground)',
              fontSize: 'var(--text-xl)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {title}
          </h1>
          {meta}
        </div>

        {actions ? (
          <div
            className="flex flex-wrap items-center"
            style={{ gap: 'var(--space-2)' }}
          >
            {actions}
          </div>
        ) : null}
      </div>

      {subtitle ? (
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 'var(--text-sm)',
            lineHeight: 'var(--leading-normal)',
            marginTop: 'var(--space-1)',
            maxWidth: '68ch',
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

/** Shared button surfaces, so an action looks the same on every screen. */
export const ACTION_STYLE = {
  primary: {
    alignItems: 'center',
    background: 'var(--primary)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--primary-foreground)',
    display: 'inline-flex',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    gap: 'var(--space-2)',
    height: 'var(--space-8)',
    justifyContent: 'center',
    paddingInline: 'var(--space-3)',
  },
  secondary: {
    alignItems: 'center',
    background: 'var(--surface)',
    border: 'var(--hairline) solid var(--border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--foreground)',
    display: 'inline-flex',
    fontSize: 'var(--text-sm)',
    fontWeight: 500,
    gap: 'var(--space-2)',
    height: 'var(--space-8)',
    justifyContent: 'center',
    paddingInline: 'var(--space-3)',
  },
} as const satisfies Record<string, React.CSSProperties>;
