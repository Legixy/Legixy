/**
 * Every user-facing string in the renewal workflow.
 *
 * THIS IS THE EASIEST PLACE IN THE PRODUCT TO BREAK THE HONESTY RULE
 * ------------------------------------------------------------------
 * A stage called "Submitted" reads as though the system submitted it. It did
 * not. A person went to the authority's own portal, filed it themselves, and
 * then told us. Every string here has to make the actor unambiguous:
 *
 *   "You marked this as filed on 14 September"   — true
 *   "Submitted on 14 September"                  — invites the wrong reading
 *
 * A client who believes the system files for them stops filing, and a licence
 * lapses. That is the worst outcome this product can produce, so the rule is
 * enforced by the honesty scan over this file rather than left to review.
 */

import type { RenewalStatus } from '@/lib/api';
import type { StatusTone } from './format';

export interface StagePresentation {
  label: string;
  tone: StatusTone;
  /** What is true at this stage, and who did it. */
  detail: string;
}

/**
 * Stage names describe where the paperwork IS, not who put it there.
 *
 * "With the authority" cannot be misread as a claim that this system sent it.
 * "Submitted" can.
 */
const STAGE_PRESENTATION: Record<RenewalStatus, StagePresentation> = {
  PREPARING: {
    label: 'Gathering documents',
    tone: 'info',
    detail: 'Collecting what the authority asks for.',
  },
  READY: {
    label: 'Ready to file',
    tone: 'info',
    detail:
      'Everything needed is on file. Someone from your team can now take '
      + 'this to the authority’s portal.',
  },
  AWAITING_AUTHORITY: {
    label: 'With the authority',
    tone: 'warning',
    detail:
      'You told us someone filed this at the portal, and the authority has '
      + 'not come back yet.',
  },
  COMPLETED: {
    label: 'Completed',
    tone: 'positive',
    detail: 'The new expiry date has been recorded and reminders reset.',
  },
  CLOSED: {
    label: 'Closed',
    tone: 'neutral',
    detail: 'Stopped without renewing. The licence keeps its existing date.',
  },
};

export function stagePresentation(status: RenewalStatus): StagePresentation {
  // Falls back to the stage that claims the least.
  return STAGE_PRESENTATION[status] ?? STAGE_PRESENTATION.PREPARING;
}

export const RENEWAL_WORKFLOW_COPY = {
  heading: 'Renewal in progress',
  startHeading: 'Renew this licence',
  startBody:
    'Track a renewal from gathering documents through to the new expiry date, '
    + 'so the record does not drift out of step with reality.',
  start: 'Start a renewal',
  starting: 'Starting…',

  none: 'No renewal is in progress for this licence.',

  /** Actor-explicit throughout. */
  startedBy: (name: string, when: string) => `Started by ${name} on ${when}`,
  youFiledOn: (name: string, when: string) =>
    `${name} marked this as filed at the portal on ${when}`,
  completedBy: (name: string, when: string) => `Completed by ${name} on ${when}`,

  // ── Actions ──────────────────────────────────────────────────────────────
  markReady: 'Everything is gathered',
  markReadyHint: 'Marks this ready for someone to take to the portal.',
  markFiled: 'I filed this at the portal',
  markFiledHint:
    'Records that a person on your team filed it. This system does not file '
    + 'anything with any authority.',
  backToPreparing: 'Back to gathering documents',
  reopenForRefiling: 'It was rejected — refile it',
  close: 'Stop this renewal',
  closeHint: 'The licence keeps its current expiry date.',
  closeReasonLabel: 'Why are you stopping it?',
  closeReasonPlaceholder: 'e.g. Superseded by a new premises licence',
  closeConfirm: 'Stop the renewal',
  cancel: 'Cancel',

  // ── Completion ───────────────────────────────────────────────────────────
  completeHeading: 'Record the new expiry',
  completeBody:
    'Enter the expiry date printed on the new licence. This replaces the date '
    + 'on the record and rebuilds every reminder from it.',
  newExpiryLabel: 'New expiry date',
  /** The proposal is explicitly a suggestion, never a value already applied. */
  proposedHint: (date: string) =>
    `Usually ${date}, based on this licence type’s renewal cycle. Check it `
    + 'against the certificate and change it if it differs.',
  dateRule:
    'Dates must be written as YYYY-MM-DD, for example 2027-09-15. A date like '
    + '01/02/2027 is refused, because it can be read as either 1 February or '
    + '2 January and guessing would put every reminder on the wrong day.',
  newNumberLabel: 'New licence number (optional)',
  certificateLabel: 'New certificate (optional)',
  certificateHint:
    'You can record the new expiry now and attach the certificate later. It '
    + 'shows as missing on the checklist until you do.',
  complete: 'Record the new expiry',
  completing: 'Recording…',

  // ── Outcome ──────────────────────────────────────────────────────────────
  expiryChanged: (from: string, to: string) =>
    `Expiry moved from ${from} to ${to}. Reminders have been rebuilt.`,
  remindersRebuilt: 'Reminders have been rebuilt from the new date.',

  // ── States ───────────────────────────────────────────────────────────────
  loading: 'Loading renewal…',
  errorTitle: 'Could not load the renewal',
  errorRetry: 'Try again',
  historyHeading: 'Earlier renewals',

  // Field labels. "Filed at the portal" alone was ambiguous about who did it —
  // the honesty scan caught it in this component's JSX. "Reported as filed"
  // cannot be read as a claim that this system filed anything.
  labelStarted: 'Started',
  labelReportedFiled: 'Reported as filed',
  labelExpiryAtStart: 'Expiry when this started',
} as const;

/**
 * Every fixed string here, plus the functions on representative inputs, so
 * the honesty scan reads all of it.
 */
export function allRenewalWorkflowCopy(): string[] {
  const fixed = Object.values(RENEWAL_WORKFLOW_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  const statuses: RenewalStatus[] = [
    'PREPARING',
    'READY',
    'AWAITING_AUTHORITY',
    'COMPLETED',
    'CLOSED',
  ];

  return [
    ...fixed,
    RENEWAL_WORKFLOW_COPY.startedBy('Ahmed Al-Rashid', '2 September 2026'),
    RENEWAL_WORKFLOW_COPY.youFiledOn('Ahmed Al-Rashid', '14 September 2026'),
    RENEWAL_WORKFLOW_COPY.completedBy('Sara Al-Dosari', '20 September 2026'),
    RENEWAL_WORKFLOW_COPY.proposedHint('15 September 2027'),
    RENEWAL_WORKFLOW_COPY.expiryChanged('15 September 2026', '15 September 2027'),
    ...statuses.flatMap((status) => {
      const stage = stagePresentation(status);
      return [stage.label, stage.detail];
    }),
  ];
}
