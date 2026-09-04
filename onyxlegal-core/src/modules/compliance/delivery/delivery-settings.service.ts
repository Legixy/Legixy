import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { ReminderSender } from './channel';

/**
 * Where reminders go, and whether they can go anywhere at all.
 *
 * WHY THIS EXISTS
 * ---------------
 * For thirteen slices there was nowhere in the product to see or set this.
 * The client's requirement is that nothing expires without him knowing, and
 * *knowing* means it reaches him — but he could not see the address it went
 * to, could not add anyone, and a licence with no owner produced a reminder
 * that reached nobody at all.
 *
 * Slice 5 declined to add a tenant fallback because nothing configured it.
 * This is that configuration, so it is no longer speculative.
 */

export interface DeliverySettings {
  /** Whether a channel exists at all right now. */
  channelConfigured: boolean;
  /** Every channel the system can actually use. Exactly one today. */
  channels: { name: string; available: boolean; detail: string }[];
  /** The tenant-wide copy address, or null. */
  copyEmail: string | null;
  /** Everyone in the tenant, and the address their reminders reach. */
  people: { id: string; name: string | null; email: string; licences: number }[];
  /** Licences with nobody responsible. */
  unassignedCount: number;
  /**
   * Active licences in total.
   *
   * Needed so the screen can tell "nobody is unassigned" apart from "there is
   * nothing to assign". Both produce unassignedCount === 0, and only one of
   * them is good news — saying "every licence has someone responsible" to a
   * tenant with no licences is an all-clear about a business the system knows
   * nothing about.
   */
  activeTotal: number;
}

@Injectable()
export class DeliverySettingsService {
  private readonly logger = new Logger(DeliverySettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ComplianceAuditService,
    private readonly sender: ReminderSender,
  ) {}

  async get(tenantId: string): Promise<DeliverySettings> {
    const [tenant, users, unassignedCount, activeTotal] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { reminderCopyEmail: true },
      }),
      this.prisma.user.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          _count: { select: { ownedLicenses: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.license.count({
        where: { tenantId, lifecycle: 'ACTIVE', ownerUserId: null },
      }),
      this.prisma.license.count({ where: { tenantId, lifecycle: 'ACTIVE' } }),
    ]);

    const available = this.sender.isAvailable();

    return {
      channelConfigured: available,
      /*
        Every channel the system HAS, with its real state. There is exactly
        one — ReminderChannel has a single member, EMAIL — and this list is
        built from what exists rather than from what is planned. A channel
        that is not built does not appear here as "unavailable"; it does not
        appear at all, because listing it would imply it is on the way.
      */
      channels: [
        {
          name: 'Email',
          available,
          detail: available
            ? 'Reminders are sent by email.'
            : 'No email server is configured, so reminders are worked out and '
              + 'scheduled but not sent. Nothing is lost — they go out as soon '
              + 'as one is set up.',
        },
      ],
      copyEmail: tenant?.reminderCopyEmail ?? null,
      people: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        licences: user._count.ownedLicenses,
      })),
      unassignedCount,
      activeTotal,
    };
  }

  /**
   * Set or clear the tenant's copy address.
   *
   * Validates shape only. Whether the address exists and is monitored is not
   * something this system can know, and pretending otherwise — a "verified"
   * tick, say — would be a claim about the world rather than about the record.
   */
  async setCopyEmail(
    tenantId: string,
    actorUserId: string,
    email: string | null,
  ): Promise<DeliverySettings> {
    const trimmed = email?.trim() || null;

    if (trimmed !== null && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      throw new BadRequestException(
        `"${trimmed}" is not a valid email address.`,
      );
    }

    const before = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { reminderCopyEmail: true },
    });

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { reminderCopyEmail: trimmed },
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: trimmed ? 'delivery.copy_email.set' : 'delivery.copy_email.cleared',
      entityType: 'tenant',
      entityId: tenantId,
      changes: {
        reminderCopyEmail: {
          from: before?.reminderCopyEmail ?? null,
          to: trimmed,
        },
      },
    });

    // The address itself is NOT logged. It is a person's contact detail, it
    // is on the audit entry where it belongs, and Slice 15 established that a
    // log aggregator is a copy held somewhere nobody audited.
    this.logger.log(
      `Reminder copy address ${trimmed ? 'set' : 'cleared'} for tenant ${tenantId}`,
    );

    return this.get(tenantId);
  }
}
