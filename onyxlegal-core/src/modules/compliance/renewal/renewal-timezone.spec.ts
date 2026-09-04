import {
  addDays,
  fromPrismaDate,
  isPlainDate,
  toPrismaDate,
} from '../domain/plain-date';
import { buildReminderSchedule } from '../domain/reminder-schedule';

/**
 * The new expiry is the highest-consequence date write in the product: every
 * reminder is computed from it. Three timezone bugs have already been found
 * here — two in earlier slices, and one in Slice 10 where exceljs turned
 * `2026-09-15` into `2026-09-14T18:30:00.000Z` on a UTC+5:30 machine.
 *
 * So the completion path is exercised end to end under timezones spanning
 * both sides of UTC, including at a year boundary where an off-by-one changes
 * the YEAR rather than just the day.
 */
describe("a renewal's new expiry survives the server timezone", () => {
  const ORIGINAL_TZ = process.env.TZ;

  afterEach(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  const ZONES = [
    'UTC',
    'Asia/Riyadh', // +03, the tenant's own zone
    'Asia/Kolkata', // +05:30, where the exceljs shift was measured
    'Pacific/Kiritimati', // +14, the largest positive offset in use
    'America/Los_Angeles', // -07/-08
    'Pacific/Niue', // -11
  ];

  it.each(ZONES)(
    'writes and reads 2027-09-15 unchanged under TZ=%s',
    (zone) => {
      process.env.TZ = zone;
      const entered = '2027-09-15';

      // The exact path completion takes: validate, convert, store, read back.
      expect(isPlainDate(entered)).toBe(true);
      const stored = toPrismaDate(entered);
      expect(stored.toISOString().slice(0, 10)).toBe('2027-09-15');
      expect(fromPrismaDate(stored)).toBe('2027-09-15');
    },
  );

  it.each(ZONES)('holds at a year boundary under TZ=%s', (zone) => {
    // 1 January is where an off-by-one changes the year, not just the day.
    process.env.TZ = zone;
    const stored = toPrismaDate('2028-01-01');

    expect(fromPrismaDate(stored)).toBe('2028-01-01');
    expect(stored.toISOString().slice(0, 10)).toBe('2028-01-01');
  });

  it.each(ZONES)('regenerates the SAME reminder ladder under TZ=%s', (zone) => {
    process.env.TZ = zone;
    // What reconcile() does after completion: the ladder is derived from
    // the new expiry, so a shifted date would move every reminder with it.
    const schedule = buildReminderSchedule('2027-09-15', '2026-09-02');

    expect(schedule.map((o) => o.offsetDays)).toEqual([90, 60, 30, 14, 7]);
    expect(schedule.map((o) => o.dueOn)).toEqual([
      addDays('2027-09-15', -90),
      addDays('2027-09-15', -60),
      addDays('2027-09-15', -30),
      addDays('2027-09-15', -14),
      addDays('2027-09-15', -7),
    ]);
    // Pinned literally, so a shift cannot hide behind the same arithmetic.
    expect(schedule[0].dueOn).toBe('2027-06-17');
    expect(schedule[4].dueOn).toBe('2027-09-08');
  });

  it('rejects an ambiguous new expiry identically in every timezone', () => {
    for (const zone of ZONES) {
      process.env.TZ = zone;
      expect({ zone, valid: isPlainDate('01/02/2027') }).toEqual({
        zone,
        valid: false,
      });
    }
  });

  it.each(ZONES)('crosses a leap day unchanged under TZ=%s', (zone) => {
    process.env.TZ = zone;
    const stored = toPrismaDate('2028-02-29');
    expect(fromPrismaDate(stored)).toBe('2028-02-29');
  });
});
