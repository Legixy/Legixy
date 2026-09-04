import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateLong,
  formatDueOn,
  formatRemaining,
  formatRemainingShort,
  formatSentAt,
  pluralLicences,
  reminderChannelLabel,
  reminderOffsetLabel,
  reminderPresentation,
  statusPresentation,
  summarisePhrase,
  summaryTone,
  toCalendarDate,
  timelineReminders,
  TONE_STYLES,
} from './format';
import type {
  LicenseExpiryStatus,
  LicenseReminder,
  ReminderStatus,
} from '@/lib/api';

/**
 * The API sends "@db.Date" values as ISO instants at midnight UTC.
 * These tests pin the one behaviour that would silently corrupt this product:
 * rendering a licence as expiring a day early because the viewer's machine
 * sits west of UTC.
 */
describe('date formatting is timezone-proof', () => {
  const MIDNIGHT_UTC = '2026-10-31T00:00:00.000Z';

  it('renders the stored calendar date, not the viewer-local one', () => {
    expect(formatDate(MIDNIGHT_UTC)).toBe('31 Oct 2026');
    expect(formatDateLong(MIDNIGHT_UTC)).toBe('31 October 2026');
  });

  it('does not shift the day for a machine west of UTC', () => {
    // Reproduces the classic bug: `new Date(iso).getDate()` in America/Los_Angeles
    // yields 30, because midnight UTC is 17:00 the previous day locally.
    const naiveLocalDay = new Date(MIDNIGHT_UTC).toLocaleDateString('en-GB', {
      timeZone: 'America/Los_Angeles',
      day: 'numeric',
    });
    expect(naiveLocalDay).toBe('30'); // the wrong answer
    expect(formatDate(MIDNIGHT_UTC)).toContain('31'); // ours is right
  });

  it('extracts the calendar date by slicing, never by constructing a Date', () => {
    expect(toCalendarDate(MIDNIGHT_UTC)).toBe('2026-10-31');
    expect(toCalendarDate(null)).toBeNull();
    expect(toCalendarDate(undefined)).toBeNull();
  });

  it('handles a leap day and a year boundary', () => {
    expect(formatDate('2024-02-29T00:00:00.000Z')).toBe('29 Feb 2024');
    expect(formatDate('2027-01-01T00:00:00.000Z')).toBe('1 Jan 2027');
  });

  it('shows a dash rather than "Invalid Date" for a missing expiry', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDateLong(null)).toBe('No expiry date');
  });
});

describe('formatRemaining', () => {
  it('never renders a negative number', () => {
    expect(formatRemaining(-6)).toBe('Expired 6 days ago');
    expect(formatRemaining(-1)).toBe('Expired yesterday');
    expect(formatRemaining(-365)).toBe('Expired 365 days ago');
  });

  it('treats the expiry day itself as not yet expired', () => {
    expect(formatRemaining(0)).toBe('Expires today');
  });

  it('uses the singular for one day', () => {
    expect(formatRemaining(1)).toBe('1 day remaining');
    expect(formatRemaining(2)).toBe('2 days remaining');
  });

  it('handles a licence with no expiry', () => {
    expect(formatRemaining(null)).toBe('No expiry');
  });

  it('has a compact form for table cells', () => {
    expect(formatRemainingShort(-6)).toBe('6d ago');
    expect(formatRemainingShort(0)).toBe('Today');
    expect(formatRemainingShort(14)).toBe('14d');
    expect(formatRemainingShort(null)).toBe('—');
  });
});

describe('status presentation', () => {
  const ALL: LicenseExpiryStatus[] = [
    'NO_EXPIRY',
    'ACTIVE',
    'EXPIRING_SOON',
    'CRITICAL',
    'EXPIRED',
  ];

  it('covers every status the API can return', () => {
    for (const status of ALL) {
      const presentation = statusPresentation(status);
      expect(presentation.label).toBeTruthy();
      expect(presentation.description).toBeTruthy();
      expect(TONE_STYLES[presentation.tone]).toBeDefined();
    }
  });

  it('reserves the critical tone for genuinely expired licences', () => {
    // The design rule: red means something has actually gone wrong, not that
    // a renewal is upcoming. A licence with 20 days left is amber, not red.
    expect(statusPresentation('EXPIRED').tone).toBe('critical');
    expect(statusPresentation('CRITICAL').tone).toBe('warning');
    expect(statusPresentation('EXPIRING_SOON').tone).not.toBe('critical');
    expect(statusPresentation('ACTIVE').tone).not.toBe('critical');
  });

  it('never labels a healthy licence with alarming language', () => {
    expect(statusPresentation('ACTIVE').label).toBe('Current');
    expect(statusPresentation('NO_EXPIRY').label).toBe('No expiry');
  });
});

describe('site rollup phrasing', () => {
  const summary = (over: Partial<Record<string, number>> = {}) => ({
    total: 0,
    active: 0,
    expiringSoon: 0,
    critical: 0,
    expired: 0,
    noExpiry: 0,
    needsAttention: 0,
    ...over,
  });

  it('states the all-clear positively rather than leaving it blank', () => {
    expect(summarisePhrase(summary({ total: 5, needsAttention: 0 }))).toBe(
      'All clear',
    );
  });

  it('pluralises the attention count', () => {
    expect(summarisePhrase(summary({ total: 5, needsAttention: 1 }))).toBe(
      '1 needs attention',
    );
    expect(summarisePhrase(summary({ total: 5, needsAttention: 3 }))).toBe(
      '3 need attention',
    );
  });

  it('distinguishes an empty site from a healthy one', () => {
    expect(summarisePhrase(summary({ total: 0 }))).toBe('No licences yet');
  });

  it('escalates tone by the worst status present', () => {
    expect(summaryTone(summary({ total: 3, expired: 1, critical: 2 }))).toBe(
      'critical',
    );
    expect(summaryTone(summary({ total: 3, critical: 1 }))).toBe('warning');
    expect(summaryTone(summary({ total: 3 }))).toBe('positive');
    expect(summaryTone(summary({ total: 0 }))).toBe('neutral');
  });

  it('pluralises licence counts', () => {
    expect(pluralLicences(1)).toBe('1 licence');
    expect(pluralLicences(0)).toBe('0 licences');
    expect(pluralLicences(12)).toBe('12 licences');
  });
});

describe('reminder presentation', () => {
  it('formats a plain YYYY-MM-DD due date without shifting the day', () => {
    // The server sends reminder dates as bare calendar dates, NOT ISO instants.
    // `new Date("2026-06-02")` parses as UTC midnight and then renders in local
    // time, which drops to 1 June west of UTC. formatDueOn must not do that.
    expect(formatDueOn('2026-06-02')).toBe('2 Jun 2026');
    expect(formatDueOn('2026-01-01')).toBe('1 Jan 2026');
    expect(formatDueOn('2024-02-29')).toBe('29 Feb 2024');
  });

  it('matches the hand-worked ladder for a 31 Aug 2026 expiry', () => {
    // Same dates asserted by the backend domain test, verified end to end.
    expect(formatDueOn('2026-06-02')).toBe('2 Jun 2026'); // 90 days
    expect(formatDueOn('2026-07-02')).toBe('2 Jul 2026'); // 60 days
    expect(formatDueOn('2026-08-01')).toBe('1 Aug 2026'); // 30 days
    expect(formatDueOn('2026-08-17')).toBe('17 Aug 2026'); // 14 days
    expect(formatDueOn('2026-08-24')).toBe('24 Aug 2026'); // 7 days
  });

  it('labels offsets in the client’s own phrasing', () => {
    expect(reminderOffsetLabel(90)).toBe('90 days before');
    expect(reminderOffsetLabel(7)).toBe('7 days before');
    expect(reminderOffsetLabel(1)).toBe('1 day before');
  });

  /**
   * REVISED IN THE DELIVERY SLICE — deliberately, not deleted.
   *
   * The old rule was "no status may mention delivery", correct while nothing
   * could send. Delivery exists now, so the rule is TIGHTENED rather than
   * dropped: only the one status that means a message actually went out may
   * claim so. Every other status must still describe an obligation.
   */
  it('only SENT is allowed to claim a message went out', () => {
    const notDelivered: ReminderStatus[] = [
      'PENDING',
      'CANCELLED',
      'SKIPPED',
      'UNDELIVERABLE',
      'FAILED',
    ];
    for (const status of notDelivered) {
      const { label, hint } = reminderPresentation(status);
      const text = `${label} ${hint ?? ''}`.toLowerCase();
      expect(text).not.toContain('email');
      expect(text).not.toContain('whatsapp');
      expect(text).not.toContain('sms');
      // "not sent"/"cannot be delivered" are fine; a bare claim of delivery is not.
      expect(text).not.toMatch(/(?<!not )\bsent\b/);
    }

    expect(reminderPresentation('SENT').label).toBe('Sent');
  });

  it('an undeliverable reminder says why, and never implies it was sent', () => {
    const { label, hint, tone } = reminderPresentation('UNDELIVERABLE');
    expect(label).toBe('No recipient');
    expect(hint?.toLowerCase()).toContain('nobody is assigned');
    expect(tone).toBe('warning');
  });

  it('a failed delivery is visible, not silent', () => {
    const { label, tone } = reminderPresentation('FAILED');
    expect(label).toBe('Delivery failed');
    expect(tone).toBe('critical');
  });

  it('a channel label is rendered only for a real channel', () => {
    expect(reminderChannelLabel('EMAIL')).toBe('by email');
    // Nothing delivered → nothing to claim about a channel.
    expect(reminderChannelLabel(null)).toBeNull();
  });

  it('a send timestamp is rendered only when one exists', () => {
    expect(formatSentAt(null)).toBeNull();
    expect(formatSentAt('2026-09-07T08:00:00.000Z')).toContain('2026');
  });

  it('describes a pending obligation as scheduled, not as sent', () => {
    expect(reminderPresentation('PENDING').label).toBe('Scheduled');
  });

  it('explains why a window was skipped or superseded', () => {
    expect(reminderPresentation('SKIPPED').hint).toBeTruthy();
    expect(reminderPresentation('CANCELLED').hint).toBeTruthy();
  });

  it('covers every reminder status the API can return', () => {
    const statuses: ReminderStatus[] = [
      'PENDING',
      'SENT',
      'CANCELLED',
      'SKIPPED',
    ];
    for (const status of statuses) {
      const presentation = reminderPresentation(status);
      expect(presentation.label).toBeTruthy();
      expect(TONE_STYLES[presentation.tone]).toBeDefined();
    }
  });
});

describe('coverage gaps are never presented as an expiry state', () => {
  /**
   * A gap is an ABSENCE — we hold no record. An expired licence EXISTS and has
   * lapsed. Conflating them would tell the client a licence had expired when
   * the truth is the system has never seen one, which is both more alarming and
   * simply false.
   *
   * The status vocabulary must therefore contain no absence language, and the
   * gap vocabulary no expiry language.
   */
  it('the expiry status vocabulary contains no absence language', () => {
    const statuses: LicenseExpiryStatus[] = [
      'NO_EXPIRY',
      'ACTIVE',
      'EXPIRING_SOON',
      'CRITICAL',
      'EXPIRED',
    ];
    for (const status of statuses) {
      const { label, description } = statusPresentation(status);
      const text = `${label} ${description}`.toLowerCase();
      expect(text).not.toContain('missing');
      expect(text).not.toContain('not recorded');
      expect(text).not.toContain('gap');
    }
  });

  it('NO_EXPIRY means "no end date", not "no licence"', () => {
    // The one status that could be misread as an absence. Its wording must be
    // about the date, not about the existence of the licence.
    const { label, description } = statusPresentation('NO_EXPIRY');
    expect(label).toBe('No expiry');
    expect(description.toLowerCase()).toContain('no expiry date');
  });
});

describe('timelineReminders — one entry per offset', () => {
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

  it('drops CANCELLED rows, which are superseded by a live one', () => {
    // The exact defect: a licence rendered two "7 days before" entries with
    // contradictory dates after its expiry moved.
    const result = timelineReminders([
      row(7, '2026-09-07', 'CANCELLED'),
      row(7, '2026-09-08', 'PENDING'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ dueOn: '2026-09-08', status: 'PENDING' });
  });

  it('keeps a SENT row even when a later row exists for the same offset', () => {
    // A delivery that actually reached someone is the most important fact
    // about that offset and must never be hidden behind a reschedule.
    const result = timelineReminders([
      row(30, '2026-08-01', 'SENT', { sentAt: '2026-08-01T09:00:00.000Z' }),
      row(30, '2026-09-01', 'PENDING'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('SENT');
  });

  it('prefers the latest date among rows of equal standing', () => {
    // Two SKIPPED rows for one offset is a real residual: both describe past
    // windows, and the newer belongs to the current expiry.
    const result = timelineReminders([
      row(90, '2026-06-01', 'SKIPPED'),
      row(90, '2026-07-15', 'SKIPPED'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].dueOn).toBe('2026-07-15');
  });

  it('returns exactly one entry per offset for a full ladder', () => {
    const result = timelineReminders([
      row(90, '2026-06-17', 'SKIPPED'),
      row(60, '2026-07-17', 'SKIPPED'),
      row(30, '2026-08-16', 'SKIPPED'),
      row(14, '2026-09-01', 'PENDING'),
      row(7, '2026-09-07', 'CANCELLED'),
      row(7, '2026-09-08', 'PENDING'),
    ]);

    expect(result.map((r) => r.offsetDays)).toEqual([90, 60, 30, 14, 7]);
    expect(new Set(result.map((r) => r.offsetDays)).size).toBe(result.length);
  });

  it('orders largest offset first, matching when the dates occur', () => {
    const result = timelineReminders([
      row(7, '2026-09-08', 'PENDING'),
      row(90, '2026-06-17', 'SKIPPED'),
      row(30, '2026-08-16', 'SKIPPED'),
    ]);

    expect(result.map((r) => r.offsetDays)).toEqual([90, 30, 7]);
  });

  it('returns nothing when every row is cancelled', () => {
    // The caller renders its empty state rather than an empty list.
    expect(timelineReminders([row(7, '2026-09-07', 'CANCELLED')])).toEqual([]);
  });

  it('handles an empty schedule', () => {
    expect(timelineReminders([])).toEqual([]);
  });

  it('never invents or mutates a row', () => {
    const original = row(14, '2026-09-01', 'PENDING');
    const result = timelineReminders([original]);

    expect(result[0]).toBe(original);
  });
});
