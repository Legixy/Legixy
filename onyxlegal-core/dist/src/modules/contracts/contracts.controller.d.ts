import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, UpdateStatusDto, ListContractsQueryDto } from './dto/contract.dto';
import { AuthenticatedUser } from '../auth/jwt.strategy';
export declare class ContractsController {
    private readonly contractsService;
    constructor(contractsService: ContractsService);
    create(user: AuthenticatedUser, dto: CreateContractDto): Promise<{
        template: {
            id: string;
            name: string;
            category: import("../../../generated/prisma/enums").TemplateCategory;
        } | null;
        createdBy: {
            id: string;
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        tenantId: string;
        templateId: string | null;
        createdById: string;
        title: string;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(user: AuthenticatedUser, query: ListContractsQueryDto): Promise<{
        data: ({
            template: {
                id: string;
                name: string;
                category: import("../../../generated/prisma/enums").TemplateCategory;
            } | null;
            createdBy: {
                id: string;
                name: string | null;
                email: string;
            };
            clauses: {
                id: string;
                type: import("../../../generated/prisma/enums").ClauseType;
                riskLevel: import("../../../generated/prisma/enums").RiskLevel;
            }[];
            _count: {
                analyses: number;
            };
        } & {
            id: string;
            tenantId: string;
            templateId: string | null;
            createdById: string;
            title: string;
            status: import("../../../generated/prisma/enums").ContractStatus;
            riskScore: number | null;
            parties: import("@prisma/client/runtime/client").JsonValue;
            content: string | null;
            contractValue: import("@prisma/client-runtime-utils").Decimal | null;
            currency: string;
            monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expirationDate: Date | null;
            signedAt: Date | null;
            lastReviewedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(user: AuthenticatedUser): Promise<{
        totalContracts: number;
        activeContracts: number;
        draftContracts: number;
        highRiskClauses: number;
        analysesThisMonth: number;
    }>;
    findOne(user: AuthenticatedUser, id: string): Promise<{
        template: {
            id: string;
            name: string;
            category: import("../../../generated/prisma/enums").TemplateCategory;
        } | null;
        createdBy: {
            id: string;
            name: string | null;
            email: string;
        };
        versions: {
            id: string;
            createdAt: Date;
            version: number;
            changeNote: string | null;
            changedBy: string;
        }[];
        clauses: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            contractId: string;
            type: import("../../../generated/prisma/enums").ClauseType;
            section: string | null;
            originalText: string;
            suggestedText: string | null;
            riskLevel: import("../../../generated/prisma/enums").RiskLevel;
            riskReason: string | null;
            estimatedImpact: import("@prisma/client-runtime-utils").Decimal | null;
            impactPeriod: string | null;
            isAccepted: boolean;
        }[];
        analyses: ({
            riskFindings: {
                id: string;
                title: string;
                createdAt: Date;
                clause: string;
                severity: import("../../../generated/prisma/enums").RiskLevel;
                analysisId: string;
                impact: string;
                suggestion: string;
                legalRef: string | null;
                estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
            }[];
        } & {
            id: string;
            status: import("../../../generated/prisma/enums").AnalysisStatus;
            createdAt: Date;
            contractId: string;
            type: import("../../../generated/prisma/enums").AnalysisType;
            tokensUsed: number;
            modelUsed: string | null;
            processingMs: number | null;
            errorMessage: string | null;
            retryCount: number;
            startedAt: Date | null;
            completedAt: Date | null;
        })[];
    } & {
        id: string;
        tenantId: string;
        templateId: string | null;
        createdById: string;
        title: string;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateContractDto): Promise<{
        template: {
            id: string;
            name: string;
            category: import("../../../generated/prisma/enums").TemplateCategory;
        } | null;
        createdBy: {
            id: string;
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        tenantId: string;
        templateId: string | null;
        createdById: string;
        title: string;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(user: AuthenticatedUser, id: string, dto: UpdateStatusDto): Promise<{
        id: string;
        tenantId: string;
        templateId: string | null;
        createdById: string;
        title: string;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    acceptFix(user: AuthenticatedUser, contractId: string, clauseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        contractId: string;
        type: import("../../../generated/prisma/enums").ClauseType;
        section: string | null;
        originalText: string;
        suggestedText: string | null;
        riskLevel: import("../../../generated/prisma/enums").RiskLevel;
        riskReason: string | null;
        estimatedImpact: import("@prisma/client-runtime-utils").Decimal | null;
        impactPeriod: string | null;
        isAccepted: boolean;
    }>;
    getVersions(user: AuthenticatedUser, id: string): Promise<{
        id: string;
        content: string;
        createdAt: Date;
        version: number;
        contractId: string;
        changeNote: string | null;
        changedBy: string;
    }[]>;
    restoreVersion(user: AuthenticatedUser, id: string, body: {
        versionId?: string;
        versionNumber?: number;
    }): Promise<{
        success: boolean;
        newVersion: {
            id: string;
            content: string;
            createdAt: Date;
            version: number;
            contractId: string;
            changeNote: string | null;
            changedBy: string;
        };
    }>;
}
