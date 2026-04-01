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
            email: string;
            name: string | null;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        templateId: string | null;
        content: string | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdById: string;
    }>;
    findAll(user: AuthenticatedUser, query: ListContractsQueryDto): Promise<{
        data: ({
            _count: {
                analyses: number;
            };
            template: {
                id: string;
                name: string;
                category: import("../../../generated/prisma/enums").TemplateCategory;
            } | null;
            createdBy: {
                id: string;
                email: string;
                name: string | null;
            };
            clauses: {
                id: string;
                type: import("../../../generated/prisma/enums").ClauseType;
                riskLevel: import("../../../generated/prisma/enums").RiskLevel;
            }[];
        } & {
            id: string;
            tenantId: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            templateId: string | null;
            content: string | null;
            parties: import("@prisma/client/runtime/client").JsonValue;
            contractValue: import("@prisma/client-runtime-utils").Decimal | null;
            currency: string;
            effectiveDate: Date | null;
            expirationDate: Date | null;
            status: import("../../../generated/prisma/enums").ContractStatus;
            riskScore: number | null;
            monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
            signedAt: Date | null;
            lastReviewedAt: Date | null;
            createdById: string;
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
            email: string;
            name: string | null;
        };
        versions: {
            id: string;
            createdAt: Date;
            changeNote: string | null;
            version: number;
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
                createdAt: Date;
                title: string;
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
            createdAt: Date;
            status: import("../../../generated/prisma/enums").AnalysisStatus;
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
        createdAt: Date;
        updatedAt: Date;
        title: string;
        templateId: string | null;
        content: string | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdById: string;
    }>;
    update(user: AuthenticatedUser, id: string, dto: UpdateContractDto): Promise<{
        template: {
            id: string;
            name: string;
            category: import("../../../generated/prisma/enums").TemplateCategory;
        } | null;
        createdBy: {
            id: string;
            email: string;
            name: string | null;
        };
    } & {
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        templateId: string | null;
        content: string | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdById: string;
    }>;
    updateStatus(user: AuthenticatedUser, id: string, dto: UpdateStatusDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        templateId: string | null;
        content: string | null;
        parties: import("@prisma/client/runtime/client").JsonValue;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        status: import("../../../generated/prisma/enums").ContractStatus;
        riskScore: number | null;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
        createdById: string;
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
}
