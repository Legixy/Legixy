import { Worker, Job } from 'bullmq';
import { zodResponseFormat } from 'openai/helpers/zod';
import { redis } from '../utils/redis';
import { prisma } from '../utils/prisma';
import { openai, ASYNC_AI_CONFIG } from '../ai-core/openai';
import { ClauseExtractionSchema, RiskDetectionSchema, Prompts } from '../ai-core/prompts';
import { env } from '../config/env';

type AnalysisJobData = {
  contractId: string;
  tenantId: string;
  analysisId: string;
};

export const createContractAnalysisWorker = () => {
  console.log('👷 Registered Worker for queue: contract-analysis');

  const worker = new Worker<AnalysisJobData>(
    'contract-analysis',
    async (job: Job<AnalysisJobData>) => {
      const { contractId, tenantId, analysisId } = job.data;
      console.log(`[Job ${job.id}] Initiating analysis for Contract ${contractId}`);

      try {
        await prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: { status: 'IN_PROGRESS' as any }
        });

        const contract = await prisma.contract.findUnique({
          where: { id: contractId, tenantId },
          include: { 
            template: true,
            versions: { orderBy: { version: 'desc' }, take: 1 }
          }
        });

        if (!contract) throw new Error(`Contract ${contractId} not found`);

        const latestVersion = contract.versions[0];
        if (!latestVersion) throw new Error('No content versions found');

        const standardParameters = contract.template?.category || 'General';
        const docText = latestVersion.content;

        let extractionData: any;
        let riskData: any;
        let totalTokens = 0;

        if (env.OPENAI_API_KEY.includes('mock-key')) {
          console.log(`[Job ${job.id}] 🧠 MOCK AI MODE: Returning simulated payload...`);
          await new Promise(r => setTimeout(r, 2000));
          const dummyText = typeof docText === 'string' ? docText.substring(0, 80) + '...' : 'Mock Clause';
          extractionData = { clauses: [{ type: 'PAYMENT', originalText: dummyText }] };
          riskData = { 
            score: 75, 
            clauses: [{ originalText: dummyText, riskLevel: 'HIGH_RISK', businessImpact: 'Uncapped liability in dummy text.', suggestedText: 'The liability is capped at the total amount paid.' }] 
          };
          totalTokens = 150;
        }

        if (!extractionData) {
          console.log(`[Job ${job.id}] Phase 1: AI Segmenting document...`);
          const extractionCompletion = await (openai.beta as any).chat.completions.parse({
            model: ASYNC_AI_CONFIG.model,
            temperature: ASYNC_AI_CONFIG.temperature,
            messages: [{ role: 'user', content: Prompts.Extract(docText) }],
            response_format: zodResponseFormat(ClauseExtractionSchema, 'clause_extraction')
          });

          extractionData = extractionCompletion.choices[0].message.parsed;
          if (!extractionData?.clauses) throw new Error('AI extraction failed');

          const totalExtractionTokens = extractionCompletion.usage?.total_tokens || 0;

          const clausesPlainText = extractionData.clauses
            .map((c: any, i: number) => `[Clause ${i+1}] ${c.originalText}`)
            .join('\n\n');

          console.log(`[Job ${job.id}] Phase 2: AI Analyzing ${extractionData.clauses.length} clauses...`);
          const riskCompletion = await (openai.beta as any).chat.completions.parse({
            model: ASYNC_AI_CONFIG.model,
            temperature: ASYNC_AI_CONFIG.temperature,
            messages: [{ role: 'user', content: Prompts.AnalyzeRisks(clausesPlainText, standardParameters) }],
            response_format: zodResponseFormat(RiskDetectionSchema, 'risk_detection')
          });

          riskData = riskCompletion.choices[0].message.parsed;
          if (!riskData) throw new Error('AI risk analysis failed');

          const totalRiskTokens = riskCompletion.usage?.total_tokens || 0;
          totalTokens = totalExtractionTokens + totalRiskTokens;
        }

        console.log(`[Job ${job.id}] Phase 3: DB Commit. Overall risk score: ${riskData.score}`);
        
        await prisma.$transaction(async (tx: any) => {
          await tx.clause.deleteMany({ where: { contractId } });

          const dbClauses = await Promise.all(extractionData.clauses.map(async (extractorInfo: any) => {
            const riskInfo = riskData.clauses.find((r: any) => 
               r.originalText === extractorInfo.originalText || 
               r.originalText.includes(extractorInfo.originalText.substring(0, 50))
            );

            return tx.clause.create({
              data: {
                contractId,
                type: extractorInfo.type as any,
                originalText: extractorInfo.originalText,
                riskLevel: (riskInfo?.riskLevel as any) || 'SAFE',
                suggestedText: riskInfo?.suggestedText || null,
                businessImpact: riskInfo?.businessImpact || null,
              }
            });
          }));

          for (const c of dbClauses) {
            if (c.riskLevel !== 'SAFE') {
              await tx.riskFinding.create({
                data: {
                  analysisId,
                  severity: c.riskLevel === 'HIGH_RISK' ? 'HIGH' : 'MEDIUM',
                  clause: c.id,
                  impact: c.businessImpact || 'Requires review',
                  suggestion: c.suggestedText || 'Revise for compliance',
                }
              });
            }
          }

          await tx.contract.update({
            where: { id: contractId },
            data: { status: 'IN_REVIEW' as any, riskScore: riskData.score }
          });

          await tx.aIAnalysis.update({
            where: { id: analysisId },
            data: { status: 'COMPLETED' as any, completedAt: new Date(), tokensUsed: totalTokens }
          });

          await tx.tenant.update({
            where: { id: tenantId },
            data: { aiTokensUsed: { increment: totalTokens } }
          });
        });

        console.log(`✅ [Job ${job.id}] Contract ${contractId} fully analyzed. Used ${totalTokens} tokens.`);

      } catch (error: any) {
        console.error(`❌ [Job ${job.id}] Failed processing Contract ${contractId}:`, error.message);
        await prisma.aIAnalysis.update({
          where: { id: analysisId },
          data: { status: 'FAILED' as any }
        });
        throw error;
      }
    },
    { connection: redis, concurrency: 2, lockDuration: 60000 }
  );

  worker.on('failed', (job, err) => {
    console.warn(`Job ${job?.id} permanently failed: ${err.message}`);
  });

  return worker;
};
