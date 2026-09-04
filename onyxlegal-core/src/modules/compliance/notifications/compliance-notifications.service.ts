import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReminderStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { assessExpiry } from '../domain/license-status';
import { fromPrismaDate, PlainDate, todayIn } from '../domain/plain-date';

/**
 * How far past its due date a reminder keeps showing in the list.
 *
 * A reminder whose date has passed is MORE urgent, not less, so it is not
 * dropped the moment it goes overdue. It stays until the licence is dealt
 * with or its obligation is superseded.
 */
export const OVERDUE_GRACE_DAYS = 365;

export interface ComplianceNotification {
  /** The reminder's id. Read state is recorded against this. */
  id: string;
  licenseId: string;
  licenseName: string;
  siteName: string | null;
  /** Null for a company-wide licence with nobody assigned. */
  ownerName: string | null;
  ownerUserId: string | null;
  offsetDays: number;
  dueOn: PlainDate;
  expiryDate: PlainDate | null;
  daysUntilExpiry: number | null;
  /** Whether THIS caller has read it. Never a global flag. */
  read: boolean;
  readAt: Date | null;
  /**
   * The reminder's delivery status, passed through untouched.
   *
   * Being visible in this list is NOT delivery. A reminder can appear here as
   * UNDELIVERABLE — that is the point: the tenant sees it even though nobody
   * was personally notified.
   */
  deliveryStatus: ReminderStatus;
}

/**
 * The in-app notification list.
 *
 * WHY THIS IS A VIEW AND NOT A TABLE OF ITS OWN
 * ---------------------------------------------
 * A reminder row already records what is due and when. Writing a separate
 * notification row per user per reminder would duplicate that, and duplicated
 * state drifts: change an expiry date and the reminder is reconciled while the
 * copies are not.
 *
 * Worse, a per-user copy needs a user. Two licences in the demo tenant have no
 * owner, and those are precisely the ones most likely to lapse. Pushing to an
 * owner who does not exist would make the most dangerous reminders the only
 * invisible ones.
 *
 * So this derives the list from reminders on every read, and persists only the
 * one thing it cannot derive: whether a given person has looked at it.
 *
 * WHAT THIS IS NOT
 * ----------------
 * It is not a delivery channel. Nothing here marks a reminder SENT, sets a
 * channel, or touches attemptCount. Slice 5 and 7 status semantics are
 * completely untouched — this reads them and never writes them.
 */
@Injectable()
export class ComplianceNotificationsService {
  private readonly logger = new Logger(ComplianceNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ComplianceAuditService,
  ) {}

  /**
   * Reminders currently due for this tenant, with the caller's read state.
   *
   * Tenant-scoped, not owner-scoped. Everyone in the organisation sees the
   * same list; only the read marks differ. A compliance obligation belongs to
   * the business, not to whoever happens to be assigned to it.
   */
  async list(
    tenantId: string,
    userId: string,
  ): Promise<ComplianceNotification[]> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timeZone: true },
    });
    const today = todayIn(tenant?.timeZone ?? 'Asia/Riyadh');

    const rows = await this.prisma.licenseReminder.findMany({
      where: {
        tenantId,
        // Due now or overdue. CANCELLED and SKIPPED are excluded: one was
        // superseded by a live obligation, the other describes a window that
        // closed before the licence was even recorded. Neither is actionable.
        status: {
          in: [
            ReminderStatus.PENDING,
            ReminderStatus.SENT,
            ReminderStatus.FAILED,
            ReminderStatus.UNDELIVERABLE,
          ],
        },
        dueOn: { lte: new Date(`${today}T00:00:00.000Z`) },
        license: { lifecycle: 'ACTIVE' },
      },
      orderBy: [{ dueOn: 'asc' }],
      select: {
        id: true,
        offsetDays: true,
        dueOn: true,
        status: true,
        licenseId: true,
        license: {
          select: {
            name: true,
            expiryDate: true,
            ownerUserId: true,
            site: { select: { name: true } },
            owner: { select: { name: true, email: true } },
          },
        },
        // Only THIS user's read mark, so one person reading cannot mark it
        // read for anyone else.
        reads: {
          where: { userId },
          select: { readAt: true },
          take: 1,
        },
      },
    });

    return rows.map((row) => {
      const expiryDate = row.license.expiryDate
        ? fromPrismaDate(row.license.expiryDate)
        : null;

      return {
        id: row.id,
        licenseId: row.licenseId,
        licenseName: row.license.name,
        siteName: row.license.site?.name ?? null,
        ownerName: row.license.owner?.name ?? row.license.owner?.email ?? null,
        ownerUserId: row.license.ownerUserId,
        offsetDays: row.offsetDays,
        dueOn: fromPrismaDate(row.dueOn),
        expiryDate,
        daysUntilExpiry: assessExpiry(expiryDate, today).daysUntilExpiry,
        read: row.reads.length > 0,
        readAt: row.reads[0]?.readAt ?? null,
        deliveryStatus: row.status,
      };
    });
  }

  /** How many of the due reminders this particular user has not read. */
  async unreadCount(
    tenantId: string,
    userId: string,
  ): Promise<{ unreadCount: number }> {
    const all = await this.list(tenantId, userId);
    return { unreadCount: all.filter((n) => !n.read).length };
  }

  /**
   * Mark one reminder read for this user.
   *
   * Idempotent: reading twice is not two events, so the unique constraint on
   * (userId, reminderId) absorbs the second call rather than erroring.
   */
  async markRead(tenantId: string, userId: string, reminderId: string) {
    const reminder = await this.prisma.licenseReminder.findFirst({
      where: { id: reminderId, tenantId },
      select: { id: true, licenseId: true },
    });
    // 404 rather than 403 — a foreign id must not be confirmed to exist.
    if (!reminder) throw new NotFoundException('Reminder not found');

    const existing = await this.prisma.reminderRead.findUnique({
      where: { userId_reminderId: { userId, reminderId } },
      select: { id: true },
    });
    if (existing) return { read: true };

    await this.prisma.reminderRead.create({ data: { userId, reminderId } });

    // Who was told what, and when, is itself compliance evidence — the same
    // reason document reads are audited.
    await this.audit.record({
      tenantId,
      actorUserId: userId,
      action: 'reminder.read',
      entityType: 'reminder',
      entityId: reminderId,
      changes: {
        // Metadata only. No licence number, no personal identifier.
        licenseId: { from: null, to: reminder.licenseId },
        channel: { from: null, to: 'IN_APP' },
      },
    });

    return { read: true };
  }

  /** Mark every currently-due reminder read for this user. */
  async markAllRead(tenantId: string, userId: string) {
    const due = await this.list(tenantId, userId);
    const unread = due.filter((n) => !n.read);

    if (unread.length === 0) return { updated: 0 };

    await this.prisma.reminderRead.createMany({
      data: unread.map((n) => ({ userId, reminderId: n.id })),
      // Another tab marking the same reminder read is not an error.
      skipDuplicates: true,
    });

    await this.audit.record({
      tenantId,
      actorUserId: userId,
      action: 'reminder.read_all',
      entityType: 'reminder',
      entityId: `${unread.length} reminders`,
      changes: { channel: { from: null, to: 'IN_APP' } },
    });

    this.logger.debug(
      `User ${userId} marked ${unread.length} reminder(s) read in tenant ${tenantId}`,
    );
    return { updated: unread.length };
  }
}
