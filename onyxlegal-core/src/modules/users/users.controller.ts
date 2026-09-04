import { Controller, Get } from '@nestjs/common';
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
}
