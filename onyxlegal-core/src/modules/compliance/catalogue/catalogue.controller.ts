import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * The licence taxonomy: authorities and licence types.
 *
 * GLOBAL reference data, so these routes are read-only and take no tenant
 * parameter. They expose no tenant information — an authority is a government
 * body, identical for every customer. There is deliberately NO write endpoint,
 * which is what makes global rows safe in a multi-tenant database.
 *
 * Authentication is still required (the global JwtAuthGuard applies); this is
 * not public data, it is simply not tenant-partitioned.
 */
@Controller('catalogue')
export class CatalogueController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('authorities')
  findAuthorities() {
    return this.prisma.authority.findMany({
      select: { id: true, name: true, nameAr: true, portalUrl: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Active types only — retired types must not be offered for new licences. */
  @Get('license-types')
  findLicenseTypes() {
    return this.prisma.licenseType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameAr: true,
        scope: true,
        defaultCycleMonths: true,
        typicalFee: true,
        requiredDocuments: true,
        authority: { select: { id: true, name: true, nameAr: true } },
      },
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
    });
  }
}
