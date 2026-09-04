import { describe, expect, it } from 'vitest';
import { POPULATION_GUARDED, UNIVERSAL_CLAIM } from './population';

// Importing the copy modules is what registers their guarded entries.
import './dashboard-copy';
import './delivery-copy';
import './format';

/**
 * The vacuous-truth guard.
 *
 * Honesty rule 6 catches strings that claim a compliance state. It cannot
 * catch a string that is TRUE and empty — "every licence has an owner", said
 * to someone with no licences. That shape has shipped twice, on two different
 * newly built surfaces, and was caught both times by hand rather than by a
 * test.
 *
 * These are the tests the brief numbers 1–5.
 */

/** The two strings that actually shipped, verbatim. */
const SHIPPED = {
  gaps: 'Everything on your list is on record',
  delivery: 'Every licence has someone responsible for it.',
} as const;

describe('vacuous truth — the detector', () => {
  // ── 1 and 2 ──────────────────────────────────────────────────────────────
  it('catches both strings that actually shipped', () => {
    expect(UNIVERSAL_CLAIM.test(SHIPPED.gaps)).toBe(true);
    expect(UNIVERSAL_CLAIM.test(SHIPPED.delivery)).toBe(true);
  });

  // ── 3 ────────────────────────────────────────────────────────────────────
  /**
   * Non-vacuousness, both directions.
   *
   * A detector that matched everything would "pass" tests 1 and 2 while
   * proving nothing, so it must also NOT fire on the sentences that are
   * legitimate — including the scoped all-clear Slice 12 shipped as the FIX,
   * and ordinary prose that happens to contain the word "every".
   */
  it('does not fire on headings, buttons, rules or negatives', () => {
    for (const honest of [
      // Headings and labels — no assertion at all.
      'At every site',
      'View all sites',
      'Everything on your list', // a quantifier with no verb asserts nothing
      // A rule about behaviour, not a claim about a population.
      'This replaces the date on the record and rebuilds every reminder from it.',
      'Reminders appear here as each licence reaches 90, 60, 30, 14 and 7 days before it expires.',
      // Plain negatives.
      'No licences are on record yet, so there is nobody to assign.',
      'Nothing here yet means nothing has been entered, not that nothing is due.',
    ]) {
      expect({ honest, flagged: UNIVERSAL_CLAIM.test(honest) }).toEqual({
        honest,
        flagged: false,
      });
    }
  });

  /**
   * A count does not save a claim from being vacuous.
   *
   * "All 12 licence types … are on record" is honest — Slice 12 shipped it as
   * the FIX, and its honesty is the named count. But the same sentence at
   * zero reads "All 0 licences across 3 sites are current", which is the bug
   * Slice 17's inventory found on the sites page. So the detector fires on
   * the scoped form too, and the registry is what proves no guard emits one
   * at population zero.
   */
  it('fires on a scoped claim as well, which is why the registry is the guard', () => {
    expect(UNIVERSAL_CLAIM.test('All 12 licence types you told us to expect are on record.')).toBe(true);
    expect(UNIVERSAL_CLAIM.test('All 0 licences across 3 sites are current.')).toBe(true);
  });
});

describe('vacuous truth — every guarded all-clear', () => {
  it('has entries to check', () => {
    // Guards against the loop below silently testing nothing, which is how a
    // registry-based test quietly stops working.
    expect(POPULATION_GUARDED.length).toBeGreaterThanOrEqual(4);
  });

  // ── 4 ────────────────────────────────────────────────────────────────────
  for (const entry of POPULATION_GUARDED) {
    it(`says something else at zero: ${entry.surface}`, () => {
      const empty = entry.render(0);

      expect({
        surface: entry.surface,
        population: entry.population,
        atZero: empty,
        makesUniversalClaim: UNIVERSAL_CLAIM.test(empty),
      }).toEqual({
        surface: entry.surface,
        population: entry.population,
        atZero: empty,
        makesUniversalClaim: false,
      });
    });

    // ── 5 ──────────────────────────────────────────────────────────────────
    it(`still says something useful when the population exists: ${entry.surface}`, () => {
      const populated = entry.render(12);
      expect(populated.length).toBeGreaterThan(0);
      // The empty and populated cases must be DIFFERENT sentences. A guard
      // that returns the same string either way is a guard in name only.
      expect(populated).not.toBe(entry.render(0));
    });
  }

});
