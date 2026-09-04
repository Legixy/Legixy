'use client';

import type { LicenseExpiryStatus } from '@/lib/api';
import { statusPresentation, TONE_STYLES } from '../lib/format';

/**
 * Status pill. The product's only one.
 *
 * WHY THERE IS ONLY ONE AGAIN
 * ---------------------------
 * Slice 13 built a second pill for the licences exemplar, wired to the
 * contrast-measured `--status-*` tokens, because changing this shared one
 * would have repainted six screens in a slice that was explicitly forbidden
 * from propagating. That left two status systems — worse than one bad one,
 * because a reader now has to know which surface uses which.
 *
 * Slice 14 pointed TONE_STYLES at those same measured tokens, so this
 * component and the exemplar's became the same thing rendered twice. The
 * exemplar's copy is deleted; this one takes its visual language:
 * radius-xs rather than a full pill, tighter padding, 11px text.
 *
 * MOTION
 * ------
 * `motion-status` crosses the colour over --motion-slow when the derived
 * status changes — which happens for real when a renewal completes and the
 * licence goes from "Action needed" to "Current". The badge does not move,
 * resize or fade: the only thing that changed is the colour, so the only
 * thing that animates is the colour. Neutralised under prefers-reduced-motion
 * by name.
 *
 * COLOUR IS NEVER THE SIGNAL
 * --------------------------
 * The label carries the meaning. Colour only makes it faster to find. That
 * rule holds because roughly one in twelve men cannot separate the amber
 * from the green, and because a compliance officer printing this list for a
 * meeting gets grey rectangles either way.
 */
export function StatusBadge({
  status,
  size = 'default',
}: {
  status: LicenseExpiryStatus;
  size?: 'default' | 'sm';
}) {
  const { label, tone } = statusPresentation(status);
  const style = TONE_STYLES[tone];

  return (
    <span
      className="motion-status inline-flex items-center whitespace-nowrap"
      style={{
        background: style.bg,
        border: `var(--hairline) solid ${style.border}`,
        borderRadius: 'var(--radius-xs)',
        color: style.fg,
        fontSize: size === 'sm' ? 'var(--text-2xs)' : 'var(--text-xs)',
        fontWeight: 500,
        gap: 'var(--space-1)',
        lineHeight: 'var(--leading-tight)',
        paddingBlock: 'var(--space-1)',
        paddingInline: 'var(--space-2)',
      }}
    >
      <span
        aria-hidden="true"
        className="inline-block shrink-0"
        style={{
          background: 'currentColor',
          borderRadius: 'var(--radius-full)',
          height: 'var(--space-1)',
          width: 'var(--space-1)',
        }}
      />
      {label}
    </span>
  );
}
