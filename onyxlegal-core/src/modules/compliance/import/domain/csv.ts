/**
 * CSV parsing, written here rather than taken from a library.
 *
 * WHY NOT exceljs, WHICH IS ALREADY A DEPENDENCY
 * ----------------------------------------------
 * Because it silently rewrites dates. Reading a CSV containing `2026-09-15`
 * through `workbook.csv.readFile` on a machine at UTC+5:30 returns a JS Date
 * of `2026-09-14T18:30:00.000Z` — the fifteenth has become the fourteenth.
 * That was measured, not assumed.
 *
 * A confidently wrong expiry date is the single worst output this product can
 * produce: it generates reminders for a day that is not the day, and the user
 * has no way to tell. So the CSV path returns raw strings and nothing else,
 * and every interpretation happens in one place we control.
 *
 * This is a deliberately small RFC 4180 reader: quoted fields, doubled quotes
 * inside them, and both line endings. It does not attempt escapes, embedded
 * charsets or dialect sniffing, because a template we publish does not need
 * them and guessing is the failure mode being avoided.
 */

/** A parsed sheet: the header row, then data rows of raw cell strings. */
export interface ParsedGrid {
  headers: string[];
  rows: string[][];
}

/** Strips a UTF-8 BOM, which Excel writes and which corrupts the first header. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsv(text: string): ParsedGrid {
  const source = stripBom(text);
  const records: string[][] = [];

  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  let sawAnyChar = false;

  const endField = () => {
    record.push(field);
    field = '';
  };
  const endRecord = () => {
    endField();
    // A trailing newline must not produce a phantom empty record.
    const isBlank = record.length === 1 && record[0].trim() === '';
    if (!isBlank) records.push(record);
    record = [];
  };

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    sawAnyChar = true;

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      endField();
    } else if (char === '\n') {
      endRecord();
    } else if (char === '\r') {
      // CRLF: the \n on the next pass closes the record.
      if (source[i + 1] !== '\n') endRecord();
    } else {
      field += char;
    }
  }

  // Flush whatever the last line left behind, when the file has no trailing
  // newline.
  if (sawAnyChar && (field !== '' || record.length > 0)) endRecord();

  if (records.length === 0) return { headers: [], rows: [] };

  const [headers, ...rows] = records;
  return {
    headers: headers.map((h) => h.trim()),
    // Drop rows that are entirely empty — a spreadsheet exported with a
    // thousand blank lines should not become a thousand failures.
    rows: rows.filter((row) => row.some((cell) => cell.trim() !== '')),
  };
}
