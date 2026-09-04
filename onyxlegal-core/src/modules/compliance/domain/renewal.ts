/**
 * Renewal preparation — pure domain.
 *
 * No I/O, no clock. `today` is always a parameter.
 *
 * DERIVED, NEVER STORED
 * ---------------------
 * The checklist is computed from the documents that exist right now. Persisting
 * it would create a second source of truth that goes stale the moment a
 * document is uploaded or expires — the same reasoning that kept coverage gaps
 * derived in Slice 4 and expiry status derived in Slice 2.
 */

import { addDays, differenceInDays, PlainDate } from './plain-date';

export type ChecklistState = 'PRESENT' | 'EXPIRED' | 'MISSING';

export interface RequiredDocument {
  code: string;
  label: string;
  labelAr: string;
}

export interface UploadedDocumentSummary {
  id: string;
  documentCode: string | null;
  filename: string;
  /** Independent of the licence's own expiry. */
  expiresOn: PlainDate | null;
}

export interface ChecklistItem {
  code: string;
  label: string;
  labelAr: string;
  state: ChecklistState;
  /** The document satisfying (or failing) this item, when one exists. */
  documentId: string | null;
  filename: string | null;
  expiresOn: PlainDate | null;
}

/**
 * Resolve each required document to PRESENT, EXPIRED or MISSING.
 *
 * A document with no `expiresOn` is PRESENT: many supporting documents — a
 * title deed, articles of association — do not expire, and treating "no date"
 * as expired would manufacture work that does not exist.
 *
 * When several documents share a code, the one expiring latest wins: that is
 * the one that actually satisfies the requirement.
 */
export function buildChecklist(
  required: readonly RequiredDocument[],
  uploaded: readonly UploadedDocumentSummary[],
  today: PlainDate,
): ChecklistItem[] {
  return required.map((requirement) => {
    const candidates = uploaded.filter(
      (document) => document.documentCode === requirement.code,
    );

    if (candidates.length === 0) {
      return {
        code: requirement.code,
        label: requirement.label,
        labelAr: requirement.labelAr,
        state: 'MISSING' as const,
        documentId: null,
        filename: null,
        expiresOn: null,
      };
    }

    // Prefer the longest-lived: a never-expiring document beats a dated one,
    // and among dated ones the latest expiry is the one still in force.
    const best = [...candidates].sort((a, b) => {
      if (a.expiresOn === null) return -1;
      if (b.expiresOn === null) return 1;
      return a.expiresOn > b.expiresOn ? -1 : 1;
    })[0];

    // Valid THROUGH its expiry day, matching licence expiry semantics exactly.
    const expired =
      best.expiresOn !== null && differenceInDays(today, best.expiresOn) < 0;

    return {
      code: requirement.code,
      label: requirement.label,
      labelAr: requirement.labelAr,
      state: expired ? ('EXPIRED' as const) : ('PRESENT' as const),
      documentId: best.id,
      filename: best.filename,
      expiresOn: best.expiresOn,
    };
  });
}

/**
 * The expiry date a renewal would produce.
 *
 * Calendar-month arithmetic, so a 12-month cycle from 31 January lands on
 * 31 January and not 3 March. Month-end is clamped: adding one month to
 * 31 January yields 28 or 29 February, which is what every registry does.
 *
 * Returns null when the type has no defined cycle — proposing a date we cannot
 * justify would be worse than proposing none.
 */
export function proposedRenewalExpiry(
  currentExpiry: PlainDate | null,
  cycleMonths: number | null,
): PlainDate | null {
  if (!currentExpiry || !cycleMonths) return null;

  const year = Number(currentExpiry.slice(0, 4));
  const month = Number(currentExpiry.slice(5, 7));
  const day = Number(currentExpiry.slice(8, 10));

  const zeroBased = month - 1 + cycleMonths;
  const targetYear = year + Math.floor(zeroBased / 12);
  const targetMonth = ((zeroBased % 12) + 12) % 12;

  // Day 0 of the following month is the last day of the target month.
  const lastDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  const result = new Date(Date.UTC(targetYear, targetMonth, clampedDay));
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  return `${pad(result.getUTCFullYear(), 4)}-${pad(
    result.getUTCMonth() + 1,
  )}-${pad(result.getUTCDate())}`;
}

// ── Submission route language ──────────────────────────────────────────────

export type SubmissionRouteValue = 'PREPARE_ONLY' | 'API_ELIGIBLE' | 'UNKNOWN';

export interface RouteGuidance {
  /** Short label for the UI. */
  headline: string;
  /** What actually happens next, in plain language. */
  detail: string;
  /** True when a person must complete the submission. Currently always true. */
  humanSubmits: boolean;
}

/**
 * What the product tells a user about submitting, per authority.
 *
 * THE RULE
 * --------
 * Every route says a PERSON submits, because that is the truth today: no
 * integration is active, no credentials exist, no partner subscription is in
 * place. `API_ELIGIBLE` means a programme exists that we might one day join —
 * it does not mean anything is automated now.
 *
 * A test asserts that no route's copy claims this system submits, files,
 * renews or lodges anything. That test is the guard on this promise.
 */
const ROUTE_GUIDANCE: Record<SubmissionRouteValue, RouteGuidance> = {
  PREPARE_ONLY: {
    headline: 'You submit this one',
    detail:
      'Everything needed is gathered here. Someone from your team completes the renewal on the authority’s portal.',
    humanSubmits: true,
  },
  API_ELIGIBLE: {
    headline: 'You submit this one, for now',
    detail:
      'This authority runs a partner programme, so direct submission may become possible later. It is not connected today, so someone from your team completes the renewal on the portal.',
    humanSubmits: true,
  },
  UNKNOWN: {
    headline: 'You submit this one',
    detail:
      'We are still confirming what this authority allows. Someone from your team completes the renewal on the portal.',
    humanSubmits: true,
  },
};

export function routeGuidance(route: SubmissionRouteValue): RouteGuidance {
  return ROUTE_GUIDANCE[route] ?? ROUTE_GUIDANCE.PREPARE_ONLY;
}

/** Every guidance string, for the test that guards the promise above. */
export function allRouteCopy(): string[] {
  return Object.values(ROUTE_GUIDANCE).flatMap((guidance) => [
    guidance.headline,
    guidance.detail,
  ]);
}

/**
 * Whether a licence is close enough to expiry to be worth preparing.
 *
 * Reuses the outermost reminder rung: if the organisation is being reminded,
 * preparation is relevant. One set of numbers, as established in Slice 4.
 */
export function isInRenewalWindow(
  expiryDate: PlainDate | null,
  today: PlainDate,
  windowDays: number,
): boolean {
  if (!expiryDate) return false;
  // Already expired still counts — renewal is more urgent, not less.
  return differenceInDays(today, expiryDate) <= windowDays;
}

/** Exposed for tests that need a date inside the window. */
export function renewalWindowStart(
  expiryDate: PlainDate,
  windowDays: number,
): PlainDate {
  return addDays(expiryDate, -windowDays);
}
