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

/**
 * CONTRACT ACTION PANEL CONTROLLER
 *
 * Main API for user-facing contract workflows:
 * - Get risk summary with actionable items
 * - Apply single or bulk fixes
 * - Manage version history
 * - Track fixing progress
 *
 * Integration Notes:
 * - Add @UseGuards(AuthGuard) and extract @CurrentUser() decorator when wiring
 * - Pass tenantId/userId via body or extract from authenticated user context
 */

export interface UserContext {
  id: string;
  tenantId: string;
}

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

  /**
   * GET /api/contracts/:contractId/action-panel
   *
   * Fetch everything needed for the action panel UI:
   * - Risk summary (simplified language)
   * - Status & progress
   * - Suggested actions
   * - Quick stats
   *
   * TODO: Add @UseGuards(AuthGuard) decorator and @CurrentUser() extraction
   */
  @Get(':contractId/action-panel')
  async getActionPanel(
    @Param('contractId') contractId: string,
    @Body() body: { tenantId: string; userId: string },
  ): Promise<ContractActionResponse> {
    const user: UserContext = { id: body.userId, tenantId: body.tenantId };

    this.logger.debug(
      `Fetching action panel for contract ${contractId} (tenant: ${user.tenantId})`,
    );

    // Get contract with all data
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        clauses: true,
      },
    });

    if (!contract || contract.tenantId !== user.tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    // Get risk summary from formatter
    const riskSummary = this.riskFormatter.summarizeRisks(
      contract.clauses.map((c) => ({
        level: c.riskLevel,
        title: c.type,
        reason: c.riskReason || '',
        suggestion: c.suggestedText || '',
        impact: c.estimatedImpact ? Number(c.estimatedImpact) : undefined,
      })),
    );

    // Get fix stats
    const fixStats = await this.contractFix.getFixStats(contractId, user.tenantId);

    // Build action items
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

  /**
   * GET /api/contracts/:contractId/risk-summary
   *
   * Get simplified risk overview
   * Used to populate the risk badge on contract list
   */
  @Get(':contractId/risk-summary')
  async getRiskSummary(
    @Param('contractId') contractId: string,
    @Body() body: { tenantId: string },
  ): Promise<RiskSummary> {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { clauses: true },
    });

    if (!contract || contract.tenantId !== body.tenantId) {
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

  /**
   * POST /api/contracts/:contractId/fix-clause/:clauseId
   *
   * Apply a single AI-suggested fix to one clause
   * Returns: Updated clause, new risk score, change details
   */
  @Post(':contractId/fix-clause/:clauseId')
  @HttpCode(200)
  async applySingleFix(
    @Param('contractId') contractId: string,
    @Param('clauseId') clauseId: string,
    @Body() body: { tenantId: string; userId: string },
  ): Promise<FixResult & { newRiskScore: number }> {
    this.logger.log(
      `User ${body.userId} applying fix to clause ${clauseId} in contract ${contractId}`,
    );

    const result = await this.contractFix.applySingleFix({
      contractId,
      clauseId,
      tenantId: body.tenantId,
      userId: body.userId,
    });

    // Get updated risk score
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      select: { riskScore: true },
    });

    return {
      ...result,
      newRiskScore: contract?.riskScore || 0,
    };
  }

  /**
   * POST /api/contracts/:contractId/fix-all
   *
   * Apply all suggested fixes at once (bulk operation)
   * Optional: Filter by risk level (CRITICAL, HIGH, MEDIUM only)
   *
   * Returns: Summary of applied fixes, risk reduction percentage, savings estimate
   */
  @Post(':contractId/fix-all')
  @HttpCode(200)
  async applyBulkFixes(
    @Param('contractId') contractId: string,
    @Body()
    body: {
      tenantId: string;
      userId: string;
      riskLevels?: string[]; // Optional: only fix these levels
    },
  ): Promise<BulkFixResult> {
    this.logger.log(`User ${body.userId} applying bulk fixes to contract ${contractId}`);

    return this.contractFix.applyBulkFixes({
      contractId,
      tenantId: body.tenantId,
      userId: body.userId,
      riskLevels: body.riskLevels as RiskLevel[] | undefined,
    });
  }

  /**
   * POST /api/contracts/:contractId/undo-fixes
   *
   * Restore contract to previous version before fixes were applied
   * Optional: Restore to specific version number
   */
  @Post(':contractId/undo-fixes')
  @HttpCode(200)
  async undoFixes(
    @Param('contractId') contractId: string,
    @Body() body: { tenantId: string; userId: string; versionNumber?: number },
  ): Promise<{ success: boolean; restoredVersion: number }> {
    this.logger.log(`User ${body.userId} undoing fixes on contract ${contractId}`);

    return this.contractFix.undoFixes(
      contractId,
      body.tenantId,
      body.userId,
      body.versionNumber,
    );
  }

  /**
   * GET /api/contracts/:contractId/version-history
   *
   * Get full version timeline
   * Used for "Track Changes" feature - shows all modifications
   */
  @Get(':contractId/version-history')
  async getVersionHistory(
    @Param('contractId') contractId: string,
    @Body() body: { tenantId: string },
  ): Promise<VersionTimeline> {
    return this.contractHistory.getHistory(contractId, body.tenantId);
  }

  /**
   * POST /api/contracts/:contractId/restore-version/:versionNumber
   *
   * Restore contract to a specific previous version
   * Creates new version entry for audit trail
   */
  @Post(':contractId/restore-version/:versionNumber')
  @HttpCode(200)
  async restoreVersion(
    @Param('contractId') contractId: string,
    @Param('versionNumber') versionNumber: number,
    @Body() body: { tenantId: string; userId: string },
  ): Promise<VersionInfo> {
    this.logger.log(
      `User ${body.userId} restoring contract ${contractId} to version ${versionNumber}`,
    );

    return this.contractHistory.restoreVersion(
      contractId,
      versionNumber,
      body.tenantId,
      body.userId,
    );
  }

  /**
   * GET /api/contracts/:contractId/progress
   *
   * Get fixing progress (for progress bar in UI)
   * Shows: total clauses, fixed, pending, critical pending, percentage complete
   */
  @Get(':contractId/progress')
  async getProgress(
    @Param('contractId') contractId: string,
    @Body() body: { tenantId: string },
  ) {
    const stats = await this.contractFix.getFixStats(contractId, body.tenantId);

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

  // ============ PRIVATE HELPERS ============

  /**
   * Build actionable items for the UI based on risk summary
   * Returns prioritized list of actions user should take
   */
  private buildActionItems(
    riskSummary: RiskSummary,
  ): Array<{ id: string; severity: string; action: string; estimatedTime: string }> {
    const items: Array<{ id: string; severity: string; action: string; estimatedTime: string }> =
      [];

    // CRITICAL - Deal-breaking issues
    if (riskSummary.critical > 0) {
      items.push({
        id: 'critical-action',
        severity: 'dealbreaker',
        action: `🚨 CRITICAL: ${riskSummary.critical} clause(s) pose deal-breaking risk. Requires legal review.`,
        estimatedTime: '30 min',
      });
    }

    // HIGH - Fix immediately
    if (riskSummary.high > 0) {
      items.push({
        id: 'high-action',
        severity: 'fixAsap',
        action: `🔴 Fix ASAP: ${riskSummary.high} high-risk clause(s). Click "Fix All" to apply suggestions.`,
        estimatedTime: '10 min',
      });
    }

    // MEDIUM - Consider fixing
    if (riskSummary.medium > 0) {
      items.push({
        id: 'medium-action',
        severity: 'fix',
        action: `🟡 Consider: ${riskSummary.medium} medium-risk clause(s) with suggested improvements.`,
        estimatedTime: '5 min',
      });
    }

    // Bulk fix option
    if (riskSummary.fixableSoonCount > 0 && riskSummary.fixableSoonCount > 1) {
      items.push({
        id: 'bulk-fix',
        severity: 'fix',
        action: `⚡ Bulk Fix: Apply all ${riskSummary.fixableSoonCount} suggestions at once (1 click).`,
        estimatedTime: '1 min',
      });
    }

    // Lawyer review needed
    if (riskSummary.needsLawyerReviewCount > 0) {
      items.push({
        id: 'lawyer-review',
        severity: 'dealbreaker',
        action: `📞 Legal Team: ${riskSummary.needsLawyerReviewCount} item(s) require expert legal review.`,
        estimatedTime: '1-2 days',
      });
    }

    // Contract ready
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
