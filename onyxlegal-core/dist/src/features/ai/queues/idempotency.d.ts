import { PrismaService } from '../../../database/prisma.service';
import { Job } from 'bullmq';
export declare function generateIdempotentJobId(contractId: string, tenantId: string, userId: string, analysisType?: string): string;
export declare function checkIdempotency(prisma: PrismaService, contractId: string, tenantId: string, userId: string, analysisType?: string): Promise<{
    allowed: boolean;
    jobId: string;
    existingAnalysisId?: string;
    reason?: string;
}>;
export declare function acquireAnalysisLock(prisma: PrismaService, contractId: string, analysisType?: string): Promise<{
    locked: boolean;
    analysisId?: string;
}>;
export declare function releaseAnalysisLock(prisma: PrismaService, analysisId: string, status?: 'COMPLETED' | 'FAILED'): Promise<boolean>;
export declare function deduplicateJob<T>(job: Job, prisma: PrismaService, processorFn: () => Promise<T>): Promise<T>;
export declare function getIdempotencyStats(prisma: PrismaService): Promise<{
    queuedAnalyses: number;
    processingAnalyses: number;
}>;
