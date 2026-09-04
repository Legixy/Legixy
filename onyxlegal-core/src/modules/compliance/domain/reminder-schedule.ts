/**
 * Reminder schedule — pure computation of when a licence must be chased.
 *
 * No I/O, no clock, no Prisma. `today` is always a parameter, which is what
 * makes reminder dates deterministic and testable in any timezone.
 *
 * Built on the SAME `addDays` used everywhere else in this domain, and on the
 * SAME `REMINDER_OFFSET_DAYS` the client specified. There is deliberately no
 * second date system and no second set of intervals.
 */

import { REMINDER_OFFSET_DAYS } from './compliance.constants';
import { addDays, differenceInDays, PlainDate } from './plain-date';

/** One reminder obligation: chase this licence `offsetDays` before it expires. */
export interface ReminderObligation {
  offsetDays: number;
  dueOn: PlainDate;
  /**
   * True when `dueOn` already lies in the past at generation time — e.g. a
   * licence entered 45 days before expiry can never be chased at 90 days.
   *
   * These are recorded rather than silently dropped, so the timeline can say
   * "this window had already passed" instead of leaving an unexplained gap.
   * They must NOT be fired retroactively: blasting three overdue reminders the
   * moment someone adds a record would destroy trust in the system on day one.
   */
  alreadyPassed: boolean;
}

/**
 * The reminder obligations for a licence.
 *
 * Returns an empty schedule when the licence has no expiry date — a licence
 * that never expires has nothing to be reminded about.
 *
 * Ordered furthest-out first (90 → 7), which is both the client's phrasing and
 * the order the timeline reads in.
 */
export function buildReminderSchedule(
  expiryDate: PlainDate | null,
  today: PlainDate,
): ReminderObligation[] {
  if (expiryDate === null) return [];

  return REMINDER_OFFSET_DAYS.map((offsetDays) => {
    const dueOn = addDays(expiryDate, -offsetDays);
    return {
      offsetDays,
      dueOn,
      // Strictly before today: a reminder due today is still actionable.
      alreadyPassed: differenceInDays(today, dueOn) < 0,
    };
  });
}

/** Stable key for one obligation, used to match persisted rows against desired ones. */
export function obligationKey(offsetDays: number, dueOn: PlainDate): string {
  return `${offsetDays}:${dueOn}`;
}
