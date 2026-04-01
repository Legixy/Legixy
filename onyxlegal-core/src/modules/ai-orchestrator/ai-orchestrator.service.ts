import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AnalysisStatus, AnalysisType } from 'generated/prisma/client';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('contract-analysis') private readonly analysisQueue: Queue,
  ) {}

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
}
