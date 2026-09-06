import { guarded } from './population';

/**
 * Every user-facing string on the "where reminders go" screen.
 *
 * This screen is the highest-risk copy surface in the product, because it is
 * about a promise: that something reaches you before a licence lapses. Every
 * sentence here is either a fact about the current configuration or a fact
 * about what the system does. None is a forecast.
 */

export const DELIVERY_COPY = {
  /*
    RENAMED IN SLICE 25, from "Where reminders go".

    The screen now does two jobs: it says where reminders go, and it is the
    only place a second person can be put in a workspace. Its name described
    one of them, and Slice 24 flagged the risk when it chose to extend this
    screen rather than build a second people list: "a client looking to add
    Faisal may not think to look under Where reminders go."

    Measured at 1440x900 on a fresh workspace, "Add someone to this workspace"
    begins at y=802 against a 900px viewport — its heading is barely visible
    and its input and button are not. Reordering does not fix that, because
    the invite block already sits directly beneath the people list where it
    belongs; the page is simply long. A second entry point elsewhere would
    add a place without repairing this one.

    So the name changed instead. "People" is the word somebody uses when they
    want to add a colleague, and the reminders half is still stated plainly.
  */
  title: 'People and reminders',
  subtitle:
    'Reminders are worked out from each licence’s expiry date and sent to the '
    + 'person responsible for it. This is who that is.',

  // ── Channels ─────────────────────────────────────────────────────────────
  channelsHeading: 'How reminders are sent',
  channelAvailable: 'Working',
  channelUnavailable: 'Not set up',

  /**
   * WhatsApp.
   *
   * DECISION: state it, as a fact, with no timeline.
   *
   * The client asked for WhatsApp and has never been told it is unavailable.
   * He will ask during the demo. If this screen is silent, the person
   * demoing improvises — and the natural improvisation is "that's coming",
   * which is a promise the product cannot keep and which rule 4 forbids.
   *
   * A screen titled "Where reminders go" that omits the channel the client
   * believes he is getting reads as an oversight rather than an answer. So it
   * is answered here, once, in the plainest available form.
   *
   * Note what this does NOT say: not "coming soon", not "planned", not "on
   * the roadmap", not "in development". Those are all forecasts, and a
   * forecast on a compliance product is a promise. This is a statement about
   * today, and it will stop being true the day it stops being true.
   */
  whatsappHeading: 'WhatsApp',
  whatsappBody:
    'Not available. Reminders are sent by email only. If WhatsApp matters to '
    + 'you, say so — it is not something the system can do today.',

  noChannelTitle: 'No reminders are being sent',
  noChannelBody:
    'No email server is set up, so reminders are still worked out and '
    + 'scheduled — they are just not going out. Nothing is lost: everything '
    + 'waiting is sent as soon as one is set up.',

  // ── People ───────────────────────────────────────────────────────────────
  peopleHeading: 'Who gets what',
  peopleBody:
    'A licence’s reminders go to whoever is responsible for it. Change who '
    + 'that is on the licence itself.',
  licencesHeld: (n: number) =>
    n === 1 ? '1 licence' : `${n} licences`,
  holdsNothing: 'No licences',

  /**
   * Slice 12 established the honest version of this, and it still holds:
   * a user cannot change their own name or email, and saying "contact your
   * workspace admin" was worse than saying nothing, because the admin cannot
   * change it either.
   */
  addressFixed:
    'Addresses come from each person’s account. Changing them is not '
    + 'available yet.',

  // ── Unassigned ───────────────────────────────────────────────────────────
  unassignedHeading: 'Licences with nobody responsible',
  /**
   * GUARDED. This was a constant, and it shipped.
   *
   * "Every licence has someone responsible for it" is true when there are no
   * licences, and reads as an all-clear about a business the system knows
   * nothing about. Taking the population as an argument makes the empty case
   * a value rather than a render condition someone has to remember.
   */
  unassignedNone: guarded({
    surface: 'delivery — nobody responsible',
    population: 'active licences',
    render: (activeTotal: number) =>
      activeTotal === 0
        ? 'No licences are on record yet, so there is nobody to assign.'
        : 'Every licence has someone responsible for it.',
  }).render,
  /**
   * The empty tenant. unassignedCount === 0 has two causes and they are not
   * the same fact — the same distinction Slice 12 drew on the gaps page.
   *
   * "Every licence has someone responsible" is vacuously true with zero
   * licences, and reads as an all-clear about a business the system knows
   * nothing about. It is the exact shape of claim rule 6 forbids.
   */

  unassignedWithoutCopy: (n: number) =>
    n === 1
      ? '1 licence has nobody responsible. Its reminders reach no one, and are '
        + 'held until someone is assigned.'
      : `${n} licences have nobody responsible. Their reminders reach no one, `
        + 'and are held until someone is assigned.',
  unassignedWithCopy: (n: number) =>
    n === 1
      ? '1 licence has nobody responsible. Its reminders go to the copy '
        + 'address below — but nobody is accountable for it.'
      : `${n} licences have nobody responsible. Their reminders go to the copy `
        + 'address below — but nobody is accountable for them.',
  unassignedCta: 'Assign someone',

  // ── Copy address ─────────────────────────────────────────────────────────
  copyHeading: 'Send a copy to one more address',
  copyBody:
    'One address that sees everything. It is copied on every reminder, and it '
    + 'receives reminders for licences that have nobody responsible.',
  /**
   * The limit, stated where the feature is. A copy address is not a
   * substitute for assigning someone, and the interface must not let anyone
   * believe it is.
   */
  copyLimit:
    'This does not make anyone responsible for a licence. A licence with '
    + 'nobody assigned still shows as unassigned.',
  copyLabel: 'Copy address',
  copyPlaceholder: 'compliance@yourcompany.com',
  copySave: 'Save',
  copySaving: 'Saving…',
  copyRemove: 'Remove',
  copyNoneSet: 'No copy address is set.',
  copySetTo: (email: string) => `Every reminder is copied to ${email}.`,

  // ── States ───────────────────────────────────────────────────────────────
  loading: 'Loading delivery settings',
  errorResource: 'delivery settings',
} as const;

/** Every fixed string, plus the functions on representative inputs. */
export function allDeliveryCopy(): string[] {
  const fixed = Object.values(DELIVERY_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  return [
    ...fixed,
    DELIVERY_COPY.licencesHeld(1),
    DELIVERY_COPY.licencesHeld(6),
    DELIVERY_COPY.unassignedWithoutCopy(1),
    DELIVERY_COPY.unassignedWithoutCopy(3),
    DELIVERY_COPY.unassignedWithCopy(1),
    DELIVERY_COPY.unassignedWithCopy(3),
    DELIVERY_COPY.copySetTo('compliance@example.com'),
    DELIVERY_COPY.unassignedNone(0),
    DELIVERY_COPY.unassignedNone(17),
  ];
}
