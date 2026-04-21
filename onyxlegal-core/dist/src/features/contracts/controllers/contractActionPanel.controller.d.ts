import { RiskFormatterService, RiskSummary } from '../services/riskFormatter.service';
import { ContractFixService, FixResult, BulkFixResult } from '../services/contractFix.service';
import { ContractHistoryService, VersionTimeline, VersionInfo } from '../services/contractHistory.service';
import { PrismaService } from '../../../database/prisma.service';
export interface UserContext {
    id: string;
    tenantId: string;
}
export interface ContractActionResponse {
    contractId: string;
    title: string;
    status: string;
    riskScore: number;
    riskSummary: RiskSummary;
    progress: {
        pendingFixes: number;
        fixedCount: number;
        progressPercent: number;
    };
    actionItems: Array<{
        id: string;
        severity: string;
        action: string;
        estimatedTime: string;
    }>;
}
export declare class ContractActionPanelController {
    private prisma;
    private riskFormatter;
    private contractFix;
    private contractHistory;
    private logger;
    constructor(prisma: PrismaService, riskFormatter: RiskFormatterService, contractFix: ContractFixService, contractHistory: ContractHistoryService);
    getActionPanel(contractId: string, body: {
        tenantId: string;
        userId: string;
    }): Promise<ContractActionResponse>;
    getRiskSummary(contractId: string, body: {
        tenantId: string;
    }): Promise<RiskSummary>;
    applySingleFix(contractId: string, clauseId: string, body: {
        tenantId: string;
        userId: string;
    }): Promise<FixResult & {
        newRiskScore: number;
    }>;
    applyBulkFixes(contractId: string, body: {
        tenantId: string;
        userId: string;
        riskLevels?: string[];
    }): Promise<BulkFixResult>;
    undoFixes(contractId: string, body: {
        tenantId: string;
        userId: string;
        versionNumber?: number;
    }): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
    getVersionHistory(contractId: string, body: {
        tenantId: string;
    }): Promise<VersionTimeline>;
    restoreVersion(contractId: string, versionNumber: number, body: {
        tenantId: string;
        userId: string;
    }): Promise<VersionInfo>;
    getProgress(contractId: string, body: {
        tenantId: string;
    }): Promise<{
        contractId: string;
        totalClauses: number;
        fixedClauses: number;
        pendingFixes: number;
        criticalPending: number;
        progressPercent: number;
        fixingComplete: boolean;
        readyForReview: boolean;
    }>;
    private buildActionItems;
}
