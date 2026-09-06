import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ComplianceAuditService } from '../compliance/audit/compliance-audit.service';

/**
 * Read-only directory of the people in a tenant.
 *
 * This is NOT a user-management system. It exists for one reason: the licence
 * editor needs a list of people who can be made accountable for a licence, and
 * the browser must never be able to invent that list.
 *
 * FIELD EXPOSURE
 * --------------
 * Only what the UI needs to render a human-readable choice. Explicitly never:
 * `password`, `passwordResetToken`, `passwordResetExpiry`, or `supabaseId`.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ComplianceAuditService,
  ) {}

  /**
   * Everyone in the caller's tenant, as assignable licence owners.
   *
   * `tenantId` comes from the authenticated JWT — see UsersController.
   */
  async findAssignable(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
  }

  /** Everyone in the tenant, with what each is accountable for. */
  async findWithHoldings(tenantId: string) {
    const people = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { ownedLicenses: true } },
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
    });
    return people.map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
      joinedAt: person.createdAt,
      licenceCount: person._count.ownedLicenses,
    }));
  }

  /**
   * Remove a person from a workspace — TRANSFER, THEN REMOVE.
   *
   * WHY NOT A PLAIN DELETE
   * ----------------------
   * `License.owner` is declared `onDelete: SetNull`. Deleting a user therefore
   * SILENTLY nulls `ownerUserId` on every licence they held. That is precisely
   * the failure this product exists to prevent: an unassigned licence gets a
   * banner saying its reminders cannot be delivered, and a departure would
   * create several of them with no record of why and nobody told.
   *
   * The schema already states the principle elsewhere — `LicenseType` uses
   * `onDelete: Restrict` with the note "deactivating a type must never orphan
   * the licences using it". The owner relation cannot use Restrict, because a
   * licence is legitimately allowed to have no owner. So the rule is enforced
   * here instead: if the person holds anything, the caller must say where it
   * goes. Leaving it unassigned stays possible and must be chosen, not
   * defaulted into.
   *
   * WHY NOT DEACTIVATE
   * ------------------
   * A deactivated user is a new state that every query would have to know
   * about — the directory, the assignment picker, the concentration figure and
   * the reminder resolver. Adding a state that four correct features would
   * silently ignore is how the ownership figure starts lying. Removal is the
   * smaller, honest change; the audit log is what preserves the history, which
   * is the actual reason people reach for deactivation.
   */
  async remove(input: {
    tenantId: string;
    actorUserId: string;
    userId: string;
    transferToUserId?: string | null;
    acceptUnassigned?: boolean;
  }) {
    if (input.userId === input.actorUserId) {
      throw new BadRequestException('You cannot remove yourself.');
    }

    // Scoped by tenant, never findUnique by id.
    const person = await this.prisma.user.findFirst({
      where: { id: input.userId, tenantId: input.tenantId },
      select: { id: true, name: true, email: true },
    });
    if (!person) throw new NotFoundException('That person is not in this workspace.');

    const remaining = await this.prisma.user.count({
      where: { tenantId: input.tenantId },
    });
    if (remaining <= 1) {
      throw new ConflictException(
        'That is the only person in this workspace. Removing them would leave ' +
          'nobody who can reach the register.',
      );
    }

    const held = await this.prisma.license.findMany({
      where: { tenantId: input.tenantId, ownerUserId: person.id },
      select: { id: true },
    });

    if (held.length > 0 && !input.transferToUserId && !input.acceptUnassigned) {
      throw new ConflictException(
        `${person.name ?? person.email} is accountable for ${held.length} ` +
          `licence${held.length === 1 ? '' : 's'}. Choose who takes them on, or ` +
          'confirm they should be left unassigned.',
      );
    }

    if (input.transferToUserId) {
      const successor = await this.prisma.user.findFirst({
        where: { id: input.transferToUserId, tenantId: input.tenantId },
        select: { id: true },
      });
      if (!successor) {
        throw new NotFoundException('That person is not in this workspace.');
      }
      if (successor.id === person.id) {
        throw new BadRequestException('Choose somebody else to take these on.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (held.length > 0) {
        await tx.license.updateMany({
          where: { tenantId: input.tenantId, ownerUserId: person.id },
          data: { ownerUserId: input.transferToUserId ?? null },
        });
      }
      await tx.user.delete({ where: { id: person.id } });
    });

    // One entry per licence: "who owns this now, and why did it change" is a
    // question asked of the LICENCE, so it has to be on the licence's history.
    for (const licence of held) {
      await this.audit.record({
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: 'license.updated',
        entityType: 'license',
        entityId: licence.id,
        changes: {
          ownerUserId: {
            from: person.id,
            to: input.transferToUserId ?? null,
          },
        },
      });
    }

    await this.audit.record({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      action: 'user.removed',
      entityType: 'user',
      entityId: person.id,
      changes: {
        email: { from: person.email, to: null },
        licencesTransferred: { from: held.length, to: input.transferToUserId ?? null },
      },
    });

    return { removed: person.id, licencesMoved: held.length };
  }
}
