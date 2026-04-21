/**
 * Dead Letter Queue (DLQ) Service
 *
 * Purpose:
 * - Permanently store failed jobs that exceed max retries
 * - Enable manual intervention and retry capability
 * - Audit trail for failures
 *
 * Architecture:
 * Failed Job (after 3 retries) → DLQ → Manual Review → Admin Retry API
 */

import { Queue } from 'bullmq';
import { Logger } from '@nestjs/common';

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

/**
 * Create Dead Letter Queue
 * Stores jobs that have exhausted all retry attempts
 */
export function createDeadLetterQueue(
  redisConnection: any,
  queueName: string = 'contract-analysis-dlq',
): Queue {
  const logger = new Logger('DeadLetterQueue');

  const queue = new Queue(queueName, {
    connection: redisConnection,
    defaultJobOptions: {
      removeOnComplete: false, // Keep forever for audit
      removeOnFail: false,
      // No retries for DLQ entries
    },
  });

  queue.on('error', (err: any) => {
    logger.error(`DLQ Error: ${err.message}`);
  });

  return queue;
}

/**
 * Add failed job to DLQ
 */
export async function addToDLQ(
  dlqQueue: Queue,
  jobId: string,
  contractId: string,
  tenantId: string,
  userId: string,
  originalData: any,
  error: Error,
  attempts: number,
  maxAttempts: number,
  metadata?: Record<string, any>,
): Promise<void> {
  const logger = new Logger('DeadLetterQueue');

  try {
    const dlqEntry: DLQEntry = {
      jobId,
      contractId,
      tenantId,
      userId,
      originalData,
      error: {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      attempts,
      maxAttempts,
      failedAt: new Date(),
      lastError: error.message,
      metadata,
    };

    // Add to DLQ with unique ID
    await dlqQueue.add(`dlq-${jobId}`, dlqEntry, {
      jobId: `dlq-${jobId}`,
      // DLQ entries stay indefinitely
    });

    logger.warn(
      `Job ${jobId} added to DLQ after ${attempts} attempts. Error: ${error.message}`,
    );
  } catch (dlqError) {
    logger.error(`Failed to add job to DLQ: ${dlqError}`, dlqError);
    // Don't throw - log and continue to prevent cascading failures
  }
}

/**
 * Get DLQ entries for a tenant
 */
export async function getDLQEntries(
  dlqQueue: Queue,
  tenantId: string,
): Promise<DLQEntry[]> {
  try {
    const jobs = await dlqQueue.getJobs(['wait', 'completed', 'failed'], 0, -1);
    return jobs
      .map((job) => job.data)
      .filter((entry: DLQEntry) => entry.tenantId === tenantId)
      .sort((a: DLQEntry, b: DLQEntry) => 
        new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime()
      );
  } catch (error) {
    const logger = new Logger('DeadLetterQueue');
    logger.error(`Failed to get DLQ entries: ${error}`);
    return [];
  }
}

/**
 * Remove entry from DLQ
 */
export async function removeFromDLQ(
  dlqQueue: Queue,
  jobId: string,
): Promise<boolean> {
  try {
    const job = await dlqQueue.getJob(`dlq-${jobId}`);
    if (job) {
      await job.remove();
      return true;
    }
    return false;
  } catch (error) {
    const logger = new Logger('DeadLetterQueue');
    logger.error(`Failed to remove from DLQ: ${error}`);
    return false;
  }
}

/**
 * Get DLQ entry details
 */
export async function getDLQEntry(
  dlqQueue: Queue,
  jobId: string,
): Promise<DLQEntry | null> {
  try {
    const job = await dlqQueue.getJob(`dlq-${jobId}`);
    return job ? (job.data as DLQEntry) : null;
  } catch (error) {
    const logger = new Logger('DeadLetterQueue');
    logger.error(`Failed to get DLQ entry: ${error}`);
    return null;
  }
}

/**
 * Get DLQ statistics
 */
export async function getDLQStats(dlqQueue: Queue): Promise<{
  totalEntries: number;
  byTenant: Record<string, number>;
}> {
  try {
    const jobs = await dlqQueue.getJobs(['wait', 'completed', 'failed'], 0, -1);
    const entries = jobs.map((job) => job.data as DLQEntry);

    const byTenant: Record<string, number> = {};
    let totalEntries = 0;

    for (const entry of entries) {
      totalEntries++;
      byTenant[entry.tenantId] = (byTenant[entry.tenantId] || 0) + 1;
    }

    return { totalEntries, byTenant };
  } catch (error) {
    const logger = new Logger('DeadLetterQueue');
    logger.error(`Failed to get DLQ stats: ${error}`);
    return { totalEntries: 0, byTenant: {} };
  }
}
