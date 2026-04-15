import { PrismaService } from '../../database/prisma.service';
import { TemplateCategory } from 'generated/prisma/client';
export declare class TemplatesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(tenantId: string, category?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        category: TemplateCategory;
        description: string | null;
        riskScore: number;
        clauseBlocks: import("@prisma/client/runtime/client").JsonValue;
        isSystem: boolean;
        usageCount: number;
        socialProof: string | null;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string | null;
        category: TemplateCategory;
        description: string | null;
        riskScore: number;
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
