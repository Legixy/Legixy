import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  aud?: string;
  type?: 'local' | 'supabase';
}

export interface AuthenticatedUser {
  id: string;
  supabaseId: string | null;
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
    const secret = config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET environment variable is not set.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // HttpOnly cookie (set by /api/auth/login server route)
        (req: { cookies?: Record<string, string> }) => req?.cookies?.auth_token ?? null,
        // Bearer header (legacy / direct API clients)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // Local auth: sub is our internal User.id
    // Supabase auth: sub is supabaseId
    const user =
      payload.type === 'local'
        ? await this.prisma.user.findUnique({ where: { id: payload.sub } })
        : await this.prisma.user.findUnique({ where: { supabaseId: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    return {
      id: user.id,
      supabaseId: user.supabaseId ?? null,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
