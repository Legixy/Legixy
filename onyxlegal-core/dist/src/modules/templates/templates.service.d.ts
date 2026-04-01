import { PrismaService } from '../../database/prisma.service';
import { TemplateCategory } from 'generated/prisma/client';
export declare class TemplatesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, category?: string): Promise<{
        id: string;
        tenantId: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        riskScore: number;
        category: TemplateCategory;
        description: string | null;
        clauseBlocks: import("@prisma/client/runtime/client").JsonValue;
        isSystem: boolean;
        usageCount: number;
        socialProof: string | null;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        tenantId: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        riskScore: number;
        category: TemplateCategory;
        description: string | null;
        clauseBlocks: import("@prisma/client/runtime/client").JsonValue;
        isSystem: boolean;
        usageCount: number;
        socialProof: string | null;
    }>;
    seedSystemTemplates(): Promise<{
        seeded: boolean;
        count: number;
    }>;
}
