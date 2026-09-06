import { Body, Controller, Delete, Get, HttpCode, Param } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { UsersService } from './users.service';

/**
 * GET /api/v1/users — the people in the caller's own tenant.
 *
 * There is no tenant parameter, by design. The tenant is taken from the
 * authenticated JWT, so there is no input a caller could manipulate to read
 * another organisation's directory.
 *
 * AUTHORIZATION
 * -------------
 * Any authenticated member of the tenant may read it. The application has no
 * working role model to defer to: `UserRole` exists, but there is no roles
 * guard, no @Roles decorator, and every registered user is created as OWNER.
 * Inventing an authorization scheme here would be a guess, so isolation is by
 * tenant. See the slice report.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findAssignable(user.tenantId);
  }

  /** The same people, with what each is accountable for. */
  @Get('holdings')
  findWithHoldings(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findWithHoldings(user.tenantId);
  }

  /**
   * Remove a person. See UsersService.remove for why this is transfer-then-
   * remove rather than a delete: `License.owner` is `onDelete: SetNull`, so a
   * plain delete silently unassigns every licence they held.
   */
  @Delete(':id')
  @HttpCode(200)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { transferToUserId?: string | null; acceptUnassigned?: boolean },
  ) {
    return this.usersService.remove({
      tenantId: user.tenantId,
      actorUserId: user.id,
      userId: id,
      transferToUserId: body?.transferToUserId ?? null,
      acceptUnassigned: body?.acceptUnassigned ?? false,
    });
  }
}
