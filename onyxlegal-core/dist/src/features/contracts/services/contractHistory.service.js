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
var ContractHistoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractHistoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
let ContractHistoryService = ContractHistoryService_1 = class ContractHistoryService {
    prisma;
    logger = new common_1.Logger(ContractHistoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createVersion(contractId, content, changeNote, userId) {
        this.logger.debug(`Creating version for contract ${contractId}`);
        const maxVersion = await this.prisma.contractVersion.findMany({
            where: { contractId },
            orderBy: { version: 'desc' },
            take: 1,
        });
        const nextVersion = (maxVersion[0]?.version || 0) + 1;
        const version = await this.prisma.contractVersion.create({
            data: {
                contractId,
                version: nextVersion,
                content,
                changeNote: changeNote || `Version ${nextVersion}`,
                changedBy: userId,
            },
        });
        this.logger.log(`Created version ${nextVersion} for contract ${contractId}: "${changeNote}"`);
        return this.toVersionInfo(version);
    }
    async getHistory(contractId, tenantId) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId },
            orderBy: { version: 'desc' },
        });
        const currentVersion = versions.length > 0 ? versions[0].version : await this.getLatestVersionNumber(contractId);
        return {
            versions: versions.map((v) => this.toVersionInfo(v)),
            currentVersion,
            totalVersions: versions.length,
        };
    }
    async restoreVersion(contractId, versionNumber, tenantId, userId) {
        this.logger.debug(`Restoring contract ${contractId} to version ${versionNumber}`);
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        const targetVersion = await this.prisma.contractVersion.findUnique({
            where: {
                contractId_version: {
                    contractId,
                    version: versionNumber,
                },
            },
        });
        if (!targetVersion) {
            throw new common_1.NotFoundException(`Version ${versionNumber} not found`);
        }
        await this.prisma.contract.update({
            where: { id: contractId },
            data: {
                content: targetVersion.content,
                updatedAt: new Date(),
            },
        });
        const newVersion = await this.createVersion(contractId, targetVersion.content, `Restored from version ${versionNumber}`, userId);
        this.logger.log(`Restored contract ${contractId} to version ${versionNumber}`);
        return newVersion;
    }
    async compareVersions(contractId, fromVersion, toVersion, tenantId) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        const from = await this.prisma.contractVersion.findUnique({
            where: {
                contractId_version: {
                    contractId,
                    version: fromVersion,
                },
            },
        });
        const to = await this.prisma.contractVersion.findUnique({
            where: {
                contractId_version: {
                    contractId,
                    version: toVersion,
                },
            },
        });
        if (!from || !to) {
            throw new common_1.NotFoundException('One or both versions not found');
        }
        const fromLines = (from.content || '').split('\n');
        const toLines = (to.content || '').split('\n');
        const additions = toLines.filter((line) => !fromLines.includes(line));
        const deletions = fromLines.filter((line) => !toLines.includes(line));
        return {
            from: this.toVersionInfo(from),
            to: this.toVersionInfo(to),
            additions,
            deletions,
            changes: this.extractChanges(from.content || '', to.content || ''),
        };
    }
    async getVersionChanges(contractId, versionNumber, tenantId) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        const version = await this.prisma.contractVersion.findUnique({
            where: {
                contractId_version: {
                    contractId,
                    version: versionNumber,
                },
            },
        });
        if (!version) {
            throw new common_1.NotFoundException(`Version ${versionNumber} not found`);
        }
        const previousVersion = await this.prisma.contractVersion.findFirst({
            where: { contractId, version: { lt: versionNumber } },
            orderBy: { version: 'desc' },
        });
        const changes = previousVersion
            ? this.calculateChanges(previousVersion.content || '', version.content || '')
            : [`Version ${versionNumber} created`];
        const impactedClauses = await this.prisma.clause.findMany({
            where: { contractId },
            select: { type: true, riskLevel: true },
            distinct: ['type'],
        });
        return {
            version: this.toVersionInfo(version),
            changes,
            impactedClauses: impactedClauses.map((c) => `${c.type} (${c.riskLevel})`),
        };
    }
    async getRecentChanges(contractId, tenantId, limit = 10) {
        const contract = await this.prisma.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract || contract.tenantId !== tenantId) {
            throw new common_1.BadRequestException('Contract not found or unauthorized');
        }
        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId },
            orderBy: { version: 'desc' },
            take: limit,
        });
        return versions.map((v, index) => {
            let summary = v.changeNote || `Version ${v.version}`;
            if (!v.changeNote && index < versions.length - 1) {
                const prev = versions[index + 1];
                const changes = this.calculateChanges(prev.content || '', v.content || '');
                summary = changes.length > 0 ? `${changes.length} changes made` : 'No changes';
            }
            return {
                version: v.version,
                changeNote: v.changeNote,
                changedAt: v.createdAt,
                changedBy: v.changedBy,
                summary,
            };
        });
    }
    async archiveOldVersions(contractId, keepCount = 50) {
        const versions = await this.prisma.contractVersion.findMany({
            where: { contractId },
            orderBy: { version: 'desc' },
            skip: keepCount,
            select: { id: true },
        });
        if (versions.length === 0) {
            return 0;
        }
        const result = await this.prisma.contractVersion.deleteMany({
            where: { id: { in: versions.map((v) => v.id) } },
        });
        this.logger.log(`Archived ${result.count} old versions for contract ${contractId}`);
        return result.count;
    }
    toVersionInfo(version) {
        return {
            version: version.version,
            content: version.content,
            changeNote: version.changeNote,
            changedBy: version.changedBy,
            createdAt: version.createdAt,
        };
    }
    async getLatestVersionNumber(contractId) {
        const latest = await this.prisma.contractVersion.findFirst({
            where: { contractId },
            orderBy: { version: 'desc' },
            take: 1,
            select: { version: true },
        });
        return latest?.version || 1;
    }
    calculateChanges(beforeContent, afterContent) {
        if (beforeContent === afterContent) {
            return [];
        }
        const changes = [];
        const beforeLines = beforeContent.split('\n').length;
        const afterLines = afterContent.split('\n').length;
        if (afterLines > beforeLines) {
            changes.push(`Added ${afterLines - beforeLines} lines`);
        }
        else if (beforeLines > afterLines) {
            changes.push(`Removed ${beforeLines - afterLines} lines`);
        }
        const clauseKeywords = [
            'Liability',
            'Payment',
            'Termination',
            'IP',
            'Confidentiality',
            'Governing Law',
        ];
        for (const keyword of clauseKeywords) {
            const beforeHas = beforeContent.includes(keyword);
            const afterHas = afterContent.includes(keyword);
            if (beforeHas && !afterHas) {
                changes.push(`Removed ${keyword} clause`);
            }
            else if (!beforeHas && afterHas) {
                changes.push(`Added ${keyword} clause`);
            }
            else if (beforeHas && afterHas) {
                const beforeSection = this.extractSection(beforeContent, keyword);
                const afterSection = this.extractSection(afterContent, keyword);
                if (beforeSection !== afterSection) {
                    changes.push(`Modified ${keyword} clause`);
                }
            }
        }
        return changes.length > 0 ? changes : ['Content updated'];
    }
    extractSection(content, keyword) {
        const lines = content.split('\n');
        const start = lines.findIndex((l) => l.includes(keyword));
        if (start === -1)
            return '';
        return lines.slice(start, start + 5).join('\n');
    }
    extractChanges(beforeContent, afterContent) {
        return [];
    }
};
exports.ContractHistoryService = ContractHistoryService;
exports.ContractHistoryService = ContractHistoryService = ContractHistoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractHistoryService);
//# sourceMappingURL=contractHistory.service.js.map