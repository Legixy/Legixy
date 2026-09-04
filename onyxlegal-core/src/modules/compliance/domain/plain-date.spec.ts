import {
  addDays,
  differenceInDays,
  fromPrismaDate,
  isPlainDate,
  parsePlainDate,
  todayIn,
  toPrismaDate,
} from './plain-date';

describe('plain-date', () => {
  describe('isPlainDate', () => {
    it.each(['2026-10-31', '2026-01-01', '2024-02-29', '1999-12-31'])(
      'accepts real date %s',
      (value) => expect(isPlainDate(value)).toBe(true),
    );

    it.each([
      ['2026-02-30', 'day that does not exist'],
      ['2025-02-29', 'Feb 29 in a non-leap year'],
      ['2026-13-01', 'month 13'],
      ['2026-00-10', 'month 0'],
      ['2026-10-32', 'day 32'],
      ['2026-1-01', 'unpadded month'],
      ['26-10-31', 'two-digit year'],
      ['2026/10/31', 'wrong separator'],
      ['2026-10-31T00:00:00Z', 'timestamp, not a date'],
      ['', 'empty string'],
      ['not-a-date', 'garbage'],
    ])('rejects %s (%s)', (value) => expect(isPlainDate(value)).toBe(false));
  });

  describe('parsePlainDate', () => {
    it('returns the value when valid', () => {
      expect(parsePlainDate('2026-10-31')).toBe('2026-10-31');
    });

    it('throws with a useful message when invalid', () => {
      expect(() => parsePlainDate('2026-02-30')).toThrow(
        /Invalid calendar date/,
      );
    });
  });

  describe('Prisma @db.Date conversion', () => {
    it('reads a midnight-UTC Date as the same calendar day', () => {
      expect(fromPrismaDate(new Date(Date.UTC(2026, 9, 31)))).toBe(
        '2026-10-31',
      );
    });

    it('writes a PlainDate as midnight UTC', () => {
      const written = toPrismaDate('2026-10-31');
      expect(written.toISOString()).toBe('2026-10-31T00:00:00.000Z');
    });

    it('round-trips without drifting a day', () => {
      for (const value of ['2026-01-01', '2026-12-31', '2024-02-29']) {
        expect(fromPrismaDate(toPrismaDate(value))).toBe(value);
      }
    });

    it('pads single-digit months and days', () => {
      expect(fromPrismaDate(new Date(Date.UTC(2026, 0, 5)))).toBe('2026-01-05');
    });
  });

  describe('addDays', () => {
    it('adds within a month', () => {
      expect(addDays('2026-10-01', 30)).toBe('2026-10-31');
    });

    it('crosses a month boundary', () => {
      expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    });

    it('crosses a year boundary', () => {
      expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    });

    it('subtracts with a negative offset', () => {
      expect(addDays('2026-11-01', -1)).toBe('2026-10-31');
    });

    it('handles a leap day', () => {
      expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
      expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
    });

    it('skips Feb 29 in a non-leap year', () => {
      expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
    });

    it('walks back the full reminder ladder from an expiry', () => {
      // The 90/60/30/14/7 offsets the reminder engine will use later.
      expect(addDays('2026-10-31', -90)).toBe('2026-08-02');
      expect(addDays('2026-10-31', -60)).toBe('2026-09-01');
      expect(addDays('2026-10-31', -30)).toBe('2026-10-01');
      expect(addDays('2026-10-31', -14)).toBe('2026-10-17');
      expect(addDays('2026-10-31', -7)).toBe('2026-10-24');
    });
  });

  describe('differenceInDays', () => {
    it('is 0 for the same day', () => {
      expect(differenceInDays('2026-10-31', '2026-10-31')).toBe(0);
    });

    it('is positive when the target is later', () => {
      expect(differenceInDays('2026-10-01', '2026-10-31')).toBe(30);
    });

    it('is negative when the target is earlier', () => {
      expect(differenceInDays('2026-11-01', '2026-10-31')).toBe(-1);
    });

    it('spans a leap year correctly', () => {
      expect(differenceInDays('2024-02-28', '2024-03-01')).toBe(2);
      expect(differenceInDays('2025-02-28', '2025-03-01')).toBe(1);
    });

    it('spans a full year', () => {
      expect(differenceInDays('2026-01-01', '2027-01-01')).toBe(365);
    });

    it('is unaffected by DST transitions in the host timezone', () => {
      // Europe/London springs forward on 2026-03-29. Pure UTC arithmetic
      // must return 31, never 30.99 rounded down or 30.
      expect(differenceInDays('2026-03-01', '2026-04-01')).toBe(31);
    });
  });

  describe('todayIn', () => {
    it('resolves the Riyadh calendar day, not the UTC one', () => {
      // 22:30 UTC on 30 Oct is already 01:30 on 31 Oct in Riyadh (UTC+3).
      const instant = new Date('2026-10-30T22:30:00Z');
      expect(todayIn('Asia/Riyadh', instant)).toBe('2026-10-31');
      expect(todayIn('UTC', instant)).toBe('2026-10-30');
    });

    it('resolves the earlier calendar day in a negative-offset zone', () => {
      // 02:00 UTC on 31 Oct is still 22:00 on 30 Oct in New York.
      const instant = new Date('2026-10-31T02:00:00Z');
      expect(todayIn('Asia/Riyadh', instant)).toBe('2026-10-31');
      expect(todayIn('America/New_York', instant)).toBe('2026-10-30');
    });

    it('pads single-digit months and days', () => {
      expect(todayIn('UTC', new Date('2026-01-05T12:00:00Z'))).toBe(
        '2026-01-05',
      );
    });

    it('produces a value that isPlainDate accepts', () => {
      expect(isPlainDate(todayIn('Asia/Riyadh'))).toBe(true);
    });

    it('throws loudly on an unknown timezone rather than silently using UTC', () => {
      expect(() => todayIn('Mars/Olympus_Mons')).toThrow(
        /Unknown IANA timezone/,
      );
    });
  });
});
