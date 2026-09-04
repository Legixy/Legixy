import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ReminderStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import {
  fromPrismaDate,
  PlainDate,
  todayIn,
  toPrismaDate,
} from '../domain/plain-date';
import { assessExpiry } from '../domain/license-status';
import { isWithinSendWindow, sendWindowReason } from '../domain/send-window';
import { ReminderSender } from '../delivery/channel';
import type { ReminderLine, ReminderMessage } from '../delivery/channel';

/** How long a claim is held before another sweep may reclaim it. */
/**
 * Map key for the batch of licences that have no owner.
 *
 * A sentinel rather than a real id, because this group is keyed by "nobody"
 * and every other key is a user id. Prefixed so it can never collide with a
 * cuid.
 */
const ORPHAN_GROUP = '\u0000orphans';

const CLAIM_TTL_MS = 5 * 60 * 1000;
/** Attempts before a reminder is marked terminally FAILED. */
const MAX_ATTEMPTS = 3;
/** Upper bound on one sweep, so a backlog cannot monopolise a run. */
const BATCH_LIMIT = 200;

export interface SweepOutcome {
  scannedTenants: number;
  sent: number;
  undeliverable: number;
  failed: number;
  skipped: number;
  /** Due, but the tenant's local time is outside the send window. */
  deferred: number;
  /**
   * Due, but no delivery channel is configured at all.
   *
   * Deliberately separate from `deferred`. Both mean "not attempted", but one
   * is a normal nightly occurrence and the other is an outage that stops every
   * reminder in the system. Collapsing them would hide the outage inside a
   * number that is expected to be non-zero.
   */
  deferredNoChannel: number;
}

/**
 * Reminder delivery.
 *
 * This is the part of the product that makes it a compliance system rather
 * than a spreadsheet: it is what actually tells a person their licence is
 * about to lapse.
 *
 * SAFETY MODEL
 * ------------
 * Correctness never depends on there being exactly one instance, or on Redis
 * behaving. Every send is gated by a database compare-and-swap that claims the
 * row. Two sweeps racing on the same reminder: one wins the UPDATE, the other
 * sees zero rows affected and moves on.
 *
 * The claim is time-boxed rather than a status flag, so a process that dies
 * mid-send releases its work automatically instead of stranding it forever.
 */
@Injectable()
export class ReminderDispatchService {
  private readonly logger = new Logger(ReminderDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: ReminderSender,
    private readonly audit: ComplianceAuditService,
  ) {}

  /**
   * One sweep across every tenant.
   *
   * Tenants are processed independently because each has its own timezone, and
   * therefore its own "today" and its own send window. A tenant in a different
   * zone must not be delivered to on its weekend because another tenant's was
   * a working day.
   */
  async sweep(now: Date = new Date()): Promise<SweepOutcome> {
    const outcome: SweepOutcome = {
      scannedTenants: 0,
      sent: 0,
      undeliverable: 0,
      failed: 0,
      skipped: 0,
      deferred: 0,
      deferredNoChannel: 0,
    };

    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, timeZone: true, reminderCopyEmail: true },
    });

    // NO CHANNEL IS NOT A DELIVERY FAILURE
    // ------------------------------------
    // With nothing configured to send through, no reminder can be attempted.
    // Attempting anyway burned a retry per reminder per sweep, so an SMTP
    // outage silently drove every reminder in the system to terminal FAILED
    // within three hourly sweeps — turning an operational gap into permanent
    // data loss that no later fix could undo.
    //
    // So this defers, exactly as being outside the send window does: nothing
    // is claimed, no attempt is counted, and the work is still waiting when a
    // channel comes back.
    if (!this.sender.isAvailable()) {
      outcome.scannedTenants = tenants.length;
      outcome.deferredNoChannel = tenants.length;
      this.logger.warn(
        'Reminder sweep deferred: no delivery channel is configured. ' +
          'Nothing was attempted and no retries were consumed. ' +
          'Reminders will be sent once a channel is available.',
      );
      return outcome;
    }

    for (const tenant of tenants) {
      outcome.scannedTenants += 1;

      // Each tenant's own local time decides whether anything may be sent.
      if (!isWithinSendWindow(now, tenant.timeZone)) {
        outcome.deferred += 1;
        this.logger.debug(
          `Tenant ${tenant.id}: ${sendWindowReason(now, tenant.timeZone)}`,
        );
        continue;
      }

      const tenantOutcome = await this.sweepTenant(
        tenant.id,
        todayIn(tenant.timeZone, now),
        now,
        tenant.reminderCopyEmail,
      );
      outcome.sent += tenantOutcome.sent;
      outcome.undeliverable += tenantOutcome.undeliverable;
      outcome.failed += tenantOutcome.failed;
      outcome.skipped += tenantOutcome.skipped;
      outcome.deferredNoChannel += tenantOutcome.deferredNoChannel;
    }

    return outcome;
  }

  private async sweepTenant(
    tenantId: string,
    today: PlainDate,
    now: Date,
    /**
     * The tenant's copy address, or null.
     *
     * Set, it does two things: it receives reminders for licences that have
     * NO owner (instead of those going UNDELIVERABLE), and it is copied on
     * every message that does go to an owner. One person, two effects — see
     * Tenant.reminderCopyEmail for why that is one column and not two.
     */
    copyEmail: string | null,
  ): Promise<Omit<SweepOutcome, 'scannedTenants' | 'deferred'>> {
    const result = {
      sent: 0,
      undeliverable: 0,
      failed: 0,
      skipped: 0,
      deferredNoChannel: 0,
    };

    // `dueOn <= today`, NOT `= today`. If the scheduler was down for three
    // days, the work is still waiting rather than silently lost. This is the
    // property that makes a missed run survivable.
    const due = await this.prisma.licenseReminder.findMany({
      where: {
        tenantId,
        status: ReminderStatus.PENDING,
        dueOn: { lte: toPrismaDate(today) },
        license: { lifecycle: 'ACTIVE' },
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      include: {
        license: {
          select: {
            id: true,
            name: true,
            expiryDate: true,
            lifecycle: true,
            site: { select: { name: true } },
            // Resolved FRESH at send time. Slice 3 deliberately did not copy
            // ownerUserId onto the reminder; this is why.
            owner: {
              select: { id: true, email: true, name: true, tenantId: true },
            },
          },
        },
      },
      orderBy: [{ licenseId: 'asc' }, { offsetDays: 'asc' }],
      take: BATCH_LIMIT,
    });

    if (due.length === 0) return result;

    // ── Catch-up: collapse a backlog to the single most urgent reminder ─────
    // If 90, 60 and 30 are all overdue, the useful message is "30 days left",
    // not three messages. The passed windows are marked SKIPPED — the same
    // meaning generation already uses for a window that can never be honoured.
    const mostUrgentByLicence = new Map<string, (typeof due)[number]>();
    const superseded: string[] = [];

    for (const reminder of due) {
      const current = mostUrgentByLicence.get(reminder.licenseId);
      if (!current) {
        mostUrgentByLicence.set(reminder.licenseId, reminder);
        continue;
      }
      // Smaller offset = nearer to expiry = the one worth sending.
      if (reminder.offsetDays < current.offsetDays) {
        superseded.push(current.id);
        mostUrgentByLicence.set(reminder.licenseId, reminder);
      } else {
        superseded.push(reminder.id);
      }
    }

    if (superseded.length > 0) {
      await this.prisma.licenseReminder.updateMany({
        where: { id: { in: superseded } },
        data: { status: ReminderStatus.SKIPPED },
      });
      result.skipped += superseded.length;
    }

    const actionable = [...mostUrgentByLicence.values()];

    // ── Unassigned owner ────────────────────────────────────────────────────
    // With no copy address this is unchanged from Slice 5: UNDELIVERABLE, and
    // revived by reviveForOwnerAssignment when someone is finally assigned.
    //
    // With one, the reminder is deliverable after all — it goes to the copy
    // address. The licence is still unassigned: it stays in the unassigned
    // prompt and still counts in ownership concentration. Somebody being told
    // is not the same as somebody being responsible, and conflating the two
    // would let a tenant hide every ownership gap by setting one address.
    const deliverable: typeof actionable = [];
    const orphans: typeof actionable = [];
    for (const reminder of actionable) {
      if (!reminder.license.owner) {
        if (copyEmail) {
          orphans.push(reminder);
          continue;
        }
        const claimed = await this.claim(reminder.id, now);
        if (!claimed) continue;
        await this.prisma.licenseReminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.UNDELIVERABLE,
            lastError: 'No owner assigned, so there is nobody to notify.',
            lockedUntil: null,
            lockedBy: null,
          },
        });
        result.undeliverable += 1;
        continue;
      }
      deliverable.push(reminder);
    }

    // ── Batch by recipient ──────────────────────────────────────────────────
    // One message per person, listing every licence of theirs that is due.
    // Five separate emails on one morning trains people to ignore them.
    //
    // Orphans batch together under the copy address as one more "recipient",
    // so a tenant with a copy address and four unowned licences gets ONE
    // message about them, not four.
    const byRecipient = new Map<string, typeof deliverable>();
    for (const reminder of deliverable) {
      const key = reminder.license.owner!.id;
      byRecipient.set(key, [...(byRecipient.get(key) ?? []), reminder]);
    }
    if (copyEmail && orphans.length > 0) {
      byRecipient.set(ORPHAN_GROUP, orphans);
    }

    for (const [groupKey, group] of byRecipient.entries()) {
      const isOrphanGroup = groupKey === ORPHAN_GROUP;
      const owner = group[0].license.owner!;

      // Defence in depth: the query is already tenant-scoped, but a reminder
      // must never reach a user outside its own tenant under any circumstance.
      // The orphan group has no owner to check; its address is the tenant's
      // own column, which cannot belong to another tenant by construction.
      if (!isOrphanGroup && owner.tenantId !== tenantId) {
        this.logger.error(
          `Refusing to send: owner ${owner.id} is not in tenant ${tenantId}`,
        );
        continue;
      }

      // Claim every row in the batch before sending anything.
      const claimedIds: string[] = [];
      for (const reminder of group) {
        if (await this.claim(reminder.id, now)) claimedIds.push(reminder.id);
      }
      if (claimedIds.length === 0) continue;

      const claimedSet = new Set(claimedIds);
      const claimedGroup = group.filter((r) => claimedSet.has(r.id));

      const lines: ReminderLine[] = claimedGroup.map((reminder) => {
        const expiry = reminder.license.expiryDate
          ? fromPrismaDate(reminder.license.expiryDate)
          : today;
        return {
          licenseId: reminder.license.id,
          licenseName: reminder.license.name,
          siteName: reminder.license.site?.name ?? null,
          expiryDate: expiry,
          daysRemaining: assessExpiry(expiry, today).daysUntilExpiry ?? 0,
        };
      });

      const message: ReminderMessage = {
        // The orphan batch goes TO the copy address; an owner's batch goes to
        // the owner and copies it. Never both — a copy address must not
        // receive the same licence twice in one sweep.
        recipientEmail: isOrphanGroup ? copyEmail! : owner.email,
        recipientName: isOrphanGroup ? null : owner.name,
        copyEmail: isOrphanGroup ? null : copyEmail,
        unowned: isOrphanGroup,
        lines,
        appUrl: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard/licenses`,
      };

      // The channel was available when the sweep began. If it has gone since,
      // release the claim untouched rather than spending an attempt on a
      // message that was never handed to anything.
      if (!this.sender.isAvailable()) {
        await this.prisma.licenseReminder.updateMany({
          where: { id: { in: claimedIds } },
          data: { lockedUntil: null, lockedBy: null },
        });
        result.deferredNoChannel += claimedIds.length;
        continue;
      }

      const sendResult = await this.sender.send(message);

      if (sendResult.ok) {
        await this.prisma.licenseReminder.updateMany({
          where: { id: { in: claimedIds } },
          data: {
            status: ReminderStatus.SENT,
            sentAt: now,
            channel: sendResult.channel,
            lastError: null,
            lockedUntil: null,
            lockedBy: null,
          },
        });
        result.sent += claimedIds.length;

        // Being able to prove somebody was told is the point of a compliance
        // product. One entry per reminder, recording the channel and who it
        // reached — never the message body.
        for (const reminder of claimedGroup) {
          await this.audit.record({
            tenantId,
            actorUserId: null,
            action: 'reminder.sent',
            entityType: 'reminder',
            entityId: reminder.id,
            changes: {
              channel: { from: null, to: sendResult.channel },
              recipient: { from: null, to: message.recipientEmail },
              licenseId: { from: null, to: reminder.licenseId },
            },
          });
        }
      } else {
        // Record the reason, release the claim, and leave the row sendable
        // until attempts are exhausted. A broken channel must fail loudly.
        for (const reminder of claimedGroup) {
          const attempts = reminder.attemptCount + 1;
          await this.prisma.licenseReminder.update({
            where: { id: reminder.id },
            data: {
              attemptCount: attempts,
              lastError: sendResult.reason.slice(0, 300),
              status:
                attempts >= MAX_ATTEMPTS
                  ? ReminderStatus.FAILED
                  : ReminderStatus.PENDING,
              lockedUntil: null,
              lockedBy: null,
            },
          });

          await this.audit.record({
            tenantId,
            actorUserId: null,
            action: 'reminder.delivery_failed',
            entityType: 'reminder',
            entityId: reminder.id,
            changes: {
              channel: { from: null, to: this.sender.channel },
              recipient: { from: null, to: message.recipientEmail },
              reason: { from: null, to: sendResult.reason.slice(0, 200) },
            },
          });
        }
        result.failed += claimedGroup.length;
      }
    }

    return result;
  }

  /**
   * Claim one reminder for this sweep.
   *
   * THE concurrency guarantee. A single conditional UPDATE: the row is taken
   * only if it is still PENDING and not already locked by a live claim.
   * `updateMany` returns the number of rows affected, so a loser sees 0 and
   * skips rather than sending a duplicate.
   *
   * Deliberately not a Redis lock: a lock lost to a network blip would
   * double-send with no record, whereas this cannot.
   *
   * Public so it can be tested directly. Racing two full sweeps is NOT a
   * reliable proof — Node is single-threaded and the sweeps may simply
   * serialise, passing even with the guarantee removed. Firing concurrent
   * claims at one row tests the actual invariant.
   */
  async claim(reminderId: string, now: Date): Promise<boolean> {
    const runId = randomUUID();
    const { count } = await this.prisma.licenseReminder.updateMany({
      where: {
        id: reminderId,
        status: ReminderStatus.PENDING,
        OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
      },
      data: {
        lockedUntil: new Date(now.getTime() + CLAIM_TTL_MS),
        lockedBy: runId,
      },
    });
    return count === 1;
  }
}
