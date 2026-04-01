import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getDashboardMetrics(user.tenantId);
  }

  @Get('risk-overview')
  getRiskOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.analyticsService.getRiskOverview(user.tenantId);
  }
}
