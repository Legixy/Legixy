import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { Plan, UserRole } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

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

  /**
   * Google OAuth — find or create user, issue JWT.
   */
  async googleLogin(profile: { googleId: string; email: string; name: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findFirst({ where: { email: profile.email } });

    if (!user) {
      const tenant = await this.prisma.tenant.create({
        data: { name: `${profile.name}'s Workspace`, plan: Plan.FREE, aiTokenLimit: 5000 },
      });
      user = await this.prisma.user.create({
        data: {
          tenantId:  tenant.id,
          email:     profile.email,
          name:      profile.name,
          avatarUrl: profile.avatarUrl,
          role:      UserRole.OWNER,
        },
      });
      this.logger.log(`New Google user: ${profile.email} (tenant: ${tenant.id})`);
    }

    return this.issueToken(user);
  }

  /**
   * POST /auth/forgot-password
   * Generates a reset token, stores it (expires in 1h), sends email if SMTP is configured.
   * Returns 200 regardless of whether the email exists (prevents user enumeration).
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (user && user.password) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiry: expiry },
      });

      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

      if (process.env.SMTP_HOST) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@legixy.com',
          to: email,
          subject: 'Reset your Legixy password',
          html: `<p>Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
        this.logger.log(`Password reset email sent to ${email}`);
      } else {
        // Dev fallback: log the reset URL (no SMTP configured)
        this.logger.warn(`[DEV] Password reset URL for ${email}: ${resetUrl}`);
      }
    }

    return { message: 'If that email is registered, a reset link has been sent.' };
  }

  /**
   * POST /auth/reset-password
   * Validates the token and sets a new password.
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hash, passwordResetToken: null, passwordResetExpiry: null },
    });

    this.logger.log(`Password reset for ${user.email}`);
    return { message: 'Password updated. You can now log in.' };
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
