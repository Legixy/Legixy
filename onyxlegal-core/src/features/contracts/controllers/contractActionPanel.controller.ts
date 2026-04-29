import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RiskFormatterService, RiskSummary } from '../services/riskFormatter.service';
import { ContractFixService, FixResult, BulkFixResult } from '../services/contractFix.service';
import { ContractHistoryService, VersionTimeline, VersionInfo } from '../services/contractHistory.service';
import { PrismaService } from '../../../database/prisma.service';
import { RiskLevel } from '@prisma/client';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../modules/auth/jwt.strategy';

export interface ContractActionResponse {
  contractId: string;
  title: string;
  status: string;
  riskScore: number;
  riskSummary: RiskSummary;
  progress: {
    pendingFixes: number;
    fixedCount: number;
    progressPercent: number;
  };
  actionItems: Array<{
    id: string;
    severity: string;
    action: string;
    estimatedTime: string;
  }>;
}

@Controller('api/contracts')
export class ContractActionPanelController {
  private logger = new Logger(ContractActionPanelController.name);

  constructor(
    private prisma: PrismaService,
    private riskFormatter: RiskFormatterService,
    private contractFix: ContractFixService,
    private contractHistory: ContractHistoryService,
  ) {}

  @Get(':contractId/action-panel')
  async getActionPanel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ): Promise<ContractActionResponse> {
    this.logger.debug(
      `Fetching action panel for contract ${contractId} (tenant: ${user.tenantId})`,
    );

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { clauses: true },
    });

    if (!contract || contract.tenantId !== user.tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    const riskSummary = this.riskFormatter.summarizeRisks(
      contract.clauses.map((c) => ({
        level: c.riskLevel,
        title: c.type,
        reason: c.riskReason || '',
        suggestion: c.suggestedText || '',
        impact: c.estimatedImpact ? Number(c.estimatedImpact) : undefined,
      })),
    );

    const fixStats = await this.contractFix.getFixStats(contractId, user.tenantId);
    const actionItems = this.buildActionItems(riskSummary);

    return {
      contractId,
      title: contract.title,
      status: contract.status,
      riskScore: contract.riskScore || 100,
      riskSummary,
      progress: {
        pendingFixes: fixStats.pendingFixes,
        fixedCount: fixStats.fixedClauses,
        progressPercent: fixStats.fixingProgress,
      },
      actionItems,
    };
  }

  @Get(':contractId/risk-summary')
  async getRiskSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ): Promise<RiskSummary> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { clauses: true },
    });

    if (!contract || contract.tenantId !== user.tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    return this.riskFormatter.summarizeRisks(
      contract.clauses.map((c) => ({
        level: c.riskLevel,
        title: c.type,
        reason: c.riskReason || '',
        suggestion: c.suggestedText || '',
        impact: c.estimatedImpact ? Number(c.estimatedImpact) : undefined,
      })),
    );
  }

  @Post(':contractId/fix-clause/:clauseId')
  @HttpCode(200)
  async applySingleFix(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Param('clauseId') clauseId: string,
    @Body() body: { riskLevels?: string[] },
  ): Promise<FixResult & { newRiskScore: number }> {
    this.logger.log(
      `User ${user.id} applying fix to clause ${clauseId} in contract ${contractId}`,
    );

    const result = await this.contractFix.applySingleFix({
      contractId,
      clauseId,
      tenantId: user.tenantId,
      userId: user.id,
    });

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { riskScore: true },
    });

    return { ...result, newRiskScore: contract?.riskScore || 0 };
  }

  @Post(':contractId/fix-all')
  @HttpCode(200)
  async applyBulkFixes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Body() body: { riskLevels?: string[] },
  ): Promise<BulkFixResult> {
    this.logger.log(`User ${user.id} applying bulk fixes to contract ${contractId}`);

    return this.contractFix.applyBulkFixes({
      contractId,
      tenantId: user.tenantId,
      userId: user.id,
      riskLevels: body.riskLevels as RiskLevel[] | undefined,
    });
  }

  @Post(':contractId/undo-fixes')
  @HttpCode(200)
  async undoFixes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Body() body: { versionNumber?: number },
  ): Promise<{ success: boolean; restoredVersion: number }> {
    this.logger.log(`User ${user.id} undoing fixes on contract ${contractId}`);

    return this.contractFix.undoFixes(contractId, user.tenantId, user.id, body.versionNumber);
  }

  @Get(':contractId/version-history')
  async getVersionHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ): Promise<VersionTimeline> {
    return this.contractHistory.getHistory(contractId, user.tenantId);
  }

  @Post(':contractId/restore-version/:versionNumber')
  @HttpCode(200)
  async restoreVersion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
    @Param('versionNumber') versionNumber: number,
  ): Promise<VersionInfo> {
    this.logger.log(
      `User ${user.id} restoring contract ${contractId} to version ${versionNumber}`,
    );

    return this.contractHistory.restoreVersion(
      contractId,
      versionNumber,
      user.tenantId,
      user.id,
    );
  }

  @Get(':contractId/progress')
  async getProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId') contractId: string,
  ) {
    const stats = await this.contractFix.getFixStats(contractId, user.tenantId);

    return {
      contractId,
      totalClauses: stats.totalClauses,
      fixedClauses: stats.fixedClauses,
      pendingFixes: stats.pendingFixes,
      criticalPending: stats.criticalPending,
      progressPercent: stats.fixingProgress,
      fixingComplete: stats.pendingFixes === 0,
      readyForReview: stats.criticalPending === 0,
    };
  }

  private buildActionItems(
    riskSummary: RiskSummary,
  ): Array<{ id: string; severity: string; action: string; estimatedTime: string }> {
    const items: Array<{ id: string; severity: string; action: string; estimatedTime: string }> = [];

    if (riskSummary.critical > 0) {
      items.push({
        id: 'critical-action',
        severity: 'dealbreaker',
        action: `🚨 CRITICAL: ${riskSummary.critical} clause(s) pose deal-breaking risk. Requires legal review.`,
        estimatedTime: '30 min',
      });
    }

    if (riskSummary.high > 0) {
      items.push({
        id: 'high-action',
        severity: 'fixAsap',
        action: `🔴 Fix ASAP: ${riskSummary.high} high-risk clause(s). Click "Fix All" to apply suggestions.`,
        estimatedTime: '10 min',
      });
    }

    if (riskSummary.medium > 0) {
      items.push({
        id: 'medium-action',
        severity: 'fix',
        action: `🟡 Consider: ${riskSummary.medium} medium-risk clause(s) with suggested improvements.`,
        estimatedTime: '5 min',
      });
    }

    if (riskSummary.fixableSoonCount > 1) {
      items.push({
        id: 'bulk-fix',
        severity: 'fix',
        action: `⚡ Bulk Fix: Apply all ${riskSummary.fixableSoonCount} suggestions at once (1 click).`,
        estimatedTime: '1 min',
      });
    }

    if (riskSummary.needsLawyerReviewCount > 0) {
      items.push({
        id: 'lawyer-review',
        severity: 'dealbreaker',
        action: `📞 Legal Team: ${riskSummary.needsLawyerReviewCount} item(s) require expert legal review.`,
        estimatedTime: '1-2 days',
      });
    }

    if (items.length === 0) {
      items.push({
        id: 'contract-ready',
        severity: 'ignore',
        action: '✅ Contract looks good! Ready to download, send for signing, or finalize.',
        estimatedTime: '0 min',
      });
    }

    return items;
  }
}
