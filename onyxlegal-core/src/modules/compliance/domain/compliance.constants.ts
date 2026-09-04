/**
 * Compliance domain thresholds.
 *
 * There is exactly ONE set of numbers in this system, and it lives here.
 * Two independent sets — one for reminders, one for status colours — would
 * drift, and a licence would eventually render green on the same day it
 * triggered a reminder. That inconsistency would undermine the single
 * promise this product makes.
 */

/**
 * Days before expiry at which the client wants to be reminded.
 * CLIENT-PROVIDED requirement.
 *
 * Not yet consumed — the reminder engine is a later slice. Defined here so
 * the status windows below are visibly derived from it rather than invented.
 */
export const REMINDER_OFFSET_DAYS = [90, 60, 30, 14, 7] as const;

/**
 * Inside this window a licence is CRITICAL.
 *
 * ENGINEERING INFERENCE, derived from the third rung of the reminder ladder:
 * by 30 days out the organisation has been reminded three times, and most
 * Saudi renewal processes need to be under way. Requires client sign-off.
 */
export const CRITICAL_WINDOW_DAYS = 30;

/**
 * Inside this window a licence is EXPIRING_SOON.
 *
 * ENGINEERING INFERENCE, derived from the outermost rung: 90 days is the
 * point at which the client asked to be told, so it is the point at which
 * a licence enters the attention window. Requires client sign-off.
 */
export const WARNING_WINDOW_DAYS = 90;
