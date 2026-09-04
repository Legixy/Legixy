'use client';

import type { ReactNode } from 'react';

/**
 * Empty state. The product's only one.
 *
 * WHAT WAS WRONG WITH THE OLD ONE
 * -------------------------------
 * A dashed border and a lucide glyph centred inside a 44px tinted circle,
 * above centred text. Both are on the banned list, and for one underlying
 * reason: they are the visual language of a placeholder. A dashed rectangle
 * says "something is missing here and this page is unfinished."
 *
 * But an empty list is not an unfinished page. It is a correct, complete
 * answer to a real question, and it is the most common state a brand-new
 * client will ever see. Drawing it as a gap tells them the software is
 * broken on the first screen they open.
 *
 * So: the same solid border the populated view has, because it is the same
 * object in a different state. Left-aligned, because centred text inside a
 * left-aligned product is a mode change nobody asked for. No icon — the
 * sentence is the content, and a decorative glyph above it only delays
 * reading it.
 *
 * THE THREE-STATE RULE THIS MUST NOT COLLAPSE
 * -------------------------------------------
 * Slice 12 established that "nothing to report" and "cannot report yet" are
 * different facts and must never converge. On the gaps screen they are three
 * distinct renderings:
 *
 *   1. no requirements declared  → "You have not told us which licences to
 *      expect" — the system has no basis for an opinion.
 *   2. declared, none missing    → "Everything on your list is on record" —
 *      scoped to the list, never a claim about the business.
 *   3. declared, some missing    → the actual list.
 *
 * That distinction lives in the CALL SITES, which choose the title and body.
 * This component must therefore never invent reassurance of its own — no
 * default copy, no "all good" flourish, no success colour. It renders what
 * it is given, and the `aside` slot exists so a caller can state the limit
 * of what an empty list actually proves.
 */
export function EmptyState({
  title,
  description,
  aside,
  action,
}: {
  title: string;
  description: string;
  /** The honesty line: what this empty list does NOT prove. */
  aside?: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: 'var(--hairline) solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        paddingBlock: 'var(--space-8)',
        paddingInline: 'var(--space-6)',
      }}
    >
      <div style={{ maxWidth: '52ch' }}>
        <h2
          style={{
            color: 'var(--foreground)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--leading-normal)',
            marginTop: 'var(--space-2)',
          }}
        >
          {description}
        </p>

        {action ? (
          <div style={{ marginTop: 'var(--space-5)' }}>{action}</div>
        ) : null}

        {aside ? (
          <p
            style={{
              borderTop: 'var(--hairline) solid var(--border)',
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-xs)',
              lineHeight: 'var(--leading-normal)',
              marginTop: 'var(--space-5)',
              paddingTop: 'var(--space-4)',
            }}
          >
            {aside}
          </p>
        ) : null}
      </div>
    </div>
  );
}
