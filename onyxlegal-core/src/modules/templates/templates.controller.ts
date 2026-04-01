import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { Public } from '../auth/public.decorator';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('category') category?: string,
  ) {
    return this.templatesService.findAll(user.tenantId, category);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.templatesService.findOne(user.tenantId, id);
  }

  /**
   * POST /api/v1/templates/seed
   * One-time seed of system templates. Public for initial setup.
   */
  @Public()
  @Post('seed')
  seed() {
    return this.templatesService.seedSystemTemplates();
  }
}
