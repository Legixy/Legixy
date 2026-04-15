"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryHandler = void 0;
const common_1 = require("@nestjs/common");
const outputSchemas_1 = require("./outputSchemas");
class RetryHandler {
    aiClient;
    logger = new common_1.Logger('RetryHandler');
    maxRetries = 3;
    constructor(aiClient) {
        this.aiClient = aiClient;
    }
    async analyzeContractWithRetry(systemPrompt, userPrompt, contractId) {
        let lastError = '';
        let attemptsUsed = 0;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            attemptsUsed = attempt;
            try {
                this.logger.log(`📊 Analyzing contract (attempt ${attempt}/${this.maxRetries})` +
                    (contractId ? ` | contract: ${contractId}` : ''));
                const llmResult = await this.aiClient.callLLM(systemPrompt, userPrompt, 'gpt-4o-mini');
                this.logger.debug(`✅ LLM returned (${llmResult.tokens.totalTokens} tokens): ${llmResult.content.substring(0, 100)}...`);
                try {
                    const validated = (0, outputSchemas_1.validateContractAnalysis)(llmResult.content);
                    this.logger.log(`✅ Contract analysis validated | ` +
                        `risks: ${validated.risks.length} | ` +
                        `score: ${validated.overallScore} | ` +
                        `attempts: ${attempt}`);
                    return {
                        result: validated,
                        success: true,
                        attemptsUsed: attempt,
                    };
                }
                catch (validationError) {
                    const validationMsg = validationError instanceof Error
                        ? validationError.message
                        : 'Unknown validation error';
                    lastError = validationMsg;
                    this.logger.warn(`⚠️ Validation failed (attempt ${attempt}/${this.maxRetries}) | ` +
                        `error: ${validationMsg}`);
                    if (attempt < this.maxRetries) {
                        await this.exponentialBackoff(attempt);
                    }
                }
            }
            catch (error) {
                lastError =
                    error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
                    `error: ${lastError}`);
                if (attempt < this.maxRetries) {
                    await this.exponentialBackoff(attempt);
                }
            }
        }
        this.logger.error(`❌ Contract analysis failed after ${this.maxRetries} attempts | ` +
            `error: ${lastError} | ` +
            `returning fallback` +
            (contractId ? ` | contract: ${contractId}` : ''));
        return {
            result: outputSchemas_1.FALLBACK_VALUES.contractAnalysis(),
            success: false,
            attemptsUsed: this.maxRetries,
            error: lastError,
        };
    }
    async generateClauseFixWithRetry(systemPrompt, userPrompt, clauseId) {
        let lastError = '';
        let attemptsUsed = 0;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            attemptsUsed = attempt;
            try {
                this.logger.log(`🔧 Generating clause fix (attempt ${attempt}/${this.maxRetries})` +
                    (clauseId ? ` | clause: ${clauseId}` : ''));
                const llmResult = await this.aiClient.callLLM(systemPrompt, userPrompt, 'gpt-4o-mini');
                try {
                    const validated = (0, outputSchemas_1.validateClauseFix)(llmResult.content);
                    this.logger.log(`✅ Clause fix validated | ` +
                        `confidence: ${validated.confidence} | ` +
                        `attempts: ${attempt}`);
                    return {
                        result: validated,
                        success: true,
                        attemptsUsed: attempt,
                    };
                }
                catch (validationError) {
                    const validationMsg = validationError instanceof Error
                        ? validationError.message
                        : 'Unknown validation error';
                    lastError = validationMsg;
                    this.logger.warn(`⚠️ Validation failed (attempt ${attempt}/${this.maxRetries}) | ` +
                        `error: ${validationMsg}`);
                    if (attempt < this.maxRetries) {
                        await this.exponentialBackoff(attempt);
                    }
                }
            }
            catch (error) {
                lastError =
                    error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
                    `error: ${lastError}`);
                if (attempt < this.maxRetries) {
                    await this.exponentialBackoff(attempt);
                }
            }
        }
        this.logger.error(`❌ Clause fix generation failed after ${this.maxRetries} attempts | ` +
            `error: ${lastError} | ` +
            `returning fallback` +
            (clauseId ? ` | clause: ${clauseId}` : ''));
        return {
            result: outputSchemas_1.FALLBACK_VALUES.clauseFix(),
            success: false,
            attemptsUsed: this.maxRetries,
            error: lastError,
        };
    }
    async checkComplianceWithRetry(systemPrompt, userPrompt, contractId) {
        let lastError = '';
        let attemptsUsed = 0;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            attemptsUsed = attempt;
            try {
                this.logger.log(`✔️ Checking compliance (attempt ${attempt}/${this.maxRetries})` +
                    (contractId ? ` | contract: ${contractId}` : ''));
                const llmResult = await this.aiClient.callLLM(systemPrompt, userPrompt, 'gpt-4o-mini');
                try {
                    const validated = (0, outputSchemas_1.validateComplianceCheck)(llmResult.content);
                    this.logger.log(`✅ Compliance check validated | ` +
                        `compliant: ${validated.compliant} | ` +
                        `risk: ${validated.overallRisk} | ` +
                        `attempts: ${attempt}`);
                    return {
                        result: validated,
                        success: true,
                        attemptsUsed: attempt,
                    };
                }
                catch (validationError) {
                    const validationMsg = validationError instanceof Error
                        ? validationError.message
                        : 'Unknown validation error';
                    lastError = validationMsg;
                    this.logger.warn(`⚠️ Validation failed (attempt ${attempt}/${this.maxRetries}) | ` +
                        `error: ${validationMsg}`);
                    if (attempt < this.maxRetries) {
                        await this.exponentialBackoff(attempt);
                    }
                }
            }
            catch (error) {
                lastError =
                    error instanceof Error ? error.message : 'Unknown error';
                this.logger.warn(`⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
                    `error: ${lastError}`);
                if (attempt < this.maxRetries) {
                    await this.exponentialBackoff(attempt);
                }
            }
        }
        this.logger.error(`❌ Compliance check failed after ${this.maxRetries} attempts | ` +
            `error: ${lastError} | ` +
            `returning fallback` +
            (contractId ? ` | contract: ${contractId}` : ''));
        return {
            result: outputSchemas_1.FALLBACK_VALUES.complianceCheck(),
            success: false,
            attemptsUsed: this.maxRetries,
            error: lastError,
        };
    }
    async exponentialBackoff(attemptNumber) {
        const delayMs = Math.pow(2, attemptNumber - 1) * 1000;
        this.logger.debug(`⏳ Waiting ${delayMs}ms before retry...`);
        return new Promise((resolve) => setTimeout(resolve, delayMs));
    }
}
exports.RetryHandler = RetryHandler;
//# sourceMappingURL=retryHandler.js.map