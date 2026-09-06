import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findHonestyViolations } from './honesty';

/**
 * The third half of the honesty guarantee: strings that reach a screen as
 * DATA rather than from a rendered file.
 *
 * WHY THIS EXISTS
 * ---------------
 * honesty.spec.ts covers centralised copy. honesty-surfaces.spec.ts reads the
 * source of every screen. Both scan `onyxlegal-web/src`, and for twelve slices
 * that was the whole boundary — so the product had a blind spot the width of a
 * database.
 *
 * The instance that surfaced it: `socialProof: 'Used by 850+ Indian startups'`
 * in prisma/seed.ts, a customer count nobody counted, of the same class Slice 8
 * removed from the landing page. It rendered from a table, so no guarantee
 * reached it.
 *
 * WHAT IS AND IS NOT IN SCOPE
 * ---------------------------
 * Only data the TEAM ships: the licence-type catalogue, the authorities, the
 * demo fixture. That is content we wrote, and it is held to the standard
 * content in a file is held to.
 *
 * CUSTOMER-SUPPLIED DATA IS DELIBERATELY EXCLUDED. If a customer names a site
 * "100% compliant", that is their record and not the product's claim, and a
 * product that edited its customers' words would be worse than one that did
 * not. Site names, licence names, organisation names and notes are theirs.
 *
 * WHAT THIS STILL DOES NOT COVER, STATED PLAINLY
 * ----------------------------------------------
 * This is a static scan of the files that WRITE the shipped rows, not of the
 * rows themselves. A row inserted by hand, by a migration, or by a future
 * script is not covered. Closing that gap means validating at the write path,
 * which is a larger piece of work than this slice claims to be.
 */

const CORE = join(__dirname, '..', '..', '..', '..', '..', 'onyxlegal-core', 'prisma');

/**
 * Files that write reference and fixture data the COMPLIANCE product renders.
 *
 * prisma/seed.ts is deliberately absent — see the quarantine test at the foot
 * of this file, which is what makes that absence safe rather than convenient.
 */
const SHIPPED_DATA = ['catalogue.ts', 'demo-reset.ts', 'seed-compliance.ts'];

/** The pre-pivot contract fixture, exempt only because it cannot run. */
const QUARANTINED = 'seed.ts';
const OPT_IN = 'ALLOW_PREPIVOT_CONTRACT_FIXTURE';

/** Quoted literals, including template literals: the shape seed data takes. */
function visibleText(source: string): string[] {
  const withoutComments = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
  return [
    ...[...withoutComments.matchAll(/'([^'\\\n]{4,})'/g)].map((m) => m[1]),
    ...[...withoutComments.matchAll(/"([^"\\\n]{4,})"/g)].map((m) => m[1]),
    ...[...withoutComments.matchAll(/`([^`\\]{4,}?)`/g)].map((m) => m[1]),
  ];
}

describe('honesty guarantee — shipped reference data', () => {
  it('finds the data files it claims to scan', () => {
    // A path typo would silently make this suite scan nothing, which is the
    // exact failure mode it exists to correct.
    for (const file of [...SHIPPED_DATA, QUARANTINED]) {
      expect({ file, found: existsSync(join(CORE, file)) }).toEqual({
        file,
        found: true,
      });
    }
    const strings = SHIPPED_DATA.flatMap((f) =>
      visibleText(readFileSync(join(CORE, f), 'utf8')),
    );
    expect(strings.length).toBeGreaterThan(100);
  });

  for (const file of SHIPPED_DATA) {
    it(`${file} writes nothing untrue`, () => {
      const violations = visibleText(readFileSync(join(CORE, file), 'utf8'))
        .flatMap((text) =>
          findHonestyViolations(text).map((v) => ({
            rule: v.rule,
            text: text.slice(0, 80),
          })),
        );
      expect(violations).toEqual([]);
    });
  }

  /**
   * Non-vacuous in the other direction. Saudi authority names, their Arabic
   * names and the document checklist labels are the product's actual subject
   * matter and must remain sayable.
   */
  it('leaves legitimate reference data alone', () => {
    for (const honest of [
      'Balady',
      'بلدي',
      'Ministry of Commerce',
      'وزارة التجارة',
      'Civil Defence',
      'Current CR certificate',
      'شهادة السجل التجاري',
      'Commercial Registration',
    ]) {
      expect({ honest, flagged: findHonestyViolations(honest).length > 0 }).toEqual(
        { honest, flagged: false },
      );
    }
  });

  /**
   * The quarantine is the mitigation for the one file this guarantee exempts.
   * If the guard is removed, this fails and the exemption stops being safe.
   */
  describe('the pre-pivot contract fixture', () => {
    const source = readFileSync(join(CORE, QUARANTINED), 'utf8');

    it('is still untrue, which is why it must not run', () => {
      const violations = visibleText(source).flatMap((t) =>
        findHonestyViolations(t),
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('refuses to run without an explicit opt-in', () => {
      expect(source).toContain(OPT_IN);
      expect(source).toContain('process.exit(1)');
      // The guard has to be CALLED, not merely defined.
      expect(source).toMatch(/async function main\(\)[\s\S]{0,80}refuseUnlessOptedIn\(\)/);
    });

    it('catches the string that actually shipped, verbatim', () => {
      const violations = findHonestyViolations('Used by 850+ Indian startups');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.map((v) => v.rule)).toContain('right market');
    });

    /**
     * The shipped string is caught on the word "Indian", not on the invented
     * count. Localising it must not make it pass.
     */
    it('catches an uncounted claim that names no country', () => {
      for (const bad of [
        'Used by 850+ startups',
        'Used by 850+ Saudi businesses',
        'Trusted by 400+ B2B companies',
        'Loved by 400+ businesses',
      ]) {
        expect({ bad, caught: findHonestyViolations(bad).length > 0 }).toEqual({
          bad,
          caught: true,
        });
      }
    });
  });
});
