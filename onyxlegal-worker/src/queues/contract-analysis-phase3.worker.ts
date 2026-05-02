/**
 * contract-analysis-phase3.worker.ts
 *
 * Standalone queue manager + worker for on-demand contract analysis jobs.
 * Distinct from the primary BullMQ worker (contract-analysis.worker.ts) which
 * handles DB-persisted jobs. This file exposes a queue API for services that
 * want to submit ad-hoc text and get results back without touching the database.
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import {
  analyzeContract,
  analyzeContractForWorker,
  calculateComplianceScore,
} from '../ai-core/aiEngine';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

export const contractAnalysisQueue = new Queue('contract-analysis-adhoc', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  },
});

export interface AnalysisJobData {
  contractId: string;
  contractText: string;
  tenantId: string;
  analysisType: 'quick_scan' | 'risk_detection' | 'deep_analysis' | 'fix_generation';
  standardParameters?: string;
}

export interface AnalysisJobResult {
  contractId: string;
  status: 'completed' | 'failed';
  riskScore: number;
  complianceScore: number;
  risks: any[];
  totalTokens: number;
  processingTimeMs: number;
}

export async function createAnalysisJob(
  contractId: string,
  contractText: string,
  tenantId: string,
  analysisType: AnalysisJobData['analysisType']
) {
  return contractAnalysisQueue.add(
    'analyze',
    { contractId, contractText, tenantId, analysisType } as AnalysisJobData,
    {
      jobId: `${contractId}-${analysisType}-${Date.now()}`,
      priority: analysisType === 'deep_analysis' ? 1 : 5,
    }
  );
}

export async function getAnalysisJobProgress(jobId: string) {
  const job = await contractAnalysisQueue.getJob(jobId);
  if (!job) return null;
  return {
    id: job.id,
    status: await job.getState(),
    progress: 0,
    data: job.data,
    result: job.returnvalue,
  };
}

export const analysisWorker = new Worker(
  'contract-analysis-adhoc',
  async (job: Job<AnalysisJobData>) => {
    const startTime = Date.now();

    try {
      const { contractId, contractText, analysisType, standardParameters } = job.data;
      console.log(`[ANALYSIS] Started — contract: ${contractId}, type: ${analysisType}`);

      if (analysisType === 'quick_scan' || analysisType === 'fix_generation') {
        // Full unified analysis (API/UI output format)
        await job.updateProgress(10);

        const analysis = await analyzeContract(contractText);
        await job.updateProgress(90);

        const complianceScore = calculateComplianceScore(
          analysis.risks.map(r => ({
            severity: r.severity.toLowerCase() as 'low' | 'medium' | 'high' | 'critical',
          }))
        );

        await job.updateProgress(100);
        console.log(`[ANALYSIS] Done — ${contractId}, risks: ${analysis.risks.length}`);

        return {
          contractId,
          status: 'completed',
          riskScore: 100 - complianceScore,
          complianceScore,
          risks: analysis.risks,
          totalTokens: 0,
          processingTimeMs: analysis.processingTimeMs,
        } satisfies AnalysisJobResult;

      } else {
        // Two-phase worker pipeline (clause extraction + risk scoring)
        await job.updateProgress(10);

        const result = await analyzeContractForWorker(
          contractText,
          standardParameters ?? 'General B2B SaaS norms'
        );
        await job.updateProgress(80);

        const complianceScore = result.riskData.score;
        await job.updateProgress(100);

        console.log(
          `[ANALYSIS] Done — ${contractId}, score: ${complianceScore}, ` +
          `tokens: ${result.totalTokens}`
        );

        return {
          contractId,
          status: 'completed',
          riskScore: 100 - complianceScore,
          complianceScore,
          risks: result.riskData.clauses,
          totalTokens: result.totalTokens,
          processingTimeMs: result.processingTimeMs,
        } satisfies AnalysisJobResult;
      }
    } catch (error) {
      console.error(`[ANALYSIS] Failed — ${job.data.contractId}:`, error);
      throw error;
    }
  },
  { connection: redis, concurrency: 5 }
);

analysisWorker.on('completed', job => {
  console.log(`[QUEUE] Job ${job.id} completed`);
});

analysisWorker.on('failed', (job, err) => {
  console.error(`[QUEUE] Job ${job?.id} failed:`, err.message);
});

analysisWorker.on('progress', (job, progress) => {
  console.log(`[QUEUE] Job ${job.id} progress: ${progress}%`);
});
