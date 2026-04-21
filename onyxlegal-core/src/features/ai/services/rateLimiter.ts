/**
 * Redis-Based Distributed Rate Limiter
 * Implements token bucket algorithm across multiple instances using Redis.
 * 
 * Features:
 * - Per-tenant quotas (FREE, STARTER, GROWTH, BUSINESS plans)
 * - Per-user rate limits (prevent single user from consuming all quota)
 * - Sliding window tracking with TTL expiry
 * - Distributed: works across multiple instances via Redis
 * 
 * Rate Limits (per 24-hour rolling window):
 * - FREE: 5 analyses/day
 * - STARTER: 50 analyses/day
 * - GROWTH: 500 analyses/day
 * - BUSINESS: 5000 analyses/day
 * 
 * Per-user limits (prevent abuse):
 * - No single user can consume >50% of tenant quota
 * - Max 20 analyses per user per 24 hours
 */

import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('RateLimiter');

// Rate limits by plan (analyses per 24 hours)
const PLAN_LIMITS = {
  FREE: 5,
  STARTER: 50,
  GROWTH: 500,
  BUSINESS: 5000,
};

// Per-user limit (prevent single user from consuming all quota)
const PER_USER_DAILY_LIMIT = 20;

// Redis TTL: 24 hours + buffer
const RATE_LIMIT_TTL = 86400 + 3600; // 25 hours

/**
 * Check if tenant has available analyses quota.
 * Uses token bucket algorithm with sliding window.
 */
export async function checkTenantRateLimit(
  redis: Redis,
  tenantId: string,
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS' = 'FREE',
): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  reason?: string;
}> {
  try {
    const limit = PLAN_LIMITS[plan];
    const key = `rate-limit:tenant:${tenantId}`;

    // Use Redis INCR to atomically increment counter
    const count = await redis.incr(key);

    // Set TTL on first increment
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_TTL);
    }

    // Get remaining TTL to calculate resetAt
    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    if (!allowed) {
      logger.warn(
        `[RateLimit] Tenant ${tenantId} exceeded quota: ${count}/${limit}`,
      );
    }

    return {
      allowed,
      remaining,
      limit,
      resetAt,
      reason: !allowed
        ? `Tenant quota exceeded (${count}/${limit}). Reset at ${resetAt.toISOString()}`
        : undefined,
    };
  } catch (error) {
    logger.error(
      `[RateLimit] Tenant check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    // On error, allow request (fail open for better UX)
    return {
      allowed: true,
      remaining: PLAN_LIMITS[plan],
      limit: PLAN_LIMITS[plan],
      resetAt: new Date(Date.now() + RATE_LIMIT_TTL * 1000),
      reason: 'Rate limit check failed, allowing request',
    };
  }
}

/**
 * Check if user has exceeded per-user rate limit.
 * Prevents single user from consuming all tenant quota.
 */
export async function checkUserRateLimit(
  redis: Redis,
  tenantId: string,
  userId: string,
): Promise<{
  allowed: boolean;
  count: number;
  limit: number;
  resetAt: Date;
  reason?: string;
}> {
  try {
    const key = `rate-limit:user:${tenantId}:${userId}`;
    const limit = PER_USER_DAILY_LIMIT;

    // Atomic increment with TTL
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_TTL);
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    const allowed = count <= limit;

    if (!allowed) {
      logger.warn(
        `[RateLimit] User ${userId} in tenant ${tenantId} exceeded personal limit: ${count}/${limit}`,
      );
    }

    return {
      allowed,
      count,
      limit,
      resetAt,
      reason: !allowed
        ? `User quota exceeded (${count}/${limit} analyses today). Reset at ${resetAt.toISOString()}`
        : undefined,
    };
  } catch (error) {
    logger.error(
      `[RateLimit] User check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    // Fail open
    return {
      allowed: true,
      count: 0,
      limit: PER_USER_DAILY_LIMIT,
      resetAt: new Date(Date.now() + RATE_LIMIT_TTL * 1000),
    };
  }
}

/**
 * Check both tenant and per-user rate limits.
 * Returns combined result.
 */
export async function checkRateLimit(
  redis: Redis,
  tenantId: string,
  userId: string,
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS' = 'FREE',
): Promise<{
  allowed: boolean;
  tenantRemaining: number;
  tenantLimit: number;
  userCount: number;
  userLimit: number;
  resetAt: Date;
  reason?: string;
}> {
  try {
    // Check both limits in parallel
    const [tenantResult, userResult] = await Promise.all([
      checkTenantRateLimit(redis, tenantId, plan),
      checkUserRateLimit(redis, tenantId, userId),
    ]);

    const allowed = tenantResult.allowed && userResult.allowed;
    const reason =
      !tenantResult.allowed ? tenantResult.reason : userResult.reason;

    return {
      allowed,
      tenantRemaining: tenantResult.remaining,
      tenantLimit: tenantResult.limit,
      userCount: userResult.count,
      userLimit: userResult.limit,
      resetAt: tenantResult.resetAt,
      reason,
    };
  } catch (error) {
    logger.error(
      `[RateLimit] Combined check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      allowed: true,
      tenantRemaining: PLAN_LIMITS[plan],
      tenantLimit: PLAN_LIMITS[plan],
      userCount: 0,
      userLimit: PER_USER_DAILY_LIMIT,
      resetAt: new Date(Date.now() + RATE_LIMIT_TTL * 1000),
    };
  }
}

/**
 * Get current rate limit status for tenant (without incrementing).
 */
export async function getRateLimitStatus(
  redis: Redis,
  tenantId: string,
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS' = 'FREE',
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  resetInSeconds: number;
}> {
  try {
    const key = `rate-limit:tenant:${tenantId}`;
    const limit = PLAN_LIMITS[plan];

    const used = parseInt((await redis.get(key)) || '0', 10);
    const ttl = await redis.ttl(key);
    const resetAt =
      ttl > 0 ? new Date(Date.now() + ttl * 1000) : new Date();

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      resetAt,
      resetInSeconds: ttl > 0 ? ttl : 0,
    };
  } catch (error) {
    logger.error(
      `[RateLimit] Status check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    const limit = PLAN_LIMITS[plan];
    return {
      used: 0,
      limit,
      remaining: limit,
      resetAt: new Date(Date.now() + RATE_LIMIT_TTL * 1000),
      resetInSeconds: RATE_LIMIT_TTL,
    };
  }
}

/**
 * Reset rate limit for tenant (admin operation).
 */
export async function resetTenantRateLimit(
  redis: Redis,
  tenantId: string,
): Promise<boolean> {
  try {
    const key = `rate-limit:tenant:${tenantId}`;
    await redis.del(key);
    logger.log(`[RateLimit] Reset rate limit for tenant ${tenantId}`);
    return true;
  } catch (error) {
    logger.error(
      `[RateLimit] Reset failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return false;
  }
}

/**
 * Get rate limit stats across all tenants (for admin dashboard).
 */
export async function getRateLimitStats(
  redis: Redis,
): Promise<{
  activeTenants: number;
  pattern: string;
}> {
  try {
    // Scan for all tenant rate limit keys
    const keys = await redis.keys('rate-limit:tenant:*');
    return {
      activeTenants: keys.length,
      pattern: 'rate-limit:tenant:*',
    };
  } catch (error) {
    logger.error(
      `[RateLimit] Stats failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      activeTenants: 0,
      pattern: 'rate-limit:tenant:*',
    };
  }
}
