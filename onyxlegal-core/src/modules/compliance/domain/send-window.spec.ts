import {
  isWithinSendWindow,
  isWorkingDay,
  localMoment,
  SEND_WINDOW_END_HOUR,
  SEND_WINDOW_START_HOUR,
  sendWindowReason,
} from './send-window';

const RIYADH = 'Asia/Riyadh'; // UTC+3, no DST

/**
 * The UTC instant at which it is `localHour`:00 in Riyadh (UTC+3) on `isoDate`.
 *
 * Built with Date.UTC rather than string concatenation so that early local
 * hours (00:00–02:59, which are the PREVIOUS day in UTC) roll the date back
 * correctly instead of producing an invalid "T-3:00:00Z" string.
 */
const riyadhAt = (isoDate: string, localHour: number) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, localHour - 3, 0, 0));
};

describe('send-window', () => {
  describe('localMoment', () => {
    it('resolves Riyadh local time, not UTC', () => {
      // 22:00 UTC Thursday is 01:00 Friday in Riyadh.
      const moment = localMoment(new Date('2026-09-03T22:00:00Z'), RIYADH);
      expect(moment.weekday).toBe(5); // Friday
      expect(moment.hour).toBe(1);
    });

    it('throws on an unknown timezone rather than guessing', () => {
      expect(() => localMoment(new Date(), 'Mars/Olympus')).toThrow(
        /Unknown IANA timezone/,
      );
    });
  });

  describe('the Saudi working week is Sunday to Thursday', () => {
    // 2026-09-06 is a Sunday.
    it.each([
      ['2026-09-06', 0, 'Sunday', true],
      ['2026-09-07', 1, 'Monday', true],
      ['2026-09-08', 2, 'Tuesday', true],
      ['2026-09-09', 3, 'Wednesday', true],
      ['2026-09-10', 4, 'Thursday', true],
      ['2026-09-11', 5, 'Friday', false],
      ['2026-09-12', 6, 'Saturday', false],
    ])('%s is %i (%s) → working day: %s', (date, weekday, _name, working) => {
      const instant = riyadhAt(date, 11);
      expect(localMoment(instant, RIYADH).weekday).toBe(weekday);
      expect(isWorkingDay(instant, RIYADH)).toBe(working);
    });

    it('NEVER sends on the Saudi weekend', () => {
      // A 7-day reminder landing Friday afternoon is a wasted reminder.
      for (const date of ['2026-09-11', '2026-09-12']) {
        for (let hour = 0; hour < 24; hour += 1) {
          expect(isWithinSendWindow(riyadhAt(date, hour), RIYADH)).toBe(false);
        }
      }
    });
  });

  describe('business hours', () => {
    const MONDAY = '2026-09-07';

    it('opens at the start hour and closes before the end hour', () => {
      expect(
        isWithinSendWindow(riyadhAt(MONDAY, SEND_WINDOW_START_HOUR), RIYADH),
      ).toBe(true);
      expect(
        isWithinSendWindow(riyadhAt(MONDAY, SEND_WINDOW_END_HOUR - 1), RIYADH),
      ).toBe(true);
      expect(
        isWithinSendWindow(riyadhAt(MONDAY, SEND_WINDOW_END_HOUR), RIYADH),
      ).toBe(false);
      expect(
        isWithinSendWindow(
          riyadhAt(MONDAY, SEND_WINDOW_START_HOUR - 1),
          RIYADH,
        ),
      ).toBe(false);
    });

    it('does not send at 03:00, the classic cron hour', () => {
      expect(isWithinSendWindow(riyadhAt(MONDAY, 3), RIYADH)).toBe(false);
    });

    it('explains why a send was held back', () => {
      expect(sendWindowReason(riyadhAt('2026-09-11', 11), RIYADH)).toMatch(
        /Weekend/,
      );
      expect(sendWindowReason(riyadhAt(MONDAY, 6), RIYADH)).toMatch(
        /Before business hours/,
      );
      expect(sendWindowReason(riyadhAt(MONDAY, 20), RIYADH)).toMatch(
        /After business hours/,
      );
    });
  });

  it('is unaffected by the host machine timezone', () => {
    // The same instant must resolve identically regardless of process TZ,
    // because Intl is given the zone explicitly.
    const instant = new Date('2026-09-07T09:00:00Z'); // 12:00 Riyadh, Monday
    expect(isWithinSendWindow(instant, RIYADH)).toBe(true);
    expect(localMoment(instant, 'UTC').hour).toBe(9);
    expect(localMoment(instant, RIYADH).hour).toBe(12);
  });
});
