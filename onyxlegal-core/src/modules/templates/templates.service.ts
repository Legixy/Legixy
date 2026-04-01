import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TemplateCategory } from 'generated/prisma/client';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List templates: system templates + tenant's custom templates
   */
  async findAll(tenantId: string, category?: string) {
    return this.prisma.template.findMany({
      where: {
        OR: [
          { isSystem: true },
          { tenantId },
        ],
        ...(category && { category: category as TemplateCategory }),
      },
      orderBy: [{ isSystem: 'desc' }, { usageCount: 'desc' }],
    });
  }

  /**
   * Get single template with clause blocks
   */
  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.template.findFirst({
      where: {
        id,
        OR: [{ isSystem: true }, { tenantId }],
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }

  /**
   * Seed system templates — called once during setup.
   * Idempotent — skips if templates already exist.
   */
  async seedSystemTemplates() {
    const count = await this.prisma.template.count({
      where: { isSystem: true },
    });

    if (count > 0) {
      this.logger.log(`System templates already exist (${count} found). Skipping seed.`);
      return { seeded: false, count };
    }

    const systemTemplates = [
      {
        category: TemplateCategory.VENDOR_AGREEMENT,
        name: 'Master Vendor Agreement',
        description:
          'Establish robust terms for services, IP ownership, and deliverables with external contractors.',
        riskScore: 98,
        socialProof: 'Used by 850+ B2B SaaS startups',
        clauseBlocks: JSON.stringify([
          {
            type: 'PAYMENT_TERMS',
            label: 'Payment Terms',
            defaultText:
              'Client shall pay within 30 days of invoice. Late payments accrue 1.5% monthly interest.',
          },
          {
            type: 'IP_OWNERSHIP',
            label: 'IP Ownership',
            defaultText:
              'All deliverables remain vendor-owned until full payment. Perpetual license granted upon receipt.',
          },
          {
            type: 'LIABILITY',
            label: 'Liability Cap',
            defaultText:
              'Maximum liability capped at 2× total contract value. Excludes gross negligence.',
          },
          {
            type: 'CONFIDENTIALITY',
            label: 'Confidentiality',
            defaultText:
              'Both parties agree to protect disclosed confidential information for 3 years post-termination.',
          },
          {
            type: 'TERMINATION',
            label: 'Termination',
            defaultText:
              'Either party may terminate with 30 days written notice. Immediate termination for material breach.',
          },
          {
            type: 'GOVERNING_LAW',
            label: 'Governing Law',
            defaultText:
              'Governed by Indian Contract Act 1872. Disputes subject to arbitration in Mumbai.',
          },
        ]),
      },
      {
        category: TemplateCategory.NDA,
        name: 'Non-Disclosure Agreement',
        description:
          'Protect IP when sharing sensitive information. Configurable for mutual or one-way protection.',
        riskScore: 95,
        socialProof: 'Used by 1,200+ similar companies',
        clauseBlocks: JSON.stringify([
          {
            type: 'CONFIDENTIALITY',
            label: 'Confidentiality Scope',
            defaultText:
              'Both parties agree to protect disclosed information for 3 years post-termination. Includes trade secrets, business plans, and technical data.',
          },
          {
            type: 'OTHER',
            label: 'Permitted Use',
            defaultText:
              'Confidential information may only be used for the purpose of evaluating a potential business relationship.',
          },
          {
            type: 'OTHER',
            label: 'Exceptions',
            defaultText:
              'Does not apply to publicly available information, independently developed information, or disclosures required by law.',
          },
          {
            type: 'TERMINATION',
            label: 'Term & Survival',
            defaultText:
              'This agreement shall remain in effect for 2 years from the date of signing. Confidentiality obligations survive termination.',
          },
          {
            type: 'GOVERNING_LAW',
            label: 'Governing Law',
            defaultText:
              'Governed by Indian Contract Act 1872. Courts of New Delhi shall have exclusive jurisdiction.',
          },
        ]),
      },
      {
        category: TemplateCategory.EMPLOYMENT_OFFER,
        name: 'Employment Offer Letter',
        description:
          'A legally robust offer protecting both the startup and new hire, compliant with local labor laws.',
        riskScore: 99,
        socialProof: 'Used by 2,400+ tech startups',
        clauseBlocks: JSON.stringify([
          {
            type: 'PAYMENT_TERMS',
            label: 'Compensation',
            defaultText:
              'Base salary as specified in Annexure A, plus variable component. Salary reviewed annually. ESOP vesting over 4 years with 1-year cliff.',
          },
          {
            type: 'NON_COMPETE',
            label: 'Non-Compete',
            defaultText:
              '6-month non-compete within same industry and geography post-employment. Note: Enforceability limited under Indian Contract Act Section 27.',
          },
          {
            type: 'CONFIDENTIALITY',
            label: 'Confidentiality & IP Assignment',
            defaultText:
              'All work product created during employment belongs to the company. Employee agrees to assign all IP rights. Confidentiality survives termination.',
          },
          {
            type: 'TERMINATION',
            label: 'Probation & Termination',
            defaultText:
              '90-day probation period with mutual 15-day termination rights. Post-probation: 30-day notice or payment in lieu.',
          },
          {
            type: 'GOVERNING_LAW',
            label: 'Governing Law',
            defaultText:
              'Subject to Indian labor laws and Industrial Disputes Act 1947. Disputes handled by labor court of appropriate jurisdiction.',
          },
        ]),
      },
    ];

    await this.prisma.template.createMany({
      data: systemTemplates.map((t) => ({
        ...t,
        isSystem: true,
        tenantId: null,
      })),
    });

    this.logger.log(`Seeded ${systemTemplates.length} system templates`);
    return { seeded: true, count: systemTemplates.length };
  }
}
