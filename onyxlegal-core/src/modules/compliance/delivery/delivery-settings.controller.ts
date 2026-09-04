import { Body, Controller, Get, Patch } from '@nestjs/common';
import { IsEmail, IsOptional, ValidateIf } from 'class-validator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { DeliverySettingsService } from './delivery-settings.service';

export class SetCopyEmailDto {
  /**
   * Null clears it. `ValidateIf` lets null through while still rejecting a
   * malformed string — without it, `@IsEmail` would reject the clear case and
   * there would be no way to unset the address.
   */
  @ValidateIf((_, value) => value !== null && value !== '')
  @IsEmail({}, { message: 'That is not a valid email address.' })
  @IsOptional()
  copyEmail!: string | null;
}

/**
 * Where reminders go.
 *
 * Tenant comes from the JWT on both routes. There is no route that accepts a
 * tenant id, here or anywhere in this product.
 */
@Controller('compliance/delivery')
export class DeliverySettingsController {
  constructor(private readonly settings: DeliverySettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.settings.get(user.tenantId);
  }

  @Patch('copy-email')
  setCopyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetCopyEmailDto,
  ) {
    return this.settings.setCopyEmail(
      user.tenantId,
      user.id,
      dto.copyEmail ?? null,
    );
  }
}
