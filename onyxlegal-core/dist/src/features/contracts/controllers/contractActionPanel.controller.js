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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ContractActionPanelController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractActionPanelController = void 0;
const common_1 = require("@nestjs/common");
const riskFormatter_service_1 = require("../services/riskFormatter.service");
const contractFix_service_1 = require("../services/contractFix.service");
const contractHistory_service_1 = require("../services/contractHistory.service");
const prisma_service_1 = require("../../../database/prisma.service");
let ContractActionPanelController = ContractActionPanelController_1 = class ContractActionPanelController {
    prisma;
    riskFormatter;
    contractFix;
    contractHistory;
    logger = new common_1.Logger(ContractActionPanelController_1.name);
    constructor(prisma, riskFormatter, contractFix, contractHistory) {
        this.prisma = prisma;
        this.riskFormatter = riskFormatter;
        this.contractFix = contractFix;
        this.contractHistory = contractHistory;
    }
    async getActionPanel(contractId, body) {
        const user = { id: body.userId, tenantId: body.tenantId };
        this.logger.debug(`Fetching action panel for contract ${contractId} (tenant: ${user.tenantId})`);
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                clauses: true,
            },
        });
        if (!contract || contract.tenantId !== user.tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        const riskSummary = this.riskFormatter.summarizeRisks(contract.clauses.map((c) => ({
            level: c.riskLevel,
            title: c.type,
            reason: c.riskReason || '',
            suggestion: c.suggestedText || '',
            impact: c.estimatedImpact ? Number(c.estimatedImpact) : undefined,
        })));
        const fixStats = await this.contractFix.getFixStats(contractId, user.tenantId);
        const actionItems = this.buildActionItems(riskSummary);
        return {
            contractId,
            title: contract.title,
            status: contract.status,
            riskScore: contract.riskScore || 100,
            riskSummary,
            progress: {
                pendingFixes: fixStats.pendingFixes,
                fixedCount: fixStats.fixedClauses,
                progressPercent: fixStats.fixingProgress,
            },
            actionItems,
        };
    }
    async getRiskSummary(contractId, body) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: { clauses: true },
        });
        if (!contract || contract.tenantId !== body.tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        return this.riskFormatter.summarizeRisks(contract.clauses.map((c) => ({
            level: c.riskLevel,
            title: c.type,
            reason: c.riskReason || '',
            suggestion: c.suggestedText || '',
            impact: c.estimatedImpact ? Number(c.estimatedImpact) : undefined,
        })));
    }
    async applySingleFix(contractId, clauseId, body) {
        this.logger.log(`User ${body.userId} applying fix to clause ${clauseId} in contract ${contractId}`);
        const result = await this.contractFix.applySingleFix({
            contractId,
            clauseId,
            tenantId: body.tenantId,
            userId: body.userId,
        });
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            select: { riskScore: true },
        });
        return {
            ...result,
            newRiskScore: contract?.riskScore || 0,
        };
    }
    async applyBulkFixes(contractId, body) {
        this.logger.log(`User ${body.userId} applying bulk fixes to contract ${contractId}`);
        return this.contractFix.applyBulkFixes({
            contractId,
            tenantId: body.tenantId,
            userId: body.userId,
            riskLevels: body.riskLevels,
        });
    }
    async undoFixes(contractId, body) {
        this.logger.log(`User ${body.userId} undoing fixes on contract ${contractId}`);
        return this.contractFix.undoFixes(contractId, body.tenantId, body.userId, body.versionNumber);
    }
    async getVersionHistory(contractId, body) {
        return this.contractHistory.getHistory(contractId, body.tenantId);
    }
    async restoreVersion(contractId, versionNumber, body) {
        this.logger.log(`User ${body.userId} restoring contract ${contractId} to version ${versionNumber}`);
        return this.contractHistory.restoreVersion(contractId, versionNumber, body.tenantId, body.userId);
    }
    async getProgress(contractId, body) {
        const stats = await this.contractFix.getFixStats(contractId, body.tenantId);
        return {
            contractId,
            totalClauses: stats.totalClauses,
            fixedClauses: stats.fixedClauses,
            pendingFixes: stats.pendingFixes,
            criticalPending: stats.criticalPending,
            progressPercent: stats.fixingProgress,
            fixingComplete: stats.pendingFixes === 0,
            readyForReview: stats.criticalPending === 0,
        };
    }
    buildActionItems(riskSummary) {
        const items = [];
        if (riskSummary.critical > 0) {
            items.push({
                id: 'critical-action',
                severity: 'dealbreaker',
                action: `🚨 CRITICAL: ${riskSummary.critical} clause(s) pose deal-breaking risk. Requires legal review.`,
                estimatedTime: '30 min',
            });
        }
        if (riskSummary.high > 0) {
            items.push({
                id: 'high-action',
                severity: 'fixAsap',
                action: `🔴 Fix ASAP: ${riskSummary.high} high-risk clause(s). Click "Fix All" to apply suggestions.`,
                estimatedTime: '10 min',
            });
        }
        if (riskSummary.medium > 0) {
            items.push({
                id: 'medium-action',
                severity: 'fix',
                action: `🟡 Consider: ${riskSummary.medium} medium-risk clause(s) with suggested improvements.`,
                estimatedTime: '5 min',
            });
        }
        if (riskSummary.fixableSoonCount > 0 && riskSummary.fixableSoonCount > 1) {
            items.push({
                id: 'bulk-fix',
                severity: 'fix',
                action: `⚡ Bulk Fix: Apply all ${riskSummary.fixableSoonCount} suggestions at once (1 click).`,
                estimatedTime: '1 min',
            });
        }
        if (riskSummary.needsLawyerReviewCount > 0) {
            items.push({
                id: 'lawyer-review',
                severity: 'dealbreaker',
                action: `📞 Legal Team: ${riskSummary.needsLawyerReviewCount} item(s) require expert legal review.`,
                estimatedTime: '1-2 days',
            });
        }
        if (items.length === 0) {
            items.push({
                id: 'contract-ready',
                severity: 'ignore',
                action: '✅ Contract looks good! Ready to download, send for signing, or finalize.',
                estimatedTime: '0 min',
            });
        }
        return items;
    }
};
exports.ContractActionPanelController = ContractActionPanelController;
__decorate([
    (0, common_1.Get)(':contractId/action-panel'),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "getActionPanel", null);
__decorate([
    (0, common_1.Get)(':contractId/risk-summary'),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "getRiskSummary", null);
__decorate([
    (0, common_1.Post)(':contractId/fix-clause/:clauseId'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('clauseId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "applySingleFix", null);
__decorate([
    (0, common_1.Post)(':contractId/fix-all'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "applyBulkFixes", null);
__decorate([
    (0, common_1.Post)(':contractId/undo-fixes'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "undoFixes", null);
__decorate([
    (0, common_1.Get)(':contractId/version-history'),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "getVersionHistory", null);
__decorate([
    (0, common_1.Post)(':contractId/restore-version/:versionNumber'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Param)('versionNumber')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "restoreVersion", null);
__decorate([
    (0, common_1.Get)(':contractId/progress'),
    __param(0, (0, common_1.Param)('contractId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractActionPanelController.prototype, "getProgress", null);
exports.ContractActionPanelController = ContractActionPanelController = ContractActionPanelController_1 = __decorate([
    (0, common_1.Controller)('api/contracts'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        riskFormatter_service_1.RiskFormatterService,
        contractFix_service_1.ContractFixService,
        contractHistory_service_1.ContractHistoryService])
], ContractActionPanelController);
//# sourceMappingURL=contractActionPanel.controller.js.map