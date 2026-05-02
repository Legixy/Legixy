import { Worker, Job } from 'bullmq';
import { redis } from '../utils/redis';
import { prisma } from '../utils/prisma';
import { env } from '../config/env';
import { analyzeContractForWorker } from '../ai-core/aiEngine';

type AnalysisJobData = {
  contractId: string;
  tenantId: string;
  analysisId: string;
};

// Map AI risk levels from the Gemini engine to Prisma's RiskLevel enum
function mapRiskLevel(level: string): string {
  switch (level) {
    case 'HIGH_RISK':    return 'HIGH';
    case 'NEEDS_REVIEW': return 'MEDIUM';
    case 'SAFE':         return 'SAFE';
    default:             return 'MEDIUM';
  }
}

// Map clause types from the extraction schema to Prisma's ClauseType enum
function mapClauseType(type: string): string {
  const map: Record<string, string> = {
    PAYMENT:       'PAYMENT_TERMS',
    IP_OWNERSHIP:  'IP_OWNERSHIP',
    LIABILITY:     'LIABILITY',
    TERMINATION:   'TERMINATION',
    CONFIDENTIALITY: 'CONFIDENTIALITY',
    NON_COMPETE:   'NON_COMPETE',
    GOVERNING_LAW: 'GOVERNING_LAW',
    OTHER:         'OTHER',
  };
  return map[type] ?? 'OTHER';
}

export const createContractAnalysisWorker = () => {
  console.log('👷 Registered Worker for queue: contract-analysis');

  const worker = new Worker<AnalysisJobData>(
    'contract-analysis',
    async (job: Job<AnalysisJobData>) => {
      const { contractId, tenantId, analysisId } = job.data;
      console.log(`[Job ${job.id}] Starting analysis for Contract ${contractId}`);

      try {
        await prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: { status: 'PROCESSING' as any },
        });

        const contract = await prisma.contract.findUnique({
          where: { id: contractId, tenantId },
          include: {
            template: { select: { category: true } },
            versions: { orderBy: { version: 'desc' }, take: 1, select: { content: true } },
          },
        }) as any;

        if (!contract) throw new Error(`Contract ${contractId} not found`);

        const latestVersion = contract.versions[0];
        const docText: string = latestVersion?.content ?? (contract as any).content ?? '';
        if (!docText) throw new Error('Contract has no content to analyze');

        const standardParameters = contract.template?.category ?? 'General B2B SaaS';

        // ── Mock mode (set GEMINI_API_KEY=mock-key in .env to enable) ──────────
        let extractionData: any;
        let riskData: any;
        let totalTokens = 0;

        if (env.GEMINI_API_KEY.includes('mock-key')) {
          console.log(`[Job ${job.id}] 🧪 MOCK MODE — returning simulated payload`);
          await new Promise(r => setTimeout(r, 1500));
          const dummyText =
            typeof docText === 'string' ? docText.substring(0, 80) + '...' : 'Mock Clause';
          extractionData = { clauses: [{ type: 'PAYMENT', originalText: dummyText }] };
          riskData = {
            score: 75,
            clauses: [
              {
                originalText: dummyText,
                riskLevel: 'HIGH_RISK',
                businessImpact: 'Uncapped liability in mock clause.',
                suggestedText: 'Liability shall be capped at the total fees paid in the preceding 12 months.',
              },
            ],
          };
          totalTokens = 150;
        }

        // ── Live Gemini analysis ───────────────────────────────────────────────
        if (!extractionData) {
          const result = await analyzeContractForWorker(docText, standardParameters);
          extractionData = result.extractionData;
          riskData = result.riskData;
          totalTokens = result.totalTokens;
          console.log(
            `[Job ${job.id}] AI complete — ` +
            `${extractionData.clauses.length} clauses, ` +
            `score: ${riskData.score}, ` +
            `tokens: ${totalTokens}`
          );
        }

        // ── Phase 3: DB commit ─────────────────────────────────────────────────
        console.log(`[Job ${job.id}] Phase 3: committing to DB…`);

        await prisma.$transaction(async (tx: any) => {
          // Clear previous clause data for this contract
          await tx.clause.deleteMany({ where: { contractId } });

          const dbClauses = await Promise.all(
            extractionData.clauses.map(async (extractorInfo: any) => {
              // Match each extracted clause to its risk assessment by text similarity
              const riskInfo = riskData.clauses.find(
                (r: any) =>
                  r.originalText === extractorInfo.originalText ||
                  extractorInfo.originalText.includes(r.originalText.substring(0, 40)) ||
                  r.originalText.includes(extractorInfo.originalText.substring(0, 40))
              );

              return tx.clause.create({
                data: {
                  contractId,
                  type: mapClauseType(extractorInfo.type) as any,
                  originalText: extractorInfo.originalText,
                  riskLevel: mapRiskLevel(riskInfo?.riskLevel ?? 'SAFE') as any,
                  riskReason: riskInfo?.businessImpact ?? null,
                  suggestedText: riskInfo?.suggestedText ?? null,
                },
              });
            })
          );

          // Create RiskFinding records for non-SAFE clauses
          for (const clause of dbClauses) {
            if (clause.riskLevel !== 'SAFE') {
              await tx.riskFinding.create({
                data: {
                  analysisId,
                  severity: clause.riskLevel as any,
                  title: clause.type.replace(/_/g, ' '),
                  clause: clause.originalText.substring(0, 500),
                  impact: clause.riskReason ?? 'Requires review',
                  suggestion: clause.suggestedText ?? 'Revise clause for better protection',
                },
              });
            }
          }

          await tx.contract.update({
            where: { id: contractId },
            data: { status: 'IN_REVIEW' as any, riskScore: riskData.score },
          });

          await tx.aIAnalysis.update({
            where: { id: analysisId },
            data: {
              status: 'COMPLETED' as any,
              completedAt: new Date(),
              tokensUsed: totalTokens,
            },
          });

          await tx.tenant.update({
            where: { id: tenantId },
            data: { aiTokensUsed: { increment: totalTokens } },
          });
        });

        console.log(
          `✅ [Job ${job.id}] Contract ${contractId} analysis complete. ` +
          `Tokens used: ${totalTokens}`
        );
      } catch (error: any) {
        console.error(
          `❌ [Job ${job.id}] Failed for Contract ${contractId}:`,
          error.message
        );
        await prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: { status: 'FAILED' as any },
        });
        throw error; // Re-throw so BullMQ marks the job as failed and can retry
      }
    },
    { connection: redis, concurrency: 2, lockDuration: 60_000 }
  );

  worker.on('failed', (job, err) => {
    console.warn(`Job ${job?.id} permanently failed: ${err.message}`);
  });

  return worker;
};
