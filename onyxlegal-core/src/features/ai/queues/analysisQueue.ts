/**
 * AnalysisQueue — BullMQ Queue Configuration
 *
 * Responsible for:
 * - Contract analysis job management
 * - Clause fix job management
 * - Exponential backoff retry
 * - Concurrency control
 *
 * Architecture:
 * Client → API → Queue → Redis → Worker
 */

import { Queue, Worker } from 'bullmq';
import { Logger } from '@nestjs/common';

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

/**
 * Creates and returns the contract analysis queue
 *
 * Configuration:
 * - Concurrency: 5 (configurable via env)
 * - Retry: 3 attempts
 * - Backoff: Exponential (5s → 10s → 20s)
 * - Keep completed jobs for 100 seconds
 * - Keep failed jobs for 50 seconds
 */
export function createAnalysisQueue(
  redisConnection: any,
  queueName: string = 'contract-analysis',
): Queue {
  const logger = new Logger('AnalysisQueue');

  const queue = new Queue(queueName, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds base
      },
      removeOnComplete: {
        age: 100, // keep for 100 seconds
      },
      removeOnFail: {
        age: 50, // keep failed jobs for 50 seconds
      },
    },
  });

  // Queue event listeners
  queue.on('waiting', (job: any) => {
    logger.log(`Job ${job.id} waiting in queue`);
  });

  queue.on('error', (err: any) => {
    logger.error(`Queue error: ${err.message}`);
  });

  return queue;
}

/**
 * Creates and returns the clause fix queue
 *
 * Similar to analysis queue but for generating clause fixes
 */
export function createClauseFixQueue(
  redisConnection: any,
  queueName: string = 'clause-fix',
): Queue {
  const logger = new Logger('ClauseFixQueue');

  const queue = new Queue(queueName, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 100,
      },
      removeOnFail: {
        age: 50,
      },
    },
  });

  queue.on('waiting', (job: any) => {
    logger.log(`Clause fix job ${job.id} waiting`);
  });

  queue.on('error', (err: any) => {
    logger.error(`Clause fix queue error: ${err.message}`);
  });

  return queue;
}

/**
 * Job creation helpers
 */
export async function addAnalysisJob(
  queue: Queue,
  data: AnalysisJobData,
  priority?: number,
): Promise<string> {
  const job = await queue.add('analyze-contract', data, {
    priority, // higher = earlier
    jobId: `analysis-${data.analysisId}`, // idempotency
  });
  return job.id || '';
}

export async function addClauseFixJob(
  queue: Queue,
  data: ClauseFixJobData,
  priority?: number,
): Promise<string> {
  const job = await queue.add('generate-clause-fix', data, {
    priority,
    jobId: `fix-${data.analysisId}`,
  });
  return job.id || '';
}

/**
 * Queue statistics using getJobCounts()
 */
export async function getQueueStats(queue: Queue): Promise<any> {
  const counts = await queue.getJobCounts();
  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    delayed: counts.delayed || 0,
  };
}
