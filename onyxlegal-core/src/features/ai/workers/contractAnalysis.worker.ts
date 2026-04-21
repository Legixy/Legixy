/**
 * ContractAnalysis Worker — BullMQ Worker
 *
 * Responsibilities:
 * - Consume jobs from contract-analysis queue
 * - Fetch contract from database
 * - Run aiEngine.analyzeContract()
 * - Parse and validate results
 * - Store analysis results
 * - Update contract status
 * - Emit WebSocket events
 * - Handle errors with retry logic
 *
 * Architecture:
 * Queue → Worker → AIEngine → Database → WebSocket → Frontend
 */

import { Worker } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AnalysisJobData } from '../queues/analysisQueue';
import { AIEngine } from '../services/aiEngine';
import { PrismaService } from '../../../database/prisma.service';
import { AnalysisStatus } from 'generated/prisma/client';
import { addToDLQ } from '../queues/deadLetterQueue';
import { Queue } from 'bullmq';

export class ContractAnalysisWorker {
  private logger = new Logger('ContractAnalysisWorker');
  private worker: Worker;
  private aiEngine: AIEngine;
  private prisma: PrismaService;
  private websocketGateway: any; // injected later
  private dlqQueue: Queue; // Dead Letter Queue

  constructor(
    redisConnection: any,
    aiEngine: AIEngine,
    prisma: PrismaService,
    dlqQueue: Queue,
    concurrency: number = 5,
  ) {
    this.aiEngine = aiEngine;
    this.prisma = prisma;
    this.dlqQueue = dlqQueue;

    this.worker = new Worker('contract-analysis', this.processorFn.bind(this), {
      connection: redisConnection,
      concurrency,
    });

    this.attachEventHandlers();
  }

  /**
   * Main processor function for each job
   */
  private async processorFn(job: any): Promise<void> {
    const data: AnalysisJobData = job.data;
    const { analysisId, contractId, tenantId, content, type } = data;

    this.logger.log(
      `[Job ${job.id}] Processing analysis ${analysisId} for contract ${contractId}`,
    );

    try {
      // Update analysis status to PROCESSING
      await this.prisma.aIAnalysis.update({
        where: { id: analysisId },
        data: {
          status: AnalysisStatus.PROCESSING,
          startedAt: new Date(),
        },
      });

      // Emit WebSocket event: analysis started
      this.emitEvent(tenantId, 'analysis_started', {
        contractId,
        analysisId,
        status: 'PROCESSING',
      });

      const startTime = Date.now();

      // Run AI analysis
      const analysisResult = await this.aiEngine.analyzeContract(
        content,
        contractId,
      );

      const processingMs = Date.now() - startTime;

      // Extract token count
      const tokenStats = this.aiEngine.getTokenStats();
      const tokensUsed = tokenStats.totalCompletionTokens + tokenStats.totalPromptTokens || 0;

      // Store analysis result
      const analysis = await this.prisma.aIAnalysis.update({
        where: { id: analysisId },
        data: {
          status: AnalysisStatus.COMPLETED,
          completedAt: new Date(),
          tokensUsed,
          processingMs,
        },
      });

      // Create risk findings from analysis
      if (analysisResult.analysis?.risks && analysisResult.analysis.risks.length > 0) {
        await Promise.all(
          analysisResult.analysis.risks.map((risk: any) =>
            this.prisma.riskFinding.create({
              data: {
                analysisId,
                severity: this.mapRiskLevel(risk.severity || 'MEDIUM'),
                title: risk.issue,
                clause: risk.clause || content.substring(0, 200),
                impact: risk.recommendation || '',
                suggestion: risk.recommendation || '',
                legalRef: undefined,
                estimatedRisk: null,
              },
            }),
          ),
        );
      }

      // Update tenant AI token usage
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          aiTokensUsed: {
            increment: tokensUsed,
          },
        },
      });

      // Emit WebSocket event: analysis completed
      this.emitEvent(tenantId, 'analysis_completed', {
        contractId,
        analysisId,
        status: 'COMPLETED',
        result: analysisResult,
        tokensUsed,
        processingMs,
      });

      this.logger.log(
        `[Job ${job.id}] Analysis completed: ${tokensUsed} tokens, ${processingMs}ms`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[Job ${job.id}] Analysis failed: ${errorMessage}`,
        error,
      );

      // Increment retry count
      const currentAttempts = (job.attemptsMade || 0) + 1;
      const maxAttempts = job.opts?.attempts || 3;

      // Update analysis status to FAILED
      await this.prisma.aIAnalysis.update({
        where: { id: analysisId },
        data: {
          status: AnalysisStatus.FAILED,
          errorMessage: errorMessage.substring(0, 500), // limit error length
          retryCount: {
            increment: 1,
          },
        },
      });

      // If max retries exceeded, add to DLQ
      if (currentAttempts >= maxAttempts) {
        this.logger.warn(
          `[Job ${job.id}] Max retries (${maxAttempts}) exceeded. Adding to DLQ.`,
        );
        
        await addToDLQ(
          this.dlqQueue,
          job.id || '',
          contractId,
          tenantId,
          data.userId,
          data,
          error instanceof Error ? error : new Error(errorMessage),
          currentAttempts,
          maxAttempts,
          {
            analysisId,
            contentLength: content.length,
          },
        );

        // Emit final failure event
        this.emitEvent(tenantId, 'analysis_failed_permanent', {
          contractId,
          analysisId,
          status: 'FAILED_PERMANENT',
          error: errorMessage,
          message: 'Job moved to dead letter queue. Admin intervention required.',
        });
      } else {
        // Emit retry event (will be retried by BullMQ)
        this.emitEvent(tenantId, 'analysis_failed', {
          contractId,
          analysisId,
          status: 'FAILED',
          error: errorMessage,
          attempt: currentAttempts,
          maxAttempts,
        });
      }

      // Re-throw to trigger job retry (unless max retries exceeded)
      throw error;
    }
  }

  /**
   * Event handlers for worker lifecycle
   */
  private attachEventHandlers(): void {
    this.worker.on('completed', (job) => {
      this.logger.log(`✅ Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `❌ Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Worker error: ${err.message}`);
    });
  }

  /**
   * Map risk level string to RiskLevel enum
   */
  private mapRiskLevel(level: string): 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const mapping: Record<string, 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
      SAFE: 'SAFE',
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      critical: 'CRITICAL',
    };
    return mapping[level] || 'MEDIUM';
  }

  /**
   * Emit WebSocket event (will be connected later)
   */
  private emitEvent(tenantId: string, event: string, data: any): void {
    if (this.websocketGateway) {
      this.websocketGateway.emitToTenant(tenantId, event, data);
    } else {
      this.logger.debug(
        `[WebSocket] Event ${event} queued (gateway not attached yet)`,
      );
    }
  }

  /**
   * Inject WebSocket gateway for event emission
   */
  public attachWebSocketGateway(gateway: any): void {
    this.websocketGateway = gateway;
    this.logger.log('WebSocket gateway attached');
  }

  /**
   * Start processing
   */
  public async start(): Promise<void> {
    this.logger.log('Worker started, listening for jobs...');
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    this.logger.log('Worker shutting down...');
    await this.worker.close();
  }

  /**
   * Get worker stats
   */
  public getStats(): any {
    return {
      isRunning: !this.worker.isPaused(),
      concurrency: this.worker.opts.concurrency,
    };
  }
}
