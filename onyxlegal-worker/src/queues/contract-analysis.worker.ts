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
          data: { status: 'PROCESSING' as any }
        });

        const contract = await prisma.contract.findUnique({
          where: { id: contractId, tenantId },
          include: {
            template: { select: { category: true } },
            versions: { orderBy: { version: 'desc' }, take: 1, select: { content: true } }
          }
        }) as any;

        if (!contract) throw new Error(`Contract ${contractId} not found`);

        const latestVersion = contract.versions[0];
        const docText = latestVersion?.content || (contract as any).content;
        if (!docText) throw new Error('Contract has no content to analyze');

        const standardParameters = contract.template?.category || 'General';

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

        // Map AI risk levels to Prisma RiskLevel enum
        const mapRiskLevel = (level: string): string => {
          switch (level) {
            case 'HIGH_RISK': return 'HIGH';
            case 'NEEDS_REVIEW': return 'MEDIUM';
            case 'SAFE': return 'SAFE';
            default: return 'MEDIUM';
          }
        };

        // Map clause type from extraction schema to Prisma ClauseType enum
        const mapClauseType = (type: string): string => {
          const map: Record<string, string> = {
            PAYMENT: 'PAYMENT_TERMS',
            IP_OWNERSHIP: 'IP_OWNERSHIP',
            LIABILITY: 'LIABILITY',
            TERMINATION: 'TERMINATION',
            CONFIDENTIALITY: 'CONFIDENTIALITY',
            NON_COMPETE: 'NON_COMPETE',
            GOVERNING_LAW: 'GOVERNING_LAW',
            OTHER: 'OTHER',
          };
          return map[type] || 'OTHER';
        };

        await prisma.$transaction(async (tx: any) => {
          await tx.clause.deleteMany({ where: { contractId } });

          const dbClauses = await Promise.all(extractionData.clauses.map(async (extractorInfo: any) => {
            const riskInfo = riskData.clauses.find((r: any) =>
               r.originalText === extractorInfo.originalText ||
               extractorInfo.originalText.includes(r.originalText.substring(0, 40)) ||
               r.originalText.includes(extractorInfo.originalText.substring(0, 40))
            );

            const mappedRiskLevel = mapRiskLevel(riskInfo?.riskLevel || 'SAFE');

            return tx.clause.create({
              data: {
                contractId,
                type: mapClauseType(extractorInfo.type) as any,
                originalText: extractorInfo.originalText,
                riskLevel: mappedRiskLevel as any,
                riskReason: riskInfo?.businessImpact || null,
                suggestedText: riskInfo?.suggestedText || null,
              }
            });
          }));

          for (const c of dbClauses) {
            if (c.riskLevel !== 'SAFE') {
              await tx.riskFinding.create({
                data: {
                  analysisId,
                  severity: c.riskLevel as any,
                  title: c.type.replace(/_/g, ' '),
                  clause: c.originalText.substring(0, 500),
                  impact: c.riskReason || 'Requires review',
                  suggestion: c.suggestedText || 'Revise clause for better protection',
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
