import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AnalysisStatus, AnalysisType } from 'generated/prisma/client';
export declare class AiOrchestratorService {
    private readonly prisma;
    private readonly analysisQueue;
    private readonly dlqQueue;
    private readonly logger;
    private readonly aiEngine;
    constructor(prisma: PrismaService, analysisQueue: Queue, dlqQueue: Queue);
    triggerAnalysis(tenantId: string, contractId: string): Promise<{
        message: string;
        analysisId: string;
        status: string;
    }>;
    analyzeContractDirect(contractId: string, contractText: string): Promise<{
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
    generateClauseFixDirect(clause: string, issue: string): Promise<{
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
    checkComplianceDirect(contractText: string, contractId?: string): Promise<{
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
    getTokenStats(): {
        averageTokensPerRequest: number;
        successRate: number;
        totalPromptTokens: number;
        totalCompletionTokens: number;
        totalRequests: number;
        failedRequests: number;
    };
    getAnalysisResults(tenantId: string, contractId: string): Promise<{
        contractId: string;
        analyses: ({
            riskFindings: {
                id: string;
                createdAt: Date;
                clause: string;
                severity: import("generated/prisma/client").RiskLevel;
                analysisId: string;
                title: string;
                impact: string;
                suggestion: string;
                legalRef: string | null;
                estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
            }[];
        } & {
            id: string;
            contractId: string;
            type: AnalysisType;
            status: AnalysisStatus;
            tokensUsed: number;
            modelUsed: string | null;
            processingMs: number | null;
            errorMessage: string | null;
            retryCount: number;
            startedAt: Date | null;
            completedAt: Date | null;
            createdAt: Date;
        })[];
    }>;
    getSuggestions(tenantId: string, contractId: string): Promise<{
        contractId: string;
        suggestions: {
            id: string;
            contractId: string;
            type: import("generated/prisma/client").ClauseType;
            createdAt: Date;
            section: string | null;
            originalText: string;
            suggestedText: string | null;
            riskLevel: import("generated/prisma/client").RiskLevel;
            riskReason: string | null;
            estimatedImpact: import("@prisma/client-runtime-utils").Decimal | null;
            impactPeriod: string | null;
            isAccepted: boolean;
            updatedAt: Date;
        }[];
    }>;
    getQueueStats(): Promise<{
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
    getAnalysisStatus(analysisId: string): Promise<{
        id: string;
        status: AnalysisStatus;
        type: AnalysisType;
        startedAt: Date | null;
        completedAt: Date | null;
        tokensUsed: number;
        processingMs: number | null;
        errorMessage: string | null;
        retryCount: number;
        riskFindings: {
            id: string;
            createdAt: Date;
            clause: string;
            severity: import("generated/prisma/client").RiskLevel;
            analysisId: string;
            title: string;
            impact: string;
            suggestion: string;
            legalRef: string | null;
            estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
    }>;
    cancelAnalysis(analysisId: string): Promise<{
        message: string;
    }>;
    adminRetryJob(tenantId: string, jobId: string): Promise<{
        message: string;
        originalJobId: string;
        newJobId: string | undefined;
        contractId: string;
        status: string;
    }>;
    adminGetDLQJobs(tenantId: string): Promise<{
        count: number;
        jobs: {
            jobId: string;
            contractId: string;
            userId: string;
            error: string;
            attempts: number;
            maxAttempts: number;
            failedAt: Date;
        }[];
    }>;
}
