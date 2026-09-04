/**
 * Every user-facing string in the licence import flow.
 *
 * Centralised so honesty.spec.ts can read all of it, following the pattern
 * renewal-copy, dashboard-copy and notification-copy established.
 */

import type { ImportField } from '@/lib/api';

export const IMPORT_COPY = {
  title: 'Import licences',
  subtitle:
    'Bring your existing licence list in from a spreadsheet, so nobody has to '
    + 'retype it.',

  // ── Template ─────────────────────────────────────────────────────────────
  templateHeading: 'Start from the template',
  templateBody:
    'The template has the right columns and three filled-in examples. If you '
    + 'already keep a spreadsheet, use that instead — you can match up your '
    + 'columns in the next step.',
  templateCsv: 'Download CSV template',
  templateXlsx: 'Download Excel template',

  /** The one rule worth repeating everywhere it can be read. */
  dateRule:
    'Dates must be written as YYYY-MM-DD, for example 2026-09-15. A date like '
    + '01/02/2026 is refused, because it can be read as either 1 February or '
    + '2 January and guessing would put every reminder on the wrong day.',

  // ── Upload ───────────────────────────────────────────────────────────────
  uploadHeading: 'Choose your file',
  uploadCta: 'Choose a spreadsheet',
  uploading: 'Reading your file…',
  accepted: 'CSV or Excel (.xlsx), up to 5MB and 1000 rows.',

  // ── Mapping ──────────────────────────────────────────────────────────────
  mappingHeading: 'Match your columns',
  mappingBody:
    'We have suggested a match where the heading was clear. Check each one — '
    + 'a column matched to the wrong field imports the wrong data.',
  mappingIgnore: 'Do not import',
  mappingRequired: 'Required',
  mappingMissing: (fields: string) =>
    `Match a column to ${fields} before continuing.`,

  // ── Resolution ───────────────────────────────────────────────────────────
  resolveHeading: 'Match the values in your file',
  resolveBody:
    'Each distinct value is confirmed once, however many rows use it.',
  resolveTypes: 'Licence types',
  resolveSites: 'Sites',
  resolveOwners: 'Responsible people',
  rowsUsing: (n: number) =>
    n === 1 ? 'used by 1 row' : `used by ${n} rows`,
  leaveUntyped: 'Leave untyped',
  leaveUnassigned: 'Leave unassigned',
  createSite: 'Create this site',
  noSite: 'No site (company-wide)',
  suggested: 'Suggested',

  // ── Preview ──────────────────────────────────────────────────────────────
  previewHeading: 'Check before importing',
  previewBody:
    'Nothing has been saved yet. Dates are shown in full so you can see at a '
    + 'glance that they are the dates you meant.',
  willCreate: (n: number) =>
    n === 1 ? '1 licence will be created' : `${n} licences will be created`,
  willFail: (n: number) =>
    n === 1
      ? '1 row cannot be imported'
      : `${n} rows cannot be imported`,
  failHint: 'These rows are listed below with the reason. Fix them in your '
    + 'spreadsheet and upload again, or import the rest without them.',
  duplicateHeading: 'Possible duplicates',
  duplicateHint:
    'These look like licences already on record. They are not blocked — check '
    + 'whether they are genuinely different.',
  rowLabel: (n: number) => `Row ${n}`,
  noExpiry: 'No expiry date',
  companyWide: 'Company-wide',
  willCreateSite: (name: string) => `will create site "${name}"`,

  commit: 'Import these licences',
  committing: 'Importing…',

  // ── Result ───────────────────────────────────────────────────────────────
  doneHeading: 'Import complete',
  doneBody: (created: number, sites: number) =>
    sites > 0
      ? `${created} ${created === 1 ? 'licence' : 'licences'} and ${sites} `
        + `${sites === 1 ? 'site' : 'sites'} were created. Reminders have been `
        + 'scheduled from each expiry date.'
      : `${created} ${created === 1 ? 'licence' : 'licences'} created. `
        + 'Reminders have been scheduled from each expiry date.',
  doneSkipped: (n: number) =>
    n === 1
      ? '1 row was not imported. It is listed below.'
      : `${n} rows were not imported. They are listed below.`,
  viewLicences: 'View your licences',
  importAnother: 'Import another file',

  // ── States ───────────────────────────────────────────────────────────────
  errorTitle: 'That file could not be read',
  errorRetry: 'Try another file',
  back: 'Back',
} as const;

export const FIELD_LABELS: Record<ImportField, string> = {
  name: 'Licence name',
  licenseType: 'Licence type',
  authority: 'Issuing authority',
  site: 'Site',
  licenseNumber: 'Licence number',
  issueDate: 'Issue date',
  expiryDate: 'Expiry date',
  ownerEmail: 'Responsible person (email)',
  notes: 'Notes',
};

/** Only the licence name is required; every other field may be absent. */
export const REQUIRED_IMPORT_FIELDS: ImportField[] = ['name'];

export const IMPORT_STEPS = [
  'Choose file',
  'Match columns',
  'Match values',
  'Check',
] as const;

/**
 * Every fixed string here plus the functions on representative inputs, so the
 * honesty scan reads all of it.
 */
export function allImportCopy(): string[] {
  const fixed = Object.values(IMPORT_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  return [
    ...fixed,
    ...Object.values(FIELD_LABELS),
    ...IMPORT_STEPS,
    IMPORT_COPY.mappingMissing('Licence name'),
    IMPORT_COPY.rowsUsing(1),
    IMPORT_COPY.rowsUsing(40),
    IMPORT_COPY.willCreate(1),
    IMPORT_COPY.willCreate(47),
    IMPORT_COPY.willFail(1),
    IMPORT_COPY.willFail(3),
    IMPORT_COPY.rowLabel(12),
    IMPORT_COPY.willCreateSite('Dammam Warehouse'),
    IMPORT_COPY.doneBody(47, 0),
    IMPORT_COPY.doneBody(47, 2),
    IMPORT_COPY.doneSkipped(1),
    IMPORT_COPY.doneSkipped(3),
  ];
}
