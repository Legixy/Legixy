import { PrismaService } from '../../database/prisma.service';
import { CreateContractDto, UpdateContractDto, UpdateStatusDto, ListContractsQueryDto } from './dto/contract.dto';
import { ContractStatus } from 'generated/prisma/client';
export declare class ContractsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private readonly validTransitions;
    create(tenantId: string, userId: string, dto: CreateContractDto): Promise<{
        template: {
            id: string;
            name: string;
            category: import("generated/prisma/client").TemplateCategory;
        } | null;
        createdBy: {
            id: string;
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        riskScore: number | null;
        templateId: string | null;
        createdById: string;
        title: string;
        status: ContractStatus;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
    }>;
    findAll(tenantId: string, query: ListContractsQueryDto): Promise<{
        data: ({
            template: {
                id: string;
                name: string;
                category: import("generated/prisma/client").TemplateCategory;
            } | null;
            _count: {
                analyses: number;
            };
            createdBy: {
                id: string;
                name: string | null;
                email: string;
            };
            clauses: {
                id: string;
                type: import("generated/prisma/client").ClauseType;
                riskLevel: import("generated/prisma/client").RiskLevel;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            riskScore: number | null;
            templateId: string | null;
            createdById: string;
            title: string;
            status: ContractStatus;
            parties: import("@prisma/client/runtime/client").JsonValue;
            content: string | null;
            contractValue: import("@prisma/client-runtime-utils").Decimal | null;
            currency: string;
            monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
            effectiveDate: Date | null;
            expirationDate: Date | null;
            signedAt: Date | null;
            lastReviewedAt: Date | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(tenantId: string, id: string): Promise<{
        template: {
            id: string;
            name: string;
            category: import("generated/prisma/client").TemplateCategory;
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
            type: import("generated/prisma/client").ClauseType;
            section: string | null;
            originalText: string;
            suggestedText: string | null;
            riskLevel: import("generated/prisma/client").RiskLevel;
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
                analysisId: string;
                severity: import("generated/prisma/client").RiskLevel;
                clause: string;
                impact: string;
                suggestion: string;
                legalRef: string | null;
                estimatedRisk: import("@prisma/client-runtime-utils").Decimal | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            status: import("generated/prisma/client").AnalysisStatus;
            contractId: string;
            type: import("generated/prisma/client").AnalysisType;
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
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        riskScore: number | null;
        templateId: string | null;
        createdById: string;
        title: string;
        status: ContractStatus;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
    }>;
    update(tenantId: string, id: string, userId: string, dto: UpdateContractDto): Promise<{
        template: {
            id: string;
            name: string;
            category: import("generated/prisma/client").TemplateCategory;
        } | null;
        createdBy: {
            id: string;
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        riskScore: number | null;
        templateId: string | null;
        createdById: string;
        title: string;
        status: ContractStatus;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
    }>;
    updateStatus(tenantId: string, id: string, dto: UpdateStatusDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        riskScore: number | null;
        templateId: string | null;
        createdById: string;
        title: string;
        status: ContractStatus;
        parties: import("@prisma/client/runtime/client").JsonValue;
        content: string | null;
        contractValue: import("@prisma/client-runtime-utils").Decimal | null;
        currency: string;
        monthlyImpact: import("@prisma/client-runtime-utils").Decimal | null;
        effectiveDate: Date | null;
        expirationDate: Date | null;
        signedAt: Date | null;
        lastReviewedAt: Date | null;
    }>;
    acceptClauseFix(tenantId: string, contractId: string, clauseId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        contractId: string;
        type: import("generated/prisma/client").ClauseType;
        section: string | null;
        originalText: string;
        suggestedText: string | null;
        riskLevel: import("generated/prisma/client").RiskLevel;
        riskReason: string | null;
        estimatedImpact: import("@prisma/client-runtime-utils").Decimal | null;
        impactPeriod: string | null;
        isAccepted: boolean;
    }>;
    getDashboardStats(tenantId: string): Promise<{
        totalContracts: number;
        activeContracts: number;
        draftContracts: number;
        highRiskClauses: number;
        analysesThisMonth: number;
    }>;
}
