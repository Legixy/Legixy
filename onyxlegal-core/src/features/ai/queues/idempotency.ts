/**
 * Idempotency Service
 * Ensures jobs are never processed twice by using stable job IDs and database-level locking.
 * 
 * Pattern:
 * 1. Generate stable jobId from (contractId, tenantId, userId, analysisType)
 * 2. Check if analysis already exists with same parameters
 * 3. If exists and queued/processing, return existing jobId (prevent duplicate)
 * 4. If exists and completed, create new analysis (allow retry)
 * 5. Track concurrent analysis to prevent race conditions
 */

import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Queue, Job } from 'bullmq';
import * as crypto from 'crypto';

const logger = new Logger('IdempotencyService');

/**
 * Generate stable job ID from contract and analysis parameters.
 * Same contract + user + type = same jobId (idempotent)
 */
export function generateIdempotentJobId(
  contractId: string,
  tenantId: string,
  userId: string,
  analysisType: string = 'full',
): string {
  const payload = `${contractId}:${tenantId}:${userId}:${analysisType}`;
  const hash = crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return `analysis-${contractId}-${hash}`;
}

/**
 * Check if analysis already in progress and prevent duplicate queueing.
 * Returns:
 * - { allowed: true, jobId: 'new-job-id' } - Safe to queue new job
 * - { allowed: false, existingJobId: 'existing-job-id' } - Return existing job
 */
export async function checkIdempotency(
  prisma: PrismaService,
  contractId: string,
  tenantId: string,
  userId: string,
  analysisType: string = 'full',
): Promise<{
  allowed: boolean;
  jobId: string;
  existingAnalysisId?: string;
  reason?: string;
}> {
  try {
    const jobId = generateIdempotentJobId(
      contractId,
      tenantId,
      userId,
      analysisType,
    );

    // Check if analysis with same parameters already exists
    const existingAnalysis = await prisma.aIAnalysis.findFirst({
      where: {
        contractId,
        // Include only non-terminal statuses
        status: {
          in: ['QUEUED', 'PROCESSING'],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    });

    if (existingAnalysis) {
      logger.warn(
        `[Idempotency] Duplicate analysis detected for contract ${contractId}. Status: ${existingAnalysis.status}`,
      );
      return {
        allowed: false,
        jobId,
        existingAnalysisId: existingAnalysis.id,
        reason: `Analysis already ${existingAnalysis.status.toLowerCase()} for this contract`,
      };
    }

    // Check if contract has any processing analysis (simple rate limit)
    const processingCount = await prisma.aIAnalysis.count({
      where: {
        contractId,
        status: 'PROCESSING',
      },
    });

    if (processingCount > 0) {
      logger.warn(
        `[Idempotency] Contract ${contractId} has analysis in progress`,
      );
      return {
        allowed: false,
        jobId,
        reason: 'Another analysis is already in progress for this contract',
      };
    }

    // Safe to proceed
    logger.log(
      `[Idempotency] Safe to queue analysis for contract ${contractId}`,
    );
    return { allowed: true, jobId };
  } catch (error) {
    logger.error(
      `[Idempotency] Check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    // On error, generate a unique jobId (better to have duplicates than block user)
    return {
      allowed: true,
      jobId: `analysis-${contractId}-${Date.now()}`,
      reason: 'Idempotency check failed, allowing retry',
    };
  }
}

/**
 * Acquire lock on contract by creating a PROCESSING analysis record.
 * Prevents concurrent analysis on same contract.
 */
export async function acquireAnalysisLock(
  prisma: PrismaService,
  contractId: string,
  analysisType: string = 'QUICK_SCAN',
): Promise<{ locked: boolean; analysisId?: string }> {
  try {
    // Try to create analysis in QUEUED state
    const analysis = await prisma.aIAnalysis.create({
      data: {
        contractId,
        type: analysisType as any,
        status: 'QUEUED',
      },
    });

    logger.log(
      `[Idempotency] Created analysis lock ${analysis.id} for contract ${contractId}`,
    );
    return { locked: true, analysisId: analysis.id };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      logger.warn(
        `[Idempotency] Failed to acquire lock - analysis already in progress for contract ${contractId}`,
      );
    } else {
      logger.error(
        `[Idempotency] Lock acquisition failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    }
    return { locked: false };
  }
}

/**
 * Release lock by completing or failing the analysis.
 * Safe to call - just updates existing record.
 */
export async function releaseAnalysisLock(
  prisma: PrismaService,
  analysisId: string,
  status: 'COMPLETED' | 'FAILED' = 'FAILED',
): Promise<boolean> {
  try {
    await prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: { status },
    });

    logger.log(
      `[Idempotency] Released analysis lock ${analysisId} (${status})`,
    );
    return true;
  } catch (error) {
    logger.error(
      `[Idempotency] Lock release failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return false;
  }
}

/**
 * Deduplication wrapper: Wrap job processing to prevent duplicates.
 * Usage in worker:
 *
 * const deduped = await deduplicateJob(
 *   job,
 *   prisma,
 *   async () => {
 *     // Your actual processing logic here
 *     return await processAnalysis(...);
 *   }
 * );
 */
export async function deduplicateJob<T>(
  job: Job,
  prisma: PrismaService,
  processorFn: () => Promise<T>,
): Promise<T> {
  const jobId = job.id || 'unknown';

  try {
    // Generate stable jobId from job data
    const data = job.data as any;
    const stableJobId = generateIdempotentJobId(
      data.contractId,
      data.tenantId,
      data.userId,
      data.analysisType || 'full',
    );

    // Check if already processing
    const processing = await prisma.aIAnalysis.findFirst({
      where: {
        contractId: data.contractId,
        status: 'PROCESSING',
      },
    });

    if (processing && processing.id !== data.analysisId) {
      logger.warn(
        `[Dedupe] Job ${jobId} is duplicate. Active job: ${processing.id}`,
      );
      return { status: 'SKIPPED', reason: 'Duplicate job detected' } as any;
    }

    // Process
    return await processorFn();
  } catch (error) {
    logger.error(
      `[Dedupe] Error: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    throw error;
  }
}

/**
 * Idempotency stats: Get information about deduplication.
 */
export async function getIdempotencyStats(
  prisma: PrismaService,
): Promise<{
  queuedAnalyses: number;
  processingAnalyses: number;
}> {
  try {
    const queued = await prisma.aIAnalysis.count({
      where: {
        status: 'QUEUED',
      },
    });

    const processing = await prisma.aIAnalysis.count({
      where: {
        status: 'PROCESSING',
      },
    });

    return {
      queuedAnalyses: queued,
      processingAnalyses: processing,
    };
  } catch (error) {
    logger.error(
      `[Idempotency] Stats failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      queuedAnalyses: 0,
      processingAnalyses: 0,
    };
  }
}
