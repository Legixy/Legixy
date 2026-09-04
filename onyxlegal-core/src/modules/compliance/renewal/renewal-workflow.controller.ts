import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { RenewalStatus } from 'generated/prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { IsPlainDate } from '../validation/is-plain-date.decorator';
import { RenewalWorkflowService } from './renewal-workflow.service';

class TransitionDto {
  /**
   * COMPLETED is deliberately absent. Completing needs a new expiry, so it
   * has its own endpoint — otherwise a renewal could be marked complete
   * without recording what it completed with.
   */
  @IsIn([
    RenewalStatus.PREPARING,
    RenewalStatus.READY,
    RenewalStatus.AWAITING_AUTHORITY,
    RenewalStatus.CLOSED,
  ])
  status: RenewalStatus;

  /** Required when closing, so the record explains itself later. */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  outcome?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

class CompleteDto {
  /**
   * Entered by a person, never computed. Validated by the same strict rule as
   * every other date in the system: YYYY-MM-DD, real calendar days only.
   */
  @IsPlainDate()
  newExpiry: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  newLicenseNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

/**
 * The renewal workflow.
 *
 * Tenant comes from the JWT on every route; no route accepts a tenant
 * identifier, and a renewal belonging to another tenant returns 404 rather
 * than 403 — a 403 would confirm the id exists.
 */
@Controller('licenses/:licenseId/renewals')
export class RenewalWorkflowController {
  constructor(private readonly workflow: RenewalWorkflowService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
  ) {
    return this.workflow.findAll(user.tenantId, licenseId);
  }

  /**
   * Wrapped rather than returning the renewal or a bare `null`.
   *
   * Nest serialises a returned `null` as an EMPTY response body, not the JSON
   * literal `null`, so the browser client's `res.json()` threw a parse error
   * and the panel rendered "Cannot reach the server" for every licence that
   * simply had no renewal yet. An object is always valid JSON.
   */
  /**
   * The period boundary: when the most recent renewal completed, as a calendar
   * date in the tenant's timezone. Null when the licence has never been
   * renewed, which is the common case.
   *
   * Wrapped, like `active` — a bare null serialises as an empty body and the
   * client's res.json() throws. See the note on that handler.
   */
  @Get('period-start')
  async periodStart(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
  ) {
    return {
      periodStart: await this.workflow.findPeriodStart(user.tenantId, licenseId),
    };
  }

  @Get('active')
  async findActive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
  ) {
    return {
      renewal: await this.workflow.findActive(user.tenantId, licenseId),
    };
  }

  @Post()
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
  ) {
    return this.workflow.start(user.tenantId, user.id, licenseId);
  }

  @Patch(':renewalId')
  transition(
    @CurrentUser() user: AuthenticatedUser,
    @Param('renewalId') renewalId: string,
    @Body() dto: TransitionDto,
  ) {
    return this.workflow.transition(
      user.tenantId,
      user.id,
      renewalId,
      dto.status,
      { outcome: dto.outcome ?? null, notes: dto.notes ?? null },
    );
  }

  @Post(':renewalId/complete')
  complete(
    @CurrentUser() user: AuthenticatedUser,
    @Param('renewalId') renewalId: string,
    @Body() dto: CompleteDto,
  ) {
    return this.workflow.complete(user.tenantId, user.id, renewalId, {
      newExpiry: dto.newExpiry,
      newLicenseNumber: dto.newLicenseNumber ?? null,
      notes: dto.notes ?? null,
    });
  }
}
