import type { ReminderStatus } from '@/lib/api';
import { describe, expect, it } from 'vitest';
import {
  AI_CLAIM_PATTERNS,
  CONTRACT_LANGUAGE_PATTERNS,
  findHonestyViolations,
  FOREIGN_CURRENCY_PATTERNS,
  HONESTY_RULES,
  isHonest,
  SUBMISSION_CLAIM_PATTERNS,
  WRONG_MARKET_PATTERNS,
} from './honesty';
import { allDashboardCopy, DASHBOARD_COPY } from './dashboard-copy';
import { allFrontendRenewalCopy } from './renewal-copy';
import { allImportCopy, IMPORT_COPY } from './import-copy';
import { allDeliveryCopy, DELIVERY_COPY } from './delivery-copy';
import { allYearAheadCopy, YEAR_AHEAD_COPY } from './year-ahead-copy';
import { allLicensesCopy, LICENSES_COPY } from './licenses-copy';
import { allNewLicenseCopy, NEW_LICENSE_COPY } from './new-license-copy';
import { allSiteFormCopy, SITE_FORM_COPY } from './site-form-copy';
import {
  allRequirementsCopy,
  REQUIREMENTS_COPY,
} from './requirements-copy';
import {
  allRenewalWorkflowCopy,
  RENEWAL_WORKFLOW_COPY,
  stagePresentation,
} from './renewal-workflow-copy';
import {
  allNotificationCopy,
  deliveryPresentation,
  NOTIFICATION_COPY,
} from './notification-copy';

/**
 * The global honesty guarantee.
 *
 * Per-feature tests stay. This one covers every centralised string in the
 * product at once, so a new surface cannot ship dishonest copy simply because
 * nobody remembered to write a test for it — which is exactly how the landing
 * page claimed an AI analysed the portfolio for eight slices.
 */
describe('honesty guarantee — global', () => {
  /**
   * NON-VACUOUSNESS.
   *
   * Slice 5 threw away a concurrency test that passed with the mechanism
   * disabled. The same standard applies here: if these known-bad strings did
   * not trip the detector, every assertion below would pass while catching
   * nothing. Each string is drawn from copy this product actually shipped, or
   * from the nearest plausible variant.
   */
  describe('the detector is not vacuous', () => {
    const KNOWN_BAD: Array<[string, string]> = [
      // Shipped verbatim on the landing page.
      [
        'no AI claim',
        'OnyxAI has analyzed your portfolio and identified 3 high-priority issues.',
      ],
      ['no AI claim', 'AI has reviewed your licences and scored them.'],
      ['no AI claim', 'Compliance Score 87%'],
      ['no AI claim', 'AI-recommended actions for this week'],
      // Shipped verbatim on the landing page.
      ['SAR only', 'FINANCIAL EXPOSURE ₹0K'],
      ['SAR only', 'Estimated cost saved: Rs 45,000'],
      ['SAR only', 'Renewal fee: $500'],
      ['SAR only', 'Potential loss of ₹10L across your portfolio'],
      ['no submission claim', 'We submit this renewal for you.'],
      ['no submission claim', 'Renewed for you automatically.'],
      ['no submission claim', 'We handle the filing on your behalf.'],
      // Shipped verbatim in the sidebar.
      [
        'no contract-analysis language',
        'Monitoring 0 active contracts for liabilities.',
      ],
      ['no contract-analysis language', '2 high-risk clauses detected'],
      ['no contract-analysis language', 'Financial exposure this quarter'],
      // Shipped verbatim on the login screen, seen before anyone signs in.
      [
        'right market',
        'AI-powered legal analysis built for Indian founders and SMEs.',
      ],
      ['right market', 'Flags non-compliant clauses under Indian law'],
      ['right market', 'Trusted by 500+ startups across India'],
      ['right market', 'Jurisdiction: India (default)'],
      // Status labels and transition copy — the renewal surface, where this
      // rule is easiest to break.
      ['no submission claim', 'Submitted'],
      ['no submission claim', 'Submitted on 14 September'],
      ['no submission claim', 'Filed'],
      ['no submission claim', 'Sent to authority'],
      ['no submission claim', 'Your application was submitted'],
      ['no submission claim', 'We have submitted this renewal'],
      ['no submission claim', 'Submitting it to Balady now'],
      // COMPLIANCE-STATE CLAIMS. The first two shipped verbatim for eight
      // slices, on the sites card and the gaps page respectively.
      [
        'no compliance-state claim',
        'Every licence you are expected to hold has a record.',
      ],
      [
        'no compliance-state claim',
        'Every licence type your organisation is expected to hold has an active record.',
      ],
      // Constructed variants of the same claim.
      ['no compliance-state claim', 'Every expected licence has a record.'],
      ['no compliance-state claim', 'You are fully compliant.'],
      ['no compliance-state claim', 'Nothing is missing.'],
      ['no compliance-state claim', 'All your licences are up to date'],
      ['no compliance-state claim', 'No gaps in your compliance'],
    ];

    it.each(KNOWN_BAD)('flags a %s violation in %j', (rule, text) => {
      const violations = findHonestyViolations(text);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.map((v) => v.rule)).toContain(rule);
    });

    it('every rule has at least one known-bad string proving it fires', () => {
      // Guards against a rule being added with patterns that never match.
      for (const rule of HONESTY_RULES) {
        const covered = KNOWN_BAD.filter(([name]) => name === rule.name);
        expect({ rule: rule.name, covered: covered.length }).toEqual({
          rule: rule.name,
          covered: covered.length,
        });
        expect(covered.length).toBeGreaterThan(0);
      }
    });

    it('does not flag honest compliance copy', () => {
      // A detector that flags everything is as useless as one that flags
      // nothing — it would just be switched off.
      const HONEST = [
        'Here is where your licences stand today.',
        '3 expected licences have no record at all.',
        'Ahmed Al-Rashid holds 81% of assigned licences.',
        'Your team completes this renewal on the authority’s portal.',
        'SAR 2000',
        'Renewal fee: SAR 1500',
        'This licence has passed its expiry date and needs renewing.',
        '2 licences have nobody responsible, so no reminder can reach anyone.',
        'Open Balady portal',
      ];
      for (const text of HONEST) {
        expect({ text, violations: findHonestyViolations(text) }).toEqual({
          text,
          violations: [],
        });
      }
    });
  });

  describe('every centralised string in the product', () => {
    const ALL_COPY = [
      ...allDashboardCopy(),
      ...allFrontendRenewalCopy(),
      ...allNotificationCopy(),
      ...allImportCopy(),
      ...allDeliveryCopy(),
      ...allYearAheadCopy(),
      ...allLicensesCopy(),
      ...allNewLicenseCopy(),
      ...allSiteFormCopy(),
      ...allRenewalWorkflowCopy(),
      ...allRequirementsCopy(),
    ];

    it('scans a non-trivial number of strings', () => {
      // If a refactor emptied these collectors, the sweep below would pass by
      // scanning nothing. Pin the floor.
      expect(ALL_COPY.length).toBeGreaterThan(50);
    });

    it('contains NO AI claim', () => {
      const offenders = ALL_COPY.flatMap(findHonestyViolations).filter(
        (v) => v.rule === 'no AI claim',
      );
      expect(offenders).toEqual([]);
    });

    it('contains NO currency other than SAR', () => {
      const offenders = ALL_COPY.flatMap(findHonestyViolations).filter(
        (v) => v.rule === 'SAR only',
      );
      expect(offenders).toEqual([]);
    });

    it('contains NO submission claim', () => {
      const offenders = ALL_COPY.flatMap(findHonestyViolations).filter(
        (v) => v.rule === 'no submission claim',
      );
      expect(offenders).toEqual([]);
    });

    it('contains NO contract-analysis language', () => {
      const offenders = ALL_COPY.flatMap(findHonestyViolations).filter(
        (v) => v.rule === 'no contract-analysis language',
      );
      expect(offenders).toEqual([]);
    });

    it('is clean under every rule at once', () => {
      const offenders = ALL_COPY.flatMap(findHonestyViolations);
      expect(offenders).toEqual([]);
    });
  });

  describe('the dashboard specifically', () => {
    it('offers no compliance score and no risk rating', () => {
      // The product cannot grade a posture it does not fully observe — which
      // is what the coverage gaps feature exists to admit.
      const joined = allDashboardCopy().join(' ');
      expect(joined).not.toMatch(/compliance score/i);
      expect(joined).not.toMatch(/risk (score|rating|level)/i);
      expect(joined).not.toMatch(/\b\d+\s*%\s*compliant/i);
    });

    it('discloses the truncated remainder of the ownership list', () => {
      // Slice 5 found a list showing 3 of 4 owners beside a sentence implying
      // it showed all of them.
      expect(DASHBOARD_COPY.otherOwners(3, 7)).toMatch(/3 other people/);
      expect(DASHBOARD_COPY.otherOwners(3, 7)).toMatch(/7 more/);
      expect(DASHBOARD_COPY.otherOwners(1, 2)).toMatch(/1 other person/);
    });

    it('explains the site-scoped vs company-wide split rather than hiding it', () => {
      const note = DASHBOARD_COPY.splitNote(15, 4);
      expect(note).toMatch(/15 held at sites/);
      expect(note).toMatch(/4 company-wide/);
      // Names the number the sites page shows, so the two screens reconcile.
      expect(note).toMatch(/sites view shows the 15/);
    });

    it('says gaps are about records, not expiry', () => {
      expect(DASHBOARD_COPY.gapsHint).toMatch(/not expiry/i);
    });

    it('is honest about unassigned licences having no recipient', () => {
      expect(DASHBOARD_COPY.unassignedWarning(2)).toMatch(
        /no reminder can reach anyone/i,
      );
    });
  });

  describe('pattern hygiene', () => {
    it('every rule has patterns and a stated reason', () => {
      for (const rule of HONESTY_RULES) {
        expect(rule.patterns.length).toBeGreaterThan(0);
        expect(rule.because.length).toBeGreaterThan(20);
      }
    });

    it('exposes the four rule sets', () => {
      expect(WRONG_MARKET_PATTERNS.length).toBeGreaterThan(3);
      expect(AI_CLAIM_PATTERNS.length).toBeGreaterThan(5);
      expect(FOREIGN_CURRENCY_PATTERNS.length).toBeGreaterThan(5);
      expect(SUBMISSION_CLAIM_PATTERNS.length).toBeGreaterThan(5);
      expect(CONTRACT_LANGUAGE_PATTERNS.length).toBeGreaterThan(3);
    });

    it('isHonest agrees with findHonestyViolations', () => {
      expect(isHonest('SAR 2000')).toBe(true);
      expect(isHonest('FINANCIAL EXPOSURE ₹0K')).toBe(false);
    });
  });

  describe('the notification surface specifically', () => {
    it('never lets an unsent reminder read as delivered', () => {
      // The whole risk of an in-app list is that being VISIBLE gets mistaken
      // for being SENT. With no channel configured nothing goes out at all.
      expect(deliveryPresentation('PENDING').label).toMatch(/not sent/i);
      expect(deliveryPresentation('UNDELIVERABLE').label).not.toMatch(/sent|emailed/i);
      expect(deliveryPresentation('FAILED').label).toMatch(/failed/i);
      // Only SENT may claim it.
      expect(deliveryPresentation('SENT').label).toBe('Emailed');
    });

    it('falls back to the status that claims the least', () => {
      const unknown = deliveryPresentation('SOMETHING_NEW' as ReminderStatus);
      expect(unknown).toEqual(deliveryPresentation('PENDING'));
      expect(unknown.label).not.toMatch(/emailed/i);
    });

    it('states plainly that appearing here is not delivery', () => {
      expect(NOTIFICATION_COPY.visibilityNote).toMatch(
        /whether or not a message was sent/i,
      );
    });

    it('explains why an unassigned licence still appears', () => {
      expect(deliveryPresentation('UNDELIVERABLE').detail).toMatch(
        /so it is not missed/i,
      );
    });

    it('gives the bell an accessible count, not colour alone', () => {
      expect(NOTIFICATION_COPY.bellLabel(0)).toMatch(/none unread/i);
      expect(NOTIFICATION_COPY.bellLabel(1)).toMatch(/1 unread/);
      expect(NOTIFICATION_COPY.bellLabel(6)).toMatch(/6 unread/);
    });

    it('every notification string is clean under all five rules', () => {
      const offenders = allNotificationCopy().flatMap(findHonestyViolations);
      expect(offenders).toEqual([]);
    });

    it('the detector still fires on this surface if copy regresses', () => {
      // Non-vacuousness, scoped to the surface this slice adds.
      const planted = [
        'OnyxAI prioritised these reminders for you',
        'Renewal fee ₹500 due',
        'We file this renewal for you once it is due',
      ];
      for (const text of planted) {
        expect({ text, clean: findHonestyViolations(text).length === 0 }).toEqual(
          { text, clean: false },
        );
      }
    });
  });


  describe('the import surface specifically', () => {
    it('states the date rule wherever someone could get it wrong', () => {
      // A misread expiry date produces a confidently wrong reminder ladder,
      // with no symptom until a licence lapses. Saying the rule costs nothing.
      expect(IMPORT_COPY.dateRule).toMatch(/YYYY-MM-DD/);
      expect(IMPORT_COPY.dateRule).toMatch(/01\/02\/2026/);
      expect(IMPORT_COPY.dateRule).toMatch(/refused|rejected/i);
    });

    it('explains WHY an ambiguous date is refused, not just that it is', () => {
      expect(IMPORT_COPY.dateRule).toMatch(/1 February/);
      expect(IMPORT_COPY.dateRule).toMatch(/2 January/);
    });

    it('never claims the import corrects or interprets anything', () => {
      const joined = allImportCopy().join(' ');
      expect(joined).not.toMatch(/we(\u2019|')?ll (fix|correct|interpret|convert)/i);
      expect(joined).not.toMatch(/automatically (detect|correct|fix) (the )?dates?/i);
      expect(joined).not.toMatch(/smart|intelligent/i);
    });

    it('says nothing is saved until the check step', () => {
      expect(IMPORT_COPY.previewBody).toMatch(/nothing has been saved yet/i);
    });

    it('promises reminders only because import really schedules them', () => {
      // Every licence goes through LicensesService.create, so reconcile()
      // runs. The integration suite proves it.
      expect(IMPORT_COPY.doneBody(3, 0)).toMatch(/reminders have been scheduled/i);
    });

    it('every import string is clean under all five rules', () => {
      expect(allImportCopy().flatMap(findHonestyViolations)).toEqual([]);
    });

    it('the detector still fires on this surface if copy regresses', () => {
      // Non-vacuousness, scoped to the surface this slice adds.
      const planted = [
        'Our AI will correct any dates it does not recognise',
        'Import your contract risk register',
        'Estimated saving: ₹40,000 of data entry',
        'We file these with the authority once imported',
        'Built for Indian founders',
      ];
      for (const text of planted) {
        expect({ text, clean: findHonestyViolations(text).length === 0 }).toEqual(
          { text, clean: false },
        );
      }
    });
  });


  describe('the licences list specifically', () => {
    it('every string on the screen passes all six rules', () => {
      expect(allLicensesCopy().flatMap(findHonestyViolations)).toEqual([]);
    });

    /**
     * The single most dangerous string on this screen.
     *
     * An empty licence list has exactly one honest meaning: nothing has been
     * entered. It does NOT mean the business holds no licences, and it does
     * not mean nothing is due. A brand-new tenant sees this screen before
     * they see any other, and "You have no licences" would be a statement
     * about their company that this system has no way to know.
     */
    it('the empty state describes the record, not the business', () => {
      expect(LICENSES_COPY.emptyTitle).toMatch(/on record/i);
      expect(LICENSES_COPY.emptyTitle).not.toMatch(/^you (have|hold)\b/i);
      expect(LICENSES_COPY.emptyBody).not.toMatch(
        /\byou (have|hold) no\b|\bnothing is (due|expiring|required)\b/i,
      );
    });

    it('the empty state separates "nothing entered" from "nothing due"', () => {
      expect(LICENSES_COPY.emptyAside).toMatch(/nothing has been entered/i);
      expect(LICENSES_COPY.emptyAside).toMatch(/not that nothing is\s+due/i);
    });

    /**
     * Import is the only way a licence gets created in this product today,
     * so the empty state must actually name it rather than gesture at it.
     */
    it('names the one route in, on the state where it is the only one', () => {
      expect(LICENSES_COPY.emptyBody).toMatch(/spreadsheet/i);
      expect(LICENSES_COPY.import).toMatch(/spreadsheet/i);
    });

    /**
     * The count is shown two different ways on purpose. Status filters run
     * against the DERIVED status after the query, so meta.total is the
     * unfiltered number: printing "3 of 40" while filtered would read as
     * pagination and understate what the client holds.
     */
    it('never pairs a filtered count with an unfiltered total', () => {
      expect(LICENSES_COPY.countFiltered(3)).not.toMatch(/\bof\b/);
      expect(LICENSES_COPY.countOfTotal(3, 40)).toMatch(/3 of 40/);
    });

    it('claims nothing about compliance, submission or analysis', () => {
      const joined = allLicensesCopy().join(' ');
      expect(joined).not.toMatch(/\bcomplian(t|ce)\b/i);
      expect(joined).not.toMatch(/\b(we|this system) (file|submit|renew)s?\b/i);
      expect(joined).not.toMatch(/\bAI\b|\banalys/i);
    });
  });

  describe('the create path specifically', () => {
    it('every string on both forms passes all six rules', () => {
      expect(allNewLicenseCopy().flatMap(findHonestyViolations)).toEqual([]);
      expect(allSiteFormCopy().flatMap(findHonestyViolations)).toEqual([]);
    });

    /**
     * The form must not predict how many reminders will be scheduled.
     *
     * Counting them means answering "how many of 90/60/30/14/7 days before
     * this date are still ahead of today", and the browser has no
     * authoritative today — expiry status is derived in the TENANT's timezone
     * server-side for exactly this reason. Slice 6 shipped a row that
     * computed its own expiry from the browser clock and disagreed with the
     * server; this is the same trap with a different shape.
     */
    it('promises reminders without predicting their number', () => {
      expect(NEW_LICENSE_COPY.echoReminders).toMatch(/will be scheduled/i);
      expect(NEW_LICENSE_COPY.echoReminders).not.toMatch(/\d/);
      const joined = allNewLicenseCopy().join(' ');
      expect(joined).not.toMatch(/\d+ reminders? (will be|are) scheduled/i);
    });

    /**
     * The form creates a record. It does not renew, file, or submit anything,
     * and it must not imply that adding a licence makes the business
     * compliant.
     */
    it('claims only that a record is kept', () => {
      const joined = allNewLicenseCopy().join(' ');
      expect(joined).not.toMatch(/\bcomplian(t|ce)\b/i);
      expect(joined).not.toMatch(/\b(we|this system) (file|submit|renew)s?\b/i);
      expect(joined).not.toMatch(/\byou are (now )?covered\b/i);
    });

    /** Unassigned is allowed, but never silent. */
    it('says plainly that an unassigned licence can reach nobody', () => {
      expect(NEW_LICENSE_COPY.ownerWarning).toMatch(/no one to go to|nobody/i);
    });

    /** The date rule is the import rule, in the same words. */
    it('states the date rule with the same example import uses', () => {
      expect(NEW_LICENSE_COPY.dateRule).toMatch(/YYYY-MM-DD/);
      expect(NEW_LICENSE_COPY.dateRule).toMatch(/01\/02\/2027/);
      expect(NEW_LICENSE_COPY.dateRule).toMatch(/1 February|2 January/);
    });

    it('the site form promises only what a site is', () => {
      expect(SITE_FORM_COPY.createdBody).toMatch(/attach licences/i);
      expect(allSiteFormCopy().join(' ')).not.toMatch(/\bcomplian(t|ce)\b/i);
    });
  });

  describe('the renewal workflow specifically', () => {
    it('NEVER labels a stage "Submitted" or "Filed"', () => {
      // The stage where this rule is easiest to break. A person filed it at
      // the authority's portal; this system filed nothing.
      const labels = (
        ['PREPARING', 'READY', 'AWAITING_AUTHORITY', 'COMPLETED', 'CLOSED'] as const
      ).map((s) => stagePresentation(s).label);

      for (const label of labels) {
        expect({ label, violations: findHonestyViolations(label) }).toEqual({
          label,
          violations: [],
        });
      }
      expect(labels).toContain('With the authority');
      expect(labels).not.toContain('Submitted');
    });

    it('names the actor whenever filing is mentioned', () => {
      expect(RENEWAL_WORKFLOW_COPY.markFiled).toMatch(/^I filed this/);
      expect(RENEWAL_WORKFLOW_COPY.youFiledOn('Ahmed', '14 September')).toMatch(
        /Ahmed marked this as filed/,
      );
    });

    it('states outright that the system files nothing', () => {
      expect(RENEWAL_WORKFLOW_COPY.markFiledHint).toMatch(
        /does not file anything with any authority/i,
      );
    });

    it('describes where the paperwork is, not who sent it', () => {
      expect(stagePresentation('AWAITING_AUTHORITY').detail).toMatch(
        /You told us someone filed this/i,
      );
    });

    it('presents the proposed expiry as a suggestion, never as applied', () => {
      // defaultCycleMonths proposes; a person confirms. An auto-set expiry
      // would invent the one fact this product exists to get right.
      const hint = RENEWAL_WORKFLOW_COPY.proposedHint('15 September 2027');
      expect(hint).toMatch(/usually/i);
      expect(hint).toMatch(/check it against the certificate/i);
    });

    it('carries the same date rule as the importer', () => {
      expect(RENEWAL_WORKFLOW_COPY.dateRule).toMatch(/YYYY-MM-DD/);
      expect(RENEWAL_WORKFLOW_COPY.dateRule).toMatch(/01\/02\/2027/);
    });

    it('says a certificate can come later without blocking the record', () => {
      expect(RENEWAL_WORKFLOW_COPY.certificateHint).toMatch(/later/i);
      expect(RENEWAL_WORKFLOW_COPY.certificateHint).toMatch(/checklist/i);
    });

    it('every renewal-workflow string is clean under all five rules', () => {
      expect(allRenewalWorkflowCopy().flatMap(findHonestyViolations)).toEqual([]);
    });

    it('the detector fires on plausible bad strings from THIS surface', () => {
      // Non-vacuousness, scoped to the surface this slice adds.
      const planted = [
        'Submitted',
        'Submitted on 14 September',
        'Sent to authority',
        'We have submitted this renewal to Balady',
        'We will renew this for you automatically',
        'One-click renewal filing',
      ];
      for (const text of planted) {
        expect({ text, clean: findHonestyViolations(text).length === 0 }).toEqual(
          { text, clean: false },
        );
      }
    });

    it('still permits the correct Slice 6 wording', () => {
      // "Filed by your team" and "Filed with" name the actor and must survive.
      for (const good of ['Filed by your team', 'Filed with', 'Filed by Ahmed']) {
        expect({ good, violations: findHonestyViolations(good) }).toEqual({
          good,
          violations: [],
        });
      }
    });
  });


  describe('rule 6 — never assert the customer\'s compliance state', () => {
    it('catches BOTH strings that actually shipped, verbatim', () => {
      // A tenant with nothing configured was told every licence it was
      // expected to hold had a record. The system knew nothing about that
      // business. Coverage gaps exists to admit what is NOT known, so this
      // inverted the feature into its opposite.
      const shipped = [
        'Every licence you are expected to hold has a record.',
        'Every licence type your organisation is expected to hold has an active record.',
      ];
      for (const text of shipped) {
        const violations = findHonestyViolations(text);
        expect({ text, rules: violations.map((v) => v.rule) }).toEqual({
          text,
          rules: ['no compliance-state claim'],
        });
      }
    });

    it('permits statements about the DATA', () => {
      // The line: facts about what is held are countable and checkable.
      // Claims about the business are not.
      const permitted = [
        'You have 19 licences on record',
        '3 expected licences have no record at all.',
        'All 12 licence types you told us to expect are on record.',
        'The 1 licence type you told us to expect is on record.',
        'You have not told us which licences to expect.',
      ];
      for (const text of permitted) {
        expect({ text, violations: findHonestyViolations(text) }).toEqual({
          text,
          violations: [],
        });
      }
    });

    it('is NON-VACUOUS — removing the patterns lets the shipped copy through', () => {
      // The standard Slice 5 set: a rule that passes with the mechanism
      // disabled is not a rule. Rebuilding the detector without rule 6 must
      // let both shipped strings straight through.
      const withoutRule6 = HONESTY_RULES.filter(
        (rule) => rule.name !== 'no compliance-state claim',
      );
      const shipped = 'Every licence you are expected to hold has a record.';

      const caughtWithRule = findHonestyViolations(shipped).length;
      const caughtWithout = withoutRule6.filter((rule) =>
        rule.patterns.some((pattern) => pattern.test(shipped)),
      ).length;

      expect(caughtWithRule).toBeGreaterThan(0);
      expect(caughtWithout).toBe(0);
    });

    it('the scoped all-clear is what makes an all-clear honest', () => {
      // "All 12 types you told us to expect are on record" claims only what
      // was configured, and the number says so.
      expect(DASHBOARD_COPY.gapsAllSatisfied(12)).toMatch(/told us to expect/);
      expect(DASHBOARD_COPY.gapsAllSatisfied(12)).toMatch(/\b12\b/);
      expect(findHonestyViolations(DASHBOARD_COPY.gapsAllSatisfied(12))).toEqual([]);
    });

    it('the not-configured copy says we cannot tell, not that all is well', () => {
      expect(DASHBOARD_COPY.gapsNotConfigured).toMatch(/have not told us/i);
      expect(DASHBOARD_COPY.gapsNotConfiguredHint).toMatch(/cannot tell you what is missing/i);
    });

    it('every requirements string is clean under all six rules', () => {
      expect(allRequirementsCopy().flatMap(findHonestyViolations)).toEqual([]);
    });

    it('the requirements surface states the tenant-wide behaviour', () => {
      // The model has no siteId, so a site-scoped requirement applies to every
      // site. Letting someone infer a per-site setting would be a lie of
      // omission about what their tick actually did.
      expect(REQUIREMENTS_COPY.siteSubtitle).toMatch(/every site/i);
    });
  });

});
