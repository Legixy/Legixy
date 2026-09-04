/**
 * Date-only arithmetic for the compliance domain.
 *
 * WHY THIS EXISTS
 * ---------------
 * A licence expiry is a CALENDAR DATE, not an instant in time.
 * "Expires on 2026-10-31" is true for the whole of that day in the tenant's
 * timezone. Modelling it as a timestamp produces off-by-one errors for part
 * of every day — a licence would flip to EXPIRED at 03:00 local time when the
 * server crosses UTC midnight.
 *
 * So: expiry and issue dates are stored as PostgreSQL `DATE`, and every
 * calculation in this domain works on `PlainDate` strings ("YYYY-MM-DD").
 *
 * PRISMA FOOTGUN
 * --------------
 * Prisma maps `@db.Date` to a JavaScript `Date` at MIDNIGHT UTC. Formatting
 * that with local-time getters renders the previous day in any negative-offset
 * zone. `fromPrismaDate` / `toPrismaDate` are the only sanctioned conversion
 * points — nothing else in the domain should touch a raw `Date`.
 *
 * NO DEPENDENCY
 * -------------
 * All five operations below are exact integer arithmetic over `Date.UTC`,
 * plus `Intl` for timezone resolution. A date library would add a
 * supply-chain surface for ~40 lines of provably correct code.
 */

/**
 * A calendar date with no time and no timezone, formatted "YYYY-MM-DD".
 *
 * INVARIANT: every value of this type has passed `isPlainDate`. Construct one
 * only via `parsePlainDate`, `fromPrismaDate`, `todayIn`, or `addDays`.
 */
export type PlainDate = string;

const PLAIN_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

/**
 * True when `value` is a well-formed, real calendar date.
 * Rejects structurally valid but non-existent dates such as "2026-02-30".
 */
export function isPlainDate(value: string): boolean {
  if (!PLAIN_DATE_PATTERN.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const roundTrip = new Date(Date.UTC(year, month - 1, day));
  return (
    roundTrip.getUTCFullYear() === year &&
    roundTrip.getUTCMonth() === month - 1 &&
    roundTrip.getUTCDate() === day
  );
}

/** Narrowing parse. Throws on anything `isPlainDate` rejects. */
export function parsePlainDate(value: string): PlainDate {
  if (!isPlainDate(value)) {
    throw new Error(
      `Invalid calendar date "${value}". Expected format YYYY-MM-DD.`,
    );
  }
  return value;
}

/**
 * Today's calendar date in the given IANA timezone.
 *
 * This is the ONLY function in the compliance domain that reads the wall
 * clock. Everything downstream takes `today` as a parameter, which is what
 * makes status and reminder logic deterministic and testable.
 */
export function todayIn(timeZone: string, now: Date = new Date()): PlainDate {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
  } catch {
    // Fail loudly. A silent fallback to UTC would shift every expiry
    // calculation for that tenant by up to a day, invisibly.
    throw new Error(
      `Unknown IANA timezone "${timeZone}". Check Tenant.timeZone.`,
    );
  }

  const find = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${find('year')}-${find('month')}-${find('day')}`;
}

/** Convert a Prisma `@db.Date` value (midnight UTC) to a PlainDate. */
export function fromPrismaDate(date: Date): PlainDate {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Convert a PlainDate to the midnight-UTC `Date` Prisma expects for `@db.Date`. */
export function toPrismaDate(value: PlainDate): Date {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return new Date(Date.UTC(year, month - 1, day));
}

/** Shift a calendar date by whole days. Negative values move backwards. */
export function addDays(value: PlainDate, days: number): PlainDate {
  const shifted = toPrismaDate(value);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return fromPrismaDate(shifted);
}

/**
 * Whole calendar days from `from` to `to`. Positive when `to` is later.
 *
 * Exact: both operands are midnight UTC, so the millisecond difference is
 * always a whole multiple of a day. `Math.round` is defensive only.
 */
export function differenceInDays(from: PlainDate, to: PlainDate): number {
  return Math.round(
    (toPrismaDate(to).getTime() - toPrismaDate(from).getTime()) / MS_PER_DAY,
  );
}
