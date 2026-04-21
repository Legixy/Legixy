import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
export declare enum JobPriority {
    HIGH = 1,
    NORMAL = 2,
    LOW = 3
}
export interface BackpressureStatus {
    canAddJob: boolean;
    priority: JobPriority;
    reason?: string;
    queueDepth: number;
    activeCount: number;
    saturationPercent: number;
}
export declare function checkBackpressure(queue: Queue, redis: Redis, tenantId: string, priority?: JobPriority): Promise<BackpressureStatus>;
export declare function recordJobActive(redis: Redis, tenantId: string): Promise<number>;
export declare function recordJobComplete(redis: Redis, tenantId: string): Promise<number>;
export declare function resetTenantActiveCount(redis: Redis, tenantId: string): Promise<boolean>;
export declare function getBackpressureStats(queue: Queue, redis: Redis): Promise<{
    globalActive: number;
    globalMax: number;
    queueDepth: number;
    queueMax: number;
    saturationPercent: number;
    activeTenants: number;
}>;
export declare function addJobWithBackpressure<T>(queue: Queue, redis: Redis, tenantId: string, jobName: string, jobData: T, priority?: JobPriority, jobId?: string): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
    backpressure?: BackpressureStatus;
}>;
export declare function recommendPriority(plan?: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS'): JobPriority;
