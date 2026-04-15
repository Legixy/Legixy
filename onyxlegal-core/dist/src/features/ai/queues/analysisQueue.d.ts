import { Queue } from 'bullmq';
export interface AnalysisJobData {
    analysisId: string;
    contractId: string;
    tenantId: string;
    userId: string;
    content: string;
    type?: 'QUICK_SCAN' | 'RISK_DETECTION' | 'DEEP_ANALYSIS' | 'FIX_GENERATION';
}
export interface ClauseFixJobData {
    analysisId: string;
    contractId: string;
    tenantId: string;
    userId: string;
    riskFindingId: string;
    content: string;
    riskDescription: string;
}
export declare function createAnalysisQueue(redisConnection: any, queueName?: string): Queue;
export declare function createClauseFixQueue(redisConnection: any, queueName?: string): Queue;
export declare function addAnalysisJob(queue: Queue, data: AnalysisJobData, priority?: number): Promise<string>;
export declare function addClauseFixJob(queue: Queue, data: ClauseFixJobData, priority?: number): Promise<string>;
export declare function getQueueStats(queue: Queue): Promise<any>;
