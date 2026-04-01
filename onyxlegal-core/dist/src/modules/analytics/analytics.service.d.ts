import { PrismaService } from '../../database/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getDashboardMetrics(tenantId: string): Promise<{
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
    getRiskOverview(tenantId: string): Promise<{
        distribution: (import("../../../generated/prisma/internal/prismaNamespace").PickEnumerable<import("../../../generated/prisma/models").ClauseGroupByOutputType, "riskLevel"[]> & {
            _count: number;
        })[];
        riskByClauseType: (import("../../../generated/prisma/internal/prismaNamespace").PickEnumerable<import("../../../generated/prisma/models").ClauseGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
    }>;
}
