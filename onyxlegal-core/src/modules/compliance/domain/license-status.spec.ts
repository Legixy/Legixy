import {
  CRITICAL_WINDOW_DAYS,
  REMINDER_OFFSET_DAYS,
  WARNING_WINDOW_DAYS,
} from './compliance.constants';
import {
  assessExpiry,
  expiryStatusBounds,
  needsAttention,
  needsAttentionBounds,
  summariseLicenses,
} from './license-status';
import { addDays } from './plain-date';

const TODAY = '2026-10-31';

/** Readable helper: a date exactly N days from TODAY. */
const inDays = (n: number) => addDays(TODAY, n);

describe('license-status', () => {
  describe('assessExpiry', () => {
    it('returns NO_EXPIRY for a licence with no expiry date', () => {
      expect(assessExpiry(null, TODAY)).toEqual({
        status: 'NO_EXPIRY',
        daysUntilExpiry: null,
      });
    });

    describe('boundaries — the cases that actually break in production', () => {
      it('expires TODAY → CRITICAL, not EXPIRED (valid through the whole day)', () => {
        expect(assessExpiry(TODAY, TODAY)).toEqual({
          status: 'CRITICAL',
          daysUntilExpiry: 0,
        });
      });

      it('expired YESTERDAY → EXPIRED with a negative day count', () => {
        expect(assessExpiry(inDays(-1), TODAY)).toEqual({
          status: 'EXPIRED',
          daysUntilExpiry: -1,
        });
      });

      it('exactly at the critical window → CRITICAL', () => {
        expect(assessExpiry(inDays(CRITICAL_WINDOW_DAYS), TODAY).status).toBe(
          'CRITICAL',
        );
      });

      it('one day past the critical window → EXPIRING_SOON', () => {
        expect(
          assessExpiry(inDays(CRITICAL_WINDOW_DAYS + 1), TODAY).status,
        ).toBe('EXPIRING_SOON');
      });

      it('exactly at the warning window → EXPIRING_SOON', () => {
        expect(assessExpiry(inDays(WARNING_WINDOW_DAYS), TODAY).status).toBe(
          'EXPIRING_SOON',
        );
      });

      it('one day past the warning window → ACTIVE', () => {
        expect(
          assessExpiry(inDays(WARNING_WINDOW_DAYS + 1), TODAY).status,
        ).toBe('ACTIVE');
      });
    });

    it.each([
      [-365, 'EXPIRED'],
      [-1, 'EXPIRED'],
      [0, 'CRITICAL'],
      [1, 'CRITICAL'],
      [14, 'CRITICAL'],
      [30, 'CRITICAL'],
      [31, 'EXPIRING_SOON'],
      [60, 'EXPIRING_SOON'],
      [90, 'EXPIRING_SOON'],
      [91, 'ACTIVE'],
      [365, 'ACTIVE'],
    ])('%i days from today → %s', (offset, expected) => {
      expect(assessExpiry(inDays(offset), TODAY).status).toBe(expected);
    });

    it('reports the exact day count, not a bucket', () => {
      expect(assessExpiry(inDays(47), TODAY).daysUntilExpiry).toBe(47);
      expect(assessExpiry(inDays(-6), TODAY).daysUntilExpiry).toBe(-6);
    });

    it('is stable across a month boundary', () => {
      // 2026-11-01 is one day after TODAY despite being a new month.
      expect(assessExpiry('2026-11-01', TODAY)).toEqual({
        status: 'CRITICAL',
        daysUntilExpiry: 1,
      });
    });

    it('is stable across a leap day', () => {
      expect(assessExpiry('2024-03-01', '2024-02-28').daysUntilExpiry).toBe(2);
    });

    it('is a pure function — same inputs, same output, no clock dependency', () => {
      const first = assessExpiry('2026-12-25', TODAY);
      const second = assessExpiry('2026-12-25', TODAY);
      expect(first).toEqual(second);
      expect(first.daysUntilExpiry).toBe(55);
    });
  });

  describe('needsAttention', () => {
    it.each([
      ['EXPIRED', true],
      ['CRITICAL', true],
      ['EXPIRING_SOON', false],
      ['ACTIVE', false],
      ['NO_EXPIRY', false],
    ] as const)('%s → %s', (status, expected) => {
      expect(needsAttention(status)).toBe(expected);
    });
  });

  describe('threshold configuration', () => {
    it('derives the status windows from the client reminder ladder', () => {
      // Guards the intent documented in compliance.constants.ts: the status
      // bands are not independent numbers, they are rungs of the ladder.
      // If someone changes one without the other, this fails.
      expect(WARNING_WINDOW_DAYS).toBe(Math.max(...REMINDER_OFFSET_DAYS));
      expect(REMINDER_OFFSET_DAYS).toContain(CRITICAL_WINDOW_DAYS);
    });

    it('keeps the ladder ordered from furthest to nearest', () => {
      const ladder = [...REMINDER_OFFSET_DAYS];
      expect(ladder).toEqual([...ladder].sort((a, b) => b - a));
    });
  });
});

describe('summariseLicenses', () => {
  const TODAY_S = '2026-10-31';
  const at = (n: number) => addDays(TODAY_S, n);

  it('returns an all-zero summary for no licences', () => {
    expect(summariseLicenses([], TODAY_S)).toEqual({
      total: 0,
      active: 0,
      expiringSoon: 0,
      critical: 0,
      expired: 0,
      noExpiry: 0,
      needsAttention: 0,
    });
  });

  it('counts every status band', () => {
    const summary = summariseLicenses(
      [at(-10), at(0), at(20), at(45), at(200), null],
      TODAY_S,
    );
    expect(summary).toEqual({
      total: 6,
      expired: 1, // -10
      critical: 2, //   0, 20
      expiringSoon: 1, // 45
      active: 1, //     200
      noExpiry: 1, //   null
      needsAttention: 3, // expired + critical
    });
  });

  it('treats needsAttention as exactly expired + critical', () => {
    const summary = summariseLicenses(
      [at(-1), at(5), at(60), at(400)],
      TODAY_S,
    );
    expect(summary.needsAttention).toBe(summary.expired + summary.critical);
    expect(summary.needsAttention).toBe(2);
  });

  it('reports all clear when nothing needs attention', () => {
    const summary = summariseLicenses([at(120), at(365), null], TODAY_S);
    expect(summary.needsAttention).toBe(0);
  });

  it('agrees with assessExpiry for every licence it counts', () => {
    // Guards the single-source-of-truth property: a site rollup can never
    // disagree with the badges on its own licence rows.
    const dates = [at(-3), at(0), at(31), at(91), null];
    const expected = dates.map((d) => assessExpiry(d, TODAY_S).status);
    const summary = summariseLicenses(dates, TODAY_S);

    expect(summary.expired).toBe(
      expected.filter((s) => s === 'EXPIRED').length,
    );
    expect(summary.critical).toBe(
      expected.filter((s) => s === 'CRITICAL').length,
    );
    expect(summary.expiringSoon).toBe(
      expected.filter((s) => s === 'EXPIRING_SOON').length,
    );
    expect(summary.active).toBe(expected.filter((s) => s === 'ACTIVE').length);
    expect(summary.noExpiry).toBe(
      expected.filter((s) => s === 'NO_EXPIRY').length,
    );
  });
});

describe('expiryStatusBounds — status as a database predicate', () => {
  const TODAY_B = '2026-09-01';

  /**
   * The critical property: the SQL predicate and `assessExpiry` must select
   * exactly the same licences. Two implementations of one rule is precisely how
   * a filtered list and its badge drift apart, so this is asserted across a
   * wide span of offsets rather than assumed.
   */
  it('agrees with assessExpiry for every offset from -400 to +400 days', () => {
    const statuses = [
      'EXPIRED',
      'CRITICAL',
      'EXPIRING_SOON',
      'ACTIVE',
    ] as const;

    for (let offset = -400; offset <= 400; offset += 1) {
      const expiry = addDays(TODAY_B, offset);
      const actual = assessExpiry(expiry, TODAY_B).status;

      for (const status of statuses) {
        const bounds = expiryStatusBounds(status, TODAY_B);
        const withinLower = !bounds.gte || expiry >= bounds.gte;
        const withinUpper = !bounds.lte || expiry <= bounds.lte;
        const selectedByBounds = withinLower && withinUpper;

        expect({ offset, status, selectedByBounds }).toEqual({
          offset,
          status,
          selectedByBounds: actual === status,
        });
      }
    }
  });

  it('selects null expiry only for NO_EXPIRY', () => {
    expect(expiryStatusBounds('NO_EXPIRY', TODAY_B)).toEqual({ isNull: true });
    for (const status of [
      'EXPIRED',
      'CRITICAL',
      'EXPIRING_SOON',
      'ACTIVE',
    ] as const) {
      expect(expiryStatusBounds(status, TODAY_B).isNull).toBeUndefined();
    }
  });

  it('uses inclusive bounds with no gap or overlap between bands', () => {
    const critical = expiryStatusBounds('CRITICAL', TODAY_B);
    const soon = expiryStatusBounds('EXPIRING_SOON', TODAY_B);
    const active = expiryStatusBounds('ACTIVE', TODAY_B);
    const expired = expiryStatusBounds('EXPIRED', TODAY_B);

    // Each band starts the day after the previous one ends.
    expect(addDays(expired.lte!, 1)).toBe(critical.gte);
    expect(addDays(critical.lte!, 1)).toBe(soon.gte);
    expect(addDays(soon.lte!, 1)).toBe(active.gte);
  });

  it('needsAttention covers exactly EXPIRED plus CRITICAL', () => {
    const bounds = needsAttentionBounds(TODAY_B);
    for (let offset = -100; offset <= 200; offset += 1) {
      const expiry = addDays(TODAY_B, offset);
      const status = assessExpiry(expiry, TODAY_B).status;
      const selected = !bounds.lte || expiry <= bounds.lte;
      expect({ offset, selected }).toEqual({
        offset,
        selected: status === 'EXPIRED' || status === 'CRITICAL',
      });
    }
  });
});
