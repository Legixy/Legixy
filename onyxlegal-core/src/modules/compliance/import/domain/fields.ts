/**
 * The fields an import can populate, and how a spreadsheet header maps to one.
 *
 * The client's own spreadsheet will not use our column names. Proposing a
 * mapping from their headers saves the tedious part; CONFIRMING it is theirs,
 * because a wrong column silently imports the wrong data.
 */

export type ImportField =
  | 'name'
  | 'licenseType'
  | 'authority'
  | 'site'
  | 'licenseNumber'
  | 'issueDate'
  | 'expiryDate'
  | 'ownerEmail'
  | 'notes';

export interface FieldSpec {
  field: ImportField;
  label: string;
  required: boolean;
  /** What the template says about this column. */
  help: string;
  /**
   * Lower-case header fragments that suggest this field. Matched against a
   * normalised header, longest first, so "expiry date" beats "date".
   */
  synonyms: string[];
}

/**
 * Only `name` is required.
 *
 * A licence with nothing but a name is a poor record, but it is a TRUE one,
 * and the product already handles every other field being absent: no expiry
 * means no reminders, no type means untyped, no owner means unassigned. Each
 * of those is an existing, tested state. Forcing an expiry date would push
 * people to invent one, and an invented date is worse than a missing one.
 */
export const FIELD_SPECS: FieldSpec[] = [
  {
    field: 'name',
    label: 'Licence name',
    required: true,
    help: 'What this licence is called. The only required column.',
    synonyms: [
      'licence name',
      'license name',
      'licence',
      'license',
      'name',
      'title',
    ],
  },
  {
    field: 'licenseType',
    label: 'Licence type',
    required: false,
    help: 'Matched to a known type. Left untyped if it does not match.',
    synonyms: ['licence type', 'license type', 'type', 'category', 'kind'],
  },
  {
    field: 'authority',
    label: 'Issuing authority',
    required: false,
    help: 'Who issues it, e.g. Balady, GOSI, Qiwa.',
    synonyms: [
      'issuing authority',
      'authority',
      'issuer',
      'issued by',
      'department',
    ],
  },
  {
    field: 'site',
    label: 'Site',
    required: false,
    help: 'The location it belongs to. Leave blank for company-wide licences.',
    synonyms: ['site', 'location', 'branch', 'premises', 'facility', 'store'],
  },
  {
    field: 'licenseNumber',
    label: 'Licence number',
    required: false,
    help: 'The reference printed on the licence.',
    synonyms: [
      'licence number',
      'license number',
      'licence no',
      'license no',
      'number',
      'ref',
      'reference',
    ],
  },
  {
    field: 'issueDate',
    label: 'Issue date',
    required: false,
    help: 'YYYY-MM-DD only, e.g. 2025-09-15.',
    synonyms: ['issue date', 'issued on', 'issued', 'start date', 'valid from'],
  },
  {
    field: 'expiryDate',
    label: 'Expiry date',
    required: false,
    help: 'YYYY-MM-DD only, e.g. 2026-09-15. Reminders come from this.',
    synonyms: [
      'expiry date',
      'expiration date',
      'expires on',
      'expiry',
      'expires',
      'valid until',
      'valid to',
      'end date',
      'renewal date',
    ],
  },
  {
    field: 'ownerEmail',
    label: 'Responsible person (email)',
    required: false,
    help: 'Matched to a user by email. Left unassigned if it does not match.',
    synonyms: [
      'owner email',
      'responsible person',
      'responsible',
      'owner',
      'assigned to',
      'email',
      'contact',
    ],
  },
  {
    field: 'notes',
    label: 'Notes',
    required: false,
    help: 'Anything else worth recording.',
    synonyms: [
      'notes',
      'note',
      'comments',
      'comment',
      'remarks',
      'description',
    ],
  },
];

export const REQUIRED_FIELDS: ImportField[] = FIELD_SPECS.filter(
  (spec) => spec.required,
).map((spec) => spec.field);

function normalise(header: string): string {
  return header
    .toLowerCase()
    .replace(/[_\-/\\]+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Proposes a field for each header. `null` means "we have no idea".
 *
 * Deliberately conservative, in two passes:
 *  · exact match on a synonym, then
 *  · the header ENDS with a synonym, on a word boundary, longest first.
 *
 * Suffix rather than "contains", because English headers put the head noun
 * last. "Expiry notes" is notes, not a date; "Internal Ref XYZ" is neither.
 * A `contains` rule matched both — it read "expiry" inside "Expiry notes" and
 * "ref" inside "Internal Ref XYZ" — which would have imported free text as a
 * date for every row in the file.
 *
 * No fuzzy distance, no stemming. Someone reviewing a proposed mapping is far
 * more likely to accept a plausible wrong guess than to notice a missing one,
 * so proposing nothing is the safer failure.
 *
 * Each field is proposed at most once: two columns cannot both become the
 * expiry date.
 */
export function proposeMapping(
  headers: string[],
): Record<number, ImportField | null> {
  const mapping: Record<number, ImportField | null> = {};
  const taken = new Set<ImportField>();

  const candidates = FIELD_SPECS.flatMap((spec) =>
    spec.synonyms.map((synonym) => ({ field: spec.field, synonym })),
  ).sort((a, b) => b.synonym.length - a.synonym.length);

  // Exact matches first, so a header named exactly "type" is not stolen by a
  // longer synonym that merely contains it.
  headers.forEach((header, index) => {
    const key = normalise(header);
    const exact = candidates.find(
      (c) => c.synonym === key && !taken.has(c.field),
    );
    if (exact) {
      mapping[index] = exact.field;
      taken.add(exact.field);
    }
  });

  headers.forEach((header, index) => {
    if (mapping[index] !== undefined) return;
    const key = normalise(header);
    if (key === '') {
      mapping[index] = null;
      return;
    }
    const suffix = candidates.find(
      (c) =>
        !taken.has(c.field) &&
        key.endsWith(c.synonym) &&
        // Word boundary: "…xyz" must not match the synonym "z".
        (key.length === c.synonym.length ||
          key[key.length - c.synonym.length - 1] === ' '),
    );
    if (suffix) {
      mapping[index] = suffix.field;
      taken.add(suffix.field);
    } else {
      mapping[index] = null;
    }
  });

  return mapping;
}
