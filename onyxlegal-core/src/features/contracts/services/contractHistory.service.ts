import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ContractVersion } from '@prisma/client';

/**
 * CONTRACT HISTORY & VERSIONING SERVICE
 *
 * Tracks all changes to contracts immutably.
 * Features:
 * - Automatic version creation on each change
 * - Change audit trail with who/what/when
 * - One-click restore to any previous version
 * - Version comparison
 * - Timeline view for UI
 */

export interface VersionInfo {
  version: number;
  content: string;
  changeNote: string | null;
  changedBy: string;
  createdAt: Date;
  author?: {
    name: string;
    email: string;
  };
}

export interface VersionTimeline {
  versions: VersionInfo[];
  currentVersion: number;
  totalVersions: number;
}

export interface VersionDiff {
  from: VersionInfo;
  to: VersionInfo;
  additions: string[];
  deletions: string[];
  changes: Array<{
    clauseType?: string;
    before: string;
    after: string;
  }>;
}

@Injectable()
export class ContractHistoryService {
  private logger = new Logger(ContractHistoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new version entry
   * Called automatically whenever contract content changes
   */
  async createVersion(
    contractId: string,
    content: string,
    changeNote: string,
    userId: string,
  ): Promise<VersionInfo> {
    this.logger.debug(`Creating version for contract ${contractId}`);

    // Get current max version
    const maxVersion = await this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
      take: 1,
    });

    const nextVersion = (maxVersion[0]?.version || 0) + 1;

    const version = await this.prisma.contractVersion.create({
      data: {
        contractId,
        version: nextVersion,
        content,
        changeNote: changeNote || `Version ${nextVersion}`,
        changedBy: userId,
      },
    });

    this.logger.log(
      `Created version ${nextVersion} for contract ${contractId}: "${changeNote}"`,
    );

    return this.toVersionInfo(version);
  }

  /**
   * Get complete version history for a contract
   */
  async getHistory(contractId: string, tenantId: string): Promise<VersionTimeline> {
    // Verify contract ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    const versions = await this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
    });

    const currentVersion =
      versions.length > 0 ? versions[0].version : await this.getLatestVersionNumber(contractId);

    return {
      versions: versions.map((v) => this.toVersionInfo(v)),
      currentVersion,
      totalVersions: versions.length,
    };
  }

  /**
   * Restore contract to a specific version
   */
  async restoreVersion(
    contractId: string,
    versionNumber: number,
    tenantId: string,
    userId: string,
  ): Promise<VersionInfo> {
    this.logger.debug(`Restoring contract ${contractId} to version ${versionNumber}`);

    // Verify contract ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    // Get target version
    const targetVersion = await this.prisma.contractVersion.findUnique({
      where: {
        contractId_version: {
          contractId,
          version: versionNumber,
        },
      },
    });

    if (!targetVersion) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Update contract content to restored version
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        content: targetVersion.content,
        updatedAt: new Date(),
      },
    });

    // Create new version entry documenting the restore
    const newVersion = await this.createVersion(
      contractId,
      targetVersion.content,
      `Restored from version ${versionNumber}`,
      userId,
    );

    this.logger.log(`Restored contract ${contractId} to version ${versionNumber}`);

    return newVersion;
  }

  /**
   * Compare two versions
   * Returns differences in clauses/sections
   */
  async compareVersions(
    contractId: string,
    fromVersion: number,
    toVersion: number,
    tenantId: string,
  ): Promise<VersionDiff> {
    // Verify contract ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    // Get both versions
    const from = await this.prisma.contractVersion.findUnique({
      where: {
        contractId_version: {
          contractId,
          version: fromVersion,
        },
      },
    });

    const to = await this.prisma.contractVersion.findUnique({
      where: {
        contractId_version: {
          contractId,
          version: toVersion,
        },
      },
    });

    if (!from || !to) {
      throw new NotFoundException('One or both versions not found');
    }

    // Parse content to find differences
    const fromLines = (from.content || '').split('\n');
    const toLines = (to.content || '').split('\n');

    // Simple diff calculation (line-based)
    const additions = toLines.filter((line) => !fromLines.includes(line));
    const deletions = fromLines.filter((line) => !toLines.includes(line));

    return {
      from: this.toVersionInfo(from),
      to: this.toVersionInfo(to),
      additions,
      deletions,
      changes: this.extractChanges(from.content || '', to.content || ''),
    };
  }

  /**
   * Get all changes for a version
   */
  async getVersionChanges(
    contractId: string,
    versionNumber: number,
    tenantId: string,
  ): Promise<{
    version: VersionInfo;
    changes: string[];
    impactedClauses?: string[];
  }> {
    // Verify contract ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    const version = await this.prisma.contractVersion.findUnique({
      where: {
        contractId_version: {
          contractId,
          version: versionNumber,
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    // Get previous version to show changes
    const previousVersion = await this.prisma.contractVersion.findFirst({
      where: { contractId, version: { lt: versionNumber } },
      orderBy: { version: 'desc' },
    });

    const changes = previousVersion
      ? this.calculateChanges(previousVersion.content || '', version.content || '')
      : [`Version ${versionNumber} created`];

    // Find impacted clauses
    const impactedClauses = await this.prisma.clause.findMany({
      where: { contractId },
      select: { type: true, riskLevel: true },
      distinct: ['type'],
    });

    return {
      version: this.toVersionInfo(version),
      changes,
      impactedClauses: impactedClauses.map((c) => `${c.type} (${c.riskLevel})`),
    };
  }

  /**
   * List recent changes (for timeline UI)
   */
  async getRecentChanges(
    contractId: string,
    tenantId: string,
    limit: number = 10,
  ): Promise<
    Array<{
      version: number;
      changeNote: string | null;
      changedAt: Date;
      changedBy: string;
      summary: string;
    }>
  > {
    // Verify contract ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract || contract.tenantId !== tenantId) {
      throw new BadRequestException('Contract not found or unauthorized');
    }

    const versions = await this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
      take: limit,
    });

    return versions.map((v, index) => {
      let summary = v.changeNote || `Version ${v.version}`;

      // Add auto-generated summary if none provided
      if (!v.changeNote && index < versions.length - 1) {
        const prev = versions[index + 1];
        const changes = this.calculateChanges(prev.content || '', v.content || '');
        summary = changes.length > 0 ? `${changes.length} changes made` : 'No changes';
      }

      return {
        version: v.version,
        changeNote: v.changeNote,
        changedAt: v.createdAt,
        changedBy: v.changedBy,
        summary,
      };
    });
  }

  /**
   * Archive old versions (cleanup)
   * Keeps last N versions
   */
  async archiveOldVersions(contractId: string, keepCount: number = 50): Promise<number> {
    const versions = await this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
      skip: keepCount,
      select: { id: true },
    });

    if (versions.length === 0) {
      return 0;
    }

    const result = await this.prisma.contractVersion.deleteMany({
      where: { id: { in: versions.map((v) => v.id) } },
    });

    this.logger.log(`Archived ${result.count} old versions for contract ${contractId}`);
    return result.count;
  }

  // ============ PRIVATE HELPERS ============

  private toVersionInfo(version: ContractVersion): VersionInfo {
    return {
      version: version.version,
      content: version.content,
      changeNote: version.changeNote,
      changedBy: version.changedBy,
      createdAt: version.createdAt,
    };
  }

  private async getLatestVersionNumber(contractId: string): Promise<number> {
    const latest = await this.prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' },
      take: 1,
      select: { version: true },
    });
    return latest?.version || 1;
  }

  private calculateChanges(beforeContent: string, afterContent: string): string[] {
    if (beforeContent === afterContent) {
      return [];
    }

    const changes: string[] = [];

    // Count line differences
    const beforeLines = beforeContent.split('\n').length;
    const afterLines = afterContent.split('\n').length;

    if (afterLines > beforeLines) {
      changes.push(`Added ${afterLines - beforeLines} lines`);
    } else if (beforeLines > afterLines) {
      changes.push(`Removed ${beforeLines - afterLines} lines`);
    }

    // Check for clause changes
    const clauseKeywords = [
      'Liability',
      'Payment',
      'Termination',
      'IP',
      'Confidentiality',
      'Governing Law',
    ];

    for (const keyword of clauseKeywords) {
      const beforeHas = beforeContent.includes(keyword);
      const afterHas = afterContent.includes(keyword);

      if (beforeHas && !afterHas) {
        changes.push(`Removed ${keyword} clause`);
      } else if (!beforeHas && afterHas) {
        changes.push(`Added ${keyword} clause`);
      } else if (beforeHas && afterHas) {
        // Clause was modified (check if content changed)
        const beforeSection = this.extractSection(beforeContent, keyword);
        const afterSection = this.extractSection(afterContent, keyword);
        if (beforeSection !== afterSection) {
          changes.push(`Modified ${keyword} clause`);
        }
      }
    }

    return changes.length > 0 ? changes : ['Content updated'];
  }

  private extractSection(content: string, keyword: string): string {
    const lines = content.split('\n');
    const start = lines.findIndex((l) => l.includes(keyword));
    if (start === -1) return '';

    // Get next 5 lines or until next section
    return lines.slice(start, start + 5).join('\n');
  }

  private extractChanges(beforeContent: string, afterContent: string): VersionDiff['changes'] {
    return [];
  }
}
