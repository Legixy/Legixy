"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardMetrics(tenantId) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [totalContracts, activeContracts, highRiskClauses, resolvedClauses, totalAnalyses, tenant,] = await Promise.all([
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
        const costSaved = resolvedClauses * 5000;
        const totalClauses = highRiskClauses + resolvedClauses;
        const riskReduced = totalClauses > 0
            ? Math.round((resolvedClauses / totalClauses) * 100)
            : 0;
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
    async getRiskOverview(tenantId) {
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map