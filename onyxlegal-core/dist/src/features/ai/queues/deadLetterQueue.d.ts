import { Queue } from 'bullmq';
export interface DLQEntry {
    jobId: string;
    contractId: string;
    tenantId: string;
    userId: string;
    originalData: any;
    error: {
        message: string;
        stack?: string;
        code?: string;
    };
    attempts: number;
    maxAttempts: number;
    failedAt: Date;
    lastError: string;
    metadata?: Record<string, any>;
}
export declare function createDeadLetterQueue(redisConnection: any, queueName?: string): Queue;
export declare function addToDLQ(dlqQueue: Queue, jobId: string, contractId: string, tenantId: string, userId: string, originalData: any, error: Error, attempts: number, maxAttempts: number, metadata?: Record<string, any>): Promise<void>;
export declare function getDLQEntries(dlqQueue: Queue, tenantId: string): Promise<DLQEntry[]>;
export declare function removeFromDLQ(dlqQueue: Queue, jobId: string): Promise<boolean>;
export declare function getDLQEntry(dlqQueue: Queue, jobId: string): Promise<DLQEntry | null>;
export declare function getDLQStats(dlqQueue: Queue): Promise<{
    totalEntries: number;
    byTenant: Record<string, number>;
}>;
