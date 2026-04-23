interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
interface AICallResult {
    content: string;
    tokens: TokenUsage;
    retries: number;
    duration: number;
}
export declare class AIClient {
    private readonly logger;
    private openai;
    private readonly timeout;
    private readonly maxRetries;
    private readonly initialBackoffMs;
    private tokenStats;
    constructor();
    private getClient;
    callLLM(systemPrompt: string, userPrompt: string, model?: 'gpt-4o-mini' | 'gpt-4o'): Promise<AICallResult>;
    private executeCallWithTimeout;
    private delay;
    getTokenStats(): {
        averageTokensPerRequest: number;
        successRate: number;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalRequests: number;
        failedRequests: number;
    };
    resetTokenStats(): void;
}
export {};
