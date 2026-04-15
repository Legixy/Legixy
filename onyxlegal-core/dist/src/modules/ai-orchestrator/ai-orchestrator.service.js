"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AiOrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("../../../generated/prisma/client");
const aiEngine_1 = require("../../features/ai/services/aiEngine");
let AiOrchestratorService = AiOrchestratorService_1 = class AiOrchestratorService {
    prisma;
    analysisQueue;
    logger = new common_1.Logger(AiOrchestratorService_1.name);
    aiEngine;
    constructor(prisma, analysisQueue) {
        this.prisma = prisma;
        this.analysisQueue = analysisQueue;
        this.aiEngine = new aiEngine_1.AIEngine();
    }
    async triggerAnalysis(tenantId, contractId) {
        const contract = await this.prisma.contract.findFirst({
            where: { id: contractId, tenantId },
        });
        if (!contract) {
            throw new common_1.BadRequestException('Contract not found');
        }
        if (!contract.content) {
            throw new common_1.BadRequestException('Contract has no content to analyze');
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (tenant && tenant.aiTokensUsed >= tenant.aiTokenLimit) {
            throw new common_1.BadRequestException('AI token limit reached for this billing cycle. Upgrade your plan for more analysis.');
        }
        const existingJob = await this.prisma.aIAnalysis.findFirst({
            where: {
                contractId,
                status: { in: [client_1.AnalysisStatus.QUEUED, client_1.AnalysisStatus.PROCESSING] },
            },
        });
        if (existingJob) {
            return {
                message: 'Analysis already in progress',
                analysisId: existingJob.id,
                status: existingJob.status,
            };
        }
        const analysis = await this.prisma.aIAnalysis.create({
            data: {
                contractId,
                type: client_1.AnalysisType.QUICK_SCAN,
                status: client_1.AnalysisStatus.QUEUED,
            },
        });
        await this.analysisQueue.add('analyze-contract', {
            analysisId: analysis.id,
            contractId,
            tenantId,
            content: contract.content,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
        });
        this.logger.log(`Analysis queued: ${analysis.id} for contract ${contractId}`);
        return {
            message: 'Analysis queued successfully',
            analysisId: analysis.id,
            status: 'QUEUED',
        };
    }
    async analyzeContractDirect(contractId, contractText) {
        try {
            this.logger.log(`🚀 Starting direct contract analysis for ${contractId}`);
            const result = await this.aiEngine.analyzeContract(contractText, contractId);
            this.logger.log(`✅ Direct analysis complete: ${result.analysis.risks.length} risks found`);
            return {
                success: result.success,
                analysis: result.analysis,
                tokensUsed: result.tokensUsed,
                duration: result.duration,
                chunksProcessed: result.chunksProcessed,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Direct analysis failed: ${errorMsg}`);
            throw new common_1.BadRequestException(`Contract analysis failed: ${errorMsg}`);
        }
    }
    async generateClauseFixDirect(clause, issue) {
        try {
            this.logger.log(`🔧 Generating clause fix`);
            const result = await this.aiEngine.generateClauseFix(clause, issue);
            this.logger.log(`✅ Clause fix generated with confidence: ${result.fix.confidence}`);
            return {
                success: result.success,
                fix: result.fix,
                tokensUsed: result.tokensUsed,
                duration: result.duration,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Clause fix generation failed: ${errorMsg}`);
            throw new common_1.BadRequestException(`Clause fix generation failed: ${errorMsg}`);
        }
    }
    async checkComplianceDirect(contractText, contractId) {
        try {
            this.logger.log(`✔️ Checking compliance${contractId ? ` for ${contractId}` : ''}`);
            const result = await this.aiEngine.checkCompliance(contractText, contractId);
            this.logger.log(`✅ Compliance check complete: ${result.check.compliant ? 'compliant' : 'non-compliant'}`);
            return {
                success: result.success,
                check: result.check,
                tokensUsed: result.tokensUsed,
                duration: result.duration,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Compliance check failed: ${errorMsg}`);
            throw new common_1.BadRequestException(`Compliance check failed: ${errorMsg}`);
        }
    }
    getTokenStats() {
        return this.aiEngine.getTokenStats();
    }
    async getAnalysisResults(tenantId, contractId) {
        const contract = await this.prisma.contract.findFirst({
            where: { id: contractId, tenantId },
        });
        if (!contract)
            throw new common_1.BadRequestException('Contract not found');
        const analyses = await this.prisma.aIAnalysis.findMany({
            where: { contractId },
            orderBy: { createdAt: 'desc' },
            include: {
                riskFindings: {
                    orderBy: { severity: 'desc' },
                },
            },
        });
        return {
            contractId,
            analyses,
        };
    }
    async getSuggestions(tenantId, contractId) {
        const contract = await this.prisma.contract.findFirst({
            where: { id: contractId, tenantId },
        });
        if (!contract)
            throw new common_1.BadRequestException('Contract not found');
        const suggestions = await this.prisma.clause.findMany({
            where: {
                contractId,
                suggestedText: { not: null },
                isAccepted: false,
                riskLevel: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] },
            },
            orderBy: { riskLevel: 'desc' },
        });
        return { contractId, suggestions };
    }
};
exports.AiOrchestratorService = AiOrchestratorService;
exports.AiOrchestratorService = AiOrchestratorService = AiOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('contract-analysis')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], AiOrchestratorService);
//# sourceMappingURL=ai-orchestrator.service.js.map