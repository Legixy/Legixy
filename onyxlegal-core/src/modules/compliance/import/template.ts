import * as ExcelJS from 'exceljs';
import { FIELD_SPECS } from './domain/fields';

/**
 * The template a client fills in.
 *
 * Without one, an import fails on format before anyone gets to the interesting
 * problems. The date rule is stated in the file itself, on the sheet the
 * person is typing into — not only in documentation they will not read.
 */

const HEADERS = FIELD_SPECS.map((spec) => spec.label);

/**
 * Example rows, chosen to show the two shapes people get wrong.
 *
 * One site-level licence and one company-wide licence, because "leave the site
 * blank for company-wide" is the rule nobody guesses. Dates are written in
 * ISO, so the format is visible rather than described.
 */
const EXAMPLES: string[][] = [
  [
    'Balady Municipal Licence',
    'Balady Municipal Licence',
    'Balady',
    'Riyadh HQ',
    'BAL-2024-1187',
    '2025-09-15',
    '2026-09-15',
    'ahmed@example.com',
    'Renewed annually.',
  ],
  [
    'Commercial Registration',
    'Commercial Registration',
    'Ministry of Commerce',
    '',
    'CR-1010234567',
    '2024-03-01',
    '2027-03-01',
    'ahmed@example.com',
    'Company-wide — leave Site blank.',
  ],
  [
    'Civil Defence Certificate',
    'Civil Defence Certificate',
    'Civil Defence',
    'Jeddah Showroom',
    'CD-5521',
    '2025-11-02',
    '2026-11-02',
    '',
    'No owner yet — will import unassigned.',
  ],
];

/**
 * The one instruction that matters, repeated in both formats.
 *
 * `01/02/2026` is unreadable without knowing whose convention wrote it, so the
 * importer rejects it rather than guessing. Saying so here is cheaper than a
 * failed import.
 */
export const TEMPLATE_NOTE =
  'Dates must be written as YYYY-MM-DD, for example 2026-09-15. ' +
  'Formats like 01/02/2026 are rejected because they can be read two ways. ' +
  'Only Licence name is required. Leave Site blank for a company-wide licence.';

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildTemplateCsv(): string {
  const lines = [
    HEADERS.map(csvCell).join(','),
    ...EXAMPLES.map((row) => row.map(csvCell).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

export async function buildTemplateXlsx(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Legixy';

  const sheet = workbook.addWorksheet('Licences');
  sheet.addRow(HEADERS);
  sheet.getRow(1).font = { bold: true };

  for (const example of EXAMPLES) {
    // Written as TEXT, deliberately. If these were real date cells, Excel
    // would reformat them to the machine's locale and the person would copy
    // that format for their own rows — turning the template into the source
    // of the ambiguity it exists to prevent.
    const row = sheet.addRow(example);
    row.eachCell((cell) => {
      cell.numFmt = '@';
    });
  }

  sheet.columns = HEADERS.map((header, index) => ({
    width: Math.max(header.length + 4, index === 8 ? 34 : 22),
  }));

  // Guidance on its own sheet, so deleting the examples cannot delete it.
  const guide = workbook.addWorksheet('How to fill this in');
  guide.addRow(['Legixy licence import']);
  guide.getRow(1).font = { bold: true, size: 14 };
  guide.addRow([]);
  guide.addRow([TEMPLATE_NOTE]);
  guide.addRow([]);
  guide.addRow(['Column', 'Required', 'Notes']);
  guide.getRow(5).font = { bold: true };
  for (const spec of FIELD_SPECS) {
    guide.addRow([spec.label, spec.required ? 'Yes' : 'No', spec.help]);
  }
  guide.columns = [{ width: 30 }, { width: 12 }, { width: 70 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
