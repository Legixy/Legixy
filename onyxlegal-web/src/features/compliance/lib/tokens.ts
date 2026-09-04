/**
 * Tokens that have to cross from CSS into JavaScript.
 *
 * lucide-react takes `size` as a number, not a CSS length, so an icon size
 * cannot be var(--icon-md) at the call site. Rather than let that become a
 * licence to sprinkle 12, 14 and 15 through the JSX — which is exactly how
 * the rest of this product ended up with three different "small" icons on
 * one screen — the numbers live here, once.
 *
 * Keep in step with the --icon-* tokens in globals.css. These are the same
 * scale, expressed twice because two languages need it.
 */
export const ICON = {
  /** Inline with 12–13px text: the company-wide glyph, the sort arrow. */
  sm: 12,
  /** Inline with 13–15px text: search, upload, row affordances. */
  md: 14,
  /** Standalone next to a 15px label: the empty state's primary action. */
  lg: 15,
} as const;
