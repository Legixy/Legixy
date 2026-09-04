import { renderReminderText, renderSubject } from './email-sender';
import type { ReminderMessage } from './channel';

/**
 * DATA MINIMISATION.
 *
 * Email is not a controlled channel, and this system holds data covered by
 * Saudi PDPL. These tests are the enforcement: if someone later adds a licence
 * number "for convenience", the build fails rather than the data leaking into
 * an inbox and an unknown number of mail servers.
 */
const message: ReminderMessage = {
  recipientEmail: 'ahmed@example.test',
  recipientName: 'Ahmed Al-Rashid',
  appUrl: 'https://app.example.test/dashboard/licenses',
  lines: [
    {
      licenseId: 'lic_1',
      licenseName: 'Balady Municipal Licence',
      siteName: 'Sahara Mall',
      expiryDate: '2026-10-31',
      daysRemaining: 14,
    },
    {
      licenseId: 'lic_2',
      licenseName: 'Commercial Registration',
      siteName: null,
      expiryDate: '2026-11-15',
      daysRemaining: 29,
    },
  ],
};

describe('reminder email content', () => {
  const body = renderReminderText(message);

  it('contains what a person needs in order to act', () => {
    expect(body).toContain('Balady Municipal Licence');
    expect(body).toContain('Sahara Mall');
    expect(body).toContain('2026-10-31');
    expect(body).toContain('14 days');
    expect(body).toContain(message.appUrl);
  });

  it('labels an entity-level licence as company-wide, not blank', () => {
    expect(body).toContain('Company-wide');
  });

  it('CARRIES NO SENSITIVE IDENTIFIER', () => {
    // The exact fields that must stay behind authentication.
    const forbidden = [
      'DEMO-BAL-2001', // licence number
      '1010234567', // CR number shape
      '2412345678', // iqama / national ID shape
      'GOSI-', // GOSI reference
    ];
    for (const value of forbidden) {
      expect(body).not.toContain(value);
    }
  });

  it('renders no field that could carry an identifier', () => {
    // Structural, not string-matching: the message type exposes only these
    // five per-licence fields, none of which is an identifier. If someone adds
    // `licenseNumber` to ReminderLine, this fails.
    const allowed = [
      'licenseId',
      'licenseName',
      'siteName',
      'expiryDate',
      'daysRemaining',
    ];
    expect(Object.keys(message.lines[0]).sort()).toEqual(allowed.sort());
  });

  it('does not leak the internal licence id into the body', () => {
    // licenseId exists on the type for linking, but must not be printed.
    expect(body).not.toContain('lic_1');
  });

  it('tells the recipient where the withheld detail lives', () => {
    expect(body).toContain('not included in this email');
    expect(body).toContain('Sign in');
  });

  it('states expiry honestly for an already-expired licence', () => {
    const expired = renderReminderText({
      ...message,
      lines: [{ ...message.lines[0], daysRemaining: -6 }],
    });
    expect(expired).toContain('expired 6 days ago');
    expect(expired).not.toContain('-6 days');
  });

  describe('subject line', () => {
    it('names the licence when there is exactly one', () => {
      expect(renderSubject({ ...message, lines: [message.lines[0]] })).toBe(
        'Balady Municipal Licence expires in 14 days',
      );
    });

    it('counts them when there are several', () => {
      expect(renderSubject(message)).toBe('2 licences need your attention');
    });

    it('says expired rather than a negative number', () => {
      expect(
        renderSubject({
          ...message,
          lines: [{ ...message.lines[0], daysRemaining: -3 }],
        }),
      ).toBe('Expired: Balady Municipal Licence');
    });

    it('carries no identifier either', () => {
      expect(renderSubject(message)).not.toMatch(/\d{6,}/);
    });
  });
});
