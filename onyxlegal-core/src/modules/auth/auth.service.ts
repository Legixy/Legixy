import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { Plan, UserRole } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

interface SignupInput {
  supabaseId: string;
  email: string;
  name: string;
  companyName: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  companyName: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * POST /auth/register — standalone local auth signup.
   * Creates tenant + owner user with a bcrypt-hashed password.
   */
  async register(input: RegisterInput) {
    const existing = await this.prisma.user.findFirst({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered.');
    }

    const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const tenant = await this.prisma.tenant.create({
      data: { name: input.companyName, plan: Plan.FREE, aiTokenLimit: 5000 },
    });

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email,
        name: input.name,
        role: UserRole.OWNER,
        password: hash,
      },
    });

    this.logger.log(`Registered new user ${input.email} (tenant: ${tenant.id})`);
    return this.issueToken(user);
  }

  /**
   * POST /auth/login — validate email + password, return JWT.
   */
  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueToken(user);
  }

  /**
   * Supabase-backed signup (legacy flow — keep for backward compat).
   */
  async signup(input: SignupInput) {
    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: input.supabaseId },
      include: { tenant: true },
    });

    if (existing) {
      this.logger.log(`User ${input.email} already registered`);
      return { user: existing, tenant: existing.tenant, isNew: false };
    }

    const emailExists = await this.prisma.user.findFirst({
      where: { email: input.email },
    });
    if (emailExists) {
      throw new ConflictException('Email already registered with another organization.');
    }

    const tenant = await this.prisma.tenant.create({
      data: { name: input.companyName, plan: Plan.FREE, aiTokenLimit: 5000 },
    });

    const user = await this.prisma.user.create({
      data: {
        supabaseId: input.supabaseId,
        tenantId: tenant.id,
        email: input.email,
        name: input.name,
        role: UserRole.OWNER,
      },
    });

    this.logger.log(`Created tenant "${input.companyName}" for ${input.email}`);
    return { user, tenant, isNew: true };
  }

  /**
   * Get user profile by internal DB id.
   */
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: { id: true, name: true, plan: true, aiTokensUsed: true, aiTokenLimit: true },
        },
      },
    });
  }

  private issueToken(user: { id: string; email: string; role: string; tenantId: string; name: string | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role, type: 'local' };
    const token = this.jwt.sign(payload);
    return {
      access_token: token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
    };
  }
}
