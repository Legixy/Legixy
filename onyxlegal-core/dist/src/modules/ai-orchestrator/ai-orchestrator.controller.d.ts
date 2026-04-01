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
    getResults(user: AuthenticatedUser, contractId: string): Promise<{
        contractId: string;
        analyses: ({
            riskFindings: {
                id: string;
                createdAt: Date;
                title: string;
                clause: string;
                severity: import("../../../generated/prisma/enums").RiskLevel;
                analysisId: string;
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
}
