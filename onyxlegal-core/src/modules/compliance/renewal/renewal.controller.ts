import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { RenewalService } from './renewal.service';

/**
 * Renewal preparation. Read-only and derived — nothing about a renewal is
 * stored, and there is deliberately no endpoint that submits anything.
 */
@Controller('licenses/:licenseId/renewal')
export class RenewalController {
  constructor(private readonly renewal: RenewalService) {}

  @Get()
  prepare(
    @CurrentUser() user: AuthenticatedUser,
    @Param('licenseId') licenseId: string,
  ) {
    return this.renewal.prepare(user.tenantId, licenseId);
  }
}
