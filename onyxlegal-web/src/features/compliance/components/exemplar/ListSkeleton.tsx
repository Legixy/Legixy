'use client';

/**
 * Loading placeholder — exemplar only.
 *
 * A skeleton, not a spinner: a spinner says "wait", a skeleton says "rows are
 * coming, and here is roughly where they will be." The client's eye lands on
 * the right part of the screen before the data arrives.
 *
 * NO LAYOUT SHIFT
 * ---------------
 * Each placeholder row is built from the same three tokens the real row uses
 * — --row-py, --row-px, --leading-snug — with bars sized to the real content
 * they stand in for. The table header is rendered for real, because it does
 * not depend on data and re-drawing it as grey bars would make it move.
 *
 * The shimmer is a background-position animation, so prefers-reduced-motion
 * stops it (see globals.css) and it does not move any layout box.
 */
function Bar({ w, h = 'var(--space-3)' }: { w: string; h?: string }) {
  return (
    <div
      className="animate-pulse"
      style={{
        width: w,
        height: h,
        background: 'var(--surface-sunken)',
        borderRadius: 'var(--radius-xs)',
      }}
    />
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--surface)',
        border: 'var(--hairline) solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center"
          style={{
            gap: 'var(--space-4)',
            paddingInline: 'var(--row-px)',
            paddingBlock: 'var(--row-py)',
            borderTop: index === 0 ? undefined : 'var(--hairline) solid var(--border)',
          }}
        >
          <div className="min-w-0 flex-1">
            <Bar w="min(var(--skel-bar-lg), 60%)" h="var(--space-4)" />
            <div style={{ marginTop: 'var(--space-1)' }}>
              <Bar w="min(var(--skel-bar-sm), 35%)" />
            </div>
          </div>
          <div className="hidden sm:block">
            <Bar w="var(--space-16)" />
          </div>
          <Bar w="var(--space-16)" h="var(--space-5)" />
        </div>
      ))}
    </div>
  );
}
