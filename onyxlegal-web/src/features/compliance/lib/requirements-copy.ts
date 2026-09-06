/**
 * Every user-facing string on the requirements surface.
 *
 * Centralised so honesty.spec.ts can read it — and this surface in particular,
 * because it is the one that decides whether the gaps page can say anything at
 * all. Copy here must never imply the list is complete, or that declaring
 * nothing means nothing is missing.
 */

export const REQUIREMENTS_COPY = {
  back: 'Not on record',
  /*
    Matches the nav and the link that reaches it ("Choose what to expect").
    The screen had three names for itself, the same defect as the gaps screen
    and found the same way — by reading the rendered h1 rather than the file.
  */
  title: 'What to expect',
  subtitle:
    'Tick the licences and permits your business is required to have. Anything '
    + 'ticked with no matching record becomes a gap. Nothing is assumed for '
    + 'you — this list is the only thing that tells us what to look for.',

  searchPlaceholder: 'Search licence types',
  selectedCount: (n: number) =>
    n === 0
      ? 'Nothing selected yet'
      : n === 1
        ? '1 type selected'
        : `${n} types selected`,

  entityHeading: 'Company-wide',
  entitySubtitle:
    'Held once by the business, not by any single location.',

  siteHeading: 'At every site',
  /**
   * States the model's actual behaviour rather than letting someone infer a
   * per-site setting that does not exist. A requirement is unique on
   * (tenantId, licenseTypeId) with no siteId.
   */
  siteSubtitle:
    'Expected at each of your active sites. Selecting one here applies it to '
    + 'every site, not just one.',

  expectedBadge: 'Expected',

  /*
    WAS: "Anything selected with no matching record now shows on coverage gaps".

    Two corrections. "coverage gaps" was a survivor of the Slice 22 rename —
    the feature is called "Not on record" in the nav, the page title, the
    dashboard card and the breadcrumb, and this link was the last place still
    using the old name.

    And "now shows" was a promise the product no longer keeps, deliberately:
    once the register is empty, declaring a type does NOT produce a gap,
    because everything is missing by definition at that point. The sentence
    now states the precondition instead of asserting the outcome.
  */
  thenWhat:
    'Once you have licences on record, anything selected without a matching ' +
    'one shows on',
  seeGaps: 'Not on record',
} as const;

/** Every string here, plus the functions on representative inputs. */
export function allRequirementsCopy(): string[] {
  const fixed = Object.values(REQUIREMENTS_COPY).filter(
    (v): v is string => typeof v === 'string',
  );
  return [
    ...fixed,
    REQUIREMENTS_COPY.selectedCount(0),
    REQUIREMENTS_COPY.selectedCount(1),
    REQUIREMENTS_COPY.selectedCount(12),
  ];
}
