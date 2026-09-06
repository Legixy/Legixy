/**
 * The honesty guarantee, made global.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every previous slice enforced honesty per feature. Reminder labels had their
 * own rule, renewal copy had `safeGuidanceDetail`, checklist states had their
 * own test. Each of those worked.
 *
 * The landing page had none, and so for eight slices it told a client that an
 * AI had analysed their portfolio, reported their financial exposure in Indian
 * rupees, and stated that nothing was expiring within 30 days while two
 * licences were. Nobody caught it, because the rule only ever covered the
 * surfaces somebody remembered to write a test for.
 *
 * So the rule stops being per-feature. These detectors are applied to every
 * centralised string in the product and to rendered page text, and adding a
 * new surface without honest copy fails the suite rather than shipping.
 *
 * ON FALSE POSITIVES
 * ------------------
 * The patterns are deliberately broad. A false positive costs one reworded
 * sentence. A false negative costs a client their licence, or tells them a
 * machine reviewed something no machine ever looked at.
 */

/** Rule 1 — this product runs no AI over the client's compliance data. */
export const AI_CLAIM_PATTERNS: RegExp[] = [
  /\bAI\s+(has\s+)?(analy[sz]ed|reviewed|scored|prioriti[sz]ed|assessed|detected)/i,
  /\b(analy[sz]ed|reviewed|scored|prioriti[sz]ed)\s+by\s+AI\b/i,
  // Both spellings: the sidebar used "Onyx AI" with a space, which an
  // OnyxAI-only pattern walked straight past.
  /\bOnyx\s?AI\b/i,
  /\bAI[- ]powered\b/i,
  /\bAI[- ]recommended\b/i,
  /\bAI[- ]generated\b/i,
  /\bintelligen(ce|t)\s+(engine|analysis|review)\b/i,
  /\bmachine learning\b/i,
  /\bour AI\b/i,
  /\bsmart\s+(analysis|review|scoring)\b/i,
  /\bcompliance score\b/i,
  /\brisk score\b/i,
  /\brisk rating\b/i,
];

/**
 * Rule 2 — Saudi Arabia. Riyals, and only riyals.
 *
 * The rupee is not hypothetical: the product shipped `₹0K` on its landing page
 * as "financial exposure", inherited from the India-market original.
 */
export const FOREIGN_CURRENCY_PATTERNS: RegExp[] = [
  /₹/,
  /\bINR\b/,
  /\bRs\.?\s?\d/,
  /\$\d/,
  /\bUSD\b/,
  /€\d/,
  /\bEUR\b/,
  /£\d/,
  /\bGBP\b/,
  /\bAED\b/,
  /\blakh\b/i,
  /\bcrore\b/i,
];

/** Rule 3 — nothing here files anything with any government authority. */
export const SUBMISSION_CLAIM_PATTERNS: RegExp[] = [
  /\bwe (will )?submit/i,
  /\bwe (will )?file\b/i,
  /\bwe (will )?renew/i,
  /\bwe(’|')ll (submit|file|renew)/i,
  /\bautomatic(ally)? (submit|submission|file|filing|renew)/i,
  /\bsubmitted for you\b/i,
  /\bfiled for you\b/i,
  /\brenewed for you\b/i,
  /\bon your behalf\b/i,
  /\bhandles? the (submission|filing)\b/i,
  /\bone[- ]click (renew|submit|filing)/i,
  // STATUS LABELS AND TRANSITION COPY.
  //
  // The renewal workflow is the easiest place in the product to break this
  // rule: a stage called "Submitted" reads as though the system submitted it.
  // A person did, at the authority's own portal, and told us afterwards.
  // These catch a bare label or a passive sentence with no actor.
  // A BARE label with no actor. The lookaheads spare the correct forms that
  // already ship: "Filed by your team" and the field label "Filed with" both
  // name who does it, and flagging them would train people to switch the
  // detector off.
  /^submitted\b(?!\s+by\b)/i,
  /^filed\b(?!\s+(by|with)\b)/i,
  /^sent to (the )?authority\b/i,
  /\bsubmitted (to|with) (the )?authorit/i,
  /\bfiled (to|with) (the )?authorit/i,
  /\bapplication (was )?submitted\b/i,
  /\bwe(’|')?ve (submitted|filed)/i,
  /\bwe have (submitted|filed)\b/i,
  /\bsubmitting (it|this|your)/i,
];

/**
 * Rule 4 — contract-analysis language has no place on a compliance surface.
 *
 * Not because the words are wrong, but because they describe a feature this
 * product no longer sells. A client looking at licence expiries should never
 * be told about clauses, liabilities or contract risk.
 */
export const CONTRACT_LANGUAGE_PATTERNS: RegExp[] = [
  /\bcontract(s)?\s+(analy[sz]|risk|expos|review)/i,
  /\bhigh[- ]risk clause/i,
  /\bclause(s)?\s+(resolved|detected|flagged)/i,
  /\bfinancial exposure\b/i,
  /\brisks? detected\b/i,
  /\bliabilit(y|ies)\s+(detected|exposure)/i,
  /\blegal review hours\b/i,
  // The sidebar shipped "Monitoring 0 active contracts for liabilities."
  // The earlier patterns missed it, which is precisely what the
  // non-vacuousness test exists to catch.
  /\bactive contracts\b/i,
  /\bcontracts?\b[^.]*\bliabilit/i,
  /\bmonitoring\s+\d+\s+.*contract/i,
];

/**
 * Rule 5 — this product serves Saudi Arabia.
 *
 * It was pivoted from an India-market contract-analysis tool, and the
 * leftovers are systematic rather than occasional: the login page claimed
 * "built for Indian founders" and "non-compliant clauses under Indian law",
 * preferences listed the jurisdiction as "India (default)", and the dashboard
 * reported exposure in rupees. A client in Riyadh reading any of it learns the
 * product was not built for them.
 *
 * Also here: social proof nobody counted. "Trusted by 500+ startups" is not a
 * fact this repository can support.
 */
export const WRONG_MARKET_PATTERNS: RegExp[] = [
  /\bIndian?\s+(law|founders?|startups?|companies|market|rupees?|Contract Act)/i,
  /\bacross India\b/i,
  /\bIndia\s*\(default\)/i,
  /\bTrusted by\s+\d+/i,
  /*
    SLICE 23. "Used by 850+ Indian startups" ships in the pre-pivot fixture and
    IS caught — but by the market pattern above, on the word "Indian", not on
    the invented count. So the guard works for the wrong reason: localise that
    string to "Used by 850+ Saudi businesses" and it passes silently, and a
    Saudi-market version is now the more likely mistake, not the less.

    A count nobody counted is untrue regardless of which country it names.

    The organisation noun is load-bearing, not decoration. The first draft of
    this pattern stopped at the number and immediately flagged "used by 1 row"
    — the importer telling you how many rows a date format appears in. Social
    proof counts ORGANISATIONS; the importer counts rows.
  */
  /\b(used|trusted|loved|chosen|backed)\s+by\s+[\d,]+\+?\s+(?:[A-Za-z][\w-]*\s+){0,2}(startups?|customers?|companies|businesses|users?|teams?|clients?|organi[sz]ations?|founders?|firms?|brands?)\b/i,
  /\b\d+\+?\s+(startups?|customers?|companies)\s+(trust|use|rely)/i,
];

/**
 * Rule 6 — never assert the customer's compliance state.
 *
 * WHY THIS IS THE MOST DANGEROUS CLASS
 * ------------------------------------
 * The five rules above are all about what the SYSTEM does. None of them
 * catches a claim about what the CUSTOMER's position is, and for a compliance
 * product that is the worst thing to get wrong.
 *
 * A tenant with no requirements configured was being shown "Every licence you
 * are expected to hold has a record." The system knew nothing about that
 * business and was reporting an all-clear. Coverage gaps exists precisely to
 * admit what is NOT known, so this inverted the feature into its opposite.
 *
 * The realistic failure: a customer imports 20 of their 47 licences,
 * configures no requirements, reads that everything expected is on record, and
 * believes they are covered. Unlike a missed reminder, nothing will ever
 * surface the error.
 *
 * THE LINE
 * --------
 * Facts about the data are fine — "You have 19 licences on record", "3 of the
 * 12 types you told us to expect have no record". Both are countable and
 * checkable.
 *
 * Claims about the business are not — "everything is covered", "nothing is
 * missing", "you are compliant". The system cannot see what it was never told
 * about, so it can never substantiate them.
 *
 * A scoped all-clear IS permitted, because the scope is the honesty:
 * "All 12 licence types you told us to expect are on record" claims only what
 * was configured, and says so.
 */
export const COMPLIANCE_CLAIM_PATTERNS: RegExp[] = [
  // The two strings that actually shipped.
  /\bevery licence (you|your organisation) (are|is) expected to hold\b/i,
  /\bevery licence type your organisation is expected to hold\b/i,
  // The same claim in its other plausible forms.
  /\bevery expected licence has a record\b/i,
  /\byou(’|')?re (fully )?(covered|compliant)\b/i,
  /\byou are (fully )?(covered|compliant)\b/i,
  /\bnothing is missing\b/i,
  /\bno(thing)? (licences?|permits?)? ?(are|is)? ?missing\b/i,
  /\bfully compliant\b/i,

  /*
    A PROMISE, not a sentence and not a score.

    Slice 22 found "Compliance today, Greater opportunities tomorrow." live on
    the login, floating over the skyline, while this scan was passing and while
    `features/auth` had been inside its boundary for fourteen slices.

    Every pattern below catches a claim about the customer's CURRENT state, and
    the score patterns catch one phrased as a metric. Neither form covers
    compliance offered as an OUTCOME THE PRODUCT DELIVERS — "compliance today",
    "a more compliant tomorrow", "stay compliant". That is the register of
    marketing copy, which is exactly where this product's claims have to be
    most careful, because DEMO.md answers "Will it tell me if I'm compliant?"
    with "No, and it deliberately never says so."

    These must NOT fire on compliance as a domain noun — "licence and
    compliance tracking", "managing your licences and compliance" — which is
    what the product legitimately is. The guard tests pin both directions.
  */
  /\bcompliance\s+(today|tomorrow|guaranteed|assured|achieved|delivered)\b/i,
  /\b(more|stays?|staying|stay|become|becoming|achieve|achieving|get)\s+compliant\b/i,
  /\bcompliance\s+(made\s+)?(simple|easy|effortless|solved|sorted)\b/i,

  /*
    A SCORE, not a sentence.

    Slice 21 found "100% ● Compliance rate" on the login, beside three
    invented figures, while the honesty scan was passing. The auth surface was
    ALREADY in the scan's boundary — `features/auth` and `app/login` have been
    listed since Slice 8. The boundary was right; the rule was incomplete.

    Every pattern above catches a compliance claim phrased as a SENTENCE.
    None caught one phrased as a metric: a percentage with a label. That is
    the form a dashboard widget takes, and it is the more dangerous form,
    because a number reads as measured rather than asserted.

    Slice 8 refused to build a compliance score and wrote down why: it treats
    "everything we track is current" as "you are compliant", which the
    coverage-gaps feature exists to contradict. No system can know the second
    from the first.
  */
  /\bcompliance (rate|score|rating|level|percentage|index)\b/i,
  /\b\d{1,3}\s*%\s*(compliant|compliance|complete|covered)\b/i,
  /\b(compliant|compliance)\s*[:\-—]?\s*\d{1,3}\s*%/i,
  /\bcompliance\s+health\b/i,
  /\ball your licences are (in order|up to date|covered)\b/i,
  /\beverything (is |you need is )?(covered|in order|up to date)\b/i,
  /\bcompletely up to date\b/i,
  /\bno gaps in your compliance\b/i,
  /\byour compliance is\b/i,
];

export interface HonestyRule {
  name: string;
  patterns: RegExp[];
  /** Why this rule exists, shown when a test fails. */
  because: string;
}

export const HONESTY_RULES: HonestyRule[] = [
  {
    name: 'no AI claim',
    patterns: AI_CLAIM_PATTERNS,
    because:
      'No AI runs over compliance data. Claiming otherwise invents a review ' +
      'that never happened.',
  },
  {
    name: 'SAR only',
    patterns: FOREIGN_CURRENCY_PATTERNS,
    because:
      'This is a Saudi product. A foreign currency symbol is a leftover from ' +
      'the India-market original.',
  },
  {
    name: 'no submission claim',
    patterns: SUBMISSION_CLAIM_PATTERNS,
    because:
      'Nothing here files with any authority. A client who believes ' +
      'otherwise stops filing, and a licence lapses.',
  },
  {
    name: 'right market',
    patterns: WRONG_MARKET_PATTERNS,
    because:
      'This product serves Saudi Arabia. India-market wording and uncounted ' +
      'social proof are leftovers from the tool it was pivoted from.',
  },
  {
    name: 'no compliance-state claim',
    patterns: COMPLIANCE_CLAIM_PATTERNS,
    because:
      'The system can only see what it was told about. Claiming the customer ' +
      'is covered, when no requirements are configured, manufactures the ' +
      'exact risk this product exists to remove — and nothing surfaces it.',
  },
  {
    name: 'no contract-analysis language',
    patterns: CONTRACT_LANGUAGE_PATTERNS,
    because:
      'The product sells licence compliance. Contract-analysis wording ' +
      'describes a feature that is not part of it.',
  },
];

export interface HonestyViolation {
  rule: string;
  pattern: string;
  because: string;
  text: string;
}

/** Every rule this text breaks. Empty means it is clean. */
export function findHonestyViolations(text: string): HonestyViolation[] {
  const violations: HonestyViolation[] = [];
  for (const rule of HONESTY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        violations.push({
          rule: rule.name,
          pattern: String(pattern),
          because: rule.because,
          // Trimmed so a failure message stays readable.
          text: text.length > 160 ? `${text.slice(0, 160)}…` : text,
        });
      }
    }
  }
  return violations;
}

export function isHonest(text: string): boolean {
  return findHonestyViolations(text).length === 0;
}
