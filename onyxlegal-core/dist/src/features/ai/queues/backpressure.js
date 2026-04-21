"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPriority = void 0;
exports.checkBackpressure = checkBackpressure;
exports.recordJobActive = recordJobActive;
exports.recordJobComplete = recordJobComplete;
exports.resetTenantActiveCount = resetTenantActiveCount;
exports.getBackpressureStats = getBackpressureStats;
exports.addJobWithBackpressure = addJobWithBackpressure;
exports.recommendPriority = recommendPriority;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('QueueBackpressure');
const GLOBAL_MAX_ACTIVE = 50;
const PER_TENANT_MAX_ACTIVE = 5;
const QUEUE_SATURATION_THRESHOLD = 0.8;
const QUEUE_CRITICAL_THRESHOLD = 0.95;
const MAX_QUEUE_SIZE = 1000;
var JobPriority;
(function (JobPriority) {
    JobPriority[JobPriority["HIGH"] = 1] = "HIGH";
    JobPriority[JobPriority["NORMAL"] = 2] = "NORMAL";
    JobPriority[JobPriority["LOW"] = 3] = "LOW";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
async function checkBackpressure(queue, redis, tenantId, priority = JobPriority.NORMAL) {
    try {
        const counts = await queue.getJobCounts();
        const queueDepth = (counts.waiting || 0) + (counts.delayed || 0);
        const activeCount = counts.active || 0;
        const saturationPercent = (queueDepth / MAX_QUEUE_SIZE) * 100;
        const tenantKey = `queue:active:${tenantId}`;
        const tenantActive = parseInt((await redis.get(tenantKey)) || '0', 10);
        logger.debug(`[Backpressure] Tenant: ${tenantId}, Queue depth: ${queueDepth}, Active: ${activeCount}, Tenant active: ${tenantActive}, Saturation: ${saturationPercent.toFixed(1)}%`);
        if (activeCount >= GLOBAL_MAX_ACTIVE) {
            if (priority === JobPriority.HIGH) {
                logger.warn(`[Backpressure] Global limit reached (${activeCount}/${GLOBAL_MAX_ACTIVE}), but HIGH priority job allowed`);
                return {
                    canAddJob: true,
                    priority,
                    reason: 'Global limit reached, but HIGH priority override applied',
                    queueDepth,
                    activeCount,
                    saturationPercent,
                };
            }
            logger.warn(`[Backpressure] Global active limit reached (${activeCount}/${GLOBAL_MAX_ACTIVE})`);
            return {
                canAddJob: false,
                priority,
                reason: `Global concurrent job limit reached (${activeCount}/${GLOBAL_MAX_ACTIVE}). Try again in a few moments.`,
                queueDepth,
                activeCount,
                saturationPercent,
            };
        }
        if (tenantActive >= PER_TENANT_MAX_ACTIVE) {
            if (priority === JobPriority.HIGH) {
                logger.warn(`[Backpressure] Tenant limit reached for ${tenantId} (${tenantActive}/${PER_TENANT_MAX_ACTIVE}), but HIGH priority job allowed`);
                return {
                    canAddJob: true,
                    priority,
                    reason: 'Per-tenant limit reached, but HIGH priority override applied',
                    queueDepth,
                    activeCount,
                    saturationPercent,
                };
            }
            logger.warn(`[Backpressure] Per-tenant limit reached for ${tenantId} (${tenantActive}/${PER_TENANT_MAX_ACTIVE})`);
            return {
                canAddJob: false,
                priority,
                reason: `Your account has too many concurrent analyses (${tenantActive}/${PER_TENANT_MAX_ACTIVE}). Wait for current jobs to complete.`,
                queueDepth,
                activeCount,
                saturationPercent,
            };
        }
        if (saturationPercent > QUEUE_CRITICAL_THRESHOLD) {
            if (priority === JobPriority.HIGH) {
                logger.warn(`[Backpressure] Queue critical (${saturationPercent.toFixed(1)}%), but HIGH priority allowed`);
                return {
                    canAddJob: true,
                    priority,
                    reason: 'Queue critically full, but HIGH priority override applied',
                    queueDepth,
                    activeCount,
                    saturationPercent,
                };
            }
            logger.warn(`[Backpressure] Queue critical (${saturationPercent.toFixed(1)}%), rejecting NORMAL/LOW priority`);
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
            logger.warn(`[Backpressure] Queue saturated (${saturationPercent.toFixed(1)}%), rejecting LOW priority`);
            return {
                canAddJob: false,
                priority,
                reason: `System is under moderate load (${saturationPercent.toFixed(1)}% full). Background jobs delayed. Upgrade to HIGH priority to proceed.`,
                queueDepth,
                activeCount,
                saturationPercent,
            };
        }
        return {
            canAddJob: true,
            priority,
            queueDepth,
            activeCount,
            saturationPercent,
        };
    }
    catch (error) {
        logger.error(`[Backpressure] Check failed: ${error instanceof Error ? error.message : String(error)}`, error);
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
async function recordJobActive(redis, tenantId) {
    try {
        const key = `queue:active:${tenantId}`;
        const count = await redis.incr(key);
        await redis.expire(key, 18000);
        logger.debug(`[Backpressure] Tenant ${tenantId} active count: ${count}`);
        return count;
    }
    catch (error) {
        logger.error(`[Backpressure] Failed to record active: ${error instanceof Error ? error.message : String(error)}`, error);
        return 0;
    }
}
async function recordJobComplete(redis, tenantId) {
    try {
        const key = `queue:active:${tenantId}`;
        const count = Math.max(0, await redis.decr(key));
        logger.debug(`[Backpressure] Tenant ${tenantId} active count: ${count}`);
        return count;
    }
    catch (error) {
        logger.error(`[Backpressure] Failed to record complete: ${error instanceof Error ? error.message : String(error)}`, error);
        return 0;
    }
}
async function resetTenantActiveCount(redis, tenantId) {
    try {
        const key = `queue:active:${tenantId}`;
        await redis.del(key);
        logger.log(`[Backpressure] Reset active count for tenant ${tenantId}`);
        return true;
    }
    catch (error) {
        logger.error(`[Backpressure] Reset failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return false;
    }
}
async function getBackpressureStats(queue, redis) {
    try {
        const counts = await queue.getJobCounts();
        const activeCount = counts.active || 0;
        const queueDepth = (counts.waiting || 0) + (counts.delayed || 0);
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
    }
    catch (error) {
        logger.error(`[Backpressure] Stats failed: ${error instanceof Error ? error.message : String(error)}`, error);
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
async function addJobWithBackpressure(queue, redis, tenantId, jobName, jobData, priority = JobPriority.NORMAL, jobId) {
    try {
        const backpressure = await checkBackpressure(queue, redis, tenantId, priority);
        if (!backpressure.canAddJob) {
            logger.warn(`[Backpressure] Job rejected for tenant ${tenantId}: ${backpressure.reason}`);
            return {
                success: false,
                error: backpressure.reason,
                backpressure,
            };
        }
        const job = await queue.add(jobName, jobData, {
            jobId,
            priority: priority,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: { age: 100 },
            removeOnFail: { age: 50 },
        });
        logger.log(`[Backpressure] Job ${job.id} added for tenant ${tenantId} with priority ${priority}`);
        return {
            success: true,
            jobId: job.id,
        };
    }
    catch (error) {
        logger.error(`[Backpressure] Add job failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add job',
        };
    }
}
function recommendPriority(plan = 'FREE') {
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
//# sourceMappingURL=backpressure.js.map