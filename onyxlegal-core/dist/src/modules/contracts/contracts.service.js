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
var ContractsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("../../../generated/prisma/client");
let ContractsService = ContractsService_1 = class ContractsService {
    prisma;
    logger = new common_1.Logger(ContractsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    validTransitions = {
        DRAFT: [client_1.ContractStatus.IN_REVIEW, client_1.ContractStatus.TERMINATED],
        IN_REVIEW: [client_1.ContractStatus.SENT, client_1.ContractStatus.DRAFT, client_1.ContractStatus.TERMINATED],
        SENT: [client_1.ContractStatus.SIGNED, client_1.ContractStatus.IN_REVIEW, client_1.ContractStatus.TERMINATED],
        SIGNED: [client_1.ContractStatus.ACTIVE, client_1.ContractStatus.TERMINATED],
        ACTIVE: [client_1.ContractStatus.EXPIRED, client_1.ContractStatus.TERMINATED],
        EXPIRED: [client_1.ContractStatus.TERMINATED],
        TERMINATED: [],
    };
    async create(tenantId, userId, dto) {
        const contract = await this.prisma.contract.create({
            data: {
                tenantId,
                createdById: userId,
                title: dto.title,
                templateId: dto.templateId || null,
                content: dto.content || null,
                parties: dto.parties ? JSON.parse(JSON.stringify(dto.parties)) : [],
                contractValue: dto.contractValue
                    ? new client_1.Prisma.Decimal(dto.contractValue)
                    : null,
                currency: dto.currency || 'INR',
                effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
                expirationDate: dto.expirationDate
                    ? new Date(dto.expirationDate)
                    : null,
            },
            include: {
                template: { select: { id: true, name: true, category: true } },
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
        if (dto.content) {
            await this.prisma.contractVersion.create({
                data: {
                    contractId: contract.id,
                    version: 1,
                    content: dto.content,
                    changeNote: 'Initial draft',
                    changedBy: userId,
                },
            });
        }
        if (dto.templateId) {
            await this.prisma.template.update({
                where: { id: dto.templateId },
                data: { usageCount: { increment: 1 } },
            });
        }
        this.logger.log(`Contract "${dto.title}" created by user ${userId}`);
        return contract;
    }
    async findAll(tenantId, query) {
        const { status, search, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const where = {
            tenantId,
            ...(status && { status: status }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [contracts, total] = await Promise.all([
            this.prisma.contract.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    template: { select: { id: true, name: true, category: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                    clauses: {
                        select: { id: true, type: true, riskLevel: true },
                    },
                    _count: { select: { analyses: true } },
                },
            }),
            this.prisma.contract.count({ where }),
        ]);
        return {
            data: contracts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(tenantId, id) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
            include: {
                template: { select: { id: true, name: true, category: true } },
                createdBy: { select: { id: true, name: true, email: true } },
                clauses: { orderBy: { createdAt: 'asc' } },
                analyses: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        riskFindings: true,
                    },
                },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 10,
                    select: {
                        id: true,
                        version: true,
                        changeNote: true,
                        changedBy: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!contract) {
            throw new common_1.NotFoundException(`Contract ${id} not found`);
        }
        return contract;
    }
    async update(tenantId, id, userId, dto) {
        const existing = await this.prisma.contract.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Contract ${id} not found`);
        }
        const updateData = {};
        if (dto.title)
            updateData.title = dto.title;
        if (dto.content)
            updateData.content = dto.content;
        if (dto.parties)
            updateData.parties = JSON.parse(JSON.stringify(dto.parties));
        if (dto.contractValue !== undefined) {
            updateData.contractValue = new client_1.Prisma.Decimal(dto.contractValue);
        }
        if (dto.effectiveDate)
            updateData.effectiveDate = new Date(dto.effectiveDate);
        if (dto.expirationDate)
            updateData.expirationDate = new Date(dto.expirationDate);
        updateData.lastReviewedAt = new Date();
        const contract = await this.prisma.contract.update({
            where: { id },
            data: updateData,
            include: {
                template: { select: { id: true, name: true, category: true } },
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
        if (dto.content) {
            const latestVersion = await this.prisma.contractVersion.findFirst({
                where: { contractId: id },
                orderBy: { version: 'desc' },
            });
            await this.prisma.contractVersion.create({
                data: {
                    contractId: id,
                    version: (latestVersion?.version || 0) + 1,
                    content: dto.content,
                    changeNote: dto.changeNote || 'Updated',
                    changedBy: userId,
                },
            });
        }
        this.logger.log(`Contract ${id} updated by user ${userId}`);
        return contract;
    }
    async updateStatus(tenantId, id, dto) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
        });
        if (!contract) {
            throw new common_1.NotFoundException(`Contract ${id} not found`);
        }
        const newStatus = dto.status;
        const allowed = this.validTransitions[contract.status];
        if (!allowed.includes(newStatus)) {
            throw new common_1.BadRequestException(`Cannot transition from ${contract.status} to ${newStatus}. ` +
                `Allowed: ${allowed.join(', ') || 'none'}`);
        }
        const updateData = { status: newStatus };
        if (newStatus === client_1.ContractStatus.SIGNED) {
            updateData.signedAt = new Date();
        }
        return this.prisma.contract.update({
            where: { id },
            data: updateData,
        });
    }
    async acceptClauseFix(tenantId, contractId, clauseId) {
        const contract = await this.prisma.contract.findFirst({
            where: { id: contractId, tenantId },
        });
        if (!contract)
            throw new common_1.NotFoundException('Contract not found');
        const clause = await this.prisma.clause.findFirst({
            where: { id: clauseId, contractId },
        });
        if (!clause)
            throw new common_1.NotFoundException('Clause not found');
        if (!clause.suggestedText) {
            throw new common_1.BadRequestException('No AI suggestion available for this clause');
        }
        return this.prisma.clause.update({
            where: { id: clauseId },
            data: {
                originalText: clause.suggestedText,
                isAccepted: true,
                riskLevel: 'SAFE',
                riskReason: 'AI suggestion accepted by user',
            },
        });
    }
    async getDashboardStats(tenantId) {
        const [totalContracts, activeContracts, draftContracts, highRiskCount, recentAnalyses,] = await Promise.all([
            this.prisma.contract.count({ where: { tenantId } }),
            this.prisma.contract.count({
                where: { tenantId, status: client_1.ContractStatus.ACTIVE },
            }),
            this.prisma.contract.count({
                where: { tenantId, status: client_1.ContractStatus.DRAFT },
            }),
            this.prisma.clause.count({
                where: {
                    contract: { tenantId },
                    riskLevel: { in: ['HIGH', 'CRITICAL'] },
                },
            }),
            this.prisma.aIAnalysis.count({
                where: {
                    contract: { tenantId },
                    status: 'COMPLETED',
                    completedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
        return {
            totalContracts,
            activeContracts,
            draftContracts,
            highRiskClauses: highRiskCount,
            analysesThisMonth: recentAnalyses,
        };
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = ContractsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map