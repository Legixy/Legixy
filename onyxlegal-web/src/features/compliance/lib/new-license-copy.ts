/**
 * Every user-facing string on the single-licence form.
 *
 * Centralised so the honesty scan reads it. This screen creates the record
 * the whole product is built on, so a promise made here — that something is
 * checked, tracked, or filed — has to be one the system keeps.
 */

export const NEW_LICENSE_COPY = {
  title: 'Add a licence',
  back: 'Back to licences',

  /**
   * Says what happens after saving, because that IS the product. A person
   * who does not know reminders appear automatically will go looking for a
   * place to set them up.
   */
  intro:
    'Only the name is required. Add the expiry date and reminders are '
    + 'scheduled from it straight away.',

  // ── Fields ───────────────────────────────────────────────────────────────
  nameLabel: 'Licence name',
  nameHint: 'What your team calls it. For example, Balady Municipal Licence.',
  namePlaceholder: 'Balady Municipal Licence',

  typeLabel: 'Licence type',
  typeHint:
    'Picking a type sets the authority and the document checklist. Leave it '
    + 'blank if none of them fit.',
  typeNone: 'No type',

  siteLabel: 'Site',
  siteNone: 'Company-wide — not tied to a location',
  /** The scope invariant, stated where it binds rather than after it fails. */
  siteRequiredHint: 'This type is held per location, so it needs a site.',
  siteForbiddenHint:
    'This type is held by the company as a whole, so it takes no site.',

  ownerLabel: 'Responsible person',
  ownerNone: 'Nobody yet',
  /**
   * Unassigned is allowed but never silent. A licence with no owner cannot
   * send a reminder to anyone, which is the one failure this product exists
   * to prevent.
   */
  ownerWarning:
    'With nobody responsible, reminders for this licence have no one to go '
    + 'to. You can set this later.',

  numberLabel: 'Licence number',
  numberHint: 'As printed on the certificate.',

  authorityLabel: 'Authority',
  authorityHint: 'Filled in from the licence type when you pick one.',

  issueLabel: 'Issue date',
  expiryLabel: 'Expiry date',

  /**
   * The same rule import enforces, in the same words, because it is the same
   * validator. See licenses.controller.ts → POST /licenses/check.
   */
  dateRule:
    'Write dates as YYYY-MM-DD, for example 2027-09-15. A date like '
    + '01/02/2027 is refused, because it can be read as either 1 February or '
    + '2 January and guessing would put every reminder on the wrong day.',
  expiryHint: 'Leave blank if this licence genuinely never expires.',

  notesLabel: 'Notes',
  notesHint: 'Anything your team needs to remember about this one.',

  // ── The echo ─────────────────────────────────────────────────────────────
  /**
   * Read back before commit, in a form that cannot be misread. Import does
   * the same thing for the same reason: a person who typed 2027-09-15 and
   * meant 2027-05-09 has one chance to notice, and it is here.
   */
  echoHeading: 'Check these before saving',
  echoExpiry: (long: string) => `Expires on ${long}`,
  echoIssue: (long: string) => `Issued on ${long}`,
  echoNoExpiry: 'No expiry date — this licence will have no reminders.',
  /**
   * States that reminders follow, NOT how many.
   *
   * Counting them means asking "how many of 90/60/30/14/7 days before this
   * date are still ahead of today" — and the browser has no authoritative
   * today. Expiry status is derived in the tenant's timezone server-side for
   * exactly this reason, and Slice 6 already shipped a bug where a row
   * computed its own expiry from the browser clock and disagreed with the
   * server. The real ladder is on the licence page a second after saving.
   */
  echoReminders: 'Reminders will be scheduled from that date.',

  // ── Actions ──────────────────────────────────────────────────────────────
  submit: 'Add this licence',
  submitting: 'Adding…',
  cancel: 'Cancel',

  // ── Outcome ──────────────────────────────────────────────────────────────
  created: 'Licence added',
  createdWithExpiry: 'It is on record, with its reminder schedule below.',
  createdNoExpiry:
    'It is on record. Add an expiry date whenever you have it and reminders '
    + 'will follow.',

  // ── Problems ─────────────────────────────────────────────────────────────
  fixBeforeSaving: 'Fix these before saving',
  failed: 'Could not add the licence',
} as const;

/** Every fixed string, plus the functions on representative inputs. */
export function allNewLicenseCopy(): string[] {
  const fixed = Object.values(NEW_LICENSE_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  return [
    ...fixed,
    NEW_LICENSE_COPY.echoExpiry('15 September 2027'),
    NEW_LICENSE_COPY.echoIssue('15 September 2026'),
  ];
}
