import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { CoverageService } from './coverage.service';

class SetRequirementDto {
  @IsBoolean()
  required: boolean;
}

/**
 * Coverage gaps and ownership concentration.
 *
 * Tenant comes from the JWT on every route; there is no tenant parameter to
 * manipulate. Read-only — a gap is computed, never stored.
 */
@Controller('compliance')
export class CoverageController {
  constructor(private readonly coverage: CoverageService) {}

  /** Expected licence types with no active record. */
  /**
   * Coverage with its REASON. `gaps` alone cannot distinguish "nothing
   * declared" from "everything declared is covered", and rendering those the
   * same told a new tenant they were fully covered.
   */
  @Get('coverage')
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.coverage.findCoverage(user.tenantId);
  }

  @Get('requirements')
  requirements(@CurrentUser() user: AuthenticatedUser) {
    return this.coverage.listRequirements(user.tenantId);
  }

  @Put('requirements/:licenseTypeId')
  setRequirement(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseTypeId') licenseTypeId: string,
    @Body() dto: SetRequirementDto,
  ) {
    return this.coverage.setRequirement(
      user.tenantId,
      user.id,
      licenseTypeId,
      dto.required,
    );
  }

  @Get('gaps')
  findGaps(@CurrentUser() user: AuthenticatedUser) {
    return this.coverage.findGaps(user.tenantId);
  }

  /** Active licences per responsible person, including the unassigned bucket. */
  @Get('owner-load')
  findOwnerLoad(@CurrentUser() user: AuthenticatedUser) {
    return this.coverage.findOwnerLoad(user.tenantId);
  }
}
