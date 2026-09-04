import { parseCsv } from './csv';
import { validateRow } from './validate';
import { toPrismaDate, fromPrismaDate } from '../../domain/plain-date';

/**
 * An imported date must mean the same day whatever the server's clock says.
 *
 * Two timezone bugs have already been fixed in this project, and a third was
 * found while building this slice: exceljs's CSV reader turns `2026-09-15`
 * into `2026-09-14T18:30:00.000Z` at UTC+5:30. So the whole path — parse,
 * validate, convert for storage, read back — is exercised under several
 * timezones rather than assumed to be safe.
 */
describe('imported dates survive the server timezone', () => {
  const ORIGINAL_TZ = process.env.TZ;

  afterEach(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  const ZONES = [
    'UTC',
    'Asia/Riyadh', // +03, the tenant's own zone
    'Asia/Kolkata', // +05:30, where the exceljs shift was measured
    'Pacific/Kiritimati', // +14, the largest positive offset in use
    'America/Los_Angeles', // -07/-08
    'Pacific/Niue', // -11
  ];

  it.each(ZONES)('round-trips 2026-09-15 unchanged under TZ=%s', (zone) => {
    process.env.TZ = zone;

    const grid = parseCsv('Licence name,Expiry date\nX,2026-09-15\n');
    const row = validateRow(2, {
      name: grid.rows[0][0],
      expiryDate: grid.rows[0][1],
    } as never);

    expect(row.outcome).toBe('CREATE');
    expect(row.expiryDate).toBe('2026-09-15');

    // The conversion the service performs before writing, and the one the
    // API performs when reading back.
    const stored = toPrismaDate(row.expiryDate!);
    expect(stored.toISOString().slice(0, 10)).toBe('2026-09-15');
    expect(fromPrismaDate(stored)).toBe('2026-09-15');
  });

  it.each(ZONES)('holds at a year boundary under TZ=%s', (zone) => {
    // 1 January is where an off-by-one timezone error changes the YEAR, not
    // just the day, so it is the most visible failure.
    process.env.TZ = zone;

    const row = validateRow(2, {
      name: 'X',
      expiryDate: '2027-01-01',
    } as never);
    const stored = toPrismaDate(row.expiryDate!);

    expect(fromPrismaDate(stored)).toBe('2027-01-01');
    expect(stored.toISOString().slice(0, 10)).toBe('2027-01-01');
  });

  it('rejects an ambiguous date identically in every timezone', () => {
    for (const zone of ZONES) {
      process.env.TZ = zone;
      const row = validateRow(2, {
        name: 'X',
        expiryDate: '01/02/2026',
      } as never);
      expect({ zone, outcome: row.outcome }).toEqual({ zone, outcome: 'FAIL' });
    }
  });
});
