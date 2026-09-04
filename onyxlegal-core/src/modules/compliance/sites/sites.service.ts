import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { LicenseLifecycle, Prisma, SiteStatus } from 'generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ComplianceAuditService } from '../audit/compliance-audit.service';
import { ComplianceSummary, summariseLicenses } from '../domain/license-status';
import { fromPrismaDate, PlainDate, todayIn } from '../domain/plain-date';
import {
  CreateSiteDto,
  ListSitesQueryDto,
  UpdateSiteDto,
} from './dto/site.dto';

/**
 * Only ACTIVE licences count toward a site's compliance rollup. An archived
 * licence is one the business has deliberately stopped tracking; including it
 * would make a tidy site look permanently non-compliant.
 */
const ROLLUP_SCOPE = { lifecycle: LicenseLifecycle.ACTIVE } as const;

/**
 * Sites — physical locations within a tenant.
 *
 * TENANT ISOLATION
 * ----------------
 * `tenantId` is always the first parameter and always comes from the
 * authenticated JWT, never from the request body. Every read uses
 * `findFirst({ where: { id, tenantId } })` — never `findUnique({ id })`,
 * which would return another tenant's row before any check could run.
 *
 * Reads that miss return 404, not 403: confirming that an id exists in
 * another tenant is itself an information leak.
 */
@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ComplianceAuditService,
  ) {}

  async create(tenantId: string, actorUserId: string, dto: CreateSiteDto) {
    try {
      const site = await this.prisma.site.create({
        data: {
          tenantId,
          name: dto.name.trim(),
          code: dto.code?.trim() || null,
          city: dto.city?.trim() || null,
          address: dto.address?.trim() || null,
          status: dto.status ?? SiteStatus.ACTIVE,
        },
      });

      await this.audit.record({
        tenantId,
        actorUserId,
        action: 'site.created',
        entityType: 'site',
        entityId: site.id,
      });

      this.logger.log(`Site "${site.name}" created in tenant ${tenantId}`);
      return site;
    } catch (error) {
      throw this.translateUniqueViolation(error, dto.name);
    }
  }

  async findAll(tenantId: string, query: ListSitesQueryDto) {
    const { status, search, page = 1, limit = 25 } = query;

    const where: Prisma.SiteWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.site.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { licenses: true } },
          licenses: {
            where: ROLLUP_SCOPE,
            select: { expiryDate: true },
          },
        },
      }),
      this.prisma.site.count({ where }),
    ]);

    const today = await this.todayFor(tenantId);

    return {
      data: data.map((site) => this.withCompliance(site, today)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { licenses: true } },
        licenses: {
          where: ROLLUP_SCOPE,
          select: { expiryDate: true },
        },
      },
    });

    if (!site) throw new NotFoundException(`Site ${id} not found`);

    const today = await this.todayFor(tenantId);

    // Entity-level licences are held by the company, not by this site, but they
    // DO apply here — a Commercial Registration covers every location. They are
    // returned as a separate rollup so the page can say "3 licences at this
    // site, plus 2 company-wide that also apply" instead of conflating the two
    // populations or dropping the entity ones entirely.
    const entityLicences = await this.prisma.license.findMany({
      where: { tenantId, siteId: null, ...ROLLUP_SCOPE },
      select: { expiryDate: true },
    });

    return {
      ...this.withCompliance(site, today),
      entityCompliance: summariseLicenses(
        entityLicences.map((licence) =>
          licence.expiryDate ? fromPrismaDate(licence.expiryDate) : null,
        ),
        today,
      ),
    };
  }

  async update(
    tenantId: string,
    actorUserId: string,
    id: string,
    dto: UpdateSiteDto,
  ) {
    const existing = await this.findOne(tenantId, id);

    const data: Prisma.SiteUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.code !== undefined) data.code = dto.code?.trim() || null;
    if (dto.city !== undefined) data.city = dto.city?.trim() || null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.status !== undefined) data.status = dto.status;

    try {
      // Safe to update by id alone: findOne above already proved tenant ownership.
      const site = await this.prisma.site.update({ where: { id }, data });

      const changes = this.audit.diff(existing, site, [
        'name',
        'code',
        'city',
        'address',
        'status',
      ]);
      if (changes) {
        await this.audit.record({
          tenantId,
          actorUserId,
          action: 'site.updated',
          entityType: 'site',
          entityId: id,
          changes,
        });
      }

      return site;
    } catch (error) {
      throw this.translateUniqueViolation(error, dto.name ?? existing.name);
    }
  }

  /**
   * Sites are deactivated, not deleted.
   *
   * `License.site` uses `onDelete: Restrict`, so a hard delete of a site with
   * licences would fail at the database anyway — deliberately. Compliance
   * history must not disappear because someone tidied up a location.
   */
  async deactivate(tenantId: string, actorUserId: string, id: string) {
    const existing = await this.findOne(tenantId, id);

    if (existing.status === SiteStatus.INACTIVE) {
      return existing;
    }

    const site = await this.prisma.site.update({
      where: { id },
      data: { status: SiteStatus.INACTIVE },
    });

    await this.audit.record({
      tenantId,
      actorUserId,
      action: 'site.deactivated',
      entityType: 'site',
      entityId: id,
      changes: { status: { from: existing.status, to: site.status } },
    });

    return site;
  }

  /**
   * Replace the raw licence rows with a status rollup.
   *
   * The rows are fetched only to be counted — returning them would leak a
   * site's entire licence list into every row of the sites index.
   */
  private withCompliance<T extends { licenses: { expiryDate: Date | null }[] }>(
    site: T,
    today: PlainDate,
  ): Omit<T, 'licenses'> & { compliance: ComplianceSummary } {
    const { licenses, ...rest } = site;
    const compliance = summariseLicenses(
      licenses.map((licence) =>
        licence.expiryDate ? fromPrismaDate(licence.expiryDate) : null,
      ),
      today,
    );
    return { ...rest, compliance };
  }

  /** Today's date in the tenant's timezone — one clock read per request. */
  private async todayFor(tenantId: string): Promise<PlainDate> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { timeZone: true },
    });
    return todayIn(tenant?.timeZone ?? 'Asia/Riyadh');
  }

  /** Turn Prisma's P2002 into a message a user can act on. */
  private translateUniqueViolation(error: unknown, name: string): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(
        `A site named "${name}" already exists in this organisation.`,
      );
    }
    return error;
  }
}
