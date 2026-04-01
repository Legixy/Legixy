import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dashboard impact metrics — matches the AI Impact Banner on frontend.
   */
  async getDashboardMetrics(tenantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalContracts,
      activeContracts,
      highRiskClauses,
      resolvedClauses,
      totalAnalyses,
      tenant,
    ] = await Promise.all([
      this.prisma.contract.count({ where: { tenantId } }),
      this.prisma.contract.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      this.prisma.clause.count({
        where: {
          contract: { tenantId },
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
          isAccepted: false,
        },
      }),
      this.prisma.clause.count({
        where: {
          contract: { tenantId },
          isAccepted: true,
        },
      }),
      this.prisma.aIAnalysis.count({
        where: {
          contract: { tenantId },
          status: 'COMPLETED',
          completedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { aiTokensUsed: true, aiTokenLimit: true, plan: true },
      }),
    ]);

    // Estimated cost savings (each resolved clause saves ~₹5000 in legal review)
    const costSaved = resolvedClauses * 5000;

    // Risk reduction percentage
    const totalClauses = highRiskClauses + resolvedClauses;
    const riskReduced = totalClauses > 0
      ? Math.round((resolvedClauses / totalClauses) * 100)
      : 0;

    // Time saved (each analysis saves ~30 minutes of manual review)
    const timeSavedHours = Math.round((totalAnalyses * 30) / 60);

    return {
      costSaved,
      costSavedFormatted: costSaved >= 100000
        ? `₹${(costSaved / 100000).toFixed(1)}L`
        : `₹${(costSaved / 1000).toFixed(0)}K`,
      riskReduced,
      timeSavedHours,
      totalContracts,
      activeContracts,
      highRiskClauses,
      resolvedClauses,
      analysesThisMonth: totalAnalyses,
      aiUsage: tenant
        ? {
            tokensUsed: tenant.aiTokensUsed,
            tokenLimit: tenant.aiTokenLimit,
            plan: tenant.plan,
          }
        : null,
    };
  }

  /**
   * Risk distribution across all contracts.
   */
  async getRiskOverview(tenantId: string) {
    const distribution = await this.prisma.clause.groupBy({
      by: ['riskLevel'],
      where: { contract: { tenantId } },
      _count: true,
    });

    const byType = await this.prisma.clause.groupBy({
      by: ['type'],
      where: {
        contract: { tenantId },
        riskLevel: { in: ['HIGH', 'CRITICAL'] },
      },
      _count: true,
      orderBy: { _count: { type: 'desc' } },
    });

    return { distribution, riskByClauseType: byType };
  }
}
