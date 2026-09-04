import { Injectable, Logger } from '@nestjs/common';
import { LicenseLifecycle, ReminderStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  buildReminderSchedule,
  obligationKey,
} from '../domain/reminder-schedule';
import {
  differenceInDays,
  fromPrismaDate,
  todayIn,
  toPrismaDate,
} from '../domain/plain-date';

/**
 * Reminder obligations for licences.
 *
 * WHAT THIS SLICE DOES
 * --------------------
 * Persists WHEN each licence must be chased. It does not schedule, and it does
 * not deliver. There is no scheduler, no mailer, no external call anywhere in
 * this file — by design.
 *
 * IDEMPOTENCY
 * -----------
 * `reconcile` is the only entry point, and it is safe to run any number of
 * times. It computes the obligations a licence *should* have and makes the
 * database match, using the `(licenseId, offsetDays, dueOn)` unique constraint
 * as the guarantee. Postgres, not application logic, prevents duplicates.
 *
 * Because it is idempotent, a crash between writing a licence and reconciling
 * it is self-healing: the next write repairs the schedule. Nothing consumes
 * these rows yet, so a briefly stale schedule has no user-visible effect.
 */
@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Make a licence's persisted reminders match what its current state requires.
   *
   * RULES
   * -----
   *  · Archived licence, or no expiry date  → no active obligations at all.
   *  · Otherwise                            → one obligation per configured
   *                                           offset, dated from the expiry.
   *
   * PRESERVATION
   * ------------
   * SENT obligations are never modified or removed. Delivered history is a
   * record of something that actually happened to a person; an expiry-date
   * edit must not rewrite it.
   *
   * SKIPPED obligations are also left alone — the window genuinely passed.
   */
  async reconcile(licenseId: string): Promise<void> {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
      select: {
        id: true,
        tenantId: true,
        expiryDate: true,
        lifecycle: true,
        tenant: { select: { timeZone: true } },
      },
    });

    if (!license) return;

    const today = todayIn(license.tenant.timeZone);

    // An archived licence, or one with no expiry, has no obligations.
    const desired =
      license.lifecycle === LicenseLifecycle.ARCHIVED
        ? []
        : buildReminderSchedule(
            license.expiryDate ? fromPrismaDate(license.expiryDate) : null,
            today,
          );

    const existing = await this.prisma.licenseReminder.findMany({
      where: { licenseId },
    });

    const desiredKeys = new Set(
      desired.map((obligation) =>
        obligationKey(obligation.offsetDays, obligation.dueOn),
      ),
    );

    // ── 1. Retire obligations that are no longer required ──────────────────
    //
    // SENT and SKIPPED are never rewritten. SENT is a delivery that actually
    // reached someone; SKIPPED is a fact about a window that had already
    // passed. Both are history, and history is not ours to edit.
    //
    // PENDING, FAILED and UNDELIVERABLE are different. Each is an obligation
    // against a schedule — one not yet attempted, one attempted and errored,
    // one attempted with nobody to send to. When the expiry date moves, that
    // schedule no longer exists, so a row still pointing at the old date is
    // not history but a leftover.
    //
    // Leaving FAILED rows behind is what produced the defect this fixes: seven
    // licences rendered two "7 days before" entries with contradictory dates,
    // because a failed delivery survived an expiry change that replaced its
    // obligation. Retiring them keeps exactly one obligation per offset while
    // the audit log and attemptCount still record that the attempt happened.
    const RETIRABLE: ReminderStatus[] = [
      ReminderStatus.PENDING,
      ReminderStatus.FAILED,
      ReminderStatus.UNDELIVERABLE,
    ];

    const stale = existing.filter(
      (row) =>
        RETIRABLE.includes(row.status) &&
        !desiredKeys.has(
          obligationKey(row.offsetDays, fromPrismaDate(row.dueOn)),
        ),
    );

    if (stale.length > 0) {
      await this.prisma.licenseReminder.updateMany({
        where: { id: { in: stale.map((row) => row.id) } },
        data: { status: ReminderStatus.CANCELLED },
      });
    }

    // ── 2. Create or revive the obligations that are required ──────────────
    for (const obligation of desired) {
      const match = existing.find(
        (row) =>
          row.offsetDays === obligation.offsetDays &&
          fromPrismaDate(row.dueOn) === obligation.dueOn,
      );

      const intendedStatus = obligation.alreadyPassed
        ? ReminderStatus.SKIPPED
        : ReminderStatus.PENDING;

      if (!match) {
        await this.prisma.licenseReminder.create({
          data: {
            tenantId: license.tenantId,
            licenseId,
            offsetDays: obligation.offsetDays,
            dueOn: toPrismaDate(obligation.dueOn),
            status: intendedStatus,
          },
        });
        continue;
      }

      // Revive an obligation cancelled by an earlier edit — this happens when
      // an expiry date is changed and then changed back. Never touch SENT,
      // and never resurrect a SKIPPED window that genuinely passed.
      if (match.status === ReminderStatus.CANCELLED) {
        await this.prisma.licenseReminder.update({
          where: { id: match.id },
          data: { status: intendedStatus },
        });
      }
    }

    this.logger.debug(
      `Reconciled reminders for licence ${licenseId}: ` +
        `${desired.length} required, ${stale.length} cancelled`,
    );
  }

  /**
   * The reminder timeline for one licence, tenant-scoped.
   *
   * Ordered furthest-out first (90 → 7), matching how the client describes the
   * ladder and how the timeline reads on screen.
   */
  async findForLicense(tenantId: string, licenseId: string) {
    const reminders = await this.prisma.licenseReminder.findMany({
      where: { licenseId, tenantId },
      orderBy: [{ offsetDays: 'desc' }, { dueOn: 'asc' }],
    });

    return reminders.map((reminder) => ({
      id: reminder.id,
      offsetDays: reminder.offsetDays,
      dueOn: fromPrismaDate(reminder.dueOn),
      status: reminder.status,
      // Delivery facts. `sentAt` is when it actually went out, which may be
      // later than `dueOn` if the send window deferred it over a weekend.
      sentAt: reminder.sentAt,
      channel: reminder.channel,
      attemptCount: reminder.attemptCount,
      lastError: reminder.lastError,
    }));
  }

  /**
   * Bring UNDELIVERABLE reminders back to life once a licence has an owner.
   *
   * THE FAILURE THIS FIXES
   * ----------------------
   * A reminder for a licence with nobody assigned goes UNDELIVERABLE: there is
   * no recipient, so there is nothing to send. That was correct. What was not
   * correct is that the status was terminal — assigning an owner afterwards
   * left every one of those reminders dead, and nothing ever chased that
   * licence again. The user saw an owner, saw a schedule, and would have been
   * told nothing when the licence expired. In a product whose whole promise is
   * "nothing important expires because someone forgot", that is the worst
   * shape a bug can take: silent, and invisible precisely where the user is
   * looking for reassurance.
   *
   * Reviving is bounded by the same rule the rest of the engine uses: an
   * obligation whose date has passed becomes SKIPPED, not PENDING. Sending a
   * "90 days before" reminder two months late would be noise, and it would
   * misrepresent the date it was supposed to mark.
   */
  async reviveForOwnerAssignment(licenseId: string): Promise<number> {
    const license = await this.prisma.license.findUnique({
      where: { id: licenseId },
      select: {
        ownerUserId: true,
        lifecycle: true,
        tenant: { select: { timeZone: true } },
      },
    });

    // No owner means nothing changed for the better; an archived licence has
    // no obligations at all. Either way there is nothing to revive.
    if (!license?.ownerUserId) return 0;
    if (license.lifecycle === LicenseLifecycle.ARCHIVED) return 0;

    const today = todayIn(license.tenant.timeZone);

    const undeliverable = await this.prisma.licenseReminder.findMany({
      where: { licenseId, status: ReminderStatus.UNDELIVERABLE },
      select: { id: true, dueOn: true },
    });

    let revived = 0;
    for (const reminder of undeliverable) {
      const dueOn = fromPrismaDate(reminder.dueOn);
      const passed = differenceInDays(today, dueOn) < 0;

      await this.prisma.licenseReminder.update({
        where: { id: reminder.id },
        data: {
          status: passed ? ReminderStatus.SKIPPED : ReminderStatus.PENDING,
          // The previous failure was "no recipient", which no longer applies.
          lastError: null,
        },
      });
      if (!passed) revived += 1;
    }

    if (undeliverable.length > 0) {
      this.logger.debug(
        `Owner assigned to licence ${licenseId}: ` +
          `${revived} reminder(s) revived, ` +
          `${undeliverable.length - revived} past their window`,
      );
    }

    return revived;
  }
}
