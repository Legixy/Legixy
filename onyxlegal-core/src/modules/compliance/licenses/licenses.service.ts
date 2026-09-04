import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LicenseLifecycle, Prisma } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RemindersService } from '../reminders/reminders.service';
import { LicenseScope } from 'generated/prisma/client';
import {
  AUDITED_LICENSE_FIELDS,
  ComplianceAuditService,
} from '../audit/compliance-audit.service';
import {
  assessExpiry,
  ExpiryAssessment,
  ExpiryDateBounds,
  expiryStatusBounds,
  needsAttentionBounds,
} from '../domain/license-status';
import {
  differenceInDays,
  fromPrismaDate,
  PlainDate,
  todayIn,
  toPrismaDate,
} from '../domain/plain-date';
import {
  CreateLicenseDto,
  ListLicensesQueryDto,
  UpdateLicenseDto,
} from './dto/license.dto';

/** A licence row plus its derived, never-stored expiry assessment. */
export type LicenseWithStatus = Record<string, unknown> & ExpiryAssessment;

/**
 * Licences — the core compliance entity.
 *
 * TENANT ISOLATION
 * ----------------
 * `tenantId` is always the first parameter, always from the authenticated
 * JWT. Every read is `findFirst({ where: { id, tenantId } })`. Cross-tenant
 * references are rejected explicitly: a licence in tenant A cannot be
 * attached to a site or an owner in tenant B, even though both ids are valid.
 *
 * DERIVED STATUS
 * --------------
 * Expiry status is computed on read from (expiryDate, today-in-tenant-tz).
 * It is never written to the database. See domain/license-status.ts.
 */
@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ComplianceAuditService,
    private readonly reminders: RemindersService,
  ) {}

  async create(tenantId: string, actorUserId: string, dto: CreateLicenseDto) {
    await this.assertSiteBelongsToTenant(tenantId, dto.siteId);
    await this.assertOwnerBelongsToTenant(tenantId, dto.ownerUserId);
    await this.assertScopeMatchesSite(dto.licenseTypeId, dto.siteId ?? null);
    this.assertDateOrder(dto.issueDate ?? null, dto.expiryDate ?? null);

    const license = await this.prisma.license.create({
      data: {
        tenantId,
        siteId: dto.siteId || null,
        ownerUserId: dto.ownerUserId || null,
        licenseTypeId: dto.licenseTypeId || null,
        hijriExpiry: dto.hijriExpiry?.trim() || null,
        name: dto.name.trim(),
        licenseType: dto.licenseType?.trim() || null,
        authority: dto.authority?.trim() || null,
        licenseNumber: dto.licenseNumber?.trim() || null,
        issueDate: dto.issueDate ? toPrismaDate(dto.issueDate) : null,
        expiryDate: dto.expiryDate ? toPrismaDate(dto.expiryDate) : null,
        notes: dto.notes?.trim() || null,
      },
    });

    // A new licence immediately acquires its reminder obligations. This is the
    // whole promise of the product: nothing expires because nobody was told.
    await this.reminders.reconcile(license.id);

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'license.created',
      entityType: 'license',
      entityId: license.id,
    });

    this.logger.log(
      `Licence "${license.name}" created in tenant ${tenantId} ` +
        `(${license.siteId ? `site ${license.siteId}` : 'company-level'})`,
    );

    return this.withStatus(license, await this.todayFor(tenantId));
  }

  async findAll(tenantId: string, query: ListLicensesQueryDto) {
    const {
      siteId,
      ownerUserId,
      lifecycle,
      expiryStatus,
      needsAttention: attentionOnly,
      search,
      page = 1,
      limit = 25,
    } = query;

    const today = await this.todayFor(tenantId);

    // Expiry status is translated into an indexed date predicate rather than
    // filtered after fetching. Filtering a fetched page would omit matches from
    // later pages and make `meta.total` disagree with the list — at limit=3 the
    // old implementation reported 12 licences and returned none.
    const expiryFilter: Prisma.LicenseWhereInput = expiryStatus
      ? boundsToWhere(expiryStatusBounds(expiryStatus, today))
      : attentionOnly
        ? boundsToWhere(needsAttentionBounds(today))
        : {};

    const where: Prisma.LicenseWhereInput = {
      tenantId,
      // "none" is the explicit filter for company-level licences.
      ...(siteId && { siteId: siteId === 'none' ? null : siteId }),
      /*
        `none` means "nobody is responsible", mirroring siteId above.

        The asymmetry was found in Slice 19: the delivery screen's "Assign
        someone" button linked to ?ownerUserId=none and the filter silently
        ignored it, so the button went to an unfiltered list. Completing the
        contract is the fix; siteId has worked this way since Slice 2.
      */
      ...(ownerUserId && {
        ownerUserId: ownerUserId === 'none' ? null : ownerUserId,
      }),
      ...(lifecycle && { lifecycle }),
      ...expiryFilter,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { authority: { contains: search, mode: 'insensitive' as const } },
          { licenseNumber: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.license.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        // Nulls last: licences with no expiry are never the urgent ones.
        orderBy: [
          { expiryDate: { sort: 'asc', nulls: 'last' } },
          { name: 'asc' },
        ],
        include: {
          site: { select: { id: true, name: true, city: true } },
          owner: { select: { id: true, name: true, email: true } },
          type: {
            select: {
              id: true,
              name: true,
              scope: true,
              authority: { select: { id: true, name: true } },
            },
          },
        },
      }),
      this.prisma.license.count({ where }),
    ]);

    const data = rows.map((row) => this.withStatus(row, today));

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const license = await this.prisma.license.findFirst({
      where: { id, tenantId },
      include: {
        site: { select: { id: true, name: true, city: true } },
        owner: { select: { id: true, name: true, email: true } },
        type: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            scope: true,
            typicalFee: true,
            requiredDocuments: true,
            authority: {
              select: { id: true, name: true, nameAr: true, portalUrl: true },
            },
          },
        },
      },
    });

    if (!license) throw new NotFoundException(`Licence ${id} not found`);
    return this.withStatus(license, await this.todayFor(tenantId));
  }

  async update(
    tenantId: string,
    actorUserId: string,
    id: string,
    dto: UpdateLicenseDto,
  ) {
    const existing = await this.prisma.license.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException(`Licence ${id} not found`);

    if (dto.siteId !== undefined) {
      await this.assertSiteBelongsToTenant(tenantId, dto.siteId);
    }
    if (dto.ownerUserId !== undefined) {
      await this.assertOwnerBelongsToTenant(tenantId, dto.ownerUserId);
    }

    // Validate the resulting date pair, not just the supplied half — a
    // partial update can invalidate the record just as easily.
    const nextIssue =
      dto.issueDate !== undefined
        ? dto.issueDate
        : existing.issueDate
          ? fromPrismaDate(existing.issueDate)
          : null;
    const nextExpiry =
      dto.expiryDate !== undefined
        ? dto.expiryDate
        : existing.expiryDate
          ? fromPrismaDate(existing.expiryDate)
          : null;
    this.assertDateOrder(nextIssue, nextExpiry);

    // Validate the resulting pair, not just what was supplied: changing only
    // the type, or only the site, can violate the invariant on its own.
    const nextTypeId =
      dto.licenseTypeId !== undefined
        ? dto.licenseTypeId
        : existing.licenseTypeId;
    const nextSiteId = dto.siteId !== undefined ? dto.siteId : existing.siteId;
    await this.assertScopeMatchesSite(nextTypeId, nextSiteId ?? null);

    const data: Prisma.LicenseUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.licenseType !== undefined)
      data.licenseType = dto.licenseType?.trim() || null;
    if (dto.authority !== undefined)
      data.authority = dto.authority?.trim() || null;
    if (dto.licenseNumber !== undefined)
      data.licenseNumber = dto.licenseNumber?.trim() || null;
    if (dto.notes !== undefined) data.notes = dto.notes?.trim() || null;
    if (dto.hijriExpiry !== undefined)
      data.hijriExpiry = dto.hijriExpiry?.trim() || null;
    if (dto.licenseTypeId !== undefined) {
      data.type = dto.licenseTypeId
        ? { connect: { id: dto.licenseTypeId } }
        : { disconnect: true };
    }
    if (dto.issueDate !== undefined)
      data.issueDate = dto.issueDate ? toPrismaDate(dto.issueDate) : null;
    if (dto.expiryDate !== undefined)
      data.expiryDate = dto.expiryDate ? toPrismaDate(dto.expiryDate) : null;
    if (dto.siteId !== undefined) {
      data.site = dto.siteId
        ? { connect: { id: dto.siteId } }
        : { disconnect: true };
    }
    if (dto.ownerUserId !== undefined) {
      data.owner = dto.ownerUserId
        ? { connect: { id: dto.ownerUserId } }
        : { disconnect: true };
    }

    // Safe to update by id alone: ownership was proved above.
    const license = await this.prisma.license.update({
      where: { id },
      data,
      include: {
        site: { select: { id: true, name: true, city: true } },
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // Only an expiry change alters WHEN the licence must be chased. Renaming it
    // leaves the schedule untouched, so reconciliation is skipped — the
    // obligations are already correct.
    const expiryChanged =
      existing.expiryDate?.getTime() !== license.expiryDate?.getTime();
    if (expiryChanged) {
      await this.reminders.reconcile(license.id);
    }

    // Gaining an owner does not change WHEN the licence is chased, but it does
    // change WHETHER anyone can be chased at all. Reminders that went
    // UNDELIVERABLE for want of a recipient now have one, and without this
    // they would stay dead — an owner assigned, a schedule on screen, and
    // nothing ever sent.
    const gainedOwner = !existing.ownerUserId && !!license.ownerUserId;
    if (gainedOwner) {
      await this.reminders.reviveForOwnerAssignment(license.id);
    }

    const changes = this.audit.diff(existing, license, AUDITED_LICENSE_FIELDS);
    if (changes) {
      await this.audit.record({
        tenantId,
        actorUserId,
        // An expiry change alters the compliance picture and, once the
        // reminder engine lands, invalidates its schedule. Name it distinctly.
        action: changes.expiryDate
          ? 'license.expiry_changed'
          : 'license.updated',
        entityType: 'license',
        entityId: id,
        changes,
      });
    }

    return this.withStatus(license, await this.todayFor(tenantId));
  }

  /**
   * Archive, never delete.
   *
   * Compliance records are evidence. A licence that is superseded or no
   * longer tracked is marked ARCHIVED and drops out of default listings,
   * but its history — and its audit trail — survives.
   */
  async archive(tenantId: string, actorUserId: string, id: string) {
    const existing = await this.prisma.license.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException(`Licence ${id} not found`);

    if (existing.lifecycle === LicenseLifecycle.ARCHIVED) {
      return this.withStatus(existing, await this.todayFor(tenantId));
    }

    const license = await this.prisma.license.update({
      where: { id },
      data: { lifecycle: LicenseLifecycle.ARCHIVED },
    });

    // Archiving retires every outstanding obligation: a licence nobody is
    // tracking any more must not keep generating chases.
    await this.reminders.reconcile(license.id);

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'license.archived',
      entityType: 'license',
      entityId: id,
      changes: {
        lifecycle: { from: existing.lifecycle, to: license.lifecycle },
      },
    });

    return this.withStatus(license, await this.todayFor(tenantId));
  }

  // ── Internals ──────────────────────────────────────────────────────────

  /**
   * Rejects attaching a licence to a site in another tenant.
   *
   * Both ids are real and well-formed, so this cannot be caught by DTO
   * validation or by a foreign key — only by an explicit tenant-scoped
   * lookup. This is the check that stops tenant A referencing tenant B's site.
   */
  private async assertSiteBelongsToTenant(
    tenantId: string,
    siteId?: string | null,
  ): Promise<void> {
    if (!siteId) return;

    const site = await this.prisma.site.findFirst({
      where: { id: siteId, tenantId },
      select: { id: true },
    });

    if (!site) {
      throw new BadRequestException(
        `Site ${siteId} does not exist in this organisation.`,
      );
    }
  }

  /** Rejects assigning ownership to a user in another tenant. */
  private async assertOwnerBelongsToTenant(
    tenantId: string,
    ownerUserId?: string | null,
  ): Promise<void> {
    if (!ownerUserId) return;

    const user = await this.prisma.user.findFirst({
      where: { id: ownerUserId, tenantId },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(
        `User ${ownerUserId} does not exist in this organisation.`,
      );
    }
  }

  /**
   * Enforce the scope invariant.
   *
   *   type.scope = ENTITY  → the licence belongs to the company, so no siteId
   *   type.scope = SITE    → the licence exists at a location, so a siteId
   *
   * This is what keeps the two populations countable. Without it, an entity
   * licence attached to a site would be double-counted, and a site licence with
   * no site would be invisible in every view.
   *
   * Licences with no catalogued type are unconstrained — the taxonomy is
   * optional, and legacy rows must keep working.
   */
  private async assertScopeMatchesSite(
    licenseTypeId: string | null | undefined,
    siteId: string | null,
  ): Promise<void> {
    if (!licenseTypeId) return;

    const type = await this.prisma.licenseType.findUnique({
      where: { id: licenseTypeId },
      select: { name: true, scope: true },
    });

    if (!type) {
      throw new BadRequestException(`Licence type ${licenseTypeId} not found.`);
    }

    if (type.scope === LicenseScope.ENTITY && siteId) {
      throw new BadRequestException(
        `"${type.name}" is an entity-level licence held by the company as a whole, ` +
          'so it cannot be assigned to a site.',
      );
    }

    if (type.scope === LicenseScope.SITE && !siteId) {
      throw new BadRequestException(
        `"${type.name}" is a site-level licence, so it must be assigned to a site.`,
      );
    }
  }

  private assertDateOrder(
    issueDate: PlainDate | null,
    expiryDate: PlainDate | null,
  ): void {
    if (!issueDate || !expiryDate) return;

    if (differenceInDays(issueDate, expiryDate) < 0) {
      throw new BadRequestException(
        `expiryDate (${expiryDate}) must not be earlier than issueDate (${issueDate}).`,
      );
    }
  }

  /** Today's date in the tenant's timezone — the single clock read per request. */
  private async todayFor(tenantId: string): Promise<PlainDate> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timeZone: true },
    });
    return todayIn(tenant?.timeZone ?? 'Asia/Riyadh');
  }

  /**
   * Attach the derived expiry assessment to a licence row, and SERIALISE its
   * calendar dates on the way out.
   *
   * THE BUG THIS FIXES, AND WHY THE TYPE MATTERS MORE THAN THE FIX
   * --------------------------------------------------------------
   * This method used to read:
   *
   *     return { ...license, ...assessExpiry(expiry, today) };
   *
   * It converted `expiryDate` to compute the status, then the spread put the
   * raw Prisma `Date` straight back. So licences — alone among every module
   * in this domain — emitted ISO instants ("2026-09-15T00:00:00.000Z") for
   * columns the schema declares `@db.Date` and the domain treats as calendar
   * dates. Renewals, reminders, documents, sites, dashboard and notifications
   * all emitted "2026-09-15".
   *
   * Nothing broke, because every frontend formatter pins `timeZone: 'UTC'`.
   * The guard was a comment on the client type. Four date bugs have shipped
   * in this project and every one was a calendar date briefly becoming an
   * instant, so a comment is not good enough.
   *
   * The return type is now stated explicitly rather than inferred as
   * `T & ExpiryAssessment`. That is the load-bearing change: `SerialisedDates`
   * maps `issueDate` and `expiryDate` to `PlainDate | null`, so a future edit
   * that drops the conversion and spreads the raw row FAILS TO COMPILE —
   * `Date` is not assignable to `string`. The old signature would have
   * accepted it silently, which is exactly how it got here.
   */
  private withStatus<T extends { expiryDate: Date | null; issueDate: Date | null }>(
    license: T,
    today: PlainDate,
  ): SerialisedDates<T> & ExpiryAssessment {
    const expiry = license.expiryDate
      ? fromPrismaDate(license.expiryDate)
      : null;

    return {
      ...license,
      issueDate: license.issueDate ? fromPrismaDate(license.issueDate) : null,
      expiryDate: expiry,
      ...assessExpiry(expiry, today),
    };
  }
}

/**
 * A licence row with its `@db.Date` columns replaced by `PlainDate` strings.
 *
 * This exists so the compiler enforces the boundary that a comment used to.
 * Any service method returning a licence must return this shape; spreading a
 * raw Prisma row into it is a type error, not a silent regression.
 */
type SerialisedDates<T extends { expiryDate: Date | null; issueDate: Date | null }> =
  Omit<T, 'issueDate' | 'expiryDate'> & {
    issueDate: PlainDate | null;
    expiryDate: PlainDate | null;
  };

/**
 * Turn domain date bounds into a Prisma predicate.
 *
 * Kept at module scope so the domain layer never imports Prisma types.
 */
function boundsToWhere(bounds: ExpiryDateBounds): Prisma.LicenseWhereInput {
  if (bounds.isNull) return { expiryDate: null };

  const range: Prisma.DateTimeFilter = {};
  if (bounds.gte) range.gte = toPrismaDate(bounds.gte);
  if (bounds.lte) range.lte = toPrismaDate(bounds.lte);
  // A bounded range must also exclude null expiry dates, which SQL comparisons
  // would drop anyway — stated explicitly so the intent is not accidental.
  return { expiryDate: range };
}
