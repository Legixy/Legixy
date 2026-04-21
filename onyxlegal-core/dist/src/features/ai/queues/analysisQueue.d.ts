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
export declare enum JobPriority {
    HIGH = 1,
    NORMAL = 2,
    LOW = 3
}
export declare function createAnalysisQueue(redisConnection: any, queueName?: string): Queue;
export declare function createClauseFixQueue(redisConnection: any, queueName?: string): Queue;
export declare function addAnalysisJob(queue: Queue, data: AnalysisJobData, priority?: JobPriority): Promise<string>;
export declare function addClauseFixJob(queue: Queue, data: ClauseFixJobData, priority?: JobPriority): Promise<string>;
export declare function getQueueStats(queue: Queue): Promise<any>;
