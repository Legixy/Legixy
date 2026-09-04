import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../auth/jwt.strategy';
import { SitesService } from './sites.service';
import {
  CreateSiteDto,
  ListSitesQueryDto,
  UpdateSiteDto,
} from './dto/site.dto';

/**
 * Sites API.
 *
 * Every handler takes `user.tenantId` from the authenticated JWT and passes
 * it as the service's first argument. No route accepts a tenant identifier
 * from the client, in any position. Auth is enforced globally by
 * `JwtAuthGuard` (registered as APP_GUARD); none of these routes is @Public().
 */
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSiteDto) {
    return this.sitesService.create(user.tenantId, user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListSitesQueryDto,
  ) {
    return this.sitesService.findAll(user.tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sitesService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
  ) {
    return this.sitesService.update(user.tenantId, user.id, id, dto);
  }

  /** Deactivate rather than delete — licences hold compliance history. */
  @Post(':id/deactivate')
  @HttpCode(200)
  deactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sitesService.deactivate(user.tenantId, user.id, id);
  }
}
