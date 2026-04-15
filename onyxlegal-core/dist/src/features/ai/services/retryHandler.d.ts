import { ContractAnalysis, ClauseFix, ComplianceCheck } from './outputSchemas';
import { AIClient } from './aiClient';
export declare class RetryHandler {
    private aiClient;
    private readonly logger;
    private readonly maxRetries;
    constructor(aiClient: AIClient);
    analyzeContractWithRetry(systemPrompt: string, userPrompt: string, contractId?: string): Promise<{
        result: ContractAnalysis;
        success: boolean;
        attemptsUsed: number;
        error?: string;
    }>;
    generateClauseFixWithRetry(systemPrompt: string, userPrompt: string, clauseId?: string): Promise<{
        result: ClauseFix;
        success: boolean;
        attemptsUsed: number;
        error?: string;
    }>;
    checkComplianceWithRetry(systemPrompt: string, userPrompt: string, contractId?: string): Promise<{
        result: ComplianceCheck;
        success: boolean;
        attemptsUsed: number;
        error?: string;
    }>;
    private exponentialBackoff;
}
