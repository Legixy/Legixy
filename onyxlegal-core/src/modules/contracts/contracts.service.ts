import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
import * as mammoth from 'mammoth';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateContractDto,
  UpdateContractDto,
  UpdateStatusDto,
  ListContractsQueryDto,
} from './dto/contract.dto';
import { ContractStatus, Prisma } from 'generated/prisma/client';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Valid lifecycle transitions ────────────────────────────────
  private readonly validTransitions: Record<ContractStatus, ContractStatus[]> = {
    DRAFT: [ContractStatus.IN_REVIEW, ContractStatus.TERMINATED],
    IN_REVIEW: [ContractStatus.SENT, ContractStatus.DRAFT, ContractStatus.TERMINATED],
    SENT: [ContractStatus.SIGNED, ContractStatus.IN_REVIEW, ContractStatus.TERMINATED],
    SIGNED: [ContractStatus.ACTIVE, ContractStatus.TERMINATED],
    ACTIVE: [ContractStatus.EXPIRED, ContractStatus.TERMINATED],
    EXPIRED: [ContractStatus.TERMINATED],
    TERMINATED: [],
  };

  /**
   * Create a new contract for a tenant.
   */
  async create(tenantId: string, userId: string, dto: CreateContractDto) {
    const contract = await this.prisma.contract.create({
      data: {
        tenantId,
        createdById: userId,
        title: dto.title,
        templateId: dto.templateId || null,
        content: dto.content || null,
        parties: dto.parties ? JSON.parse(JSON.stringify(dto.parties)) : [],
        contractValue: dto.contractValue
          ? new Prisma.Decimal(dto.contractValue)
          : null,
        currency: dto.currency || 'INR',
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : null,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : null,
      },
      include: {
        template: { select: { id: true, name: true, category: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // If there's content, create initial version
    if (dto.content) {
      await this.prisma.contractVersion.create({
        data: {
          contractId: contract.id,
          version: 1,
          content: dto.content,
          changeNote: 'Initial draft',
          changedBy: userId,
        },
      });
    }

    // Increment template usage counter
    if (dto.templateId) {
      await this.prisma.template.update({
        where: { id: dto.templateId },
        data: { usageCount: { increment: 1 } },
      });
    }

    this.logger.log(`Contract "${dto.title}" created by user ${userId}`);
    return contract;
  }

  /**
   * List contracts with pagination, filtering, and search.
   * Automatically scoped to tenant.
   */
  async findAll(tenantId: string, query: ListContractsQueryDto) {
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {
      tenantId,
      ...(status && { status: status as ContractStatus }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          template: { select: { id: true, name: true, category: true } },
          createdBy: { select: { id: true, name: true, email: true } },
          clauses: {
            select: { id: true, type: true, riskLevel: true },
          },
          _count: { select: { analyses: true } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      data: contracts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single contract with full details.
   */
  async findOne(tenantId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: {
        template: { select: { id: true, name: true, category: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        clauses: { orderBy: { createdAt: 'asc' } },
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            riskFindings: true,
          },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 10,
          select: {
            id: true,
            version: true,
            changeNote: true,
            changedBy: true,
            createdAt: true,
          },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    return contract;
  }

  /**
   * Update contract — creates a new version if content changed.
   */
  async update(tenantId: string, id: string, userId: string, dto: UpdateContractDto) {
    const existing = await this.prisma.contract.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // Build update data
    const updateData: Prisma.ContractUpdateInput = {};
    if (dto.title) updateData.title = dto.title;
    if (dto.content) updateData.content = dto.content;
    if (dto.parties) updateData.parties = JSON.parse(JSON.stringify(dto.parties));
    if (dto.contractValue !== undefined) {
      updateData.contractValue = new Prisma.Decimal(dto.contractValue);
    }
    if (dto.effectiveDate) updateData.effectiveDate = new Date(dto.effectiveDate);
    if (dto.expirationDate) updateData.expirationDate = new Date(dto.expirationDate);
    updateData.lastReviewedAt = new Date();

    const contract = await this.prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        template: { select: { id: true, name: true, category: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // If content changed, create a new version
    if (dto.content) {
      const latestVersion = await this.prisma.contractVersion.findFirst({
        where: { contractId: id },
        orderBy: { version: 'desc' },
      });

      await this.prisma.contractVersion.create({
        data: {
          contractId: id,
          version: (latestVersion?.version || 0) + 1,
          content: dto.content,
          changeNote: dto.changeNote || 'Updated',
          changedBy: userId,
        },
      });
    }

    this.logger.log(`Contract ${id} updated by user ${userId}`);
    return contract;
  }

  /**
   * Move contract to a new lifecycle state.
   * Validates transition rules.
   */
  async updateStatus(tenantId: string, id: string, dto: UpdateStatusDto) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
    });

    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    const newStatus = dto.status as ContractStatus;
    const allowed = this.validTransitions[contract.status as ContractStatus];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${contract.status} to ${newStatus}. ` +
        `Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const updateData: Prisma.ContractUpdateInput = { status: newStatus };

    // Auto-set lifecycle dates
    if (newStatus === ContractStatus.SIGNED) {
      updateData.signedAt = new Date();
    }

    return this.prisma.contract.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Accept an AI suggestion on a clause.
   */
  async acceptClauseFix(tenantId: string, contractId: string, clauseId: string) {
    // Verify contract belongs to tenant
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    });
    if (!contract) throw new NotFoundException('Contract not found');

    const clause = await this.prisma.clause.findFirst({
      where: { id: clauseId, contractId },
    });
    if (!clause) throw new NotFoundException('Clause not found');
    if (!clause.suggestedText) {
      throw new BadRequestException('No AI suggestion available for this clause');
    }

    // Apply the fix
    return this.prisma.clause.update({
      where: { id: clauseId },
      data: {
        originalText: clause.suggestedText, // replace with suggested
        isAccepted: true,
        riskLevel: 'SAFE',
        riskReason: 'AI suggestion accepted by user',
      },
    });
  }

  /**
   * List all versions for a contract.
   */
  async getVersions(tenantId: string, contractId: string) {
    const contract = await this.prisma.contract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');

    return this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Restore a contract to a previous version — creates a new version for audit trail.
   */
  async restoreVersion(
    tenantId: string,
    userId: string,
    contractId: string,
    versionId?: string,
    versionNumber?: number,
  ) {
    const contract = await this.prisma.contract.findFirst({ where: { id: contractId, tenantId } });
    if (!contract) throw new NotFoundException('Contract not found');

    const target = versionId
      ? await this.prisma.contractVersion.findFirst({ where: { id: versionId, contractId } })
      : versionNumber
        ? await this.prisma.contractVersion.findFirst({ where: { contractId, version: versionNumber } })
        : null;

    if (!target) throw new NotFoundException('Version not found');

    const latest = await this.prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' },
    });

    const newVersion = await this.prisma.contractVersion.create({
      data: {
        contractId,
        version: (latest?.version || 0) + 1,
        content: target.content,
        changeNote: `Restored to version ${target.version}`,
        changedBy: userId,
      },
    });

    await this.prisma.contract.update({
      where: { id: contractId },
      data: { content: target.content },
    });

    return { success: true, newVersion };
  }

  /**
   * Dashboard stats for a tenant.
   */
  async getDashboardStats(tenantId: string) {
    const [
      totalContracts,
      activeContracts,
      draftContracts,
      highRiskCount,
      recentAnalyses,
    ] = await Promise.all([
      this.prisma.contract.count({ where: { tenantId } }),
      this.prisma.contract.count({
        where: { tenantId, status: ContractStatus.ACTIVE },
      }),
      this.prisma.contract.count({
        where: { tenantId, status: ContractStatus.DRAFT },
      }),
      this.prisma.clause.count({
        where: {
          contract: { tenantId },
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }),
      this.prisma.aIAnalysis.count({
        where: {
          contract: { tenantId },
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
          },
        },
      }),
    ]);

    return {
      totalContracts,
      activeContracts,
      draftContracts,
      highRiskClauses: highRiskCount,
      analysesThisMonth: recentAnalyses,
    };
  }

  /**
   * Create a contract from an uploaded PDF or DOCX file.
   * Extracts plain text, validates it is not a scanned image, then creates.
   */
  async createFromFile(
    tenantId: string,
    userId: string,
    file: Express.Multer.File,
    title?: string,
  ) {
    const isPdf = file.mimetype === 'application/pdf';
    let extractedText: string;
    let pageCount = 1;

    if (isPdf) {
      const parsed = await pdfParse(file.buffer);
      extractedText = parsed.text;
      pageCount = parsed.numpages || 1;

      // Scanned PDF check: reject if ≥50% of pages have <100 chars
      const charsPerPage = extractedText.length / pageCount;
      if (charsPerPage < 100 && pageCount > 1) {
        throw new BadRequestException(
          'This document appears to be a scanned image. Upload a text-based PDF or DOCX for best results.',
        );
      }
    } else {
      // DOCX
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    }

    if (!extractedText || extractedText.trim().length < 50) {
      throw new BadRequestException(
        "We couldn't read this file. Try a different PDF or DOCX.",
      );
    }

    const contractTitle =
      title?.trim() ||
      file.originalname.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' ');

    this.logger.log(
      `File upload: "${contractTitle}" (${file.size} bytes, ${extractedText.length} chars extracted)`,
    );

    return this.create(tenantId, userId, {
      title: contractTitle,
      content: extractedText,
    } as any);
  }
}
