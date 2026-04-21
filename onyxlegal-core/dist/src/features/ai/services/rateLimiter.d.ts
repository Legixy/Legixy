import { Redis } from 'ioredis';
export declare function checkTenantRateLimit(redis: Redis, tenantId: string, plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS'): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetAt: Date;
    reason?: string;
}>;
export declare function checkUserRateLimit(redis: Redis, tenantId: string, userId: string): Promise<{
    allowed: boolean;
    count: number;
    limit: number;
    resetAt: Date;
    reason?: string;
}>;
export declare function checkRateLimit(redis: Redis, tenantId: string, userId: string, plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS'): Promise<{
    allowed: boolean;
    tenantRemaining: number;
    tenantLimit: number;
    userCount: number;
    userLimit: number;
    resetAt: Date;
    reason?: string;
}>;
export declare function getRateLimitStatus(redis: Redis, tenantId: string, plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS'): Promise<{
    used: number;
    limit: number;
    remaining: number;
    resetAt: Date;
    resetInSeconds: number;
}>;
export declare function resetTenantRateLimit(redis: Redis, tenantId: string): Promise<boolean>;
export declare function getRateLimitStats(redis: Redis): Promise<{
    activeTenants: number;
    pattern: string;
}>;
