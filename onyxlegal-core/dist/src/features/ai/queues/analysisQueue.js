"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnalysisQueue = createAnalysisQueue;
exports.createClauseFixQueue = createClauseFixQueue;
exports.addAnalysisJob = addAnalysisJob;
exports.addClauseFixJob = addClauseFixJob;
exports.getQueueStats = getQueueStats;
const bullmq_1 = require("bullmq");
const common_1 = require("@nestjs/common");
function createAnalysisQueue(redisConnection, queueName = 'contract-analysis') {
    const logger = new common_1.Logger('AnalysisQueue');
    const queue = new bullmq_1.Queue(queueName, {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: {
                age: 100,
            },
            removeOnFail: {
                age: 50,
            },
        },
    });
    queue.on('waiting', (job) => {
        logger.log(`Job ${job.id} waiting in queue`);
    });
    queue.on('error', (err) => {
        logger.error(`Queue error: ${err.message}`);
    });
    return queue;
}
function createClauseFixQueue(redisConnection, queueName = 'clause-fix') {
    const logger = new common_1.Logger('ClauseFixQueue');
    const queue = new bullmq_1.Queue(queueName, {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: {
                age: 100,
            },
            removeOnFail: {
                age: 50,
            },
        },
    });
    queue.on('waiting', (job) => {
        logger.log(`Clause fix job ${job.id} waiting`);
    });
    queue.on('error', (err) => {
        logger.error(`Clause fix queue error: ${err.message}`);
    });
    return queue;
}
async function addAnalysisJob(queue, data, priority) {
    const job = await queue.add('analyze-contract', data, {
        priority,
        jobId: `analysis-${data.analysisId}`,
    });
    return job.id || '';
}
async function addClauseFixJob(queue, data, priority) {
    const job = await queue.add('generate-clause-fix', data, {
        priority,
        jobId: `fix-${data.analysisId}`,
    });
    return job.id || '';
}
async function getQueueStats(queue) {
    const counts = await queue.getJobCounts();
    return {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
    };
}
//# sourceMappingURL=analysisQueue.js.map