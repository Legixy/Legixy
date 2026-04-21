import { PrismaService } from '../../../database/prisma.service';
export interface VersionInfo {
    version: number;
    content: string;
    changeNote: string | null;
    changedBy: string;
    createdAt: Date;
    author?: {
        name: string;
        email: string;
    };
}
export interface VersionTimeline {
    versions: VersionInfo[];
    currentVersion: number;
    totalVersions: number;
}
export interface VersionDiff {
    from: VersionInfo;
    to: VersionInfo;
    additions: string[];
    deletions: string[];
    changes: Array<{
        clauseType?: string;
        before: string;
        after: string;
    }>;
}
export declare class ContractHistoryService {
    private prisma;
    private logger;
    constructor(prisma: PrismaService);
    createVersion(contractId: string, content: string, changeNote: string, userId: string): Promise<VersionInfo>;
    getHistory(contractId: string, tenantId: string): Promise<VersionTimeline>;
    restoreVersion(contractId: string, versionNumber: number, tenantId: string, userId: string): Promise<VersionInfo>;
    compareVersions(contractId: string, fromVersion: number, toVersion: number, tenantId: string): Promise<VersionDiff>;
    getVersionChanges(contractId: string, versionNumber: number, tenantId: string): Promise<{
        version: VersionInfo;
        changes: string[];
        impactedClauses?: string[];
    }>;
    getRecentChanges(contractId: string, tenantId: string, limit?: number): Promise<Array<{
        version: number;
        changeNote: string | null;
        changedAt: Date;
        changedBy: string;
        summary: string;
    }>>;
    archiveOldVersions(contractId: string, keepCount?: number): Promise<number>;
    private toVersionInfo;
    private getLatestVersionNumber;
    private calculateChanges;
    private extractSection;
    private extractChanges;
}
