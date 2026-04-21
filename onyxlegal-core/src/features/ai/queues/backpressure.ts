/**
 * Queue Backpressure & Priority Manager
 * 
 * Features:
 * - Enforces max concurrent jobs per tenant
 * - Implements job priority levels (1=high, 2=normal, 3=low)
 * - Applies backpressure: reject new jobs when queue is saturated
 * - Tracks per-tenant concurrency to ensure fairness
 * 
 * Configuration:
 * - Global max active jobs: 50 (all tenants combined)
 * - Per-tenant max active: 5 (prevent single tenant hogging resources)
 * - Queue saturation threshold: 80% full = backpressure
 * - High priority: 1 (jumps queue)
 * - Normal priority: 2 (default)
 * - Low priority: 3 (background)
 * 
 * Backpressure behavior:
 * - If queue > 80% full: reject new LOW priority jobs
 * - If queue > 95% full: reject new NORMAL priority jobs
 * - HIGH priority always allowed (emergency override)
 */

import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

const logger = new Logger('QueueBackpressure');

// Configuration constants
const GLOBAL_MAX_ACTIVE = 50; // Max concurrent jobs across all tenants
const PER_TENANT_MAX_ACTIVE = 5; // Max concurrent jobs per tenant
const QUEUE_SATURATION_THRESHOLD = 0.8; // 80% full = start rejecting LOW priority
const QUEUE_CRITICAL_THRESHOLD = 0.95; // 95% full = reject NORMAL priority
const MAX_QUEUE_SIZE = 1000; // Maximum pending jobs

export enum JobPriority {
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

export interface BackpressureStatus {
  canAddJob: boolean;
  priority: JobPriority;
  reason?: string;
  queueDepth: number;
  activeCount: number;
  saturationPercent: number;
}

/**
 * Check if new job can be added based on backpressure limits.
 */
export async function checkBackpressure(
  queue: Queue,
  redis: Redis,
  tenantId: string,
  priority: JobPriority = JobPriority.NORMAL,
): Promise<BackpressureStatus> {
  try {
    // Get queue statistics
    const counts = await queue.getJobCounts();
    const queueDepth = (counts.waiting || 0) + (counts.delayed || 0);
    const activeCount = counts.active || 0;

    // Calculate saturation percentage (based on MAX_QUEUE_SIZE)
    const saturationPercent = (queueDepth / MAX_QUEUE_SIZE) * 100;

    // Get per-tenant active count
    const tenantKey = `queue:active:${tenantId}`;
    const tenantActive = parseInt((await redis.get(tenantKey)) || '0', 10);

    logger.debug(
      `[Backpressure] Tenant: ${tenantId}, Queue depth: ${queueDepth}, Active: ${activeCount}, Tenant active: ${tenantActive}, Saturation: ${saturationPercent.toFixed(1)}%`,
    );

    // Check global limits first
    if (activeCount >= GLOBAL_MAX_ACTIVE) {
      if (priority === JobPriority.HIGH) {
        logger.warn(
          `[Backpressure] Global limit reached (${activeCount}/${GLOBAL_MAX_ACTIVE}), but HIGH priority job allowed`,
        );
        return {
          canAddJob: true,
          priority,
          reason: 'Global limit reached, but HIGH priority override applied',
          queueDepth,
          activeCount,
          saturationPercent,
        };
      }

      logger.warn(
        `[Backpressure] Global active limit reached (${activeCount}/${GLOBAL_MAX_ACTIVE})`,
      );
      return {
        canAddJob: false,
        priority,
        reason: `Global concurrent job limit reached (${activeCount}/${GLOBAL_MAX_ACTIVE}). Try again in a few moments.`,
        queueDepth,
        activeCount,
        saturationPercent,
      };
    }

    // Check per-tenant limits
    if (tenantActive >= PER_TENANT_MAX_ACTIVE) {
      if (priority === JobPriority.HIGH) {
        logger.warn(
          `[Backpressure] Tenant limit reached for ${tenantId} (${tenantActive}/${PER_TENANT_MAX_ACTIVE}), but HIGH priority job allowed`,
        );
        return {
          canAddJob: true,
          priority,
          reason: 'Per-tenant limit reached, but HIGH priority override applied',
          queueDepth,
          activeCount,
          saturationPercent,
        };
      }

      logger.warn(
        `[Backpressure] Per-tenant limit reached for ${tenantId} (${tenantActive}/${PER_TENANT_MAX_ACTIVE})`,
      );
      return {
        canAddJob: false,
        priority,
        reason: `Your account has too many concurrent analyses (${tenantActive}/${PER_TENANT_MAX_ACTIVE}). Wait for current jobs to complete.`,
        queueDepth,
        activeCount,
        saturationPercent,
      };
    }

    // Check queue saturation for priority-based rejection
    if (saturationPercent > QUEUE_CRITICAL_THRESHOLD) {
      if (priority === JobPriority.HIGH) {
        logger.warn(
          `[Backpressure] Queue critical (${saturationPercent.toFixed(1)}%), but HIGH priority allowed`,
        );
        return {
          canAddJob: true,
          priority,
          reason: 'Queue critically full, but HIGH priority override applied',
          queueDepth,
          activeCount,
          saturationPercent,
        };
      }

      logger.warn(
        `[Backpressure] Queue critical (${saturationPercent.toFixed(1)}%), rejecting NORMAL/LOW priority`,
      );
      return {
        canAddJob: false,
        priority,
        reason: `System is under heavy load (${saturationPercent.toFixed(1)}% full). Please retry with HIGH priority or try again later.`,
        queueDepth,
        activeCount,
        saturationPercent,
      };
    }

    if (saturationPercent > QUEUE_SATURATION_THRESHOLD && priority === JobPriority.LOW) {
      logger.warn(
        `[Backpressure] Queue saturated (${saturationPercent.toFixed(1)}%), rejecting LOW priority`,
      );
      return {
        canAddJob: false,
        priority,
        reason: `System is under moderate load (${saturationPercent.toFixed(1)}% full). Background jobs delayed. Upgrade to HIGH priority to proceed.`,
        queueDepth,
        activeCount,
        saturationPercent,
      };
    }

    // Safe to proceed
    return {
      canAddJob: true,
      priority,
      queueDepth,
      activeCount,
      saturationPercent,
    };
  } catch (error) {
    logger.error(
      `[Backpressure] Check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    // On error, allow job (fail open for better UX)
    return {
      canAddJob: true,
      priority,
      queueDepth: 0,
      activeCount: 0,
      saturationPercent: 0,
      reason: 'Backpressure check failed, allowing request',
    };
  }
}

/**
 * Record that a job started for a tenant (increment active counter).
 */
export async function recordJobActive(
  redis: Redis,
  tenantId: string,
): Promise<number> {
  try {
    const key = `queue:active:${tenantId}`;
    const count = await redis.incr(key);
    // Set TTL to 5 hours (safety cleanup if job crashes without cleanup)
    await redis.expire(key, 18000);
    logger.debug(`[Backpressure] Tenant ${tenantId} active count: ${count}`);
    return count;
  } catch (error) {
    logger.error(
      `[Backpressure] Failed to record active: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return 0;
  }
}

/**
 * Record that a job completed for a tenant (decrement active counter).
 */
export async function recordJobComplete(
  redis: Redis,
  tenantId: string,
): Promise<number> {
  try {
    const key = `queue:active:${tenantId}`;
    const count = Math.max(0, await redis.decr(key));
    logger.debug(`[Backpressure] Tenant ${tenantId} active count: ${count}`);
    return count;
  } catch (error) {
    logger.error(
      `[Backpressure] Failed to record complete: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return 0;
  }
}

/**
 * Reset per-tenant active counter (admin operation).
 */
export async function resetTenantActiveCount(
  redis: Redis,
  tenantId: string,
): Promise<boolean> {
  try {
    const key = `queue:active:${tenantId}`;
    await redis.del(key);
    logger.log(`[Backpressure] Reset active count for tenant ${tenantId}`);
    return true;
  } catch (error) {
    logger.error(
      `[Backpressure] Reset failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return false;
  }
}

/**
 * Get backpressure statistics for all tenants.
 */
export async function getBackpressureStats(
  queue: Queue,
  redis: Redis,
): Promise<{
  globalActive: number;
  globalMax: number;
  queueDepth: number;
  queueMax: number;
  saturationPercent: number;
  activeTenants: number;
}> {
  try {
    const counts = await queue.getJobCounts();
    const activeCount = counts.active || 0;
    const queueDepth = (counts.waiting || 0) + (counts.delayed || 0);

    // Count active tenants
    const tenantKeys = await redis.keys('queue:active:*');
    const activeTenants = tenantKeys.length;

    const saturationPercent = (queueDepth / MAX_QUEUE_SIZE) * 100;

    return {
      globalActive: activeCount,
      globalMax: GLOBAL_MAX_ACTIVE,
      queueDepth,
      queueMax: MAX_QUEUE_SIZE,
      saturationPercent,
      activeTenants,
    };
  } catch (error) {
    logger.error(
      `[Backpressure] Stats failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      globalActive: 0,
      globalMax: GLOBAL_MAX_ACTIVE,
      queueDepth: 0,
      queueMax: MAX_QUEUE_SIZE,
      saturationPercent: 0,
      activeTenants: 0,
    };
  }
}

/**
 * Middleware wrapper for adding jobs with backpressure checking.
 */
export async function addJobWithBackpressure<T>(
  queue: Queue,
  redis: Redis,
  tenantId: string,
  jobName: string,
  jobData: T,
  priority: JobPriority = JobPriority.NORMAL,
  jobId?: string,
): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
  backpressure?: BackpressureStatus;
}> {
  try {
    // Check backpressure
    const backpressure = await checkBackpressure(queue, redis, tenantId, priority);

    if (!backpressure.canAddJob) {
      logger.warn(
        `[Backpressure] Job rejected for tenant ${tenantId}: ${backpressure.reason}`,
      );
      return {
        success: false,
        error: backpressure.reason,
        backpressure,
      };
    }

    // Add job with priority
    const job = await queue.add(jobName, jobData, {
      jobId,
      priority: priority as number,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { age: 100 },
      removeOnFail: { age: 50 },
    });

    logger.log(
      `[Backpressure] Job ${job.id} added for tenant ${tenantId} with priority ${priority}`,
    );

    return {
      success: true,
      jobId: job.id,
    };
  } catch (error) {
    logger.error(
      `[Backpressure] Add job failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add job',
    };
  }
}

/**
 * Priority recommendation based on plan.
 * Higher plans get higher priority.
 */
export function recommendPriority(
  plan: 'FREE' | 'STARTER' | 'GROWTH' | 'BUSINESS' = 'FREE',
): JobPriority {
  switch (plan) {
    case 'BUSINESS':
    case 'GROWTH':
      return JobPriority.HIGH;
    case 'STARTER':
      return JobPriority.NORMAL;
    case 'FREE':
    default:
      return JobPriority.LOW;
  }
}
