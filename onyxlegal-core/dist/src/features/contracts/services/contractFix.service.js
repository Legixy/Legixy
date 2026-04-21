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
var ContractFixService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractFixService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let ContractFixService = ContractFixService_1 = class ContractFixService {
    prisma;
    logger = new common_1.Logger(ContractFixService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async applySingleFix(req) {
        this.logger.debug(`Applying fix to clause ${req.clauseId} in contract ${req.contractId}`);
        const contract = await this.prisma.contract.findUnique({
            where: { id: req.contractId },
            include: { clauses: true },
        });
        if (!contract) {
            throw new common_1.BadRequestException('Contract not found');
        }
        if (contract.tenantId !== req.tenantId) {
            throw new common_1.BadRequestException('Unauthorized: Contract belongs to different tenant');
        }
        if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
            throw new common_1.BadRequestException('Cannot modify signed or active contract');
        }
        const clause = await this.prisma.clause.findUnique({
            where: { id: req.clauseId },
        });
        if (!clause) {
            throw new common_1.BadRequestException('Clause not found');
        }
        if (!clause.suggestedText) {
            throw new common_1.BadRequestException('No AI-suggested fix available for this clause');
        }
        if (clause.contractId !== req.contractId) {
            throw new common_1.BadRequestException('Clause does not belong to this contract');
        }
        const originalText = clause.originalText;
        const fixedText = clause.suggestedText;
        const updatedClause = await this.prisma.clause.update({
            where: { id: req.clauseId },
            data: {
                originalText: fixedText,
                isAccepted: true,
                updatedAt: new Date(),
            },
        });
        const updatedContractContent = this.replaceClauseInContent(contract.content || '', originalText, fixedText);
        const latestVersion = await this.prisma.contractVersion.findMany({
            where: { contractId: req.contractId },
            orderBy: { version: 'desc' },
            take: 1,
        });
        const nextVersion = (latestVersion[0]?.version || 0) + 1;
        await this.prisma.contractVersion.create({
            data: {
                contractId: req.contractId,
                version: nextVersion,
                content: updatedContractContent,
                changeNote: `Applied AI fix to ${clause.type} clause`,
                changedBy: req.userId,
            },
        });
        await this.prisma.contract.update({
            where: { id: req.contractId },
            data: {
                content: updatedContractContent,
                updatedAt: new Date(),
            },
        });
        const riskReduction = this.calculateRiskReduction(clause.riskLevel);
        return {
            success: true,
            clauseId: req.clauseId,
            originalText,
            fixedText,
            changeType: this.determineChangeType(clause.type),
            estimatedImpactReduction: riskReduction,
        };
    }
    async applyBulkFixes(req) {
        this.logger.debug(`Applying bulk fixes to contract ${req.contractId}`);
        const contract = await this.prisma.contract.findUnique({
            where: { id: req.contractId },
            include: { clauses: true },
        });
        if (!contract) {
            throw new common_1.BadRequestException('Contract not found');
        }
        if (contract.tenantId !== req.tenantId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
            throw new common_1.BadRequestException('Cannot modify signed contract');
        }
        let clausesToFix = contract.clauses.filter((c) => c.suggestedText && !c.isAccepted);
        if (req.riskLevels && req.riskLevels.length > 0) {
            clausesToFix = clausesToFix.filter((c) => req.riskLevels.includes(c.riskLevel));
        }
        this.logger.debug(`Found ${clausesToFix.length} clauses to fix`);
        const results = [];
        let updatedContent = contract.content || '';
        let totalRiskReduction = 0;
        for (const clause of clausesToFix) {
            try {
                const result = await this.applySingleFix({
                    contractId: req.contractId,
                    clauseId: clause.id,
                    tenantId: req.tenantId,
                    userId: req.userId,
                });
                results.push(result);
                totalRiskReduction += result.estimatedImpactReduction;
            }
            catch (error) {
                this.logger.warn(`Failed to fix clause ${clause.id}: ${error.message}`);
            }
        }
        const newRiskScore = Math.max(0, (contract.riskScore || 100) - totalRiskReduction);
        const updatedContract = await this.prisma.contract.update({
            where: { id: req.contractId },
            data: {
                status: 'IN_REVIEW',
                riskScore: Math.round(newRiskScore),
                lastReviewedAt: new Date(),
            },
        });
        const versionData = await this.prisma.contractVersion.findMany({
            where: { contractId: req.contractId },
            orderBy: { version: 'desc' },
            take: 1,
        });
        const versionNumber = (versionData[0]?.version || 0) + 1;
        return {
            contractId: req.contractId,
            totalClauses: contract.clauses.length,
            appliedFixes: results.length,
            skippedClauses: contract.clauses.length - results.length,
            riskReductionPercent: totalRiskReduction,
            estimatedSavings: this.calculateSavings(totalRiskReduction, contract.contractValue ? Number(contract.contractValue) : undefined),
            results,
            versionNumber,
        };
    }
    async undoFixes(contractId, tenantId, userId, versionNumber) {
        this.logger.debug(`Undoing fixes for contract ${contractId}`);
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const targetVersion = versionNumber
            ? versionNumber
            : Math.max(1, (contract.updatedAt ? new Date(contract.updatedAt).getTime() : 0));
        const previousVersion = await this.prisma.contractVersion.findFirst({
            where: { contractId },
            orderBy: { version: 'desc' },
            skip: 1,
        });
        if (!previousVersion) {
            throw new common_1.BadRequestException('No previous version available');
        }
        await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                content: previousVersion.content,
                updatedAt: new Date(),
            },
        });
        await this.prisma.clause.updateMany({
            where: { contractId, isAccepted: true },
            data: { isAccepted: false },
        });
        this.logger.log(`Restored contract ${contractId} to version ${previousVersion.version}`);
        return {
            success: true,
            restoredVersion: previousVersion.version,
        };
    }
    async getFixStats(contractId, tenantId) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
            include: {
                clauses: true,
                versions: { orderBy: { version: 'desc' }, take: 1 },
            },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Unauthorized');
        }
        const totalClauses = contract.clauses.length;
        const fixedClauses = contract.clauses.filter((c) => c.isAccepted).length;
        const pendingFixes = contract.clauses.filter((c) => c.suggestedText && !c.isAccepted).length;
        const criticalPending = contract.clauses.filter((c) => c.suggestedText && !c.isAccepted && (c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH')).length;
        return {
            totalClauses,
            fixedClauses,
            pendingFixes,
            criticalPending,
            fixingProgress: Math.round((fixedClauses / totalClauses) * 100),
            currentVersion: contract.versions[0]?.version || 0,
            lastModified: contract.updatedAt,
        };
    }
    replaceClauseInContent(content, original, replacement) {
        return content.replace(original, replacement);
    }
    determineChangeType(clauseType) {
        if (clauseType === 'LIABILITY' || clauseType === 'INDEMNIFICATION') {
            return 'mitigation';
        }
        if (clauseType === 'IP_OWNERSHIP' || clauseType === 'DATA_PROTECTION') {
            return 'improvement';
        }
        return 'improvement';
    }
    calculateRiskReduction(riskLevel) {
        const reductionMap = {
            SAFE: 0,
            LOW: 5,
            MEDIUM: 15,
            HIGH: 30,
            CRITICAL: 40,
        };
        return reductionMap[riskLevel] || 0;
    }
    calculateSavings(riskReductionPercent, contractValue) {
        if (!contractValue)
            return 0;
        const value = typeof contractValue === 'string' ? parseFloat(contractValue) : contractValue;
        return Math.round(value * (riskReductionPercent / 100) * 0.5);
    }
};
exports.ContractFixService = ContractFixService;
exports.ContractFixService = ContractFixService = ContractFixService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractFixService);
//# sourceMappingURL=contractFix.service.js.map