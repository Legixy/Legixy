import { distinctValues, validateRow } from './validate';
import { proposeMapping } from './fields';
import { parseCsv } from './csv';

const row = (values: Record<string, string>, n = 2) =>
  validateRow(n, values as never);

describe('import validation', () => {
  describe('THE DATE RULE — ambiguity is rejected, never guessed', () => {
    it('REJECTS 01/02/2026, which has two readings and no tiebreaker', () => {
      // The first of February to most of the world, the second of January in
      // the United States. Choosing either silently builds a reminder ladder
      // on the wrong day, with no symptom until a licence lapses.
      const result = row({ name: 'X', expiryDate: '01/02/2026' });

      expect(result.outcome).toBe('FAIL');
      expect(result.expiryDate).toBeNull();
      expect(result.issues[0].message).toMatch(/ambiguous/i);
      // The message must name the required format, not just refuse.
      expect(result.issues[0].message).toMatch(/YYYY-MM-DD/);
      expect(result.issues[0].message).toMatch(/2026-09-15/);
    });

    it.each([
      '01/02/2026',
      '1/2/2026',
      '02-01-2026',
      '01.02.2026',
      '31/12/2026',
      '12/31/2026',
      '2026/09/15',
    ])('rejects %s rather than picking a reading', (input) => {
      const result = row({ name: 'X', expiryDate: input });
      expect({
        input,
        outcome: result.outcome,
        value: result.expiryDate,
      }).toEqual({ input, outcome: 'FAIL', value: null });
    });

    it('rejects an impossible date and says so distinctly', () => {
      // 2026-13-45 is ISO-SHAPED but not a real day. The fix differs from an
      // ambiguous date, so the message differs too.
      const result = row({ name: 'X', expiryDate: '2026-13-45' });

      expect(result.outcome).toBe('FAIL');
      expect(result.issues[0].message).toMatch(/not a real calendar date/i);
      expect(result.issues[0].message).toMatch(/YYYY-MM-DD/);
    });

    it.each(['2026-02-30', '2025-02-29', '2026-00-10', '2026-04-31'])(
      'rejects the non-existent day %s',
      (input) => {
        expect(row({ name: 'X', expiryDate: input }).outcome).toBe('FAIL');
      },
    );

    it.each(['2026-09-15', '2024-02-29', '2026-01-01', '2026-12-31'])(
      'accepts the unambiguous date %s exactly as written',
      (input) => {
        const result = row({ name: 'X', expiryDate: input });
        expect(result.outcome).toBe('CREATE');
        expect(result.expiryDate).toBe(input);
      },
    );

    it('names the row so a person can find it in their spreadsheet', () => {
      const result = validateRow(12, {
        name: 'X',
        expiryDate: '01/02/2026',
      } as never);
      expect(result.rowNumber).toBe(12);
    });

    it('treats a blank date as absent, not as an error', () => {
      // No expiry is a supported state: it simply generates no reminders.
      const result = row({ name: 'X', expiryDate: '   ' });
      expect(result.outcome).toBe('CREATE');
      expect(result.expiryDate).toBeNull();
    });

    it('applies the same rule to the issue date', () => {
      expect(row({ name: 'X', issueDate: '01/02/2026' }).outcome).toBe('FAIL');
      expect(row({ name: 'X', issueDate: '2025-09-15' }).outcome).toBe(
        'CREATE',
      );
    });

    it('catches an expiry that precedes its issue date', () => {
      const result = row({
        name: 'X',
        issueDate: '2026-09-15',
        expiryDate: '2025-09-15',
      });
      expect(result.outcome).toBe('FAIL');
      expect(result.issues[0].message).toMatch(/before the issue date/i);
    });
  });

  describe('required fields', () => {
    it('fails a row with no name', () => {
      const result = row({ name: '  ', expiryDate: '2026-09-15' });
      expect(result.outcome).toBe('FAIL');
      expect(result.issues[0].field).toBe('name');
    });

    it('creates from a name alone — every other field is optional', () => {
      // A licence with only a name is a poor record but a TRUE one. Forcing an
      // expiry date would push people to invent one.
      const result = row({ name: 'Just a name' });
      expect(result.outcome).toBe('CREATE');
      expect(result.expiryDate).toBeNull();
      expect(result.rawSite).toBeNull();
      expect(result.rawOwnerEmail).toBeNull();
    });
  });

  describe('reports every problem at once', () => {
    it('does not stop at the first issue', () => {
      // Someone fixing a spreadsheet should see all of it in one pass rather
      // than re-uploading once per error.
      const result = row({
        name: '',
        issueDate: '01/02/2026',
        expiryDate: 'whenever',
        ownerEmail: 'not-an-email',
      });
      expect(result.outcome).toBe('FAIL');
      expect(result.issues.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('owner email', () => {
    it('rejects a malformed address', () => {
      expect(row({ name: 'X', ownerEmail: 'nope' }).outcome).toBe('FAIL');
    });

    it('accepts a well-formed one without asserting the user exists', () => {
      // Whether it matches a real user is resolution's job, and no match is
      // not an error — it means unassigned.
      const result = row({ name: 'X', ownerEmail: 'nobody@example.test' });
      expect(result.outcome).toBe('CREATE');
      expect(result.rawOwnerEmail).toBe('nobody@example.test');
    });
  });

  describe('distinctValues — confirm once, not once per row', () => {
    it('collapses forty rows of one type into a single decision', () => {
      const rows = Array.from({ length: 40 }, (_, i) =>
        row({ name: `L${i}`, licenseType: 'Municipality Licence' }, i + 2),
      );
      expect(distinctValues(rows, (r) => r.rawLicenseType)).toEqual([
        'Municipality Licence',
      ]);
    });

    it('treats case and surrounding space as the same value', () => {
      const rows = [
        row({ name: 'A', site: 'Riyadh HQ' }),
        row({ name: 'B', site: '  riyadh hq ' }),
        row({ name: 'C', site: 'RIYADH HQ' }),
      ];
      expect(distinctValues(rows, (r) => r.rawSite)).toHaveLength(1);
    });

    it('keeps the first spelling seen, for display', () => {
      const rows = [
        row({ name: 'A', site: 'Riyadh HQ' }),
        row({ name: 'B', site: 'riyadh hq' }),
      ];
      expect(distinctValues(rows, (r) => r.rawSite)).toEqual(['Riyadh HQ']);
    });

    it('ignores blanks', () => {
      const rows = [row({ name: 'A', site: '' }), row({ name: 'B' })];
      expect(distinctValues(rows, (r) => r.rawSite)).toEqual([]);
    });
  });
});

describe('CSV parsing', () => {
  it('returns raw strings and converts nothing', () => {
    // exceljs turns 2026-09-15 into a Date shifted by the machine timezone,
    // which moves the day. This parser must hand back exactly what was typed.
    const grid = parseCsv('name,expiryDate\nBalady,2026-09-15\n');
    expect(grid.rows[0][1]).toBe('2026-09-15');
    expect(typeof grid.rows[0][1]).toBe('string');
  });

  it('handles quoted fields containing commas', () => {
    const grid = parseCsv('name,notes\n"Balady, Riyadh",ok\n');
    expect(grid.rows[0]).toEqual(['Balady, Riyadh', 'ok']);
  });

  it('handles doubled quotes inside a quoted field', () => {
    const grid = parseCsv('name\n"He said ""hello"""\n');
    expect(grid.rows[0][0]).toBe('He said "hello"');
  });

  it('handles quoted newlines', () => {
    const grid = parseCsv('name,notes\n"A","line one\nline two"\n');
    expect(grid.rows).toHaveLength(1);
    expect(grid.rows[0][1]).toBe('line one\nline two');
  });

  it('handles CRLF', () => {
    const grid = parseCsv('name,x\r\nA,1\r\nB,2\r\n');
    expect(grid.headers).toEqual(['name', 'x']);
    expect(grid.rows).toHaveLength(2);
  });

  it('strips the BOM Excel writes, which would corrupt the first header', () => {
    const grid = parseCsv('﻿name,x\nA,1\n');
    expect(grid.headers[0]).toBe('name');
  });

  it('reads a final line with no trailing newline', () => {
    const grid = parseCsv('name,x\nA,1');
    expect(grid.rows).toEqual([['A', '1']]);
  });

  it('drops entirely blank rows', () => {
    const grid = parseCsv('name,x\nA,1\n\n\n,\nB,2\n');
    expect(grid.rows).toEqual([
      ['A', '1'],
      ['B', '2'],
    ]);
  });

  it('returns nothing usable for an empty file', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });

  it('returns headers but no rows for a header-only file', () => {
    expect(parseCsv('name,x\n')).toEqual({ headers: ['name', 'x'], rows: [] });
  });
});

describe('header mapping proposals', () => {
  it('maps the template headers exactly', () => {
    const mapping = proposeMapping([
      'Licence name',
      'Licence type',
      'Issuing authority',
      'Site',
      'Licence number',
      'Issue date',
      'Expiry date',
      'Responsible person (email)',
      'Notes',
    ]);
    expect(Object.values(mapping)).toEqual([
      'name',
      'licenseType',
      'authority',
      'site',
      'licenseNumber',
      'issueDate',
      'expiryDate',
      'ownerEmail',
      'notes',
    ]);
  });

  it("maps a client's own wording", () => {
    const mapping = proposeMapping([
      'Permit Title',
      'Valid Until',
      'Branch',
      'Assigned To',
    ]);
    expect(mapping[1]).toBe('expiryDate');
    expect(mapping[2]).toBe('site');
    expect(mapping[3]).toBe('ownerEmail');
  });

  it('proposes nothing rather than guessing at an unknown header', () => {
    // A wrong proposal is more dangerous than none: a reviewer accepts a
    // plausible guess far more readily than they notice a blank.
    const mapping = proposeMapping(['Internal Ref XYZ', 'Colour']);
    expect(mapping[0]).toBeNull();
    expect(mapping[1]).toBeNull();
  });

  it('never proposes the same field for two columns', () => {
    const mapping = proposeMapping(['Expiry date', 'Expiry date (old)']);
    const proposed = Object.values(mapping).filter(Boolean);
    expect(new Set(proposed).size).toBe(proposed.length);
  });

  it('does not mistake a notes column for a date column', () => {
    const mapping = proposeMapping(['Licence name', 'Expiry notes']);
    // "Expiry notes" contains "expiry" but is free text. It must not become
    // the expiry date, which would import prose as a date for every row.
    expect(mapping[1]).not.toBe('expiryDate');
  });

  it('is case and separator insensitive', () => {
    const mapping = proposeMapping(['LICENCE_NAME', 'expiry-date']);
    expect(mapping[0]).toBe('name');
    expect(mapping[1]).toBe('expiryDate');
  });

  it('handles a blank header', () => {
    expect(proposeMapping([''])[0]).toBeNull();
  });
});
