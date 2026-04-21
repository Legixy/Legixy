import { PrismaService } from '../../../database/prisma.service';
import { RiskLevel } from '@prisma/client';
export interface ClauseFixRequest {
    contractId: string;
    clauseId: string;
    tenantId: string;
    userId: string;
}
export interface BulkFixRequest {
    contractId: string;
    tenantId: string;
    userId: string;
    riskLevels?: RiskLevel[];
}
export interface FixResult {
    success: boolean;
    clauseId: string;
    originalText: string;
    fixedText: string;
    changeType: 'improvement' | 'mitigation' | 'removal';
    estimatedImpactReduction: number;
}
export interface BulkFixResult {
    contractId: string;
    totalClauses: number;
    appliedFixes: number;
    skippedClauses: number;
    riskReductionPercent: number;
    estimatedSavings: number;
    results: FixResult[];
    versionNumber: number;
}
export declare class ContractFixService {
    private prisma;
    private logger;
    constructor(prisma: PrismaService);
    applySingleFix(req: ClauseFixRequest): Promise<FixResult>;
    applyBulkFixes(req: BulkFixRequest): Promise<BulkFixResult>;
    undoFixes(contractId: string, tenantId: string, userId: string, versionNumber?: number): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
    getFixStats(contractId: string, tenantId: string): Promise<{
        totalClauses: number;
        fixedClauses: number;
        pendingFixes: number;
        criticalPending: number;
        fixingProgress: number;
        currentVersion: number;
        lastModified: Date;
    }>;
    private replaceClauseInContent;
    private determineChangeType;
    private calculateRiskReduction;
    private calculateSavings;
}
