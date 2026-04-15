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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIEngine = void 0;
const common_1 = require("@nestjs/common");
const aiClient_1 = require("./aiClient");
const retryHandler_1 = require("./retryHandler");
const promptTemplates_1 = require("./promptTemplates");
let AIEngine = class AIEngine {
    logger = new common_1.Logger('AIEngine');
    aiClient;
    retryHandler;
    constructor() {
        this.aiClient = new aiClient_1.AIClient();
        this.retryHandler = new retryHandler_1.RetryHandler(this.aiClient);
    }
    async analyzeContract(contractText, contractId) {
        const startTime = Date.now();
        this.logger.log(`📄 Starting contract analysis${contractId ? ` | id: ${contractId}` : ''}`);
        try {
            const chunks = this.chunkContract(contractText);
            this.logger.log(`📦 Contract split into ${chunks.length} chunks`);
            if (chunks.length === 0) {
                this.logger.error('Contract is empty');
                return {
                    analysis: {
                        risks: [],
                        overallScore: 50,
                        summary: 'Contract is empty',
                    },
                    success: false,
                    tokensUsed: 0,
                    duration: Date.now() - startTime,
                    chunksProcessed: 0,
                };
            }
            const chunkAnalyses = [];
            let totalTokensUsed = 0;
            for (let i = 0; i < chunks.length; i++) {
                this.logger.log(`🔍 Analyzing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
                const userPrompt = promptTemplates_1.USER_PROMPTS.contractAnalysis(chunks[i]);
                const { result, success, error } = await this.retryHandler.analyzeContractWithRetry(promptTemplates_1.SYSTEM_PROMPTS.contractAnalysis, userPrompt, contractId ? `${contractId}-chunk-${i}` : undefined);
                chunkAnalyses.push(result);
                const stats = this.aiClient.getTokenStats();
                totalTokensUsed = stats.totalPromptTokens + stats.totalCompletionTokens;
                if (!success && error) {
                    this.logger.warn(`⚠️ Chunk ${i + 1} analysis had issues: ${error}`);
                }
            }
            const mergedAnalysis = this.mergeAnalyses(chunkAnalyses);
            const duration = Date.now() - startTime;
            this.logger.log(`✅ Contract analysis complete | ` +
                `risks: ${mergedAnalysis.risks.length} | ` +
                `score: ${mergedAnalysis.overallScore} | ` +
                `chunks: ${chunks.length} | ` +
                `tokens: ${totalTokensUsed} | ` +
                `duration: ${duration}ms`);
            return {
                analysis: mergedAnalysis,
                success: true,
                tokensUsed: totalTokensUsed,
                duration,
                chunksProcessed: chunks.length,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Contract analysis error: ${errorMsg}${contractId ? ` | contract: ${contractId}` : ''}`);
            return {
                analysis: {
                    risks: [],
                    overallScore: 50,
                    summary: `Analysis failed: ${errorMsg}`,
                },
                success: false,
                tokensUsed: 0,
                duration: Date.now() - startTime,
                chunksProcessed: 0,
            };
        }
    }
    async generateClauseFix(clause, issue, clauseId) {
        const startTime = Date.now();
        this.logger.log(`🔧 Generating clause fix${clauseId ? ` | id: ${clauseId}` : ''}`);
        try {
            const userPrompt = promptTemplates_1.USER_PROMPTS.clauseFix(clause, issue);
            const { result, success, error } = await this.retryHandler.generateClauseFixWithRetry(promptTemplates_1.SYSTEM_PROMPTS.clauseFix, userPrompt, clauseId);
            const stats = this.aiClient.getTokenStats();
            const tokensUsed = stats.totalPromptTokens + stats.totalCompletionTokens;
            const duration = Date.now() - startTime;
            if (!success) {
                this.logger.warn(`⚠️ Clause fix generation had issues: ${error}`);
            }
            this.logger.log(`✅ Clause fix generated | ` +
                `confidence: ${result.confidence} | ` +
                `tokens: ${tokensUsed} | ` +
                `duration: ${duration}ms`);
            return {
                fix: result,
                success,
                tokensUsed,
                duration,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Clause fix generation error: ${errorMsg}${clauseId ? ` | clause: ${clauseId}` : ''}`);
            return {
                fix: {
                    original: clause,
                    improved: clause,
                    explanation: `Generation failed: ${errorMsg}`,
                    confidence: 0,
                },
                success: false,
                tokensUsed: 0,
                duration: Date.now() - startTime,
            };
        }
    }
    async checkCompliance(contractText, contractId) {
        const startTime = Date.now();
        this.logger.log(`✔️ Checking compliance${contractId ? ` | id: ${contractId}` : ''}`);
        try {
            const userPrompt = promptTemplates_1.USER_PROMPTS.complianceCheck(contractText);
            const { result, success, error } = await this.retryHandler.checkComplianceWithRetry(promptTemplates_1.SYSTEM_PROMPTS.complianceCheck, userPrompt, contractId);
            const stats = this.aiClient.getTokenStats();
            const tokensUsed = stats.totalPromptTokens + stats.totalCompletionTokens;
            const duration = Date.now() - startTime;
            if (!success) {
                this.logger.warn(`⚠️ Compliance check had issues: ${error}`);
            }
            this.logger.log(`✅ Compliance check complete | ` +
                `compliant: ${result.compliant} | ` +
                `issues: ${result.issues.length} | ` +
                `tokens: ${tokensUsed} | ` +
                `duration: ${duration}ms`);
            return {
                check: result,
                success,
                tokensUsed,
                duration,
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`❌ Compliance check error: ${errorMsg}${contractId ? ` | contract: ${contractId}` : ''}`);
            return {
                check: {
                    compliant: false,
                    issues: [],
                    overallRisk: 'medium',
                },
                success: false,
                tokensUsed: 0,
                duration: Date.now() - startTime,
            };
        }
    }
    getTokenStats() {
        return this.aiClient.getTokenStats();
    }
    resetTokenStats() {
        this.aiClient.resetTokenStats();
    }
    chunkContract(contractText) {
        const maxChars = promptTemplates_1.CHUNK_SETTINGS.maxTokensPerChunk * 4;
        if (contractText.length <= maxChars) {
            return [contractText];
        }
        const paragraphs = contractText.split('\n\n').filter((p) => p.trim());
        const chunks = [];
        let currentChunk = '';
        for (const paragraph of paragraphs) {
            const potentialChunk = currentChunk
                ? `${currentChunk}\n\n${paragraph}`
                : paragraph;
            if (potentialChunk.length > maxChars && currentChunk) {
                chunks.push(currentChunk);
                currentChunk = paragraph;
            }
            else {
                currentChunk = potentialChunk;
            }
            if (chunks.length >= promptTemplates_1.CHUNK_SETTINGS.maxChunks) {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                break;
            }
        }
        if (currentChunk && chunks.length < promptTemplates_1.CHUNK_SETTINGS.maxChunks) {
            chunks.push(currentChunk);
        }
        return chunks;
    }
    mergeAnalyses(analyses) {
        if (analyses.length === 0) {
            return {
                risks: [],
                overallScore: 50,
                summary: 'No analyses performed',
            };
        }
        if (analyses.length === 1) {
            return analyses[0];
        }
        const allRisks = analyses.flatMap((a) => a.risks);
        const uniqueRisks = {};
        for (const risk of allRisks) {
            const key = risk.clause.toLowerCase();
            if (!uniqueRisks[key] || risk.confidence > uniqueRisks[key].confidence) {
                uniqueRisks[key] = risk;
            }
        }
        const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
        const mergedRisks = Object.values(uniqueRisks).sort((a, b) => {
            return (severityRank[a.severity] -
                severityRank[b.severity]);
        });
        const avgScore = Math.round(analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length);
        const summary = `Contract analyzed in ${analyses.length} sections. ` +
            `${mergedRisks.length} risks identified. ` +
            `Overall compliance score: ${avgScore}/100.`;
        return {
            risks: mergedRisks,
            overallScore: avgScore,
            summary,
        };
    }
};
exports.AIEngine = AIEngine;
exports.AIEngine = AIEngine = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIEngine);
//# sourceMappingURL=aiEngine.js.map