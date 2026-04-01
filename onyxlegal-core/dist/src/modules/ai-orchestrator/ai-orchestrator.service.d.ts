import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AnalysisStatus, AnalysisType } from 'generated/prisma/client';
export declare class AiOrchestratorService {
    private readonly prisma;
    private readonly analysisQueue;
    private readonly logger;
    constructor(prisma: PrismaService, analysisQueue: Queue);
    triggerAnalysis(tenantId: string, contractId: string): Promise<{
        message: string;
        analysisId: string;
        status: string;
    }>;
    getAnalysisResults(tenantId: string, contractId: string): Promise<{
        contractId: string;
        analyses: ({
            riskFindings: {
                id: string;
                createdAt: Date;
                title: string;
                clause: string;
                severity: import("generated/prisma/client").RiskLevel;
                analysisId: string;
                impact: string;
                suggestion: string;
                legalRef: string | null;
                estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            status: AnalysisStatus;
            contractId: string;
            type: AnalysisType;
            tokensUsed: number;
            modelUsed: string | null;
            processingMs: number | null;
            errorMessage: string | null;
            retryCount: number;
            startedAt: Date | null;
            completedAt: Date | null;
        })[];
    }>;
    getSuggestions(tenantId: string, contractId: string): Promise<{
        contractId: string;
        suggestions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            contractId: string;
            type: import("generated/prisma/client").ClauseType;
            section: string | null;
            originalText: string;
            suggestedText: string | null;
            riskLevel: import("generated/prisma/client").RiskLevel;
            riskReason: string | null;
            estimatedImpact: import("@prisma/client-runtime-utils").Decimal | null;
            impactPeriod: string | null;
            isAccepted: boolean;
        }[];
    }>;
}
