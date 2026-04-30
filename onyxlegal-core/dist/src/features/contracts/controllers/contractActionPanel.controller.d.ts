import { RiskFormatterService, RiskSummary } from '../services/riskFormatter.service';
import { ContractFixService, FixResult, BulkFixResult } from '../services/contractFix.service';
import { ContractHistoryService, VersionTimeline, VersionInfo } from '../services/contractHistory.service';
import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../../modules/auth/jwt.strategy';
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
    getActionPanel(user: AuthenticatedUser, contractId: string): Promise<ContractActionResponse>;
    getRiskSummary(user: AuthenticatedUser, contractId: string): Promise<RiskSummary>;
    applySingleFix(user: AuthenticatedUser, contractId: string, clauseId: string, body: {
        riskLevels?: string[];
    }): Promise<FixResult & {
        newRiskScore: number;
    }>;
    applyBulkFixes(user: AuthenticatedUser, contractId: string, body: {
        riskLevels?: string[];
    }): Promise<BulkFixResult>;
    undoFixes(user: AuthenticatedUser, contractId: string, body: {
        versionNumber?: number;
    }): Promise<{
        success: boolean;
        restoredVersion: number;
    }>;
    getVersionHistory(user: AuthenticatedUser, contractId: string): Promise<VersionTimeline>;
    restoreVersion(user: AuthenticatedUser, contractId: string, versionNumber: number): Promise<VersionInfo>;
    getProgress(user: AuthenticatedUser, contractId: string): Promise<{
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
