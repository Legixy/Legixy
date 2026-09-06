import { guarded } from './population';

/**
 * Every user-facing string on the compliance dashboard.
 *
 * Centralised for the same reason renewal-copy.ts is: so a test can read all
 * of it. The landing page told a client for eight slices that an AI had
 * analysed their portfolio, because its strings lived inline in JSX where
 * nothing could scan them.
 *
 * See honesty.ts for the rules every string here is held to.
 */

export const DASHBOARD_COPY = {
  greeting: (firstName: string) => `Welcome back, ${firstName}`,
  subtitle: 'Here is where your licences stand today.',

  // ── Portfolio ────────────────────────────────────────────────────────────
  portfolioHeading: 'Your licences',
  totalLabel: 'Tracked',
  totalHint: 'Active licences on record',
  expiredLabel: 'Expired',
  expiredHint: 'Past their expiry date',
  criticalLabel: 'Action needed',
  criticalHint: 'Expiring within a month',
  expiringSoonLabel: 'Coming up',
  expiringSoonHint: 'Expiring within three months',

  /**
   * The reconciliation line. Slice 7 found the sites page reads "3 of 15
   * licences" where 15 counts only site-scoped ones — defensible there, but a
   * client subtracting numbers across two screens deserves an explanation
   * rather than a discrepancy.
   */
  splitNote: (atSites: number, entityWide: number) =>
    `${atSites} held at sites, ${entityWide} company-wide. ` +
    `The sites view shows the ${atSites} attached to a location.`,

  /**
   * GUARDED. Reachable only when total >= 1 today — the dashboard renders
   * EmptyDashboard above it — but the guard makes that structural rather
   * than a property of one component's ternary order.
   */
  allClear: guarded({
    surface: 'dashboard — nothing needs attention',
    population: 'active licences',
    render: (total: number) =>
      total === 0
        ? 'No licences are on record yet.'
        : 'Nothing needs attention today.',
  }).render,

  // ── Coverage gaps ────────────────────────────────────────────────────────
  gapsHeading: 'Not yet on record',

  /**
   * Zero gaps has TWO causes and they are not the same fact.
   *
   * Nothing declared means the system has no basis for an opinion. Saying
   * "every expected licence has a record" there told a brand-new tenant they
   * were covered when nothing was known about them at all.
   */
  gapsNotConfigured: 'You have not told us which licences to expect.',
  gapsNotConfiguredHint:
    'Until you do, this cannot tell you what is missing — only what is '
    + 'already on record.',
  gapsConfigure: 'Choose what to expect',
  /**
   * A scoped all-clear. The scope is the honesty — an unscoped "Nothing
   * missing" claims something about the business rather than about the list.
   */
  /**
   * GUARDED. Slice 12 made this correct by pairing it with a NOT_CONFIGURED
   * branch; guarding it here means the pairing cannot be forgotten by the
   * next surface that reuses the string.
   */
  gapsSatisfiedTitle: guarded({
    surface: 'gaps — all satisfied',
    population: 'declared requirements',
    render: (requirementCount: number) =>
      requirementCount === 0
        ? 'You have not told us which licences to expect'
        : 'Everything on your list is on record',
  }).render,
  gapsAllSatisfied: (n: number) =>
    n === 1
      ? 'The 1 licence type you told us to expect is on record.'
      : `All ${n} licence types you told us to expect are on record.`,
  /**
   * DECLARED, BUT THE REGISTER IS EMPTY.
   *
   * Slice 25. A customer who ticked two boxes on "What to expect" and had not
   * yet entered anything was told two expected licences had no record at all.
   * True by the letter and the wrong thing to say: at that moment everything
   * is missing by definition, and the product's sharpest feature was firing at
   * someone who had done nothing wrong.
   *
   * It is deliberately NOT an all-clear and deliberately NOT guarded, because
   * it makes no claim at all — it restates the declaration and says the
   * register is empty. The shape follows the year-ahead's line, which has said
   * this correctly since Slice 16: "an empty year here means nothing has been
   * entered, not that nothing is due."
   */
  gapsNothingEnteredTitle: 'Nothing is on record yet',
  gapsNothingEntered: (n: number) =>
    n === 1
      ? 'You told us to expect 1 licence type. Nothing has been entered yet, ' +
        'so there is nothing to compare it against.'
      : `You told us to expect ${n} licence types. Nothing has been entered ` +
        'yet, so there is nothing to compare them against.',
  gapsNothingEnteredCta: 'Add a licence',
  gapsNothingEnteredHint:
    'Add a licence and this page will show which of them are still missing.',

  gapsCount: (n: number) =>
    n === 1
      ? '1 expected licence has no record at all.'
      : `${n} expected licences have no record at all.`,
  gapsHint:
    'This is about missing records, not expiry. Nothing can be tracked ' +
    'until it is entered.',
  gapsCta: 'See what is missing',

  // ── Ownership ────────────────────────────────────────────────────────────
  ownershipHeading: 'Who holds the licences',
  unassignedLabel: 'Unassigned',
  unassignedWarning: (n: number) =>
    n === 1
      ? '1 licence has nobody responsible, so no reminder can reach anyone.'
      : `${n} licences have nobody responsible, so no reminder can reach anyone.`,
  concentration: (name: string, percent: number) =>
    `${name} holds ${percent}% of assigned licences.`,
  /** The Slice 5 disclosure fix: never imply the list is complete. */
  otherOwners: (owners: number, licences: number) =>
    owners === 1
      ? `1 other person holds ${licences} more.`
      : `${owners} other people hold ${licences} more between them.`,
  ownershipNone: 'No licences are assigned yet.',

  // ── Reminders ────────────────────────────────────────────────────────────
  remindersHeading: 'Reminders in the next 30 days',
  remindersNone: 'No reminders are due in the next 30 days.',
  remindersCount: (n: number) =>
    n === 1 ? '1 reminder scheduled' : `${n} reminders scheduled`,
  reminderNoRecipient: 'No one assigned',

  // ── Sites ────────────────────────────────────────────────────────────────
  sitesHeading: 'Your sites',
  sitesSummary: (total: number, withLicences: number) =>
    `${total} ${total === 1 ? 'site' : 'sites'}, ${withLicences} with licences on record.`,
  sitesCta: 'View all sites',
  sitesNone: 'No sites yet.',

  // ── States ───────────────────────────────────────────────────────────────
  loading: 'Loading your licences…',
  errorTitle: 'Could not load your dashboard',
  errorBody: 'Something went wrong fetching your licences. Try again.',
  errorRetry: 'Try again',
  /**
   * The first-run path.
   *
   * A new tenant previously landed here with exactly one action — "Add a
   * licence", one at a time — while a real customer has dozens across many
   * sites. Import existed but was buried on the Licences page, and the
   * dependency order (sites before site-scoped licences, requirements before
   * gaps mean anything) was never disclosed anywhere.
   *
   * Three steps, in the order they actually depend on each other. Not a
   * wizard: nothing here persists, tracks completion, or blocks a step. The
   * order is advice, and every step is reachable at any time.
   */
  /**
   * What is already true, shown on the step that is already satisfied.
   *
   * These state a COUNT, never a judgment: "4 sites added" is a fact about
   * the register. "You're all set" would be a claim about the business.
   */
  step1Done: (n: number) =>
    n === 1 ? '1 site added.' : `${n} sites added.`,
  step3Done: (n: number) =>
    n === 1
      ? '1 licence type declared.'
      : `${n} licence types declared.`,

  emptyTitle: 'Let’s get your licences in',
  emptyBody:
    'Three steps. The order matters a little — sites first, because a licence '
    + 'usually belongs to one.',

  step1Title: 'Add your sites',
  step1Body:
    'Every location that holds its own licences. Skip it if everything is '
    + 'company-wide.',
  step1Cta: 'Add a site',

  step2Title: 'Bring in your licences',
  step2Body:
    'Upload the spreadsheet you already keep. You will match up your columns '
    + 'and check everything before anything is saved.',
  step2Cta: 'Import a spreadsheet',
  step2Alt: 'or add one by hand',

  step3Title: 'Say what you are expected to hold',
  step3Body:
    'Tick the licence types your business needs. Until you do, this cannot '
    + 'tell you what is missing — only what is already on record.',
  step3Cta: 'Choose what to expect',
} as const;

/** The currency this product uses. There is no other. */
export const CURRENCY = 'SAR';

export function formatSar(amount: string | number | null): string {
  if (amount === null || amount === '') return 'Not recorded';
  return `${CURRENCY} ${amount}`;
}

/**
 * Every fixed string in this module, flattened, with the functions called on
 * representative inputs. The honesty spec walks this list, so a new string
 * added here is checked the moment it is added.
 */
export function allDashboardCopy(): string[] {
  const fixed = Object.values(DASHBOARD_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  const generated = [
    DASHBOARD_COPY.greeting('Demo'),
    DASHBOARD_COPY.splitNote(15, 4),
    DASHBOARD_COPY.gapsCount(1),
    DASHBOARD_COPY.gapsCount(3),
    DASHBOARD_COPY.gapsSatisfiedTitle(0),
    DASHBOARD_COPY.gapsSatisfiedTitle(12),
    DASHBOARD_COPY.allClear(0),
    DASHBOARD_COPY.allClear(17),
    DASHBOARD_COPY.gapsAllSatisfied(1),
    DASHBOARD_COPY.gapsAllSatisfied(12),
    DASHBOARD_COPY.unassignedWarning(1),
    DASHBOARD_COPY.unassignedWarning(3),
    DASHBOARD_COPY.concentration('Ahmed Al-Rashid', 81),
    DASHBOARD_COPY.otherOwners(1, 2),
    DASHBOARD_COPY.otherOwners(3, 7),
    DASHBOARD_COPY.remindersCount(1),
    DASHBOARD_COPY.remindersCount(9),
    DASHBOARD_COPY.sitesSummary(5, 4),
    DASHBOARD_COPY.sitesSummary(1, 1),
    formatSar(2000),
    formatSar(null),
  ];

  return [...fixed, ...generated];
}
