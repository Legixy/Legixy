import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;   // Supabase user ID
  email: string;
  role?: string;
  aud?: string;
}

export interface AuthenticatedUser {
  id: string;        // our User.id
  supabaseId: string;
  tenantId: string;
  email: string;
  name: string | null;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET') || 'default_dev_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Called after JWT is verified. Looks up the user in our database
   * and attaches full user context (including tenantId) to the request.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found. Please complete registration.');
    }

    return {
      id: user.id,
      supabaseId: user.supabaseId,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
