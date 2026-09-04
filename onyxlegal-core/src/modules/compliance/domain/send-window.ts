/**
 * When a reminder may actually be delivered.
 *
 * Pure: no clock, no I/O. The instant is always a parameter, which is what
 * makes weekend and business-hour behaviour testable without freezing time.
 *
 * WHY DEFER RATHER THAN SHIFT
 * ---------------------------
 * `dueOn` is the OBLIGATION date — the day the licence was supposed to be
 * chased. Rewriting it because a Friday got in the way would falsify the
 * record. Instead the reminder stays PENDING and `sentAt` records when
 * delivery actually happened. The two dates are allowed to differ, and the
 * difference is the truth.
 *
 * THE SAUDI WEEK
 * --------------
 * The working week is Sunday to Thursday. Friday and Saturday are the weekend.
 * A 7-day reminder landing on Friday afternoon is a wasted reminder — it is
 * read on Sunday at the earliest, by which point it is a 5-day reminder that
 * nobody registered as urgent.
 */

/** Sunday..Thursday. `Date.getUTCDay()`: 0=Sun … 6=Sat. */
const WORKING_DAYS = new Set([0, 1, 2, 3, 4]);

/** Local hour at which delivery may begin, inclusive. */
export const SEND_WINDOW_START_HOUR = 9;
/** Local hour at which delivery stops, exclusive. 17 = last send at 16:59. */
export const SEND_WINDOW_END_HOUR = 17;

export interface LocalMoment {
  /** 0=Sunday … 6=Saturday, in the target timezone. */
  weekday: number;
  /** 0..23, in the target timezone. */
  hour: number;
}

/**
 * Resolve an instant into weekday and hour in the given IANA timezone.
 *
 * Uses Intl rather than offset arithmetic so the answer stays correct if the
 * tenant is ever in a zone that observes DST. Saudi Arabia does not, but the
 * code must not encode that.
 */
export function localMoment(instant: Date, timeZone: string): LocalMoment {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(instant);
  } catch {
    // Fail loudly rather than silently delivering at the wrong local time.
    throw new Error(`Unknown IANA timezone "${timeZone}".`);
  }

  const weekdayName =
    parts.find((part) => part.type === 'weekday')?.value ?? 'Sun';
  const hourValue = parts.find((part) => part.type === 'hour')?.value ?? '0';

  const weekdayIndex = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ].indexOf(weekdayName);

  return {
    weekday: weekdayIndex === -1 ? 0 : weekdayIndex,
    // Intl renders midnight as "24" in some ICU versions; normalise it.
    hour: Number(hourValue) % 24,
  };
}

/** True when the Saudi working week is in session at this instant. */
export function isWorkingDay(instant: Date, timeZone: string): boolean {
  return WORKING_DAYS.has(localMoment(instant, timeZone).weekday);
}

/**
 * True when a reminder may be delivered right now.
 *
 * Both conditions must hold: a working day AND inside business hours. Outside
 * the window the sweep does nothing — it does not queue, claim or defer-and-
 * remember. The next sweep inside the window picks the work up, because the
 * selection query is `dueOn <= today` and therefore self-catching.
 */
export function isWithinSendWindow(instant: Date, timeZone: string): boolean {
  const { weekday, hour } = localMoment(instant, timeZone);
  if (!WORKING_DAYS.has(weekday)) return false;
  return hour >= SEND_WINDOW_START_HOUR && hour < SEND_WINDOW_END_HOUR;
}

/** Plain-language reason a send was held back, for logs and the UI. */
export function sendWindowReason(instant: Date, timeZone: string): string {
  const { weekday, hour } = localMoment(instant, timeZone);
  if (!WORKING_DAYS.has(weekday)) {
    return 'Weekend in the tenant timezone — deferred to the next working day';
  }
  if (hour < SEND_WINDOW_START_HOUR) {
    return 'Before business hours — deferred';
  }
  return 'After business hours — deferred to the next working morning';
}
