import { ContractAnalysis, ClauseFix, ComplianceCheck } from './outputSchemas';
export declare class AIEngine {
    private readonly logger;
    private readonly aiClient;
    private readonly retryHandler;
    constructor();
    analyzeContract(contractText: string, contractId?: string): Promise<{
        analysis: ContractAnalysis;
        success: boolean;
        tokensUsed: number;
        duration: number;
        chunksProcessed: number;
    }>;
    generateClauseFix(clause: string, issue: string, clauseId?: string): Promise<{
        fix: ClauseFix;
        success: boolean;
        tokensUsed: number;
        duration: number;
    }>;
    checkCompliance(contractText: string, contractId?: string): Promise<{
        check: ComplianceCheck;
        success: boolean;
        tokensUsed: number;
        duration: number;
    }>;
    getTokenStats(): {
        averageTokensPerRequest: number;
        successRate: number;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalRequests: number;
        failedRequests: number;
    };
    resetTokenStats(): void;
    private chunkContract;
    private mergeAnalyses;
}
