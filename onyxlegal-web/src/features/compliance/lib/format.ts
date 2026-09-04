/**
 * Presentation helpers for compliance dates and statuses.
 *
 * THE TIMEZONE RULE
 * -----------------
 * The API stores expiry as a PostgreSQL DATE and serialises it as an ISO
 * instant at midnight UTC — "2026-10-31T00:00:00.000Z".
 *
 * That string MUST be read in UTC. `new Date(iso).toLocaleDateString()` in
 * any negative-offset timezone renders 30 October: the licence would appear
 * to expire a day early, in the one product where that is unacceptable.
 *
 * So every formatter here pins `timeZone: 'UTC'`, and the calendar date is
 * taken by slicing the string rather than by constructing a local Date.
 *
 * WHAT THIS FILE DOES NOT DO
 * --------------------------
 * It never computes status or days-remaining. Those are derived server-side
 * from the tenant's timezone and arrive on the payload. Recomputing them in
 * the browser would create a second source of truth that disagrees with the
 * server whenever the viewer sits in a different timezone from the tenant.
 */

import type { LicenseExpiryStatus } from '@/lib/api';
import { guarded } from './population';

/**
 * "2026-10-31" → "2026-10-31". Null-safe, and idempotent.
 *
 * Since Slice 15 every compliance service emits PlainDate strings, so this is
 * a no-op on licence dates. It is kept, and kept lenient, because it is the
 * one place that would silently absorb an instant if a new endpoint ever
 * emitted one again — trimming to ten characters is correct for both shapes,
 * and the date-boundary integration test is what actually fails if it
 * happens.
 */
export function toCalendarDate(iso: string | null | undefined): string | null {
  return iso ? iso.slice(0, 10) : null;
}

/** "2026-10-31" → "31 Oct 2026". Pins UTC, so an instant also renders correctly. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** "2026-10-31T00:00:00.000Z" → "31 October 2026", for the detail hero. */
export function formatDateLong(iso: string | null | undefined): string {
  if (!iso) return 'No expiry date';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Human phrasing for the server's `daysUntilExpiry`.
 *
 * Never renders a negative number: "-6 days" reads as a bug, "Expired 6 days
 * ago" reads as a fact.
 */
export function formatRemaining(days: number | null): string {
  if (days === null) return 'No expiry';
  if (days < 0) {
    const ago = Math.abs(days);
    return ago === 1 ? 'Expired yesterday' : `Expired ${ago} days ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day remaining';
  return `${days} days remaining`;
}

/** Compact form for dense table cells. */
export function formatRemainingShort(days: number | null): string {
  if (days === null) return '—';
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days === 0) return 'Today';
  return `${days}d`;
}

// ── Status presentation ────────────────────────────────────────────────────

export type StatusTone =
  | 'critical'
  | 'warning'
  /**
   * The expiry ramp's "soon". Distinct from `info` since Slice 19: the ramp
   * needs a warm value between amber and green, while `info` must stay
   * indigo for scheduled reminders, declared requirements and renewal
   * stages — none of which is a warning.
   */
  | 'soon'
  | 'info'
  | 'positive'
  | 'neutral';

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
  /** One plain sentence for the detail page. No jargon, no alarm. */
  description: string;
}

/**
 * Status → visual language.
 *
 * Red is reserved for EXPIRED — something that has actually gone wrong.
 * A licence with 20 days left is amber: it needs planning, not panic.
 * Healthy licences are quiet, so the eye lands on the ones that are not.
 */
const STATUS_PRESENTATION: Record<LicenseExpiryStatus, StatusPresentation> = {
  EXPIRED: {
    label: 'Expired',
    tone: 'critical',
    description: 'This licence has passed its expiry date and needs renewing.',
  },
  CRITICAL: {
    label: 'Action needed',
    tone: 'warning',
    description: 'Renewal should be under way. This expires within a month.',
  },
  EXPIRING_SOON: {
    label: 'Expiring soon',
    tone: 'soon',
    description: 'Coming up. There is still comfortable time to renew.',
  },
  ACTIVE: {
    label: 'Current',
    tone: 'positive',
    description: 'Valid, with no action needed right now.',
  },
  NO_EXPIRY: {
    label: 'No expiry',
    tone: 'neutral',
    description: 'This licence has no expiry date recorded.',
  },
};

export function statusPresentation(
  status: LicenseExpiryStatus,
): StatusPresentation {
  return STATUS_PRESENTATION[status] ?? STATUS_PRESENTATION.NO_EXPIRY;
}

/** CSS custom properties per tone, drawn from the existing design tokens. */
/**
 * The product's ONE status palette.
 *
 * WHY THESE VALUES AND NOT THE OLD ONES
 * -------------------------------------
 * Until Slice 14 this map carried eight rgba() literals written by eye —
 * rgba(220,38,38,0.08), rgba(217,119,6,0.09) and so on — whose contrast was
 * never measured. Meanwhile Slice 12 had added six colour pairs to
 * globals.css and measured every one against its own background, and nothing
 * used them. Two status systems, one of them verified and unused, the other
 * unverified and imported by sixteen files.
 *
 * These are now the measured pairs. The contrast figures are:
 *
 *   critical  6.05:1   (expired red)
 *   warning   5.20:1   (action-needed amber)
 *   info      7.32:1   (expiring-soon indigo)
 *   positive  5.40:1   (current green)
 *   neutral   7.36:1   (slate)
 *
 * All pass WCAG AA for normal text, which the old values were never checked
 * against.
 *
 * KEYED BY TONE, NOT BY EXPIRY STATUS
 * -----------------------------------
 * This is deliberate and it is why the exemplar's StatusPill was folded back
 * into StatusBadge rather than the other way round. A tone is a generic
 * semantic: `critical` colours an expired licence, a missing required
 * document, and a failed import row. Keying this by LicenseExpiryStatus would
 * make "this import row failed" inexpressible.
 *
 * The sixth measured pair (--status-gap-*, purple, 6.02:1) is intentionally
 * unmapped: coverage gaps currently render as `warning`, and inventing a
 * sixth tone for one consumer would be a token in search of a use.
 *
 * Borders are derived from the foreground with color-mix so the palette has
 * exactly one definition per colour, in globals.css.
 */
export const TONE_STYLES: Record<
  StatusTone,
  { fg: string; bg: string; border: string }
> = {
  critical: {
    fg: 'var(--status-expired-fg)',
    bg: 'var(--status-expired-bg)',
    border: 'color-mix(in srgb, var(--status-expired-fg) 22%, transparent)',
  },
  warning: {
    fg: 'var(--status-critical-fg)',
    bg: 'var(--status-critical-bg)',
    border: 'color-mix(in srgb, var(--status-critical-fg) 22%, transparent)',
  },
  soon: {
    fg: 'var(--status-ramp-fg)',
    bg: 'var(--status-ramp-bg)',
    border: 'color-mix(in srgb, var(--status-ramp-fg) 22%, transparent)',
  },
  info: {
    fg: 'var(--status-soon-fg)',
    bg: 'var(--status-soon-bg)',
    border: 'color-mix(in srgb, var(--status-soon-fg) 22%, transparent)',
  },
  positive: {
    fg: 'var(--status-current-fg)',
    bg: 'var(--status-current-bg)',
    border: 'color-mix(in srgb, var(--status-current-fg) 22%, transparent)',
  },
  neutral: {
    fg: 'var(--status-neutral-fg)',
    bg: 'var(--status-neutral-bg)',
    border: 'color-mix(in srgb, var(--status-neutral-fg) 22%, transparent)',
  },
};

// ── Site-level rollup phrasing ─────────────────────────────────────────────

/**
 * One calm sentence describing a site's compliance state.
 *
 * The product promise is "everything is under control", so the all-clear
 * case is stated positively and explicitly rather than left blank.
 */
export function summarisePhrase(summary: {
  total: number;
  needsAttention: number;
}): string {
  if (summary.total === 0) return 'No licences yet';
  if (summary.needsAttention === 0) return 'All clear';
  return summary.needsAttention === 1
    ? '1 needs attention'
    : `${summary.needsAttention} need attention`;
}

/** Tone for a site card, derived from its rollup — no second source of truth. */
export function summaryTone(summary: {
  total: number;
  expired: number;
  critical: number;
}): StatusTone {
  if (summary.expired > 0) return 'critical';
  if (summary.critical > 0) return 'warning';
  if (summary.total === 0) return 'neutral';
  return 'positive';
}

/** "12 licences" / "1 licence" */
export function pluralLicences(count: number): string {
  return count === 1 ? '1 licence' : `${count} licences`;
}

/**
 * The sites-page summary line. GUARDED.
 *
 * Found by Slice 17's vacuous-truth inventory. The chain read
 * `sites === 0 ? … : attention === 0 ? "All N licences … are current" : …`,
 * so a tenant with three sites and no licences was told
 * "All 0 licences across 3 sites are current." True, absurd, and reassuring
 * about a register that is empty.
 */
export const sitesSummaryLine = guarded({
  surface: 'sites — summary line',
  population: 'active licences',
  render: (licences: number, sites = 1, attention = 0): string => {
    if (sites === 0) {
      return 'Track every licence across every site in one place.';
    }
    if (licences === 0) {
      return `No licences are on record at ${
        sites === 1 ? 'your site' : `any of your ${sites} sites`
      } yet.`;
    }
    const where = `${sites} ${sites === 1 ? 'site' : 'sites'}`;
    return attention === 0
      ? `All ${pluralLicences(licences)} across ${where} are current.`
      : `${attention} of ${licences} licences need attention across ${where}.`;
  },
}).render as (licences: number, sites?: number, attention?: number) => string;

// ── Reminder presentation ──────────────────────────────────────────────────
//
// TRUTHFULNESS RULE
// -----------------
// Email delivery is real as of the scheduler slice, but it is the ONLY
// channel: there is no SMS and no WhatsApp. So SENT remains the only status
// permitted to claim delivery, it is only ever rendered alongside the
// timestamp and channel the database actually recorded, and every other
// status says plainly what did not happen. Claiming otherwise in a product
// whose entire promise is "nothing expires unnoticed" would be the worst
// possible lie to tell a user.

import type {
  LicenseReminder,
  ReminderChannel,
  ReminderStatus,
} from '@/lib/api';

export interface ReminderPresentation {
  label: string;
  tone: StatusTone;
  /** Shown when the plain label needs qualifying. */
  hint?: string;
}

const REMINDER_PRESENTATION: Record<ReminderStatus, ReminderPresentation> = {
  PENDING: {
    label: 'Scheduled',
    tone: 'info',
  },
  SENT: {
    // The ONLY status permitted to claim delivery, and only ever rendered
    // together with the sentAt timestamp and channel the database recorded.
    label: 'Sent',
    tone: 'positive',
  },
  UNDELIVERABLE: {
    label: 'No recipient',
    tone: 'warning',
    hint: 'Nobody is assigned to this licence, so there was no one to notify.',
  },
  FAILED: {
    label: 'Delivery failed',
    tone: 'critical',
    hint: 'Attempted several times without success.',
  },
  SKIPPED: {
    label: 'Window passed',
    tone: 'neutral',
    hint: 'This date had already passed when the licence was added.',
  },
  CANCELLED: {
    label: 'Superseded',
    tone: 'neutral',
    hint: 'Replaced when the expiry date changed.',
  },
};

export function reminderPresentation(
  status: ReminderStatus,
): ReminderPresentation {
  return REMINDER_PRESENTATION[status] ?? REMINDER_PRESENTATION.PENDING;
}

/**
 * How a delivered reminder was sent, for display next to its timestamp.
 * Returns null for anything not actually delivered — the caller must not
 * render a channel for a reminder that never went out.
 */
export function reminderChannelLabel(
  channel: ReminderChannel | null,
): string | null {
  if (channel === 'EMAIL') return 'by email';
  return null;
}

/** Timestamp of an actual delivery, in the reader's locale. */
export function formatSentAt(sentAt: string | null): string | null {
  if (!sentAt) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(sentAt));
}

/** "90 days before" — the client's own phrasing for the ladder. */
/**
 * Copy for the prior-period disclosure.
 *
 * PRESENTATION CHOICE: a collapsed section, closed by default.
 *
 * Not a separate page, because a delivery is evidence and evidence a person
 * has to go looking for is evidence they will not find. Not shown expanded,
 * because the current ladder is what the page is for and prior periods would
 * double its length on every renewed licence.
 *
 * Closed-but-counted is the honest middle: the count tells you something is
 * there, so nothing is concealed, and one click reveals it.
 */
export const PRIOR_PERIOD_COPY = {
  summary: (n: number) =>
    n === 1
      ? '1 reminder from before this licence was renewed'
      : `${n} reminders from before this licence was renewed`,
  hint: (renewedOn: string) =>
    `These belong to the licence as it was before it was renewed on ${renewedOn}. `
    + 'They are kept as a record of what was sent.',
} as const;

export function reminderOffsetLabel(offsetDays: number): string {
  return offsetDays === 1 ? '1 day before' : `${offsetDays} days before`;
}

/**
 * A reminder's `dueOn` arrives as a plain "YYYY-MM-DD" calendar date from the
 * server — not an ISO instant like licence expiry does.
 *
 * Formatting it must not go through `new Date("YYYY-MM-DD")` either: that is
 * parsed as UTC midnight and then rendered in local time, which shifts the day
 * backwards west of UTC. Appending the explicit UTC marker and formatting in
 * UTC keeps the date the server computed.
 */
export function formatPlainDate(date: string | null | undefined): string {
  if (!date) return '\u2014';
  return formatDate(`${date}T00:00:00.000Z`);
}

/**
 * A plain date written out in full: "15 September 2026".
 *
 * Used where a person is being asked to VERIFY a date rather than just read
 * one — the import preview above all. An abbreviated month is unambiguous, but
 * the full month name is the form someone actually checks against the licence
 * in their hand.
 */
export function formatPlainDateLong(date: string | null | undefined): string {
  if (!date) return '\u2014';
  return formatDateLong(`${date}T00:00:00.000Z`);
}

/** A reminder's `dueOn`. Same plain-date handling, named for its caller. */
export function formatDueOn(dueOn: string): string {
  return formatPlainDate(dueOn);
}

// ── Which reminders the timeline shows ─────────────────────────────────────

/**
 * Collapses a licence's reminder rows to one entry per offset.
 *
 * WHY THIS EXISTS
 * ---------------
 * A licence accumulates more than one row per offset over its life. Move an
 * expiry date and the old obligation is retired and a new one written at the
 * new date; both rows persist, because the retired one may record a real
 * delivery attempt and history is not rewritten server-side.
 *
 * Rendering all of them produced the defect this fixes: a licence showed two
 * "7 days before" entries with contradictory dates, which reads as a bug in
 * the one place the product is asking to be trusted.
 *
 * The rules, in order:
 *
 *   · CANCELLED rows are dropped entirely. "Superseded" means a live row for
 *     the same offset is already on screen, so the retired one is pure noise.
 *   · Among what remains for an offset, a SENT row always wins. A delivery
 *     that actually reached someone is the most important fact about that
 *     offset, and must never be hidden behind a later reschedule.
 *   · Otherwise the latest due date wins, because that is the one belonging
 *     to the current expiry.
 *
 * Nothing is deleted — this is presentation only. The full history stays in
 * the database and in the audit log.
 */
export function timelineReminders(
  reminders: LicenseReminder[],
): LicenseReminder[] {
  const byOffset = new Map<number, LicenseReminder>();

  for (const reminder of reminders) {
    if (reminder.status === 'CANCELLED') continue;

    const held = byOffset.get(reminder.offsetDays);
    if (!held) {
      byOffset.set(reminder.offsetDays, reminder);
      continue;
    }

    // A real delivery outranks anything scheduled later.
    const heldIsSent = held.status === 'SENT';
    const candidateIsSent = reminder.status === 'SENT';
    if (heldIsSent !== candidateIsSent) {
      if (candidateIsSent) byOffset.set(reminder.offsetDays, reminder);
      continue;
    }

    if (reminder.dueOn > held.dueOn) {
      byOffset.set(reminder.offsetDays, reminder);
    }
  }

  // Largest offset first: 90 days before, then 60, then 30 — the order the
  // dates actually occur in.
  return [...byOffset.values()].sort((a, b) => b.offsetDays - a.offsetDays);
}

/**
 * Splits a licence's reminders at the renewal boundary.
 *
 * WHY A BOUNDARY EXISTS AT ALL
 * ----------------------------
 * A completed renewal ends one licence period and starts another. A reminder
 * dated before that point belongs to the licence as it WAS, and Slice 11 found
 * it surfacing inside the new ladder: a "14 days before" delivery from
 * September 2026 sat among a 2027 schedule, reading as though the 2027
 * reminder had already gone out.
 *
 * SLICE 8'S RULE IS NOT REVERSED
 * ------------------------------
 * That rule — a SENT row outranks a later PENDING for the same offset — exists
 * so a delivery that genuinely reached someone is never hidden behind a
 * reschedule. It is still right for that case, and with no completed renewal
 * this function returns exactly what Slice 8 returned. The rule simply
 * predates periods; a renewal boundary did not exist until Slice 11. It is
 * being scoped to the case it was written for, not overturned.
 *
 * `periodStart` is a PlainDate computed SERVER-side in the tenant's timezone,
 * because `dueOn` is a calendar date in that timezone. Converting the
 * renewal's `completedAt` in the browser would land on the wrong day for
 * anyone outside Riyadh.
 *
 * Nothing is deleted and no status is invented. Prior-period rows are returned
 * separately so they stay reachable.
 */
export function splitTimelineByPeriod(
  reminders: LicenseReminder[],
  periodStart: string | null,
): { current: LicenseReminder[]; prior: LicenseReminder[] } {
  if (!periodStart) {
    // No renewal has completed, so there is one period and Slice 8 governs.
    return { current: timelineReminders(reminders), prior: [] };
  }

  const prior: LicenseReminder[] = [];
  const currentPeriod: LicenseReminder[] = [];

  for (const reminder of reminders) {
    // Plain "YYYY-MM-DD" strings compare lexicographically, which is why the
    // domain uses them rather than Date objects.
    if (reminder.dueOn < periodStart) prior.push(reminder);
    else currentPeriod.push(reminder);
  }

  return {
    current: timelineReminders(currentPeriod),
    // Newest first, and CANCELLED rows stay out of the history view too —
    // they were superseded, not delivered.
    prior: prior
      .filter((reminder) => reminder.status !== 'CANCELLED')
      .sort((a, b) => (a.dueOn < b.dueOn ? 1 : -1)),
  };
}
