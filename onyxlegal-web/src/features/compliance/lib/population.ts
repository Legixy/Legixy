/**
 * The vacuous-truth guard.
 *
 * THE CLASS THIS EXISTS TO CLOSE
 * ------------------------------
 * Twice now this product has shipped a sentence that was true, meaningless,
 * and read as reassurance:
 *
 *   Slice 12, coverage gaps:
 *     "Everything on your list is on record"
 *     ...said to a tenant that had declared nothing.
 *
 *   Slice 16, where reminders go:
 *     "Every licence has someone responsible for it."
 *     ...said to a tenant holding zero licences.
 *
 * Both are universally quantified over an empty set, so both are TRUE. Both
 * passed the honesty scan, because honesty rule 6 catches strings that claim
 * a compliance state and neither string claims one — it claims a property of
 * a set. Both were caught late, by hand, by someone opening an empty tenant.
 *
 * Two occurrences by the same mechanism is a class.
 *
 * WHY A REGISTRY AND NOT A SOURCE SCAN
 * ------------------------------------
 * The bug is not in the string. "Every licence has someone responsible for
 * it" is a fine sentence; it was rendered in the wrong state. A scan over
 * copy modules cannot see render conditions, and a scan over JSX cannot
 * evaluate them.
 *
 * A DOM assertion would see it, but this project deliberately has no jsdom
 * and no testing-library — vitest runs in node over `src/**\/*.spec.ts`.
 *
 * So the guard is structural in a different way: an all-clear is not allowed
 * to be a CONSTANT. It must be a function of the population it quantifies
 * over, which forces the caller to have that number in hand, and makes the
 * empty case a value a test can simply ask for.
 *
 *     unassignedNone: 'Every licence has someone responsible.'   ← was this
 *     unassignedNone: (total) => total === 0 ? '…' : 'Every…'    ← now this
 *
 * The test then walks this registry and asserts that no entry returns a
 * universal claim at population zero. That is checkable, it is not a matter
 * of anyone remembering, and it fails the moment someone adds a thirteenth
 * surface with the same shape.
 */

/**
 * A universal claim about the CURRENT STATE of a population.
 *
 * Both shipped bugs have the same grammar: a quantifier, a population noun,
 * and a present-tense state verb.
 *
 *   "Everything on your list IS on record"
 *   "Every licence HAS someone responsible for it"
 *
 * The verb is what makes it an assertion rather than a description, and it
 * is what makes it vacuous when the population is empty. Without it, the
 * pattern matches headings ("At every site"), buttons ("Everything is
 * gathered" — an action, not a claim), advice ("skip it if everything is
 * company-wide") and possessives ("each licence's expiry date"). An earlier
 * version of this regex matched all of those: nine false positives against
 * zero true ones.
 *
 * Deliberately still imprecise in one direction — it can flag a sentence
 * that is not about data. That is why it is used to check the OUTPUT of
 * registered guards, where the surrounding meaning is known, rather than
 * scanned across every string in the product.
 */
export const UNIVERSAL_CLAIM =
  /\b(every|everything|all|each)\b[^.!?]{0,44}?\b(is|are|has|have)\b/i;

export interface PopulationGuarded {
  /** Where this string appears, for the failure message. */
  surface: string;
  /** What the population counts. */
  population: string;
  /** The string rendered for a given population size. */
  render: (population: number) => string;
}

/**
 * Every all-clear in the product that quantifies over a population.
 *
 * Adding a surface that says "all/every X are Y" without adding it here is
 * the mistake this file exists to prevent — and `population.spec.ts` also
 * checks the copy modules for constants that look like unguarded all-clears,
 * so the registry cannot simply be bypassed by not registering.
 */
export const POPULATION_GUARDED: PopulationGuarded[] = [];

/** Register a guarded all-clear. Called by the copy modules themselves. */
export function guarded(entry: PopulationGuarded): PopulationGuarded {
  POPULATION_GUARDED.push(entry);
  return entry;
}
