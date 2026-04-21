"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIdempotentJobId = generateIdempotentJobId;
exports.checkIdempotency = checkIdempotency;
exports.acquireAnalysisLock = acquireAnalysisLock;
exports.releaseAnalysisLock = releaseAnalysisLock;
exports.deduplicateJob = deduplicateJob;
exports.getIdempotencyStats = getIdempotencyStats;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const logger = new common_1.Logger('IdempotencyService');
function generateIdempotentJobId(contractId, tenantId, userId, analysisType = 'full') {
    const payload = `${contractId}:${tenantId}:${userId}:${analysisType}`;
    const hash = crypto
        .createHash('sha256')
        .update(payload)
        .digest('hex')
        .substring(0, 16);
    return `analysis-${contractId}-${hash}`;
}
async function checkIdempotency(prisma, contractId, tenantId, userId, analysisType = 'full') {
    try {
        const jobId = generateIdempotentJobId(contractId, tenantId, userId, analysisType);
        const existingAnalysis = await prisma.aIAnalysis.findFirst({
            where: {
                contractId,
                status: {
                    in: ['QUEUED', 'PROCESSING'],
                },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true },
        });
        if (existingAnalysis) {
            logger.warn(`[Idempotency] Duplicate analysis detected for contract ${contractId}. Status: ${existingAnalysis.status}`);
            return {
                allowed: false,
                jobId,
                existingAnalysisId: existingAnalysis.id,
                reason: `Analysis already ${existingAnalysis.status.toLowerCase()} for this contract`,
            };
        }
        const processingCount = await prisma.aIAnalysis.count({
            where: {
                contractId,
                status: 'PROCESSING',
            },
        });
        if (processingCount > 0) {
            logger.warn(`[Idempotency] Contract ${contractId} has analysis in progress`);
            return {
                allowed: false,
                jobId,
                reason: 'Another analysis is already in progress for this contract',
            };
        }
        logger.log(`[Idempotency] Safe to queue analysis for contract ${contractId}`);
        return { allowed: true, jobId };
    }
    catch (error) {
        logger.error(`[Idempotency] Check failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            allowed: true,
            jobId: `analysis-${contractId}-${Date.now()}`,
            reason: 'Idempotency check failed, allowing retry',
        };
    }
}
async function acquireAnalysisLock(prisma, contractId, analysisType = 'QUICK_SCAN') {
    try {
        const analysis = await prisma.aIAnalysis.create({
            data: {
                contractId,
                type: analysisType,
                status: 'QUEUED',
            },
        });
        logger.log(`[Idempotency] Created analysis lock ${analysis.id} for contract ${contractId}`);
        return { locked: true, analysisId: analysis.id };
    }
    catch (error) {
        if (error instanceof Error &&
            error.message.includes('Unique constraint')) {
            logger.warn(`[Idempotency] Failed to acquire lock - analysis already in progress for contract ${contractId}`);
        }
        else {
            logger.error(`[Idempotency] Lock acquisition failed: ${error instanceof Error ? error.message : String(error)}`, error);
        }
        return { locked: false };
    }
}
async function releaseAnalysisLock(prisma, analysisId, status = 'FAILED') {
    try {
        await prisma.aIAnalysis.update({
            where: { id: analysisId },
            data: { status },
        });
        logger.log(`[Idempotency] Released analysis lock ${analysisId} (${status})`);
        return true;
    }
    catch (error) {
        logger.error(`[Idempotency] Lock release failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return false;
    }
}
async function deduplicateJob(job, prisma, processorFn) {
    const jobId = job.id || 'unknown';
    try {
        const data = job.data;
        const stableJobId = generateIdempotentJobId(data.contractId, data.tenantId, data.userId, data.analysisType || 'full');
        const processing = await prisma.aIAnalysis.findFirst({
            where: {
                contractId: data.contractId,
                status: 'PROCESSING',
            },
        });
        if (processing && processing.id !== data.analysisId) {
            logger.warn(`[Dedupe] Job ${jobId} is duplicate. Active job: ${processing.id}`);
            return { status: 'SKIPPED', reason: 'Duplicate job detected' };
        }
        return await processorFn();
    }
    catch (error) {
        logger.error(`[Dedupe] Error: ${error instanceof Error ? error.message : String(error)}`, error);
        throw error;
    }
}
async function getIdempotencyStats(prisma) {
    try {
        const queued = await prisma.aIAnalysis.count({
            where: {
                status: 'QUEUED',
            },
        });
        const processing = await prisma.aIAnalysis.count({
            where: {
                status: 'PROCESSING',
            },
        });
        return {
            queuedAnalyses: queued,
            processingAnalyses: processing,
        };
    }
    catch (error) {
        logger.error(`[Idempotency] Stats failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            queuedAnalyses: 0,
            processingAnalyses: 0,
        };
    }
}
//# sourceMappingURL=idempotency.js.map