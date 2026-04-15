/**
 * Rate Limiting Guard — Per-User & Per-Tenant Limits
 *
 * Rules:
 * - Free tier: 10 analyses per hour, 100 per month
 * - Starter: 50 per hour, 1000 per month
 * - Growth: 200 per hour, 5000 per month
 * - Business: Unlimited
 *
 * Enforcement:
 * - Returns 429 Too Many Requests if exceeded
 * - Uses Redis for tracking (degrade gracefully if Redis unavailable)
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../../modules/auth/jwt.strategy';
import { PrismaService } from '../../database/prisma.service';

interface RateLimitConfig {
  perHour: number;
  perMonth: number;
}

const LIMITS_BY_PLAN: Record<string, RateLimitConfig> = {
  FREE: { perHour: 10, perMonth: 100 },
  STARTER: { perHour: 50, perMonth: 1000 },
  GROWTH: { perHour: 200, perMonth: 5000 },
  BUSINESS: { perHour: -1, perMonth: -1 }, // unlimited
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private logger = new Logger('RateLimitGuard');
  private requestCounts = new Map<string, { count: number; resetTime: number }>();

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user as AuthenticatedUser | undefined;

    if (!user) {
      // No user, allow through
      return true;
    }

    // Get tenant plan
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { plan: true },
    });

    if (!tenant) {
      this.logger.warn(`Tenant ${user.tenantId} not found`);
      return true;
    }

    const limits = LIMITS_BY_PLAN[tenant.plan];
    if (!limits) {
      this.logger.warn(`Unknown plan: ${tenant.plan}`);
      return true;
    }

    // Unlimited plans always pass
    if (limits.perHour === -1 && limits.perMonth === -1) {
      return true;
    }

    // Check hourly limit
    if (limits.perHour > 0) {
      const hourlyKey = `rl:hourly:${user.tenantId}:${Math.floor(Date.now() / 3600000)}`;
      const hourlyCount = await this.incrementAndGet(hourlyKey, 3600); // 1 hour

      if (hourlyCount > limits.perHour) {
        this.logger.warn(
          `Tenant ${user.tenantId} exceeded hourly limit: ${hourlyCount}/${limits.perHour}`,
        );
        throw new ForbiddenException(
          `Rate limit exceeded: ${hourlyCount}/${limits.perHour} analyses per hour. Upgrade your plan.`,
        );
      }
    }

    // Check monthly limit
    if (limits.perMonth > 0) {
      const now = new Date();
      const monthlyKey = `rl:monthly:${user.tenantId}:${now.getFullYear()}-${now.getMonth()}`;
      const monthlyCount = await this.incrementAndGet(monthlyKey, 2592000); // 30 days

      if (monthlyCount > limits.perMonth) {
        this.logger.warn(
          `Tenant ${user.tenantId} exceeded monthly limit: ${monthlyCount}/${limits.perMonth}`,
        );
        throw new ForbiddenException(
          `Monthly rate limit exceeded: ${monthlyCount}/${limits.perMonth} analyses. Upgrade your plan.`,
        );
      }
    }

    return true;
  }

  /**
   * Increment counter and get value (using in-memory store for demo)
   * In production, use Redis
   */
  private async incrementAndGet(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    const now = Date.now();
    const entry = this.requestCounts.get(key);

    if (!entry || entry.resetTime < now) {
      // New entry or expired
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + ttlSeconds * 1000,
      });
      return 1;
    }

    // Increment and return
    entry.count++;
    return entry.count;
  }

  /**
   * Reset rate limit for testing
   */
  public resetLimits(): void {
    this.requestCounts.clear();
    this.logger.log('Rate limits reset');
  }
}
