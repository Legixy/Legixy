import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AnalysisStatus, AnalysisType } from 'generated/prisma/client';
import { AIEngine } from '../../features/ai/services/aiEngine';
import { getDLQEntries, removeFromDLQ } from '../../features/ai/queues/deadLetterQueue';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private readonly aiEngine: AIEngine;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('contract-analysis') private readonly analysisQueue: Queue,
    @InjectQueue('contract-analysis-dlq') private readonly dlqQueue: Queue,
  ) {
    this.aiEngine = new AIEngine();
  }

  /**
   * Trigger AI analysis on a contract.
   * Creates an AIAnalysis record and enqueues the job.
   */
  async triggerAnalysis(tenantId: string, contractId: string) {
    // Verify contract exists and belongs to tenant
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    if (!contract.content) {
      throw new BadRequestException('Contract has no content to analyze');
    }

    // Check tenant token budget
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (tenant && tenant.aiTokensUsed >= tenant.aiTokenLimit) {
      throw new BadRequestException(
        'AI token limit reached for this billing cycle. Upgrade your plan for more analysis.',
      );
    }

    // Check if analysis is already in progress
    const existingJob = await this.prisma.aIAnalysis.findFirst({
      where: {
        contractId,
        status: { in: [AnalysisStatus.QUEUED, AnalysisStatus.PROCESSING] },
      },
    });

    if (existingJob) {
      return {
        message: 'Analysis already in progress',
        analysisId: existingJob.id,
        status: existingJob.status,
      };
    }

    // Create analysis record
    const analysis = await this.prisma.aIAnalysis.create({
      data: {
        contractId,
        type: AnalysisType.QUICK_SCAN,
        status: AnalysisStatus.QUEUED,
      },
    });

    // Enqueue the job
    await this.analysisQueue.add(
      'analyze-contract',
      {
        analysisId: analysis.id,
        contractId,
        tenantId,
        content: contract.content,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Analysis queued: ${analysis.id} for contract ${contractId}`);

    return {
      message: 'Analysis queued successfully',
      analysisId: analysis.id,
      status: 'QUEUED',
    };
  }

  /**
   * Perform synchronous AI analysis (direct call, no queue)
   * Used for quick operations that don't need async processing
   */
  async analyzeContractDirect(contractId: string, contractText: string) {
    try {
      this.logger.log(`🚀 Starting direct contract analysis for ${contractId}`);

      const result = await this.aiEngine.analyzeContract(contractText, contractId);

      this.logger.log(
        `✅ Direct analysis complete: ${result.analysis.risks.length} risks found`,
      );

      return {
        success: result.success,
        analysis: result.analysis,
        tokensUsed: result.tokensUsed,
        duration: result.duration,
        chunksProcessed: result.chunksProcessed,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Direct analysis failed: ${errorMsg}`);

      throw new BadRequestException(
        `Contract analysis failed: ${errorMsg}`,
      );
    }
  }

  /**
   * Generate improved clause (direct call)
   */
  async generateClauseFixDirect(clause: string, issue: string) {
    try {
      this.logger.log(`🔧 Generating clause fix`);

      const result = await this.aiEngine.generateClauseFix(clause, issue);

      this.logger.log(
        `✅ Clause fix generated with confidence: ${result.fix.confidence}`,
      );

      return {
        success: result.success,
        fix: result.fix,
        tokensUsed: result.tokensUsed,
        duration: result.duration,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Clause fix generation failed: ${errorMsg}`);

      throw new BadRequestException(
        `Clause fix generation failed: ${errorMsg}`,
      );
    }
  }

  /**
   * Check compliance (direct call)
   */
  async checkComplianceDirect(contractText: string, contractId?: string) {
    try {
      this.logger.log(
        `✔️ Checking compliance${contractId ? ` for ${contractId}` : ''}`,
      );

      const result = await this.aiEngine.checkCompliance(contractText, contractId);

      this.logger.log(
        `✅ Compliance check complete: ${result.check.compliant ? 'compliant' : 'non-compliant'}`,
      );

      return {
        success: result.success,
        check: result.check,
        tokensUsed: result.tokensUsed,
        duration: result.duration,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Compliance check failed: ${errorMsg}`);

      throw new BadRequestException(
        `Compliance check failed: ${errorMsg}`,
      );
    }
  }

  /**
   * Get AI token statistics
   */
  getTokenStats() {
    return this.aiEngine.getTokenStats();
  }

  /**
   * Get analysis results for a contract.
   */
  async getAnalysisResults(tenantId: string, contractId: string) {
    // Verify contract ownership
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    });
    if (!contract) throw new BadRequestException('Contract not found');

    const analyses = await this.prisma.aIAnalysis.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
      include: {
        riskFindings: {
          orderBy: { severity: 'desc' },
        },
      },
    });

    return {
      contractId,
      analyses,
    };
  }

  /**
   * Get auto-fix suggestions (accepted=false clauses with suggestions).
   */
  async getSuggestions(tenantId: string, contractId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    });
    if (!contract) throw new BadRequestException('Contract not found');

    const suggestions = await this.prisma.clause.findMany({
      where: {
        contractId,
        suggestedText: { not: null },
        isAccepted: false,
        riskLevel: { in: ['MEDIUM', 'HIGH', 'CRITICAL'] },
      },
      orderBy: { riskLevel: 'desc' },
    });

    return { contractId, suggestions };
  }

  /**
   * Get queue statistics for monitoring
   */
  async getQueueStats() {
    try {
      const counts = await this.analysisQueue.getJobCounts();
      const workers = await this.analysisQueue.getWorkers();

      return {
        queue: {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        },
        workers: {
          count: workers.length,
          isPaused: await this.analysisQueue.isPaused(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error}`);
      return {
        queue: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
        workers: {
          count: 0,
          isPaused: false,
        },
        error: 'Failed to fetch queue stats',
      };
    }
  }

  /**
   * Get analysis status
   */
  async getAnalysisStatus(analysisId: string) {
    const analysis = await this.prisma.aIAnalysis.findUnique({
      where: { id: analysisId },
      include: {
        riskFindings: {
          orderBy: { severity: 'desc' },
        },
      },
    });

    if (!analysis) {
      throw new BadRequestException('Analysis not found');
    }

    return {
      id: analysis.id,
      status: analysis.status,
      type: analysis.type,
      startedAt: analysis.startedAt,
      completedAt: analysis.completedAt,
      tokensUsed: analysis.tokensUsed,
      processingMs: analysis.processingMs,
      errorMessage: analysis.errorMessage,
      retryCount: analysis.retryCount,
      riskFindings: analysis.riskFindings,
    };
  }

  /**
   * Cancel an analysis job
   */
  async cancelAnalysis(analysisId: string) {
    const analysis = await this.prisma.aIAnalysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new BadRequestException('Analysis not found');
    }

    if (analysis.status === AnalysisStatus.COMPLETED || analysis.status === AnalysisStatus.FAILED) {
      throw new BadRequestException(
        `Cannot cancel ${analysis.status.toLowerCase()} analysis`,
      );
    }

    // Remove from queue
    const job = await this.analysisQueue.getJob(`analysis-${analysisId}`);
    if (job) {
      await job.remove();
    }

    // Update status
    await this.prisma.aIAnalysis.update({
      where: { id: analysisId },
      data: {
        status: AnalysisStatus.FAILED,
        errorMessage: 'Analysis cancelled by user',
      },
    });

    return { message: 'Analysis cancelled successfully' };
  }

  /**
   * Admin endpoint: Retry a failed job from the DLQ.
   * Fetches the job from DLQ, re-adds it to the main queue, and removes it from DLQ.
   */
  async adminRetryJob(tenantId: string, jobId: string) {
    this.logger.log(`[Admin] Retrying job ${jobId} from DLQ for tenant ${tenantId}`);

    // Get all DLQ entries for this tenant to verify authorization
    const dlqEntries = await getDLQEntries(this.dlqQueue, tenantId);
    const dlqEntry = dlqEntries.find((entry) => entry.jobId === jobId);

    if (!dlqEntry) {
      throw new BadRequestException(
        `Job ${jobId} not found in DLQ for this tenant`,
      );
    }

    try {
      // Re-add job to the main queue with fresh attempts
      const requeuedJob = await this.analysisQueue.add(
        'analyze-contract',
        dlqEntry.originalData,
        {
          jobId: `${dlqEntry.contractId}-${Date.now()}`, // Fresh job ID
          attempts: 3, // Reset attempts
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        `[Admin] Job ${jobId} re-queued with new ID ${requeuedJob.id}`,
      );

      // Update AIAnalysis record
      await this.prisma.aIAnalysis.update({
        where: { id: dlqEntry.originalData.analysisId },
        data: {
          status: AnalysisStatus.QUEUED,
          retryCount: 0, // Reset retry counter
          errorMessage: null,
        },
      });

      // Remove from DLQ
      await removeFromDLQ(this.dlqQueue, jobId);
      this.logger.log(`[Admin] Job ${jobId} removed from DLQ`);

      return {
        message: 'Job successfully re-queued',
        originalJobId: jobId,
        newJobId: requeuedJob.id,
        contractId: dlqEntry.contractId,
        status: 'REQUEUED',
      };
    } catch (error) {
      this.logger.error(
        `[Admin] Failed to retry job ${jobId}: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      throw new BadRequestException(
        `Failed to retry job: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Admin endpoint: Get all failed jobs in DLQ for current tenant.
   */
  async adminGetDLQJobs(tenantId: string) {
    try {
      const dlqEntries = await getDLQEntries(this.dlqQueue, tenantId);
      return {
        count: dlqEntries.length,
        jobs: dlqEntries.map((entry) => ({
          jobId: entry.jobId,
          contractId: entry.contractId,
          userId: entry.userId,
          error: entry.error.message,
          attempts: entry.attempts,
          maxAttempts: entry.maxAttempts,
          failedAt: entry.failedAt,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get DLQ jobs: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
      throw new BadRequestException('Failed to fetch DLQ entries');
    }
  }
}

