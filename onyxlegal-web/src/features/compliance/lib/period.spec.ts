import { afterEach, describe, expect, it } from 'vitest';
import {
  PRIOR_PERIOD_COPY,
  splitTimelineByPeriod,
  timelineReminders,
} from './format';
import { findHonestyViolations } from './honesty';
import type { LicenseReminder, ReminderStatus } from '@/lib/api';

const row = (
  offsetDays: number,
  dueOn: string,
  status: ReminderStatus,
  extra: Partial<LicenseReminder> = {},
): LicenseReminder => ({
  id: `${offsetDays}-${dueOn}-${status}`,
  offsetDays,
  dueOn,
  status,
  sentAt: null,
  channel: null,
  attemptCount: 0,
  lastError: null,
  ...extra,
});

describe('renewal periods', () => {
  describe('with NO completed renewal — Slice 8 behaviour, unchanged', () => {
    const reminders = [
      row(30, '2026-08-01', 'SENT', { sentAt: '2026-08-01T09:00:00.000Z' }),
      row(30, '2026-09-01', 'PENDING'),
      row(14, '2026-09-10', 'PENDING'),
    ];

    it('still prefers a SENT row over a later PENDING for the same offset', () => {
      // The rule exists so a delivery that genuinely reached someone is never
      // hidden behind a RESCHEDULE. That case is untouched.
      const { current, prior } = splitTimelineByPeriod(reminders, null);
      const at30 = current.find((r) => r.offsetDays === 30);

      expect(at30?.status).toBe('SENT');
      expect(prior).toEqual([]);
    });

    it('returns exactly what timelineReminders returns', () => {
      expect(splitTimelineByPeriod(reminders, null).current).toEqual(
        timelineReminders(reminders),
      );
    });
  });

  describe('with a completed renewal', () => {
    const periodStart = '2026-09-20';
    const reminders = [
      // Previous period.
      row(30, '2026-08-01', 'SENT', { sentAt: '2026-08-01T09:00:00.000Z' }),
      row(14, '2026-09-01', 'SENT', { sentAt: '2026-09-01T09:00:00.000Z' }),
      row(90, '2026-06-17', 'SKIPPED'),
      // Current period, against the new expiry.
      row(90, '2027-06-22', 'PENDING'),
      row(60, '2027-07-22', 'PENDING'),
      row(30, '2027-08-21', 'PENDING'),
      row(14, '2027-09-06', 'PENDING'),
      row(7, '2027-09-13', 'PENDING'),
    ];

    it('drops pre-boundary reminders from the current ladder', () => {
      // The Slice 11 defect: a "14 days before" delivery from September 2026
      // sat among a 2027 schedule, reading as though the 2027 reminder had
      // already gone out.
      const { current } = splitTimelineByPeriod(reminders, periodStart);

      expect(current.every((r) => r.dueOn >= periodStart)).toBe(true);
      expect(current.find((r) => r.offsetDays === 14)?.dueOn).toBe('2027-09-06');
      expect(current.find((r) => r.offsetDays === 14)?.status).toBe('PENDING');
    });

    it('shows exactly one entry per offset', () => {
      const { current } = splitTimelineByPeriod(reminders, periodStart);
      const offsets = current.map((r) => r.offsetDays);
      expect(offsets).toEqual([90, 60, 30, 14, 7]);
      expect(new Set(offsets).size).toBe(offsets.length);
    });

    it('KEEPS the prior reminders — they are evidence, not clutter', () => {
      const { prior } = splitTimelineByPeriod(reminders, periodStart);

      expect(prior).toHaveLength(3);
      // Nothing invented, nothing removed.
      expect(prior.filter((r) => r.status === 'SENT')).toHaveLength(2);
      expect(prior.some((r) => r.status === 'SKIPPED')).toBe(true);
    });

    it('never rewrites a SENT or SKIPPED row', () => {
      const { current, prior } = splitTimelineByPeriod(reminders, periodStart);
      const all = [...current, ...prior];
      const sent = all.filter((r) => r.status === 'SENT');

      expect(sent).toHaveLength(2);
      for (const reminder of sent) expect(reminder.sentAt).not.toBeNull();
      expect(all.some((r) => r.status === 'SKIPPED')).toBe(true);
    });

    it('orders prior reminders newest first', () => {
      const { prior } = splitTimelineByPeriod(reminders, periodStart);
      expect(prior.map((r) => r.dueOn)).toEqual([
        '2026-09-01',
        '2026-08-01',
        '2026-06-17',
      ]);
    });

    it('keeps CANCELLED rows out of the history view too', () => {
      // Superseded, not delivered — so not evidence of anything.
      const { prior } = splitTimelineByPeriod(
        [...reminders, row(7, '2026-09-07', 'CANCELLED')],
        periodStart,
      );
      expect(prior.some((r) => r.status === 'CANCELLED')).toBe(false);
    });
  });

  describe('two successive renewals', () => {
    it('scopes to the MOST RECENT boundary', () => {
      const reminders = [
        row(30, '2026-08-01', 'SENT'),   // period 1
        row(30, '2027-08-21', 'SENT'),   // period 2
        row(30, '2028-08-20', 'PENDING'), // period 3, current
      ];
      const { current, prior } = splitTimelineByPeriod(reminders, '2028-01-15');

      expect(current).toHaveLength(1);
      expect(current[0].dueOn).toBe('2028-08-20');
      expect(prior).toHaveLength(2);
    });
  });

  describe('a renewal CLOSED without completing creates no boundary', () => {
    it('is indistinguishable from never having renewed', () => {
      // findPeriodStart only looks at COMPLETED renewals, so the client is
      // handed null and Slice 8 governs.
      const reminders = [row(30, '2026-08-01', 'SENT'), row(30, '2026-09-01', 'PENDING')];
      expect(splitTimelineByPeriod(reminders, null)).toEqual({
        current: timelineReminders(reminders),
        prior: [],
      });
    });
  });

  describe('timezone stability', () => {
    const ZONES = [
      'UTC',
      'Asia/Riyadh',
      'Asia/Kolkata',
      'Pacific/Kiritimati',
      'America/Los_Angeles',
      'Pacific/Niue',
    ];
    const ORIGINAL_TZ = process.env.TZ;

    afterEach(() => {
      process.env.TZ = ORIGINAL_TZ;
    });

    it.each(ZONES)('splits identically under TZ=%s', (zone) => {
      // The comparison is string-on-string between calendar dates, and the
      // boundary is computed server-side in the TENANT's zone. Neither depends
      // on the machine running this code — which is the whole point, after
      // four date-boundary bugs.
      process.env.TZ = zone;
      const reminders = [
        row(30, '2026-12-31', 'SENT'),
        row(30, '2027-01-01', 'PENDING'),
      ];
      const { current, prior } = splitTimelineByPeriod(reminders, '2027-01-01');

      expect({ zone, current: current.map((r) => r.dueOn) }).toEqual({
        zone,
        current: ['2027-01-01'],
      });
      expect({ zone, prior: prior.map((r) => r.dueOn) }).toEqual({
        zone,
        prior: ['2026-12-31'],
      });
    });

    it.each(ZONES)('treats the boundary day itself as CURRENT under TZ=%s', (zone) => {
      process.env.TZ = zone;
      const { current } = splitTimelineByPeriod(
        [row(30, '2027-03-15', 'PENDING')],
        '2027-03-15',
      );
      expect({ zone, len: current.length }).toEqual({ zone, len: 1 });
    });
  });

  describe('honesty of the period copy', () => {
    it('is clean under all six rules', () => {
      const strings = [
        PRIOR_PERIOD_COPY.summary(1),
        PRIOR_PERIOD_COPY.summary(4),
        PRIOR_PERIOD_COPY.hint('20 September 2026'),
      ];
      expect(strings.flatMap(findHonestyViolations)).toEqual([]);
    });

    it('says plainly that these predate the renewal', () => {
      expect(PRIOR_PERIOD_COPY.summary(3)).toMatch(/before this licence was renewed/i);
      expect(PRIOR_PERIOD_COPY.hint('20 September 2026')).toMatch(/kept as a record/i);
    });
  });
});
