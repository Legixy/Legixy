import {
  allRouteCopy,
  buildChecklist,
  isInRenewalWindow,
  proposedRenewalExpiry,
  routeGuidance,
  SubmissionRouteValue,
} from './renewal';
import { addDays } from './plain-date';

const TODAY = '2026-09-01';
const REQUIRED = [
  { code: 'lease', label: 'Lease contract', labelAr: 'عقد الإيجار' },
  { code: 'cd_cert', label: 'Civil Defence certificate', labelAr: 'شهادة' },
  { code: 'cr_copy', label: 'CR copy', labelAr: 'نسخة' },
];

const doc = (
  code: string | null,
  expiresOn: string | null,
  id = `doc_${code}`,
) => ({ id, documentCode: code, filename: `${code}.pdf`, expiresOn });

describe('renewal', () => {
  describe('buildChecklist', () => {
    it('resolves PRESENT for an in-date document', () => {
      const checklist = buildChecklist(
        REQUIRED,
        [doc('lease', addDays(TODAY, 200))],
        TODAY,
      );
      expect(checklist.find((i) => i.code === 'lease')).toMatchObject({
        state: 'PRESENT',
        filename: 'lease.pdf',
      });
    });

    it('resolves EXPIRED once expiresOn has passed', () => {
      const checklist = buildChecklist(
        REQUIRED,
        [doc('lease', addDays(TODAY, -1))],
        TODAY,
      );
      expect(checklist.find((i) => i.code === 'lease')?.state).toBe('EXPIRED');
    });

    it('treats the expiry day itself as still valid', () => {
      // Matches licence expiry semantics exactly: valid THROUGH the day.
      const checklist = buildChecklist(REQUIRED, [doc('lease', TODAY)], TODAY);
      expect(checklist.find((i) => i.code === 'lease')?.state).toBe('PRESENT');
    });

    it('resolves MISSING when nothing was uploaded', () => {
      const checklist = buildChecklist(REQUIRED, [], TODAY);
      expect(checklist.every((item) => item.state === 'MISSING')).toBe(true);
      expect(checklist.every((item) => item.documentId === null)).toBe(true);
    });

    it('treats a document with no expiry as PRESENT, not expired', () => {
      // A title deed or articles of association do not expire. Treating "no
      // date" as expired would manufacture work that does not exist.
      const checklist = buildChecklist(REQUIRED, [doc('cr_copy', null)], TODAY);
      expect(checklist.find((i) => i.code === 'cr_copy')?.state).toBe(
        'PRESENT',
      );
    });

    it('prefers the longest-lived document when several share a code', () => {
      const checklist = buildChecklist(
        REQUIRED,
        [
          doc('lease', addDays(TODAY, -30), 'old'),
          doc('lease', addDays(TODAY, 300), 'current'),
        ],
        TODAY,
      );
      const item = checklist.find((i) => i.code === 'lease');
      expect(item?.state).toBe('PRESENT');
      expect(item?.documentId).toBe('current');
    });

    it('ignores ad-hoc uploads that match no requirement', () => {
      const checklist = buildChecklist(
        REQUIRED,
        [doc(null, null, 'adhoc')],
        TODAY,
      );
      expect(checklist.every((item) => item.state === 'MISSING')).toBe(true);
    });

    it('returns one item per requirement, in order', () => {
      const checklist = buildChecklist(REQUIRED, [], TODAY);
      expect(checklist.map((i) => i.code)).toEqual([
        'lease',
        'cd_cert',
        'cr_copy',
      ]);
    });

    it('handles a licence type with no required documents', () => {
      expect(buildChecklist([], [doc('lease', null)], TODAY)).toEqual([]);
    });
  });

  describe('proposedRenewalExpiry — calendar months, not 30-day blocks', () => {
    it('adds a 12-month cycle to the same day of the month', () => {
      expect(proposedRenewalExpiry('2026-09-15', 12)).toBe('2027-09-15');
    });

    it('clamps a month-end date rather than overflowing', () => {
      // 31 Jan + 1 month is 28 Feb, not 3 March. Every registry does this.
      expect(proposedRenewalExpiry('2026-01-31', 1)).toBe('2026-02-28');
      expect(proposedRenewalExpiry('2024-01-31', 1)).toBe('2024-02-29'); // leap
      expect(proposedRenewalExpiry('2026-03-31', 1)).toBe('2026-04-30');
    });

    it('crosses a year boundary', () => {
      expect(proposedRenewalExpiry('2026-11-15', 3)).toBe('2027-02-15');
      expect(proposedRenewalExpiry('2026-12-31', 12)).toBe('2027-12-31');
    });

    it('handles a multi-year cycle', () => {
      expect(proposedRenewalExpiry('2026-06-30', 36)).toBe('2029-06-30');
      expect(proposedRenewalExpiry('2026-06-30', 24)).toBe('2028-06-30');
    });

    it('preserves 29 February only when the target year has one', () => {
      expect(proposedRenewalExpiry('2024-02-29', 12)).toBe('2025-02-28');
      expect(proposedRenewalExpiry('2024-02-29', 48)).toBe('2028-02-29');
    });

    it('returns null when there is nothing to compute from', () => {
      // Proposing a date we cannot justify is worse than proposing none.
      expect(proposedRenewalExpiry(null, 12)).toBeNull();
      expect(proposedRenewalExpiry('2026-09-15', null)).toBeNull();
      expect(proposedRenewalExpiry('2026-09-15', 0)).toBeNull();
    });
  });

  describe('isInRenewalWindow', () => {
    it('is true inside the window and false outside', () => {
      expect(isInRenewalWindow(addDays(TODAY, 90), TODAY, 90)).toBe(true);
      expect(isInRenewalWindow(addDays(TODAY, 91), TODAY, 90)).toBe(false);
    });

    it('is true for an already-expired licence — renewal is more urgent', () => {
      expect(isInRenewalWindow(addDays(TODAY, -30), TODAY, 90)).toBe(true);
    });

    it('is false for a licence with no expiry date', () => {
      expect(isInRenewalWindow(null, TODAY, 90)).toBe(false);
    });
  });

  describe('submission language — the promise this product must not break', () => {
    const ROUTES: SubmissionRouteValue[] = [
      'PREPARE_ONLY',
      'API_ELIGIBLE',
      'UNKNOWN',
    ];

    it('NO route claims this system submits, files or renews anything', () => {
      // No integration is active, no credentials exist, no partner
      // subscription is in place. Copy that implied otherwise would be the
      // single most damaging lie this product could tell.
      const forbidden = [
        /\bwe (will )?submit/i,
        /\bwe (will )?file/i,
        /\bwe (will )?renew/i,
        /\bautomatically submit/i,
        /\bsubmitted for you\b/i,
        /\bfiled for you\b/i,
        /\bon your behalf\b/i,
        /\bhandles? the submission\b/i,
      ];

      for (const copy of allRouteCopy()) {
        for (const pattern of forbidden) {
          expect({ copy, matched: pattern.test(copy) }).toEqual({
            copy,
            matched: false,
          });
        }
      }
    });

    it('every route states that a person submits', () => {
      for (const route of ROUTES) {
        expect(routeGuidance(route).humanSubmits).toBe(true);
      }
    });

    it('API_ELIGIBLE describes a possibility, never a live capability', () => {
      const { detail } = routeGuidance('API_ELIGIBLE');
      expect(detail).toMatch(/may become possible/i);
      expect(detail).toMatch(/not connected today/i);
      // And it still says a human does it.
      expect(detail).toMatch(/your team completes/i);
    });

    it('every route has non-empty copy and a safe fallback', () => {
      for (const route of ROUTES) {
        const guidance = routeGuidance(route);
        expect(guidance.headline.length).toBeGreaterThan(0);
        expect(guidance.detail.length).toBeGreaterThan(0);
      }
      // An unrecognised value must degrade to the most conservative route.
      expect(routeGuidance('SOMETHING_NEW' as SubmissionRouteValue)).toEqual(
        routeGuidance('PREPARE_ONLY'),
      );
    });
  });
});
