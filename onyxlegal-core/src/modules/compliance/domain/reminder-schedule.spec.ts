import { REMINDER_OFFSET_DAYS } from './compliance.constants';
import { buildReminderSchedule, obligationKey } from './reminder-schedule';
import { addDays } from './plain-date';

const TODAY = '2026-09-01';

describe('reminder-schedule', () => {
  describe('buildReminderSchedule', () => {
    it('produces exactly one obligation per configured offset', () => {
      const schedule = buildReminderSchedule('2026-12-31', TODAY);
      expect(schedule).toHaveLength(REMINDER_OFFSET_DAYS.length);
      expect(schedule).toHaveLength(5);
    });

    it('uses the offsets the client specified, furthest out first', () => {
      const schedule = buildReminderSchedule('2026-12-31', TODAY);
      expect(schedule.map((o) => o.offsetDays)).toEqual([90, 60, 30, 14, 7]);
    });

    it('dates every offset back from the expiry', () => {
      // Worked by hand from 2026-08-31 so a wrong sign or an off-by-one shows.
      const schedule = buildReminderSchedule('2026-08-31', '2026-01-01');
      expect(schedule).toEqual([
        { offsetDays: 90, dueOn: '2026-06-02', alreadyPassed: false },
        { offsetDays: 60, dueOn: '2026-07-02', alreadyPassed: false },
        { offsetDays: 30, dueOn: '2026-08-01', alreadyPassed: false },
        { offsetDays: 14, dueOn: '2026-08-17', alreadyPassed: false },
        { offsetDays: 7, dueOn: '2026-08-24', alreadyPassed: false },
      ]);
    });

    it('returns no obligations for a licence that never expires', () => {
      expect(buildReminderSchedule(null, TODAY)).toEqual([]);
    });

    it('marks windows that had already passed at generation time', () => {
      // Entered 45 days before expiry: the 90 and 60 day windows are gone.
      const expiry = addDays(TODAY, 45);
      const schedule = buildReminderSchedule(expiry, TODAY);

      const passed = schedule.filter((o) => o.alreadyPassed);
      expect(passed.map((o) => o.offsetDays)).toEqual([90, 60]);

      const live = schedule.filter((o) => !o.alreadyPassed);
      expect(live.map((o) => o.offsetDays)).toEqual([30, 14, 7]);
    });

    it('treats an obligation due today as still actionable', () => {
      // Expiry in exactly 30 days → the 30-day reminder is due today.
      const schedule = buildReminderSchedule(addDays(TODAY, 30), TODAY);
      const thirtyDay = schedule.find((o) => o.offsetDays === 30);
      expect(thirtyDay?.dueOn).toBe(TODAY);
      expect(thirtyDay?.alreadyPassed).toBe(false);
    });

    it('marks every window passed for an already-expired licence', () => {
      const schedule = buildReminderSchedule(addDays(TODAY, -10), TODAY);
      expect(schedule.every((o) => o.alreadyPassed)).toBe(true);
    });

    it('is deterministic — same inputs, identical output', () => {
      const first = buildReminderSchedule('2026-12-31', TODAY);
      const second = buildReminderSchedule('2026-12-31', TODAY);
      expect(first).toEqual(second);
    });

    it('crosses month and year boundaries without drifting', () => {
      const schedule = buildReminderSchedule('2027-01-05', '2026-01-01');
      expect(schedule.find((o) => o.offsetDays === 7)?.dueOn).toBe(
        '2026-12-29',
      );
      expect(schedule.find((o) => o.offsetDays === 30)?.dueOn).toBe(
        '2026-12-06',
      );
    });

    it('handles a leap year correctly', () => {
      // 2024-03-01 minus 7 days lands on 2024-02-23 only if 29 Feb exists.
      const schedule = buildReminderSchedule('2024-03-01', '2024-01-01');
      expect(schedule.find((o) => o.offsetDays === 7)?.dueOn).toBe(
        '2024-02-23',
      );
    });

    it('never depends on the host clock', () => {
      // `today` is a parameter; no Date.now() reachable from this function.
      // Same expiry assessed from two different "todays" yields identical dates.
      const a = buildReminderSchedule('2026-12-31', '2020-01-01');
      const b = buildReminderSchedule('2026-12-31', '2026-06-15');
      expect(a.map((o) => o.dueOn)).toEqual(b.map((o) => o.dueOn));
    });
  });

  describe('obligationKey', () => {
    it('is stable and distinguishes offset and date', () => {
      expect(obligationKey(90, '2026-06-02')).toBe('90:2026-06-02');
      expect(obligationKey(90, '2026-06-02')).not.toBe(
        obligationKey(60, '2026-06-02'),
      );
      expect(obligationKey(90, '2026-06-02')).not.toBe(
        obligationKey(90, '2026-06-03'),
      );
    });
  });
});
