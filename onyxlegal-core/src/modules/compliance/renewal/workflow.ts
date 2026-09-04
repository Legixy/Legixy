import { RenewalStatus } from 'generated/prisma/client';

/**
 * The renewal state machine.
 *
 * WHAT EACH STAGE ACTUALLY MEANS
 * ------------------------------
 * PREPARING          gathering what the authority asks for
 * READY              everything on file; a person can take it to the portal
 * AWAITING_AUTHORITY a person filed it themselves and told us
 * COMPLETED          the new expiry has been entered and written
 * CLOSED             stopped without completing, with a reason
 *
 * AWAITING_AUTHORITY is deliberately not called "SUBMITTED". This system
 * submits nothing to anybody: no integration exists, no credentials exist, and
 * the stage records a person's report that THEY filed it. A client who reads
 * "Submitted" as "the system submitted it" stops filing, and a licence lapses.
 * That is the single most damaging thing this product could imply, so the
 * distinction is enforced in the name itself rather than left to copy.
 */

/** Stages from which nothing further can happen. */
export const TERMINAL_STATUSES: RenewalStatus[] = [
  RenewalStatus.COMPLETED,
  RenewalStatus.CLOSED,
];

/**
 * Which moves are legal, and why.
 *
 * Forward flow, plus the ability to step BACK while nothing irreversible has
 * happened — a person who marked something ready and then found a document
 * expired must be able to return to preparing, and one whose filing was
 * rejected must be able to go back and refile.
 *
 * PREPARING -> AWAITING_AUTHORITY skips READY on purpose. People do not work
 * in the order software imagines: someone who simply went and filed it should
 * be able to say so without first ticking a box claiming they were ready.
 *
 * COMPLETED and CLOSED are terminal. Both have consequences — one wrote a new
 * expiry into the register, the other abandoned the attempt — and re-opening
 * either would make the audit trail ambiguous about which renewal did what.
 * Starting again means starting a NEW renewal, which the one-active-renewal
 * rule then governs.
 */
export const LEGAL_TRANSITIONS: Record<RenewalStatus, RenewalStatus[]> = {
  [RenewalStatus.PREPARING]: [
    RenewalStatus.READY,
    RenewalStatus.AWAITING_AUTHORITY,
    RenewalStatus.CLOSED,
  ],
  [RenewalStatus.READY]: [
    RenewalStatus.PREPARING,
    RenewalStatus.AWAITING_AUTHORITY,
    RenewalStatus.CLOSED,
  ],
  [RenewalStatus.AWAITING_AUTHORITY]: [
    RenewalStatus.COMPLETED,
    // A rejected filing goes back to be fixed and refiled.
    RenewalStatus.READY,
    RenewalStatus.CLOSED,
  ],
  [RenewalStatus.COMPLETED]: [],
  [RenewalStatus.CLOSED]: [],
};

/**
 * Why a finished renewal accepts no further changes.
 *
 * Distinct from `explainRefusal(x, x)`, which says "already at that stage" —
 * true but useless to someone trying to change something that is closed.
 */
export function explainTerminal(status: RenewalStatus): string {
  return (
    `This renewal is ${STAGE_LABELS[status].toLowerCase()} and cannot be ` +
    'changed. Start a new renewal if this licence needs renewing again.'
  );
}

export function isTerminal(status: RenewalStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(from: RenewalStatus, to: RenewalStatus): boolean {
  return (LEGAL_TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Why a move was refused, phrased for the person who tried it.
 *
 * Names the current stage and what IS possible, because "invalid transition"
 * tells someone nothing about what to do next.
 */
export function explainRefusal(from: RenewalStatus, to: RenewalStatus): string {
  if (from === to) {
    return `This renewal is already at "${STAGE_LABELS[to]}".`;
  }
  if (isTerminal(from)) {
    return (
      `This renewal is ${STAGE_LABELS[from].toLowerCase()} and cannot be ` +
      'changed. Start a new renewal if this licence needs renewing again.'
    );
  }
  const allowed = LEGAL_TRANSITIONS[from]
    .map((status) => `"${STAGE_LABELS[status]}"`)
    .join(', ');
  return (
    `A renewal at "${STAGE_LABELS[from]}" cannot move to ` +
    `"${STAGE_LABELS[to]}". It can move to ${allowed}.`
  );
}

/**
 * Stage names as a person reads them.
 *
 * "With the authority" rather than "Submitted": the phrasing describes where
 * the paperwork IS, not who put it there, and cannot be misread as a claim
 * that this system filed anything.
 */
export const STAGE_LABELS: Record<RenewalStatus, string> = {
  [RenewalStatus.PREPARING]: 'Gathering documents',
  [RenewalStatus.READY]: 'Ready to file',
  [RenewalStatus.AWAITING_AUTHORITY]: 'With the authority',
  [RenewalStatus.COMPLETED]: 'Completed',
  [RenewalStatus.CLOSED]: 'Closed',
};

/** The order stages are shown in. */
export const STAGE_ORDER: RenewalStatus[] = [
  RenewalStatus.PREPARING,
  RenewalStatus.READY,
  RenewalStatus.AWAITING_AUTHORITY,
  RenewalStatus.COMPLETED,
];
