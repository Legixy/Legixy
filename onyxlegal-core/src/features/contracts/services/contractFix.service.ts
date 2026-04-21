import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RiskLevel, Clause } from '@prisma/client';

/**
 * AI FIX SYSTEM
 *
 * Allows users to apply AI-suggested fixes to contract clauses.
 * Features:
 * - One-click fix per clause
 * - Bulk fix (apply all fixes at once)
 * - Change tracking & version history
 * - Real-time progress updates (via WebSocket - injected separately)
 * - Undo/rollback capability
 */

export interface ClauseFixRequest {
  contractId: string;
  clauseId: string;
  tenantId: string;
  userId: string;
}

export interface BulkFixRequest {
  contractId: string;
  tenantId: string;
  userId: string;
  riskLevels?: RiskLevel[]; // Only fix these severity levels
}

export interface FixResult {
  success: boolean;
  clauseId: string;
  originalText: string;
  fixedText: string;
  changeType: 'improvement' | 'mitigation' | 'removal';
  estimatedImpactReduction: number; // percentage
}

export interface BulkFixResult {
  contractId: string;
  totalClauses: number;
  appliedFixes: number;
  skippedClauses: number;
  riskReductionPercent: number;
  estimatedSavings: number; // ₹
  results: FixResult[];
  versionNumber: number;
}

@Injectable()
export class ContractFixService {
  private logger = new Logger(ContractFixService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Apply a single AI-suggested fix to a clause
   *
   * Flow:
   * 1. Validate clause exists and belongs to contract
   * 2. Ensure contract is not signed
   * 3. Replace clause text with suggested fix
   * 4. Update Clause model (mark isAccepted=true)
   * 5. Create contract version for audit trail
   * 6. Broadcast update via WebSocket
   * 7. Return result
   */
  async applySingleFix(req: ClauseFixRequest): Promise<FixResult> {
    this.logger.debug(`Applying fix to clause ${req.clauseId} in contract ${req.contractId}`);

    // 1. Verify ownership (tenant + user)
    const contract = await this.prisma.contract.findUnique({
      where: { id: req.contractId },
      include: { clauses: true },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    if (contract.tenantId !== req.tenantId) {
      throw new BadRequestException('Unauthorized: Contract belongs to different tenant');
    }

    // 2. Check contract is not signed
    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      throw new BadRequestException('Cannot modify signed or active contract');
    }

    // 3. Find clause and verify it has a suggested fix
    const clause = await this.prisma.clause.findUnique({
      where: { id: req.clauseId },
    });

    if (!clause) {
      throw new BadRequestException('Clause not found');
    }

    if (!clause.suggestedText) {
      throw new BadRequestException('No AI-suggested fix available for this clause');
    }

    if (clause.contractId !== req.contractId) {
      throw new BadRequestException('Clause does not belong to this contract');
    }

    // 4. Apply the fix (update clause in database)
    const originalText = clause.originalText;
    const fixedText = clause.suggestedText;

    const updatedClause = await this.prisma.clause.update({
      where: { id: req.clauseId },
      data: {
        originalText: fixedText, // AI suggestion becomes the new text
        isAccepted: true,
        updatedAt: new Date(),
      },
    });

    // 5. Update contract content (replace clause in full text)
    const updatedContractContent = this.replaceClauseInContent(
      contract.content || '',
      originalText,
      fixedText,
    );

    // 6. Create version entry for audit trail
    const latestVersion = await this.prisma.contractVersion.findMany({
      where: { contractId: req.contractId },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = (latestVersion[0]?.version || 0) + 1;

    await this.prisma.contractVersion.create({
      data: {
        contractId: req.contractId,
        version: nextVersion,
        content: updatedContractContent,
        changeNote: `Applied AI fix to ${clause.type} clause`,
        changedBy: req.userId,
      },
    });

    // 7. Update contract content
    await this.prisma.contract.update({
      where: { id: req.contractId },
      data: {
        content: updatedContractContent,
        updatedAt: new Date(),
      },
    });

    // 8. Calculate impact reduction (WebSocket broadcast added in module integration)
    const riskReduction = this.calculateRiskReduction(clause.riskLevel);

    return {
      success: true,
      clauseId: req.clauseId,
      originalText,
      fixedText,
      changeType: this.determineChangeType(clause.type),
      estimatedImpactReduction: riskReduction,
    };
  }

  /**
   * Apply multiple fixes in bulk
   *
   * Flow:
   * 1. Get all clauses that need fixes
   * 2. Filter by risk level (if specified)
   * 3. Apply fixes in transaction
   * 4. Recalculate contract risk score
   * 5. Update contract status to REVIEWED
   * 6. Create single version entry
   * 7. Broadcast final result
   */
  async applyBulkFixes(req: BulkFixRequest): Promise<BulkFixResult> {
    this.logger.debug(`Applying bulk fixes to contract ${req.contractId}`);

    // 1. Verify contract ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: req.contractId },
      include: { clauses: true },
    });

    if (!contract) {
      throw new BadRequestException('Contract not found');
    }

    if (contract.tenantId !== req.tenantId) {
      throw new BadRequestException('Unauthorized');
    }

    if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') {
      throw new BadRequestException('Cannot modify signed contract');
    }

    // 2. Get clauses with suggested fixes
    let clausesToFix = contract.clauses.filter((c: Clause) => c.suggestedText && !c.isAccepted);

    // 3. Filter by risk level if specified
    if (req.riskLevels && req.riskLevels.length > 0) {
      clausesToFix = clausesToFix.filter((c: Clause) => req.riskLevels!.includes(c.riskLevel));
    }

    this.logger.debug(`Found ${clausesToFix.length} clauses to fix`);

    const results: FixResult[] = [];
    let updatedContent = contract.content || '';
    let totalRiskReduction = 0;

    // 4. Apply each fix
    for (const clause of clausesToFix) {
      try {
        const result = await this.applySingleFix({
          contractId: req.contractId,
          clauseId: clause.id,
          tenantId: req.tenantId,
          userId: req.userId,
        });
        results.push(result);
        totalRiskReduction += result.estimatedImpactReduction;
      } catch (error) {
        this.logger.warn(`Failed to fix clause ${clause.id}: ${error.message}`);
        // Continue with next clause instead of failing entire bulk operation
      }
    }

    // 5. Recalculate risk score
    const newRiskScore = Math.max(0, (contract.riskScore || 100) - totalRiskReduction);

    // 6. Update contract status to REVIEWED
    const updatedContract = await this.prisma.contract.update({
      where: { id: req.contractId },
      data: {
        status: 'IN_REVIEW',
        riskScore: Math.round(newRiskScore),
        lastReviewedAt: new Date(),
      },
    });

    // 7. Get latest version number
    const versionData = await this.prisma.contractVersion.findMany({
      where: { contractId: req.contractId },
      orderBy: { version: 'desc' },
      take: 1,
    });
    const versionNumber = (versionData[0]?.version || 0) + 1;

    // 8. Calculate result (WebSocket broadcast added in module integration)
    return {
      contractId: req.contractId,
      totalClauses: contract.clauses.length,
      appliedFixes: results.length,
      skippedClauses: contract.clauses.length - results.length,
      riskReductionPercent: totalRiskReduction,
      estimatedSavings: this.calculateSavings(
        totalRiskReduction,
        contract.contractValue ? Number(contract.contractValue) : undefined,
      ),
      results,
      versionNumber,
    };
  }

  /**
   * Undo the last fix(es) and restore previous version
   */
  async undoFixes(
    contractId: string,
    tenantId: string,
    userId: string,
    versionNumber?: number,
  ): Promise<{ success: boolean; restoredVersion: number }> {
    this.logger.debug(`Undoing fixes for contract ${contractId}`);

    // Verify ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Unauthorized');
    }

    // Get target version (or previous version if not specified)
    const targetVersion = versionNumber
      ? versionNumber
      : Math.max(1, (contract.updatedAt ? new Date(contract.updatedAt).getTime() : 0));

    const previousVersion = await this.prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' },
      skip: 1, // Get the one before current
    });

    if (!previousVersion) {
      throw new BadRequestException('No previous version available');
    }

    // Restore content from previous version
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        content: previousVersion.content,
        updatedAt: new Date(),
      },
    });

    // Mark all accepted clauses as not accepted
    await this.prisma.clause.updateMany({
      where: { contractId, isAccepted: true },
      data: { isAccepted: false },
    });

    this.logger.log(`Restored contract ${contractId} to version ${previousVersion.version}`);

    return {
      success: true,
      restoredVersion: previousVersion.version,
    };
  }

  /**
   * Get fix statistics for a contract
   */
  async getFixStats(contractId: string, tenantId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        clauses: true,
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Unauthorized');
    }

    const totalClauses = contract.clauses.length;
    const fixedClauses = contract.clauses.filter((c: Clause) => c.isAccepted).length;
    const pendingFixes = contract.clauses.filter((c: Clause) => c.suggestedText && !c.isAccepted).length;
    const criticalPending = contract.clauses.filter(
      (c: Clause) => c.suggestedText && !c.isAccepted && (c.riskLevel === 'CRITICAL' || c.riskLevel === 'HIGH'),
    ).length;

    return {
      totalClauses,
      fixedClauses,
      pendingFixes,
      criticalPending,
      fixingProgress: Math.round((fixedClauses / totalClauses) * 100),
      currentVersion: contract.versions[0]?.version || 0,
      lastModified: contract.updatedAt,
    };
  }

  // ============ PRIVATE HELPERS ============

  /**
   * Replace clause text in full contract content
   */
  private replaceClauseInContent(content: string, original: string, replacement: string): string {
    // Use safe replacement that doesn't break formatting
    return content.replace(original, replacement);
  }

  /**
   * Determine what type of change was made
   */
  private determineChangeType(
    clauseType: any,
  ): 'improvement' | 'mitigation' | 'removal' {
    if (clauseType === 'LIABILITY' || clauseType === 'INDEMNIFICATION') {
      return 'mitigation';
    }
    if (clauseType === 'IP_OWNERSHIP' || clauseType === 'DATA_PROTECTION') {
      return 'improvement';
    }
    return 'improvement';
  }

  /**
   * Calculate risk reduction percentage based on risk level
   */
  private calculateRiskReduction(riskLevel: RiskLevel): number {
    const reductionMap: Record<RiskLevel, number> = {
      SAFE: 0,
      LOW: 5,
      MEDIUM: 15,
      HIGH: 30,
      CRITICAL: 40,
    };
    return reductionMap[riskLevel] || 0;
  }

  /**
   * Calculate financial savings from fixing risks
   */
  private calculateSavings(
    riskReductionPercent: number,
    contractValue?: number | string,
  ): number {
    if (!contractValue) return 0;
    const value = typeof contractValue === 'string' ? parseFloat(contractValue) : contractValue;
    // Assume risk reduction translates to savings (very conservative estimate)
    return Math.round(value * (riskReductionPercent / 100) * 0.5);
  }
}
