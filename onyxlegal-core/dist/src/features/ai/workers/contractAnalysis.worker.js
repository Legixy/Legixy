"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractAnalysisWorker = void 0;
const bullmq_1 = require("bullmq");
const common_1 = require("@nestjs/common");
const client_1 = require("../../../../generated/prisma/client");
const deadLetterQueue_1 = require("../queues/deadLetterQueue");
class ContractAnalysisWorker {
    logger = new common_1.Logger('ContractAnalysisWorker');
    worker;
    aiEngine;
    prisma;
    websocketGateway;
    dlqQueue;
    constructor(redisConnection, aiEngine, prisma, dlqQueue, concurrency = 5) {
        this.aiEngine = aiEngine;
        this.prisma = prisma;
        this.dlqQueue = dlqQueue;
        this.worker = new bullmq_1.Worker('contract-analysis', this.processorFn.bind(this), {
            connection: redisConnection,
            concurrency,
        });
        this.attachEventHandlers();
    }
    async processorFn(job) {
        const data = job.data;
        const { analysisId, contractId, tenantId, content, type } = data;
        this.logger.log(`[Job ${job.id}] Processing analysis ${analysisId} for contract ${contractId}`);
        try {
            await this.prisma.aIAnalysis.update({
                where: { id: analysisId },
                data: {
                    status: client_1.AnalysisStatus.PROCESSING,
                    startedAt: new Date(),
                },
            });
            this.emitEvent(tenantId, 'analysis_started', {
                contractId,
                analysisId,
                status: 'PROCESSING',
            });
            const startTime = Date.now();
            const analysisResult = await this.aiEngine.analyzeContract(content, contractId);
            const processingMs = Date.now() - startTime;
            const tokenStats = this.aiEngine.getTokenStats();
            const tokensUsed = tokenStats.totalCompletionTokens + tokenStats.totalPromptTokens || 0;
            const analysis = await this.prisma.aIAnalysis.update({
                where: { id: analysisId },
                data: {
                    status: client_1.AnalysisStatus.COMPLETED,
                    completedAt: new Date(),
                    tokensUsed,
                    processingMs,
                },
            });
            if (analysisResult.analysis?.risks && analysisResult.analysis.risks.length > 0) {
                await Promise.all(analysisResult.analysis.risks.map((risk) => this.prisma.riskFinding.create({
                    data: {
                        analysisId,
                        severity: this.mapRiskLevel(risk.severity || 'MEDIUM'),
                        title: risk.issue,
                        clause: risk.clause || content.substring(0, 200),
                        impact: risk.recommendation || '',
                        suggestion: risk.recommendation || '',
                        legalRef: undefined,
                        estimatedRisk: null,
                    },
                })));
            }
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: {
                    aiTokensUsed: {
                        increment: tokensUsed,
                    },
                },
            });
            this.emitEvent(tenantId, 'analysis_completed', {
                contractId,
                analysisId,
                status: 'COMPLETED',
                result: analysisResult,
                tokensUsed,
                processingMs,
            });
            this.logger.log(`[Job ${job.id}] Analysis completed: ${tokensUsed} tokens, ${processingMs}ms`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`[Job ${job.id}] Analysis failed: ${errorMessage}`, error);
            const currentAttempts = (job.attemptsMade || 0) + 1;
            const maxAttempts = job.opts?.attempts || 3;
            await this.prisma.aIAnalysis.update({
                where: { id: analysisId },
                data: {
                    status: client_1.AnalysisStatus.FAILED,
                    errorMessage: errorMessage.substring(0, 500),
                    retryCount: {
                        increment: 1,
                    },
                },
            });
            if (currentAttempts >= maxAttempts) {
                this.logger.warn(`[Job ${job.id}] Max retries (${maxAttempts}) exceeded. Adding to DLQ.`);
                await (0, deadLetterQueue_1.addToDLQ)(this.dlqQueue, job.id || '', contractId, tenantId, data.userId, data, error instanceof Error ? error : new Error(errorMessage), currentAttempts, maxAttempts, {
                    analysisId,
                    contentLength: content.length,
                });
                this.emitEvent(tenantId, 'analysis_failed_permanent', {
                    contractId,
                    analysisId,
                    status: 'FAILED_PERMANENT',
                    error: errorMessage,
                    message: 'Job moved to dead letter queue. Admin intervention required.',
                });
            }
            else {
                this.emitEvent(tenantId, 'analysis_failed', {
                    contractId,
                    analysisId,
                    status: 'FAILED',
                    error: errorMessage,
                    attempt: currentAttempts,
                    maxAttempts,
                });
            }
            throw error;
        }
    }
    attachEventHandlers() {
        this.worker.on('completed', (job) => {
            this.logger.log(`✅ Job ${job.id} completed`);
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
        });
        this.worker.on('error', (err) => {
            this.logger.error(`Worker error: ${err.message}`);
        });
    }
    mapRiskLevel(level) {
        const mapping = {
            SAFE: 'SAFE',
            LOW: 'LOW',
            MEDIUM: 'MEDIUM',
            HIGH: 'HIGH',
            CRITICAL: 'CRITICAL',
            low: 'LOW',
            medium: 'MEDIUM',
            high: 'HIGH',
            critical: 'CRITICAL',
        };
        return mapping[level] || 'MEDIUM';
    }
    emitEvent(tenantId, event, data) {
        if (this.websocketGateway) {
            this.websocketGateway.emitToTenant(tenantId, event, data);
        }
        else {
            this.logger.debug(`[WebSocket] Event ${event} queued (gateway not attached yet)`);
        }
    }
    attachWebSocketGateway(gateway) {
        this.websocketGateway = gateway;
        this.logger.log('WebSocket gateway attached');
    }
    async start() {
        this.logger.log('Worker started, listening for jobs...');
    }
    async shutdown() {
        this.logger.log('Worker shutting down...');
        await this.worker.close();
    }
    getStats() {
        return {
            isRunning: !this.worker.isPaused(),
            concurrency: this.worker.opts.concurrency,
        };
    }
}
exports.ContractAnalysisWorker = ContractAnalysisWorker;
//# sourceMappingURL=contractAnalysis.worker.js.map