"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeadLetterQueue = createDeadLetterQueue;
exports.addToDLQ = addToDLQ;
exports.getDLQEntries = getDLQEntries;
exports.removeFromDLQ = removeFromDLQ;
exports.getDLQEntry = getDLQEntry;
exports.getDLQStats = getDLQStats;
const bullmq_1 = require("bullmq");
const common_1 = require("@nestjs/common");
function createDeadLetterQueue(redisConnection, queueName = 'contract-analysis-dlq') {
    const logger = new common_1.Logger('DeadLetterQueue');
    const queue = new bullmq_1.Queue(queueName, {
        connection: redisConnection,
        defaultJobOptions: {
            removeOnComplete: false,
            removeOnFail: false,
        },
    });
    queue.on('error', (err) => {
        logger.error(`DLQ Error: ${err.message}`);
    });
    return queue;
}
async function addToDLQ(dlqQueue, jobId, contractId, tenantId, userId, originalData, error, attempts, maxAttempts, metadata) {
    const logger = new common_1.Logger('DeadLetterQueue');
    try {
        const dlqEntry = {
            jobId,
            contractId,
            tenantId,
            userId,
            originalData,
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code,
            },
            attempts,
            maxAttempts,
            failedAt: new Date(),
            lastError: error.message,
            metadata,
        };
        await dlqQueue.add(`dlq-${jobId}`, dlqEntry, {
            jobId: `dlq-${jobId}`,
        });
        logger.warn(`Job ${jobId} added to DLQ after ${attempts} attempts. Error: ${error.message}`);
    }
    catch (dlqError) {
        logger.error(`Failed to add job to DLQ: ${dlqError}`, dlqError);
    }
}
async function getDLQEntries(dlqQueue, tenantId) {
    try {
        const jobs = await dlqQueue.getJobs(['wait', 'completed', 'failed'], 0, -1);
        return jobs
            .map((job) => job.data)
            .filter((entry) => entry.tenantId === tenantId)
            .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime());
    }
    catch (error) {
        const logger = new common_1.Logger('DeadLetterQueue');
        logger.error(`Failed to get DLQ entries: ${error}`);
        return [];
    }
}
async function removeFromDLQ(dlqQueue, jobId) {
    try {
        const job = await dlqQueue.getJob(`dlq-${jobId}`);
        if (job) {
            await job.remove();
            return true;
        }
        return false;
    }
    catch (error) {
        const logger = new common_1.Logger('DeadLetterQueue');
        logger.error(`Failed to remove from DLQ: ${error}`);
        return false;
    }
}
async function getDLQEntry(dlqQueue, jobId) {
    try {
        const job = await dlqQueue.getJob(`dlq-${jobId}`);
        return job ? job.data : null;
    }
    catch (error) {
        const logger = new common_1.Logger('DeadLetterQueue');
        logger.error(`Failed to get DLQ entry: ${error}`);
        return null;
    }
}
async function getDLQStats(dlqQueue) {
    try {
        const jobs = await dlqQueue.getJobs(['wait', 'completed', 'failed'], 0, -1);
        const entries = jobs.map((job) => job.data);
        const byTenant = {};
        let totalEntries = 0;
        for (const entry of entries) {
            totalEntries++;
            byTenant[entry.tenantId] = (byTenant[entry.tenantId] || 0) + 1;
        }
        return { totalEntries, byTenant };
    }
    catch (error) {
        const logger = new common_1.Logger('DeadLetterQueue');
        logger.error(`Failed to get DLQ stats: ${error}`);
        return { totalEntries: 0, byTenant: {} };
    }
}
//# sourceMappingURL=deadLetterQueue.js.map