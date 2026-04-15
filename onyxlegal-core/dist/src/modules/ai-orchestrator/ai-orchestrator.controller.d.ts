import { AiOrchestratorService } from './ai-orchestrator.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
export declare class AiOrchestratorController {
    private readonly aiService;
    constructor(aiService: AiOrchestratorService);
    triggerAnalysis(user: AuthenticatedUser, contractId: string): Promise<{
        message: string;
        analysisId: string;
        status: string;
    }>;
    analyzeDirect(user: AuthenticatedUser, body: {
        contractText: string;
        contractId?: string;
    }): Promise<{
        success: boolean;
        analysis: {
            risks: {
                clause: string;
                issue: string;
                severity: "low" | "medium" | "high" | "critical";
                recommendation: string;
                confidence: number;
            }[];
            overallScore: number;
            summary?: string | undefined;
        };
        tokensUsed: number;
        duration: number;
        chunksProcessed: number;
    }>;
    generateFix(user: AuthenticatedUser, body: {
        clause: string;
        issue: string;
    }): Promise<{
        success: boolean;
        fix: {
            original: string;
            improved: string;
            explanation: string;
            confidence: number;
        };
        tokensUsed: number;
        duration: number;
    }>;
    checkCompliance(user: AuthenticatedUser, body: {
        contractText: string;
        contractId?: string;
    }): Promise<{
        success: boolean;
        check: {
            compliant: boolean;
            issues: {
                category: "GST" | "Labor" | "DataProtection" | "Unfair" | "Tax" | "Other";
                severity: "low" | "medium" | "high" | "critical";
                issue: string;
                solution: string;
            }[];
            overallRisk: "low" | "medium" | "high" | "critical";
        };
        tokensUsed: number;
        duration: number;
    }>;
    getTokenStats(user: AuthenticatedUser): {
        averageTokensPerRequest: number;
        successRate: number;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalRequests: number;
        failedRequests: number;
    };
    getResults(user: AuthenticatedUser, contractId: string): Promise<{
        contractId: string;
        analyses: ({
            riskFindings: {
                id: string;
                createdAt: Date;
                title: string;
                analysisId: string;
                severity: import("../../../generated/prisma/enums").RiskLevel;
                clause: string;
                impact: string;
                suggestion: string;
                legalRef: string | null;
                estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            status: import("../../../generated/prisma/enums").AnalysisStatus;
            contractId: string;
            type: import("../../../generated/prisma/enums").AnalysisType;
            tokensUsed: number;
            modelUsed: string | null;
            processingMs: number | null;
            errorMessage: string | null;
            retryCount: number;
            startedAt: Date | null;
            completedAt: Date | null;
        })[];
    }>;
    getSuggestions(user: AuthenticatedUser, contractId: string): Promise<{
        contractId: string;
        suggestions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            contractId: string;
            type: import("../../../generated/prisma/enums").ClauseType;
            section: string | null;
            originalText: string;
            suggestedText: string | null;
            riskLevel: import("../../../generated/prisma/enums").RiskLevel;
            riskReason: string | null;
            estimatedImpact: import("@prisma/client-runtime-utils").Decimal | null;
            impactPeriod: string | null;
            isAccepted: boolean;
        }[];
    }>;
    getQueueStats(user: AuthenticatedUser): Promise<{
        queue: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
        };
        workers: {
            count: number;
            isPaused: boolean;
        };
        timestamp: string;
        error?: undefined;
    } | {
        queue: {
            waiting: number;
            active: number;
            completed: number;
            failed: number;
            delayed: number;
        };
        workers: {
            count: number;
            isPaused: boolean;
        };
        error: string;
        timestamp?: undefined;
    }>;
    getAnalysisStatus(user: AuthenticatedUser, analysisId: string): Promise<{
        id: string;
        status: import("../../../generated/prisma/enums").AnalysisStatus;
        type: import("../../../generated/prisma/enums").AnalysisType;
        startedAt: Date | null;
        completedAt: Date | null;
        tokensUsed: number;
        processingMs: number | null;
        errorMessage: string | null;
        retryCount: number;
        riskFindings: {
            id: string;
            createdAt: Date;
            title: string;
            analysisId: string;
            severity: import("../../../generated/prisma/enums").RiskLevel;
            clause: string;
            impact: string;
            suggestion: string;
            legalRef: string | null;
            estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
    }>;
    cancelAnalysis(user: AuthenticatedUser, analysisId: string): Promise<{
        message: string;
    }>;
}
