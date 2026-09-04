import { isPlainDate, PlainDate } from '../../domain/plain-date';
import { ImportField } from './fields';

/**
 * Row validation.
 *
 * THE DATE RULE, WHICH IS THE POINT OF THIS FILE
 * ----------------------------------------------
 * `01/02/2026` is the first of February to most of the world and the second of
 * January to the United States. Nothing in the file says which. A parser that
 * picks one is guessing, and a guess that lands produces a reminder ladder
 * built on the wrong day — with no symptom until a licence lapses.
 *
 * So ambiguity is REJECTED, never resolved. Only `YYYY-MM-DD` is accepted from
 * text, because it is the one format that cannot be read two ways.
 *
 * The single exception is a spreadsheet cell that is genuinely date-typed. In
 * that case the ambiguity was already resolved by Excel when the value was
 * entered, and the cell carries a real date rather than characters. Those
 * arrive here already converted to `YYYY-MM-DD` by the reader, which takes the
 * date's LOCAL components — a date cell for 15 September is midnight local
 * time, whose UTC instant is the 14th in any positive-offset zone. Reading it
 * as UTC would move every date in the file back a day.
 */

export type RowOutcome = 'CREATE' | 'FAIL';

export interface RowIssue {
  field: ImportField | null;
  message: string;
}

export interface ResolvedRow {
  /** 1-based row number as the person sees it in their spreadsheet. */
  rowNumber: number;
  outcome: RowOutcome;
  issues: RowIssue[];

  name: string;
  licenseNumber: string | null;
  authority: string | null;
  notes: string | null;
  issueDate: PlainDate | null;
  expiryDate: PlainDate | null;

  /** Raw free-text values, before resolution to real records. */
  rawLicenseType: string | null;
  rawSite: string | null;
  rawOwnerEmail: string | null;
}

export const MAX_NAME_LENGTH = 200;
export const MAX_NOTES_LENGTH = 2000;

/**
 * A date cell that arrived as text.
 *
 * Returns the value, or an issue explaining exactly what was wrong and what
 * is required. The message names the expected format every time: someone
 * fixing forty rows needs to know the rule, not just that row 12 failed.
 */
function readDate(
  raw: string,
  field: ImportField,
  label: string,
): { value: PlainDate | null; issue: RowIssue | null } {
  const trimmed = raw.trim();
  if (trimmed === '') return { value: null, issue: null };

  if (isPlainDate(trimmed)) return { value: trimmed, issue: null };

  // Say WHY it was refused, distinguishing "wrong shape" from "impossible
  // day", because the fix is different.
  const looksSlashed = /^\d{1,4}[/.]\d{1,2}[/.]\d{1,4}$/.test(trimmed);
  const looksIsoShaped = /^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed);

  const message = looksSlashed
    ? `${label} "${trimmed}" is ambiguous — it could be read as either day/month or month/day. ` +
      'Use YYYY-MM-DD, for example 2026-09-15.'
    : looksIsoShaped
      ? `${label} "${trimmed}" is not a real calendar date. Use YYYY-MM-DD, for example 2026-09-15.`
      : `${label} "${trimmed}" is not a recognised date. Use YYYY-MM-DD, for example 2026-09-15.`;

  return { value: null, issue: { field, message } };
}

/**
 * Turns one raw row into a validated row.
 *
 * Collects EVERY issue rather than stopping at the first, so a person fixing
 * a spreadsheet sees all of it in one pass instead of re-uploading per error.
 */
export function validateRow(
  rowNumber: number,
  values: Partial<Record<ImportField, string>>,
): ResolvedRow {
  const issues: RowIssue[] = [];
  const text = (field: ImportField): string => (values[field] ?? '').trim();

  const name = text('name');
  if (name === '') {
    issues.push({
      field: 'name',
      message: 'Licence name is required. This row has no name.',
    });
  } else if (name.length > MAX_NAME_LENGTH) {
    issues.push({
      field: 'name',
      message: `Licence name is longer than ${MAX_NAME_LENGTH} characters.`,
    });
  }

  const issue = readDate(text('issueDate'), 'issueDate', 'Issue date');
  if (issue.issue) issues.push(issue.issue);

  const expiry = readDate(text('expiryDate'), 'expiryDate', 'Expiry date');
  if (expiry.issue) issues.push(expiry.issue);

  // Both present and the wrong way round is a data-entry slip worth catching:
  // it would otherwise produce a licence that expired before it was issued.
  if (issue.value && expiry.value && expiry.value < issue.value) {
    issues.push({
      field: 'expiryDate',
      message: `Expiry date ${expiry.value} is before the issue date ${issue.value}.`,
    });
  }

  const notes = text('notes');
  if (notes.length > MAX_NOTES_LENGTH) {
    issues.push({
      field: 'notes',
      message: `Notes are longer than ${MAX_NOTES_LENGTH} characters.`,
    });
  }

  const ownerEmail = text('ownerEmail');
  // Only shape is checked here. Whether the address belongs to a real user in
  // this tenant is resolution's job, and not matching is not an error.
  if (ownerEmail !== '' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
    issues.push({
      field: 'ownerEmail',
      message: `"${ownerEmail}" is not a valid email address.`,
    });
  }

  return {
    rowNumber,
    outcome: issues.length > 0 ? 'FAIL' : 'CREATE',
    issues,
    name,
    licenseNumber: text('licenseNumber') || null,
    authority: text('authority') || null,
    notes: notes || null,
    issueDate: issue.value,
    expiryDate: expiry.value,
    rawLicenseType: text('licenseType') || null,
    rawSite: text('site') || null,
    rawOwnerEmail: ownerEmail || null,
  };
}

/**
 * Distinct non-empty values for one field, preserving first-seen order.
 *
 * This is what makes resolution bearable: forty rows saying "Municipality
 * Licence" is ONE decision, not forty.
 */
export function distinctValues(
  rows: ResolvedRow[],
  pick: (row: ResolvedRow) => string | null,
): string[] {
  const seen = new Map<string, string>();
  for (const row of rows) {
    const value = pick(row);
    if (!value) continue;
    const key = value.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, value.trim());
  }
  return [...seen.values()];
}
