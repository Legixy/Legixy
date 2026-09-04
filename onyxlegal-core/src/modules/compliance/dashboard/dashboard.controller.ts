import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { DashboardService } from './dashboard.service';
import { YearAheadService } from './year-ahead.service';

/**
 * Compliance dashboard.
 *
 * Read-only and derived. The tenant comes from the JWT; there is no route
 * parameter and no query string that could name a different one.
 */
@Controller('compliance/dashboard')
export class DashboardController {
  constructor(private readonly yearAheadService: YearAheadService,
    private readonly dashboard: DashboardService) {}

  /**
   * GET /api/v1/compliance/dashboard/year-ahead
   *
   * Every licence expiring in the next twelve months, bucketed by the
   * tenant's calendar months. Separate from the overview because the
   * overview's projection is deliberately narrow.
   */
  @Get('year-ahead')
  yearAhead(@CurrentUser() user: AuthenticatedUser) {
    return this.yearAheadService.forTenant(user.tenantId);
  }

  @Get()
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboard.overview(user.tenantId);
  }
}
