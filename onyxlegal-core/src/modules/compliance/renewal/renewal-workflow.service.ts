import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LicenseLifecycle, RenewalStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { RemindersService } from '../reminders/reminders.service';
import {
  fromPrismaDate,
  isPlainDate,
  PlainDate,
  todayIn,
  toPrismaDate,
} from '../domain/plain-date';
import {
  canTransition,
  explainRefusal,
  explainTerminal,
  isTerminal,
  STAGE_LABELS,
} from './workflow';

export interface CompleteRenewalInput {
  /** Entered by a person. Never computed from a cycle length. */
  newExpiry: string;
  newLicenseNumber?: string | null;
  notes?: string | null;
}

/**
 * The renewal workflow.
 *
 * WHY THIS EXISTS
 * ---------------
 * Without it the loop never closes. A reminder fires, someone renews at the
 * portal, and the register still holds the old date: reminders keep firing
 * against a date already past until they lapse to SKIPPED, and no reminders
 * exist for the real expiry at all. The system goes quietly wrong in exactly
 * the way it was built to prevent, and nothing surfaces it.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * Submit anything. `AWAITING_AUTHORITY` records that a PERSON filed it at the
 * portal and said so. There is no integration, no credential, and no code here
 * that talks to an authority.
 *
 * Nor does it invent a date. `defaultCycleMonths` proposes; a person confirms
 * or overrides. Writing a computed expiry into the register would be inventing
 * the one fact this product exists to get right.
 */
@Injectable()
export class RenewalWorkflowService {
  private readonly logger = new Logger(RenewalWorkflowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reminders: RemindersService,
    private readonly audit: ComplianceAuditService,
  ) {}

  /**
   * The calendar date, in the tenant's own timezone, on which the most recent
   * renewal completed — or null if none has.
   *
   * This is the PERIOD BOUNDARY. Reminders dated before it belong to the
   * licence as it was before renewal, and showing them in the current ladder
   * makes a delivery from the old period read as though a future reminder had
   * already gone out.
   *
   * Derived server-side and returned as a PlainDate rather than left to the
   * browser, because the comparison is against `dueOn`, which is a calendar
   * date in the TENANT's timezone. A client converting `completedAt` with its
   * own clock would land on the wrong day for anyone not sitting in Riyadh —
   * the same class of bug this project has now hit four times.
   */
  async findPeriodStart(
    tenantId: string,
    licenseId: string,
  ): Promise<PlainDate | null> {
    const [tenant, latest] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { timeZone: true },
      }),
      this.prisma.licenseRenewal.findFirst({
        where: {
          tenantId,
          licenseId,
          status: RenewalStatus.COMPLETED,
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      }),
    ]);

    if (!latest?.completedAt) return null;
    // A renewal CLOSED without completing creates no boundary: nothing was
    // renewed, so the licence is still in the same period.
    return todayIn(tenant?.timeZone ?? 'Asia/Riyadh', latest.completedAt);
  }

  /** The renewal currently being worked on for a licence, if any. */
  async findActive(tenantId: string, licenseId: string) {
    const renewal = await this.prisma.licenseRenewal.findFirst({
      where: {
        tenantId,
        licenseId,
        status: {
          in: [
            RenewalStatus.PREPARING,
            RenewalStatus.READY,
            RenewalStatus.AWAITING_AUTHORITY,
          ],
        },
      },
      include: this.withPeople(),
      orderBy: { startedAt: 'desc' },
    });
    return renewal ? this.serialise(renewal) : null;
  }

  /** Every renewal for a licence, newest first. History, not just the live one. */
  async findAll(tenantId: string, licenseId: string) {
    const renewals = await this.prisma.licenseRenewal.findMany({
      where: { tenantId, licenseId },
      include: this.withPeople(),
      orderBy: { startedAt: 'desc' },
    });
    return renewals.map((renewal) => this.serialise(renewal));
  }

  async start(tenantId: string, actorUserId: string, licenseId: string) {
    const license = await this.prisma.license.findFirst({
      where: { id: licenseId, tenantId },
      select: { id: true, lifecycle: true, expiryDate: true, name: true },
    });
    if (!license) throw new NotFoundException('Licence not found');

    // Archiving means the licence is out of scope, so there is nothing to
    // renew — the same rule that already refuses document uploads.
    if (license.lifecycle === LicenseLifecycle.ARCHIVED) {
      throw new ConflictException(
        'This licence is archived, so there is nothing to renew.',
      );
    }

    const existing = await this.findActive(tenantId, licenseId);
    if (existing) {
      throw new ConflictException(
        'A renewal is already under way for this licence.',
      );
    }

    const renewal = await this.prisma.licenseRenewal.create({
      data: {
        tenantId,
        licenseId,
        status: RenewalStatus.PREPARING,
        startedById: actorUserId,
        // Captured now, because once the licence is updated this value is
        // gone from the licence itself and the change becomes unprovable.
        previousExpiry: license.expiryDate,
      },
      include: this.withPeople(),
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'renewal.started',
      entityType: 'renewal',
      entityId: renewal.id,
      changes: {
        licenseId: { from: null, to: licenseId },
        status: { from: null, to: RenewalStatus.PREPARING },
        previousExpiry: {
          from: null,
          to: license.expiryDate ? fromPrismaDate(license.expiryDate) : null,
        },
      },
    });

    this.logger.log(
      `Renewal started for licence ${licenseId} in tenant ${tenantId}`,
    );
    return this.serialise(renewal);
  }

  /**
   * Move a renewal to another stage.
   *
   * COMPLETED is not reachable here — it needs a new expiry, so it has its own
   * method. Routing it through a generic "set status" would make it possible
   * to mark something complete without recording what it completed WITH.
   */
  async transition(
    tenantId: string,
    actorUserId: string,
    renewalId: string,
    to: RenewalStatus,
    options: { outcome?: string | null; notes?: string | null } = {},
  ) {
    const renewal = await this.requireRenewal(tenantId, renewalId);

    if (to === RenewalStatus.COMPLETED) {
      throw new BadRequestException(
        'Completing a renewal needs the new expiry date. Use the completion ' +
          'step instead.',
      );
    }
    if (!canTransition(renewal.status, to)) {
      throw new ConflictException(explainRefusal(renewal.status, to));
    }
    // A closed renewal without a reason is an unexplained gap in the record.
    if (to === RenewalStatus.CLOSED && !options.outcome?.trim()) {
      throw new BadRequestException(
        'Closing a renewal needs a reason, so the record explains itself later.',
      );
    }

    const updated = await this.prisma.licenseRenewal.update({
      where: { id: renewalId },
      data: {
        status: to,
        outcome: options.outcome?.trim() || renewal.outcome,
        notes: options.notes?.trim() ?? renewal.notes,
        // Records that a PERSON filed it and told us — never that this system
        // submitted anything.
        ...(to === RenewalStatus.AWAITING_AUTHORITY
          ? { submittedAt: new Date(), submittedById: actorUserId }
          : {}),
      },
      include: this.withPeople(),
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'renewal.transitioned',
      entityType: 'renewal',
      entityId: renewalId,
      changes: {
        status: { from: renewal.status, to },
        ...(options.outcome
          ? { outcome: { from: renewal.outcome, to: options.outcome } }
          : {}),
      },
    });

    this.logger.log(
      `Renewal ${renewalId}: ${STAGE_LABELS[renewal.status]} -> ${STAGE_LABELS[to]}`,
    );
    return this.serialise(updated);
  }

  /**
   * Complete a renewal, writing the new expiry into the register.
   *
   * This is the most consequential write in the product: it changes the date
   * every reminder is computed from. So the new expiry is validated by exactly
   * the same rule as every other date in the system — `isPlainDate`, which
   * requires YYYY-MM-DD and rejects impossible days — and then converted by
   * `toPrismaDate`, the single conversion point for @db.Date. No second date
   * path is introduced here.
   */
  async complete(
    tenantId: string,
    actorUserId: string,
    renewalId: string,
    input: CompleteRenewalInput,
  ) {
    const renewal = await this.requireRenewal(tenantId, renewalId);

    if (!canTransition(renewal.status, RenewalStatus.COMPLETED)) {
      throw new ConflictException(
        explainRefusal(renewal.status, RenewalStatus.COMPLETED),
      );
    }

    const newExpiry = (input.newExpiry ?? '').trim();
    if (!isPlainDate(newExpiry)) {
      // The same message shape the importer uses, for the same reason: a date
      // like 01/02/2026 has two readings and guessing one would build the
      // whole reminder ladder on the wrong day.
      throw new BadRequestException(
        `"${newExpiry}" is not a date this system will accept. Use ` +
          'YYYY-MM-DD, for example 2027-09-15.',
      );
    }

    const previous = renewal.previousExpiry
      ? fromPrismaDate(renewal.previousExpiry)
      : null;

    const updatedLicense = await this.prisma.license.update({
      where: { id: renewal.licenseId },
      data: {
        expiryDate: toPrismaDate(newExpiry),
        ...(input.newLicenseNumber?.trim()
          ? { licenseNumber: input.newLicenseNumber.trim() }
          : {}),
      },
      select: { id: true, name: true, licenseNumber: true },
    });

    const completed = await this.prisma.licenseRenewal.update({
      where: { id: renewalId },
      data: {
        status: RenewalStatus.COMPLETED,
        newExpiry: toPrismaDate(newExpiry),
        newLicenseNumber: input.newLicenseNumber?.trim() || null,
        completedAt: new Date(),
        completedById: actorUserId,
        notes: input.notes?.trim() ?? renewal.notes,
      },
      include: this.withPeople(),
    });

    // THE POINT OF THE WHOLE SLICE. Old obligations are retired and a fresh
    // ladder is generated against the new date, under the preservation rules
    // Slices 3 and 7 established: SENT and SKIPPED are never rewritten.
    await this.reminders.reconcile(renewal.licenseId);

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'renewal.completed',
      entityType: 'renewal',
      entityId: renewalId,
      changes: {
        status: { from: renewal.status, to: RenewalStatus.COMPLETED },
        // How an expiry date changed is itself the evidence a compliance
        // review asks for, so both sides are recorded explicitly.
        expiryDate: { from: previous, to: newExpiry },
        ...(input.newLicenseNumber?.trim()
          ? {
              licenseNumber: {
                from: null,
                to: updatedLicense.licenseNumber,
              },
            }
          : {}),
      },
    });

    this.logger.log(
      `Renewal ${renewalId} completed: licence ${renewal.licenseId} expiry ` +
        `${previous ?? 'none'} -> ${newExpiry}, reminders regenerated`,
    );

    return this.serialise(completed);
  }

  /**
   * Converts the two @db.Date columns to plain "YYYY-MM-DD" strings.
   *
   * Prisma hands back a Date at UTC midnight, which serialises as a full ISO
   * instant. The client type says these are calendar dates, and every date
   * formatter in the frontend assumes that — so the boundary must make the
   * type true rather than leaving callers to guess. Leaving it raw produced
   * "Invalid time value" the moment a renewal existed.
   */
  private serialise<
    T extends { previousExpiry: Date | null; newExpiry: Date | null },
  >(renewal: T) {
    return {
      ...renewal,
      previousExpiry: renewal.previousExpiry
        ? fromPrismaDate(renewal.previousExpiry)
        : null,
      newExpiry: renewal.newExpiry ? fromPrismaDate(renewal.newExpiry) : null,
    };
  }

  private async requireRenewal(tenantId: string, renewalId: string) {
    // Resolved by { id, tenantId } together — never by id alone — so another
    // tenant's renewal is a 404 rather than a 403 that confirms it exists.
    const renewal = await this.prisma.licenseRenewal.findFirst({
      where: { id: renewalId, tenantId },
    });
    if (!renewal) throw new NotFoundException('Renewal not found');
    if (isTerminal(renewal.status)) {
      throw new ConflictException(explainTerminal(renewal.status));
    }
    return renewal;
  }

  private withPeople() {
    const person = { select: { id: true, name: true, email: true } };
    return {
      startedBy: person,
      submittedBy: person,
      completedBy: person,
    };
  }
}
