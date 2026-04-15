import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AnalysisStatus, AnalysisType } from 'generated/prisma/client';
import { AIEngine } from '../../features/ai/services/aiEngine';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private readonly aiEngine: AIEngine;

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('contract-analysis') private readonly analysisQueue: Queue,
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
}
