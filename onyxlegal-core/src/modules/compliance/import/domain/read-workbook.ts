import * as ExcelJS from 'exceljs';
import { parseCsv, ParsedGrid } from './csv';

/** Rejected before parsing. Parsing a huge file is itself the attack. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 1000;

export type ImportFormat = 'csv' | 'xlsx';

/**
 * A spreadsheet cell that is genuinely date-typed, rendered as YYYY-MM-DD.
 *
 * Excel stores 15 September 2026 as midnight LOCAL time, so the same value in
 * a positive-offset zone has a UTC instant on the 14th. Calling toISOString()
 * would therefore move every date in the file back a day — the exact bug this
 * project has already fixed twice elsewhere. The local components are what the
 * spreadsheet means, so those are what is read.
 */
function dateCellToPlainDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Every cell becomes a string, and every conversion is explicit.
 *
 * Nothing here guesses at a date: a text cell stays text and is judged later
 * by the one strict rule in validate.ts. Only a real date-typed cell is
 * converted, because its ambiguity was resolved when it was typed in.
 */
function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return dateCellToPlainDate(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Rich text, formulas and hyperlinks arrive as objects. Take the displayed
  // text; never the formula, which is not what the person sees.
  if (typeof value === 'object') {
    const candidate = value as {
      text?: unknown;
      result?: unknown;
      richText?: { text: string }[];
      hyperlink?: unknown;
    };
    if (Array.isArray(candidate.richText)) {
      return candidate.richText.map((part) => part.text).join('');
    }
    if (typeof candidate.text === 'string') return candidate.text;
    if (candidate.result instanceof Date) {
      return dateCellToPlainDate(candidate.result);
    }
    if (
      typeof candidate.result === 'string' ||
      typeof candidate.result === 'number'
    ) {
      return String(candidate.result);
    }
  }
  return '';
}

export class ImportReadError extends Error {}

/**
 * Reads an uploaded file into a header row and raw string rows.
 *
 * CSV does NOT go through exceljs. Its CSV reader coerces `2026-09-15` into a
 * Date shifted by the machine's timezone, which silently changes the day. See
 * domain/csv.ts.
 */
export async function readWorkbook(
  data: Buffer,
  format: ImportFormat,
): Promise<ParsedGrid> {
  if (data.length === 0) {
    throw new ImportReadError('That file is empty.');
  }
  if (data.length > MAX_IMPORT_BYTES) {
    throw new ImportReadError(
      `Files must be ${Math.floor(MAX_IMPORT_BYTES / (1024 * 1024))}MB or smaller.`,
    );
  }

  if (format === 'csv') {
    return parseCsv(data.toString('utf8'));
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(data as unknown as ExcelJS.Buffer);
  } catch {
    // Never surface the library's internal error: it leaks paths and tells a
    // person nothing they can act on.
    throw new ImportReadError(
      'That file could not be read as a spreadsheet. Save it as .xlsx or .csv and try again.',
    );
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ImportReadError('That spreadsheet has no sheets.');

  const grid: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    // `row.cellCount` ignores trailing empties, which would ragged-edge the
    // grid and misalign columns against the header.
    for (let column = 1; column <= sheet.columnCount; column += 1) {
      cells.push(cellToString(row.getCell(column).value));
    }
    grid.push(cells);
  });

  if (grid.length === 0) return { headers: [], rows: [] };

  const [headers, ...rows] = grid;
  return {
    headers: headers.map((header) => header.trim()),
    rows: rows.filter((row) => row.some((cell) => cell.trim() !== '')),
  };
}
