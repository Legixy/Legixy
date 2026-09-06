/**
 * Copy for inviting somebody into a workspace.
 *
 * Centralised so the honesty scan reads it. Two claims are deliberately
 * absent: that an email was sent (SMTP is unconfigured, and the wording
 * follows what actually happened), and that roles restrict anything — they do
 * not, and the last line says so rather than letting an inviter assume.
 */
export const INVITE_COPY = {
  heading: 'Add someone to this workspace',
  body:
    'They will see the same register you do, and can be made accountable for ' +
    'a licence.',
  fieldLabel: 'Their email address',
  placeholder: 'name@company.com',
  cta: 'Invite',
  working: 'Inviting…',

  emailed: 'Invitation emailed. The link is below if you need it.',
  notEmailed:
    'No email channel is configured, so nothing was sent. Send them this link.',
  linkLabel: 'Invitation link',
  copy: 'Copy',
  copied: 'Copied',
  linkExpiry: 'This link works once, and expires in 7 days.',

  pendingHeading: (count: number) =>
    count === 1 ? '1 invitation not yet accepted' : `${count} invitations not yet accepted`,
  withdraw: 'Withdraw',

  everyoneSeesEverything:
    'Everyone in a workspace can see and change everything in it. There are no ' +
    'restricted roles. Who did what is recorded on each licence.',
} as const;
