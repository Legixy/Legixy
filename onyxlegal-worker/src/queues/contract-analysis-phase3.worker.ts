/**
 * /src/queues/contract-analysis-phase3.worker.ts
 *
 * Async job queue for contract analysis
 * Uses BullMQ + Redis for scalability
 * Implements real AI analysis pipeline
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  analyzeContract,
  generateClauseFix,
  extractClauses,
  calculateComplianceScore,
} from '../ai-core/aiEngine';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const contractAnalysisQueue = new Queue('contract-analysis', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export interface AnalysisJobData {
  contractId: string;
  contractText: string;
  tenantId: string;
  analysisType: 'quick_scan' | 'risk_detection' | 'deep_analysis' | 'fix_generation';
  jurisdiction?: string;
}

export interface AnalysisJobResult {
  contractId: string;
  status: 'completed' | 'failed';
  riskScore: number;
  complianceScore: number;
  risks: any[];
  suggestions: any[];
  tokensUsed: number;
  processingTimeMs: number;
}

/**
 * Create analysis job
 */
export async function createAnalysisJob(
  contractId: string,
  contractText: string,
  tenantId: string,
  analysisType: AnalysisJobData['analysisType']
) {
  const job = await contractAnalysisQueue.add(
    'analyze',
    {
      contractId,
      contractText,
      tenantId,
      analysisType,
    } as AnalysisJobData,
    {
      jobId: `${contractId}-${analysisType}-${Date.now()}`,
      priority: analysisType === 'deep_analysis' ? 1 : 5,
    }
  );

  return job;
}

/**
 * Get job progress
 */
export async function getAnalysisJobProgress(jobId: string) {
  const job = await contractAnalysisQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();

  return {
    id: job.id,
    status: state,
    progress: 0,
    data: job.data,
    result: job.returnvalue,
  };
}

/**
 * Worker processor
 */
export const analysisWorker = new Worker(
  'contract-analysis',
  async (job: Job<AnalysisJobData>) => {
    const startTime = Date.now();

    try {
      const { contractId, contractText, tenantId, analysisType } = job.data;

      console.log(`[ANALYSIS] Started for contract ${contractId}, type: ${analysisType}`);

      job.updateProgress(10);

      // Step 1: Extract clauses
      let clauses = [];
      if (analysisType === 'quick_scan' || analysisType === 'risk_detection') {
        const extraction = await extractClauses(contractText);
        clauses = extraction.clauses;
        job.updateProgress(25);
      }

      // Step 2: Analyze contract
      const analysis = await analyzeContract(contractText);
      job.updateProgress(60);

      // Step 3: Calculate scores
      const riskScore = 100 - analysis.score;
      const complianceScore = calculateComplianceScore(analysis.risks);
      job.updateProgress(85);

      // Step 4: For critical issues, generate fixes
      let risksWithFixes = analysis.risks;
      if (analysisType === 'fix_generation') {
        for (const risk of analysis.risks.slice(0, 3)) {
          // Only top 3 for now
          try {
            const fixResult = await generateClauseFix(risk.clause, risk.impact, 'India');
            risk.suggestedFix = fixResult.improved;
            risk.fixConfidence = fixResult.confidenceScore;
          } catch (err) {
            console.error(`Failed to generate fix for risk ${risk.id}`, err);
          }
        }
      }

      job.updateProgress(95);

      const result: AnalysisJobResult = {
        contractId,
        status: 'completed',
        riskScore,
        complianceScore,
        risks: risksWithFixes,
        suggestions: analysis.suggestions,
        tokensUsed: analysis.tokensUsed,
        processingTimeMs: Date.now() - startTime,
      };

      job.updateProgress(100);

      console.log(
        `[ANALYSIS] Completed for ${contractId}, risk: ${riskScore}, compliance: ${complianceScore}`
      );

      return result;
    } catch (error) {
      console.error(`[ANALYSIS] Failed for ${job.data.contractId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process 5 contracts in parallel
  }
);

// Event handlers
analysisWorker.on('completed', async (job) => {
  console.log(`[QUEUE] Job ${job.id} completed successfully`);
});

analysisWorker.on('failed', async (job, err) => {
  console.error(`[QUEUE] Job ${job?.id} failed:`, err);
  // Could send notification here
});

analysisWorker.on('progress', async (job, progress) => {
  console.log(`[QUEUE] Job ${job.id} progress: ${progress}%`);
});
