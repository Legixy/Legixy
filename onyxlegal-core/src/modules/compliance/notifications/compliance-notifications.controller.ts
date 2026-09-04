import { Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { ComplianceNotificationsService } from './compliance-notifications.service';

/**
 * In-app notifications for compliance reminders.
 *
 * Tenant and user both come from the JWT. No route accepts either, so one
 * user cannot read another's list or mark something read on their behalf.
 */
@Controller('compliance/notifications')
export class ComplianceNotificationsController {
  constructor(private readonly notifications: ComplianceNotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.list(user.tenantId, user.id);
  }

  @Get('count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.unreadCount(user.tenantId, user.id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user.tenantId, user.id);
  }

  @Patch(':reminderId/read')
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reminderId') reminderId: string,
  ) {
    return this.notifications.markRead(user.tenantId, user.id, reminderId);
  }
}
