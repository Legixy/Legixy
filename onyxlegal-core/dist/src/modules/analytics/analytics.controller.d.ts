import { AnalyticsService } from './analytics.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(user: AuthenticatedUser): Promise<{
        costSaved: number;
        costSavedFormatted: string;
        riskReduced: number;
        timeSavedHours: number;
        totalContracts: number;
        activeContracts: number;
        highRiskClauses: number;
        resolvedClauses: number;
        analysesThisMonth: number;
        aiUsage: {
            tokensUsed: number;
            tokenLimit: number;
            plan: import("../../../generated/prisma/enums").Plan;
        } | null;
    }>;
    getRiskOverview(user: AuthenticatedUser): Promise<{
        distribution: (import("../../../generated/prisma/internal/prismaNamespace").PickEnumerable<import("../../../generated/prisma/models").ClauseGroupByOutputType, "riskLevel"[]> & {
            _count: number;
        })[];
        riskByClauseType: (import("../../../generated/prisma/internal/prismaNamespace").PickEnumerable<import("../../../generated/prisma/models").ClauseGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
    }>;
}
