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
exports.AIClient = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("openai");
let AIClient = class AIClient {
    logger = new common_1.Logger('AIClient');
    openai = null;
    timeout = 10000;
    maxRetries = 3;
    initialBackoffMs = 1000;
    tokenStats = {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalRequests: 0,
        failedRequests: 0,
    };
    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey || apiKey.startsWith('sk-your')) {
            this.logger.warn('OPENAI_API_KEY not set — AI features will be unavailable until configured');
        }
        else {
            this.openai = new openai_1.default({ apiKey });
        }
    }
    getClient() {
        if (!this.openai) {
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey && !apiKey.startsWith('sk-your')) {
                this.openai = new openai_1.default({ apiKey });
            }
            else {
                throw new Error('OPENAI_API_KEY is not configured. Set it in your .env file to enable AI features.');
            }
        }
        return this.openai;
    }
    async callLLM(systemPrompt, userPrompt, model = 'gpt-4o-mini') {
        const startTime = Date.now();
        let lastError = null;
        let retryCount = 0;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const result = await this.executeCallWithTimeout(systemPrompt, userPrompt, model);
                const duration = Date.now() - startTime;
                this.tokenStats.totalPromptTokens += result.tokens.promptTokens;
                this.tokenStats.totalCompletionTokens +=
                    result.tokens.completionTokens;
                this.tokenStats.totalRequests += 1;
                this.logger.log(`✅ LLM call successful (attempt ${attempt}) | ` +
                    `model: ${model} | ` +
                    `tokens: ${result.tokens.totalTokens} | ` +
                    `duration: ${duration}ms | ` +
                    `retries: ${retryCount}`);
                return {
                    ...result,
                    retries: retryCount,
                    duration,
                };
            }
            catch (error) {
                lastError = error;
                retryCount = attempt - 1;
                const isLastAttempt = attempt === this.maxRetries;
                const backoffMs = this.initialBackoffMs * Math.pow(2, attempt - 1);
                if (!isLastAttempt) {
                    this.logger.warn(`⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
                        `error: ${lastError.message} | ` +
                        `retry in ${backoffMs}ms`);
                    await this.delay(backoffMs);
                }
                else {
                    this.logger.error(`❌ LLM call failed after ${this.maxRetries} attempts | ` +
                        `error: ${lastError.message}`);
                    this.tokenStats.failedRequests += 1;
                }
            }
        }
        throw new Error(`LLM call failed after ${this.maxRetries} attempts: ${lastError?.message}`);
    }
    async executeCallWithTimeout(systemPrompt, userPrompt, model) {
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                reject(new Error(`LLM call timeout (${this.timeout}ms exceeded)`));
            }, this.timeout);
            this.getClient().chat.completions
                .create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.2,
                max_tokens: 2000,
            })
                .then((response) => {
                clearTimeout(timeoutHandle);
                const content = response.choices[0]?.message?.content || '';
                const tokens = {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                };
                resolve({
                    content,
                    tokens,
                    retries: 0,
                    duration: 0,
                });
            })
                .catch((error) => {
                clearTimeout(timeoutHandle);
                reject(error);
            });
        });
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    getTokenStats() {
        return {
            ...this.tokenStats,
            averageTokensPerRequest: this.tokenStats.totalRequests > 0
                ? Math.round((this.tokenStats.totalPromptTokens +
                    this.tokenStats.totalCompletionTokens) /
                    this.tokenStats.totalRequests)
                : 0,
            successRate: this.tokenStats.totalRequests > 0
                ? Math.round(((this.tokenStats.totalRequests -
                    this.tokenStats.failedRequests) /
                    this.tokenStats.totalRequests) *
                    100)
                : 0,
        };
    }
    resetTokenStats() {
        this.tokenStats = {
            totalPromptTokens: 0,
            totalCompletionTokens: 0,
            totalRequests: 0,
            failedRequests: 0,
        };
        this.logger.log('📊 Token statistics reset');
    }
};
exports.AIClient = AIClient;
exports.AIClient = AIClient = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AIClient);
//# sourceMappingURL=aiClient.js.map