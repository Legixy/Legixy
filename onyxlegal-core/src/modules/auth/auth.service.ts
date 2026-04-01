import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Plan, UserRole } from 'generated/prisma/client';

interface SignupInput {
  supabaseId: string;
  email: string;
  name: string;
  companyName: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tenant + owner user on first signup.
   * Idempotent — if user already exists, returns existing record.
   */
  async signup(input: SignupInput) {
    // Check if user already registered
    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: input.supabaseId },
      include: { tenant: true },
    });

    if (existing) {
      this.logger.log(`User ${input.email} already registered`);
      return { user: existing, tenant: existing.tenant, isNew: false };
    }

    // Check for duplicate email across tenants
    const emailExists = await this.prisma.user.findFirst({
      where: { email: input.email },
    });
    if (emailExists) {
      throw new ConflictException('Email already registered with another organization.');
    }

    // Create tenant first, then user (no interactive transaction needed —
    // if user creation fails, orphan tenant is harmless and can be cleaned up)
    const tenant = await this.prisma.tenant.create({
      data: {
        name: input.companyName,
        plan: Plan.FREE,
        aiTokenLimit: 5000,
      },
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
   * Get full user profile with tenant info.
   */
  async getProfile(supabaseId: string) {
    return this.prisma.user.findUnique({
      where: { supabaseId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            plan: true,
            aiTokensUsed: true,
            aiTokenLimit: true,
          },
        },
      },
    });
  }
}
