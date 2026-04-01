import { TemplatesService } from './templates.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    findAll(user: AuthenticatedUser, category?: string): Promise<{
        id: string;
        tenantId: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        riskScore: number;
        category: import("../../../generated/prisma/enums").TemplateCategory;
        description: string | null;
        clauseBlocks: import("@prisma/client/runtime/client").JsonValue;
        isSystem: boolean;
        usageCount: number;
        socialProof: string | null;
    }[]>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        tenantId: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        riskScore: number;
        category: import("../../../generated/prisma/enums").TemplateCategory;
        description: string | null;
        clauseBlocks: import("@prisma/client/runtime/client").JsonValue;
        isSystem: boolean;
        usageCount: number;
        socialProof: string | null;
    }>;
    seed(): Promise<{
        seeded: boolean;
        count: number;
    }>;
}
