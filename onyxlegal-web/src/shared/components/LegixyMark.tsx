/**
 * The Legixy mark.
 *
 * WHAT IT REPLACES, AND WHY
 * -------------------------
 * The product shipped with lucide's `Scale` — the scales of justice. That
 * mark says *law*, and specifically it says *litigation*. This product has
 * nothing to do with either. It does not give legal advice, does not analyse
 * contracts any more, and never appears in a dispute. It keeps a register of
 * licences and the dates they expire on, and it says something before a date
 * passes. A client who sees scales expects a lawyer; what they get is a
 * diary. The mark was making a promise the product does not keep, which is
 * the same failure mode as any other untrue string in this codebase.
 *
 * WHAT THIS ONE SAYS
 * ------------------
 * Records, and one of them is due.
 *
 * A rounded square holds ruled lines — the register. The top line is short
 * and carries a filled dot at its end: the entry that has a date attached and
 * is coming up. That is the whole product in two shapes. It reads as a
 * ledger, a list, or a record card depending on who is looking, and none of
 * those readings is wrong.
 *
 * TWO OPTICAL SIZES, ONE MARK
 * ---------------------------
 * At 24px and above the register has three rules. Below 20px — a favicon, a
 * table row, a browser tab — three 1.75px rules at 3.5px pitch collapse into
 * grey mush at 1x. The `compact` variant drops to two heavier rules at a
 * wider pitch, which is what the mark actually looks like when it is small.
 * This is the same thing a type family does with optical sizes: not a
 * different mark, the same mark drawn for the size it will be seen at.
 *
 * Strokes are currentColor, so the mark inherits whatever it sits on — white
 * on the indigo sidebar chip, foreground on a light surface.
 */
export function LegixyMark({
  size = 24,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Give this only when the mark is the sole label. Otherwise it is decorative. */
  title?: string;
}) {
  const compact = size < 20;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* The register */}
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4.5"
        stroke="currentColor"
        strokeWidth={compact ? 2 : 1.75}
      />

      {compact ? (
        <>
          {/* The due entry — short rule, then the dot */}
          <path
            d="M7 10h4.5"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
          <circle cx="16.5" cy="10" r="1.75" fill="currentColor" />
          <path
            d="M7 14.75h10"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M7 9h5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="16.5" cy="9" r="1.6" fill="currentColor" />
          <path
            d="M7 12.75h10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M7 16.5h10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
