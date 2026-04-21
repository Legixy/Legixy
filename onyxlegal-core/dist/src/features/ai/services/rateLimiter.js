"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTenantRateLimit = checkTenantRateLimit;
exports.checkUserRateLimit = checkUserRateLimit;
exports.checkRateLimit = checkRateLimit;
exports.getRateLimitStatus = getRateLimitStatus;
exports.resetTenantRateLimit = resetTenantRateLimit;
exports.getRateLimitStats = getRateLimitStats;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('RateLimiter');
const PLAN_LIMITS = {
    FREE: 5,
    STARTER: 50,
    GROWTH: 500,
    BUSINESS: 5000,
};
const PER_USER_DAILY_LIMIT = 20;
const RATE_LIMIT_TTL = 86400 + 3600;
async function checkTenantRateLimit(redis, tenantId, plan = 'FREE') {
    try {
        const limit = PLAN_LIMITS[plan];
        const key = `rate-limit:tenant:${tenantId}`;
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, RATE_LIMIT_TTL);
        }
        const ttl = await redis.ttl(key);
        const resetAt = new Date(Date.now() + ttl * 1000);
        const allowed = count <= limit;
        const remaining = Math.max(0, limit - count);
        if (!allowed) {
            logger.warn(`[RateLimit] Tenant ${tenantId} exceeded quota: ${count}/${limit}`);
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
    }
    catch (error) {
        logger.error(`[RateLimit] Tenant check failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            allowed: true,
            remaining: PLAN_LIMITS[plan],
            limit: PLAN_LIMITS[plan],
            resetAt: new Date(Date.now() + RATE_LIMIT_TTL * 1000),
            reason: 'Rate limit check failed, allowing request',
        };
    }
}
async function checkUserRateLimit(redis, tenantId, userId) {
    try {
        const key = `rate-limit:user:${tenantId}:${userId}`;
        const limit = PER_USER_DAILY_LIMIT;
        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, RATE_LIMIT_TTL);
        }
        const ttl = await redis.ttl(key);
        const resetAt = new Date(Date.now() + ttl * 1000);
        const allowed = count <= limit;
        if (!allowed) {
            logger.warn(`[RateLimit] User ${userId} in tenant ${tenantId} exceeded personal limit: ${count}/${limit}`);
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
    }
    catch (error) {
        logger.error(`[RateLimit] User check failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            allowed: true,
            count: 0,
            limit: PER_USER_DAILY_LIMIT,
            resetAt: new Date(Date.now() + RATE_LIMIT_TTL * 1000),
        };
    }
}
async function checkRateLimit(redis, tenantId, userId, plan = 'FREE') {
    try {
        const [tenantResult, userResult] = await Promise.all([
            checkTenantRateLimit(redis, tenantId, plan),
            checkUserRateLimit(redis, tenantId, userId),
        ]);
        const allowed = tenantResult.allowed && userResult.allowed;
        const reason = !tenantResult.allowed ? tenantResult.reason : userResult.reason;
        return {
            allowed,
            tenantRemaining: tenantResult.remaining,
            tenantLimit: tenantResult.limit,
            userCount: userResult.count,
            userLimit: userResult.limit,
            resetAt: tenantResult.resetAt,
            reason,
        };
    }
    catch (error) {
        logger.error(`[RateLimit] Combined check failed: ${error instanceof Error ? error.message : String(error)}`, error);
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
async function getRateLimitStatus(redis, tenantId, plan = 'FREE') {
    try {
        const key = `rate-limit:tenant:${tenantId}`;
        const limit = PLAN_LIMITS[plan];
        const used = parseInt((await redis.get(key)) || '0', 10);
        const ttl = await redis.ttl(key);
        const resetAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : new Date();
        return {
            used,
            limit,
            remaining: Math.max(0, limit - used),
            resetAt,
            resetInSeconds: ttl > 0 ? ttl : 0,
        };
    }
    catch (error) {
        logger.error(`[RateLimit] Status check failed: ${error instanceof Error ? error.message : String(error)}`, error);
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
async function resetTenantRateLimit(redis, tenantId) {
    try {
        const key = `rate-limit:tenant:${tenantId}`;
        await redis.del(key);
        logger.log(`[RateLimit] Reset rate limit for tenant ${tenantId}`);
        return true;
    }
    catch (error) {
        logger.error(`[RateLimit] Reset failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return false;
    }
}
async function getRateLimitStats(redis) {
    try {
        const keys = await redis.keys('rate-limit:tenant:*');
        return {
            activeTenants: keys.length,
            pattern: 'rate-limit:tenant:*',
        };
    }
    catch (error) {
        logger.error(`[RateLimit] Stats failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            activeTenants: 0,
            pattern: 'rate-limit:tenant:*',
        };
    }
}
//# sourceMappingURL=rateLimiter.js.map