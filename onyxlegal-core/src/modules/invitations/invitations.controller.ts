import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  HttpCode,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { Public } from '../auth/public.decorator';
import { InvitationsService } from './invitations.service';

/**
 * Putting a second person in a workspace.
 *
 * TENANT SAFETY
 * -------------
 * There is no tenant parameter on any authenticated route: the workspace comes
 * from the JWT. `POST /invitations/accept` is deliberately public — the person
 * accepting has no account yet — and takes only a token. The workspace they
 * join is read from the invitation row, so nothing a caller sends can steer
 * which organisation they land in.
 *
 * AUTHORIZATION
 * -------------
 * Any member may invite. The application has no working role model to defer to
 * — `UserRole` exists but there is no roles guard and no @Roles decorator —
 * and Slice 3 refused to invent one. For a three-person Saudi business
 * everyone doing everything is very likely correct; what makes it defensible
 * is that every invitation, acceptance and removal is written to the audit log
 * and shown on the licence it touched.
 */
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.invitations.listPending(user.tenantId);
  }

  @Post()
  async invite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { email: string },
  ) {
    const result = await this.invitations.invite({
      tenantId: user.tenantId,
      actorUserId: user.id,
      email: body?.email ?? '',
    });
    return {
      id: result.invitation.id,
      email: result.invitation.email,
      expiresAt: result.invitation.expiresAt,
      /*
        The link is returned to the INVITER, always — not only when email
        fails. SMTP is unconfigured in this deployment, and an invitation that
        silently goes nowhere is the failure class this product removes
        everywhere else. The screen shows the link and says whether it was
        also emailed.
      */
      link: result.link,
      delivered: result.delivered,
    };
  }

  @Delete(':id')
  @HttpCode(204)
  async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    await this.invitations.revoke({
      tenantId: user.tenantId,
      actorUserId: user.id,
      id,
    });
  }

  @Public()
  @Post('accept')
  async accept(
    @Body() body: { token: string; name: string; password: string },
  ) {
    const user = await this.invitations.accept({
      token: body?.token ?? '',
      name: body?.name ?? '',
      password: body?.password ?? '',
    });
    return { email: user.email, name: user.name };
  }
}
