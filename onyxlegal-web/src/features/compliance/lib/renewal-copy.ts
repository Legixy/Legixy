/**
 * Every word this application says about renewal and documents.
 *
 * THE ONE PROMISE THIS PRODUCT MUST NOT BREAK
 * -------------------------------------------
 * This system does not submit anything to any government authority. There is
 * no integration, no credential, no partner subscription, and no code that
 * talks to a portal. A person from the client's team does the filing.
 *
 * A screen that implied otherwise would be the single most damaging thing this
 * product could say: someone would stop filing, and a licence would lapse.
 *
 * So all renewal wording lives in this one pure module — not scattered through
 * JSX — precisely so a test can read every string and prove none of them makes
 * that claim. See renewal-copy.spec.ts.
 *
 * The backend authors its own route guidance and holds the same rule under its
 * own test. `safeGuidanceDetail` below is a second, independent guard: if a
 * future backend change ever let a submission claim through, the browser
 * refuses to render it rather than passing it to a user.
 */

import type { ChecklistState, SubmissionRoute } from '@/lib/api';
import type { StatusTone } from './format';

/**
 * Phrasings that would assert this system files on the user's behalf.
 *
 * Deliberately broad. A false positive costs a fallback string; a false
 * negative costs a client their licence.
 */
export const SUBMISSION_CLAIM_PATTERNS: RegExp[] = [
  /\bwe (will )?submit/i,
  /\bwe (will )?file\b/i,
  /\bwe (will )?renew/i,
  /\bwe(’|')ll (submit|file|renew)/i,
  /\bautomatic(ally)? (submit|submission|file|filing|renew)/i,
  /\bsubmitted for you\b/i,
  /\bfiled for you\b/i,
  /\brenewed for you\b/i,
  /\bon your behalf\b/i,
  /\bhandles? the (submission|filing)\b/i,
  /\bsubmit(s|ting)? (it|this|the renewal) for you\b/i,
  /\bone[- ]click (renew|submit|filing)/i,
];

export function containsSubmissionClaim(text: string): boolean {
  return SUBMISSION_CLAIM_PATTERNS.some((pattern) => pattern.test(text));
}

/** The most conservative wording, used whenever anything is uncertain. */
export const FALLBACK_GUIDANCE_DETAIL =
  'Your team completes this renewal on the authority’s portal. This system ' +
  'gathers what you need; it does not file anything for you.';

/**
 * Renders server-supplied guidance, or the safe fallback if it ever makes a
 * claim this product cannot honour.
 */
export function safeGuidanceDetail(detail: string | null | undefined): string {
  if (!detail) return FALLBACK_GUIDANCE_DETAIL;
  return containsSubmissionClaim(detail) ? FALLBACK_GUIDANCE_DETAIL : detail;
}

// ── Submission route ───────────────────────────────────────────────────────

export interface RouteBadge {
  label: string;
  tone: StatusTone;
  /** Hover/aria explanation. Never a promise. */
  title: string;
}

/**
 * Note the tones: no route is `positive`. There is nothing to celebrate about
 * a submission route while every one of them still requires a person.
 */
const ROUTE_BADGE: Record<SubmissionRoute, RouteBadge> = {
  PREPARE_ONLY: {
    label: 'Filed by your team',
    tone: 'neutral',
    title: 'This authority is filed with manually, on its own portal.',
  },
  API_ELIGIBLE: {
    label: 'Filed by your team',
    tone: 'neutral',
    title:
      'This authority runs a partner programme. Nothing is connected today.',
  },
  UNKNOWN: {
    label: 'Filed by your team',
    tone: 'neutral',
    title: 'We are still confirming what this authority allows.',
  },
};

export function routeBadge(route: SubmissionRoute): RouteBadge {
  return ROUTE_BADGE[route] ?? ROUTE_BADGE.PREPARE_ONLY;
}

/** The portal link opens the authority's own site. It never posts anything. */
export function portalLinkLabel(authorityName: string | null): string {
  return authorityName ? `Open ${authorityName} portal` : 'Open the portal';
}

export const PORTAL_LINK_HINT =
  'Opens the authority’s own website in a new tab.';

// ── Checklist ──────────────────────────────────────────────────────────────

export interface ChecklistPresentation {
  label: string;
  tone: StatusTone;
  /** Short reason, shown under the requirement name. */
  hint: string;
}

/**
 * The three states are given different labels AND different tones, because a
 * document that has expired is a different problem from one never supplied:
 * one is a re-upload, the other is a trip to get a document issued. Colour
 * alone is not relied on — each row also carries its own icon and text label.
 */
const CHECKLIST_PRESENTATION: Record<ChecklistState, ChecklistPresentation> = {
  PRESENT: {
    label: 'Ready',
    tone: 'positive',
    hint: 'On file and in date.',
  },
  EXPIRED: {
    label: 'Out of date',
    tone: 'warning',
    hint: 'On file, but past its own expiry. A current copy is needed.',
  },
  MISSING: {
    label: 'Not supplied',
    tone: 'critical',
    hint: 'Nothing has been uploaded for this requirement.',
  },
};

export function checklistPresentation(
  state: ChecklistState,
): ChecklistPresentation {
  return CHECKLIST_PRESENTATION[state] ?? CHECKLIST_PRESENTATION.MISSING;
}

/** One calm sentence summarising the whole checklist. */
export function checklistSummary(states: ChecklistState[]): string {
  if (states.length === 0) {
    return 'No supporting documents are recorded for this licence type.';
  }
  const outstanding = states.filter((state) => state !== 'PRESENT').length;
  if (outstanding === 0) return 'Everything needed is on file.';
  return outstanding === 1
    ? '1 item still to sort out.'
    : `${outstanding} items still to sort out.`;
}

// ── Documents ──────────────────────────────────────────────────────────────

export const DOCUMENT_COPY = {
  heading: 'Documents',
  empty: 'No documents are attached to this licence yet.',
  emptyHint:
    'Upload the licence itself and anything the authority asks for at renewal.',
  uploadCta: 'Add a document',
  uploading: 'Uploading…',
  accepted: 'PDF, JPEG, PNG or WebP, up to 10MB.',
  storedNote:
    'Documents are encrypted before they are stored, and every upload, download and removal is recorded.',
  removeTitle: 'Remove this document?',
  removeBody:
    'It stops appearing on this licence. It is not destroyed — a compliance document removed by mistake must be recoverable.',
  removeConfirm: 'Remove document',
  removeCancel: 'Keep it',
  /** Shown when a document's own expiry has passed. */
  expiredTag: 'Out of date',
} as const;

export const RENEWAL_COPY = {
  heading: 'Renewal',
  notYetHeading: 'Not due yet',
  notYet:
    'This licence is not close enough to expiry to prepare a renewal. Everything on file stays available in the meantime.',
  archived: 'This licence is archived, so there is nothing to renew.',
  checklistHeading: 'What you need',
  feeLabel: 'Typical fee',
  feeUnknown: 'Not recorded',
  authorityLabel: 'Filed with',
  proposedLabel: 'New expiry would be',
  proposedHint:
    'Estimated from the usual renewal cycle for this licence type. The authority sets the real date.',
} as const;

/**
 * Every frontend-authored string in this module, flattened.
 *
 * The spec walks this so that adding a new string without reviewing it is not
 * possible: it is checked automatically the moment it is added here, and a
 * string added outside this module is caught in review because copy does not
 * belong in JSX.
 */
export function allFrontendRenewalCopy(): string[] {
  const routes: SubmissionRoute[] = ['PREPARE_ONLY', 'API_ELIGIBLE', 'UNKNOWN'];
  const states: ChecklistState[] = ['PRESENT', 'EXPIRED', 'MISSING'];

  return [
    ...Object.values(DOCUMENT_COPY),
    ...Object.values(RENEWAL_COPY),
    FALLBACK_GUIDANCE_DETAIL,
    PORTAL_LINK_HINT,
    portalLinkLabel('Balady'),
    portalLinkLabel(null),
    ...routes.flatMap((route) => {
      const badge = routeBadge(route);
      return [badge.label, badge.title];
    }),
    ...states.flatMap((state) => {
      const presentation = checklistPresentation(state);
      return [presentation.label, presentation.hint];
    }),
    checklistSummary([]),
    checklistSummary(['PRESENT']),
    checklistSummary(['MISSING']),
    checklistSummary(['MISSING', 'EXPIRED']),
  ];
}
