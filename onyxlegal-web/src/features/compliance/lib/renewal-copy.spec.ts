import { describe, expect, it } from 'vitest';
import type { ChecklistState, SubmissionRoute } from '@/lib/api';
import {
  allFrontendRenewalCopy,
  checklistPresentation,
  checklistSummary,
  containsSubmissionClaim,
  DOCUMENT_COPY,
  FALLBACK_GUIDANCE_DETAIL,
  portalLinkLabel,
  routeBadge,
  safeGuidanceDetail,
  SUBMISSION_CLAIM_PATTERNS,
} from './renewal-copy';

const ROUTES: SubmissionRoute[] = ['PREPARE_ONLY', 'API_ELIGIBLE', 'UNKNOWN'];
const STATES: ChecklistState[] = ['PRESENT', 'EXPIRED', 'MISSING'];

describe('renewal copy — the promise this product must not break', () => {
  describe('containsSubmissionClaim', () => {
    // Proves the detector is not vacuous. Without this, a broken regex would
    // make every assertion below pass while catching nothing.
    it.each([
      'We submit this renewal for you.',
      'We will file it with Balady.',
      'Renewed for you automatically.',
      'We handle the submission on your behalf.',
      'One-click renewal.',
      'Automatic filing to the authority.',
      'We’ll submit it when the documents are ready.',
    ])('flags %j', (bad) => {
      expect(containsSubmissionClaim(bad)).toBe(true);
    });

    it.each([
      'Your team completes the renewal on the authority’s portal.',
      'Everything needed is gathered here.',
      'This authority runs a partner programme. Nothing is connected today.',
      'Open the Balady portal',
    ])('does not flag the honest phrasing %j', (good) => {
      expect(containsSubmissionClaim(good)).toBe(false);
    });
  });

  it('NO frontend-authored string claims this system submits anything', () => {
    const offenders = allFrontendRenewalCopy().filter((copy) =>
      containsSubmissionClaim(copy),
    );
    expect(offenders).toEqual([]);
  });

  it('every frontend-authored string is non-empty', () => {
    // A blank label would silently remove the very disclosure being tested.
    for (const copy of allFrontendRenewalCopy()) {
      expect(copy.trim().length).toBeGreaterThan(0);
    }
  });

  describe('safeGuidanceDetail — the second, independent guard', () => {
    it('passes honest server copy through unchanged', () => {
      const honest =
        'Someone from your team completes the renewal on the portal.';
      expect(safeGuidanceDetail(honest)).toBe(honest);
    });

    it('REFUSES to render server copy that claims submission', () => {
      // If a future backend change ever let this through, the browser is the
      // last thing standing between the claim and the client.
      expect(safeGuidanceDetail('We submit this on your behalf.')).toBe(
        FALLBACK_GUIDANCE_DETAIL,
      );
    });

    it('falls back when the server sends nothing at all', () => {
      expect(safeGuidanceDetail(null)).toBe(FALLBACK_GUIDANCE_DETAIL);
      expect(safeGuidanceDetail('')).toBe(FALLBACK_GUIDANCE_DETAIL);
    });

    it('its own fallback is clean under the same rule', () => {
      expect(containsSubmissionClaim(FALLBACK_GUIDANCE_DETAIL)).toBe(false);
      expect(FALLBACK_GUIDANCE_DETAIL).toMatch(/does not file anything for you/);
    });
  });

  describe('route badges', () => {
    it('says a person files it, for every route including API_ELIGIBLE', () => {
      for (const route of ROUTES) {
        expect(routeBadge(route).label).toBe('Filed by your team');
      }
    });

    it('never uses a positive tone — nothing here is good news yet', () => {
      for (const route of ROUTES) {
        expect(routeBadge(route).tone).not.toBe('positive');
      }
    });

    it('API_ELIGIBLE states plainly that nothing is connected', () => {
      expect(routeBadge('API_ELIGIBLE').title).toMatch(/nothing is connected/i);
    });

    it('degrades an unrecognised route to the most conservative badge', () => {
      expect(routeBadge('SOMETHING_NEW' as SubmissionRoute)).toEqual(
        routeBadge('PREPARE_ONLY'),
      );
    });
  });

  describe('portal link', () => {
    it('offers to OPEN a portal, never to submit through one', () => {
      expect(portalLinkLabel('Balady')).toBe('Open Balady portal');
      expect(portalLinkLabel(null)).toBe('Open the portal');
      expect(portalLinkLabel('Qiwa')).not.toMatch(/submit|file|renew/i);
    });
  });
});

describe('checklist presentation', () => {
  it('gives the three states distinct labels', () => {
    const labels = STATES.map((state) => checklistPresentation(state).label);
    expect(new Set(labels).size).toBe(3);
  });

  it('gives the three states distinct tones, so they are visually distinct', () => {
    // EXPIRED and MISSING must not collapse into one colour: a re-upload and
    // a document that does not exist yet are different amounts of work.
    const tones = STATES.map((state) => checklistPresentation(state).tone);
    expect(new Set(tones).size).toBe(3);
    expect(checklistPresentation('EXPIRED').tone).not.toBe(
      checklistPresentation('MISSING').tone,
    );
  });

  it('only PRESENT reads as done', () => {
    expect(checklistPresentation('PRESENT').tone).toBe('positive');
    expect(checklistPresentation('EXPIRED').tone).not.toBe('positive');
    expect(checklistPresentation('MISSING').tone).not.toBe('positive');
  });

  it('falls back to the most cautious state for an unknown value', () => {
    expect(checklistPresentation('WHATEVER' as ChecklistState)).toEqual(
      checklistPresentation('MISSING'),
    );
  });

  describe('checklistSummary', () => {
    it('counts anything not PRESENT as outstanding', () => {
      expect(checklistSummary(['PRESENT', 'PRESENT'])).toBe(
        'Everything needed is on file.',
      );
      expect(checklistSummary(['PRESENT', 'EXPIRED'])).toBe(
        '1 item still to sort out.',
      );
      expect(checklistSummary(['MISSING', 'EXPIRED', 'PRESENT'])).toBe(
        '2 items still to sort out.',
      );
    });

    it('does not claim all-clear when there is simply nothing to check', () => {
      // "Everything needed is on file" for a licence type with no required
      // documents would be a reassurance we have not actually earned.
      expect(checklistSummary([])).toMatch(/no supporting documents/i);
    });
  });
});

describe('document copy', () => {
  it('does not promise the file is destroyed on removal', () => {
    // Soft delete is the behaviour. Saying "permanently deleted" would be a
    // lie to anyone who removed a document expecting it to be gone.
    //
    // Only AFFIRMATIVE destruction claims are forbidden — "it is not
    // destroyed" is exactly the disclosure this test exists to require, so
    // the patterns must not match a negation of themselves.
    const claimsDestruction = [
      /\bpermanently (deleted|removed|erased)\b/i,
      /\bdeleted forever\b/i,
      /(?<!not )\bdestroyed\b/i,
      /\bgone for good\b/i,
      /\bcannot be recovered\b/i,
    ];
    for (const pattern of claimsDestruction) {
      expect({ pattern: String(pattern), matched: pattern.test(DOCUMENT_COPY.removeBody) })
        .toEqual({ pattern: String(pattern), matched: false });
    }
    expect(DOCUMENT_COPY.removeBody).toMatch(/recoverable/i);
    expect(DOCUMENT_COPY.removeBody).toMatch(/not destroyed/i);
  });

  it('states the accepted types and the real size cap', () => {
    expect(DOCUMENT_COPY.accepted).toMatch(/PDF/);
    expect(DOCUMENT_COPY.accepted).toMatch(/10MB/);
  });

  it('claims encryption and auditing, both of which are implemented', () => {
    expect(DOCUMENT_COPY.storedNote).toMatch(/encrypted/i);
    expect(DOCUMENT_COPY.storedNote).toMatch(/recorded/i);
  });
});

describe('the pattern list itself', () => {
  it('is non-empty and every entry is a usable regex', () => {
    expect(SUBMISSION_CLAIM_PATTERNS.length).toBeGreaterThan(5);
    for (const pattern of SUBMISSION_CLAIM_PATTERNS) {
      expect(pattern).toBeInstanceOf(RegExp);
      expect(pattern.flags).toContain('i');
    }
  });
});
