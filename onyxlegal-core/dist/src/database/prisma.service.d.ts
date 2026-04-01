import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get tenant(): import("../../generated/prisma/models").TenantDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get user(): import("../../generated/prisma/models").UserDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get template(): import("../../generated/prisma/models").TemplateDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get contract(): import("../../generated/prisma/models").ContractDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get contractVersion(): import("../../generated/prisma/models").ContractVersionDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get clause(): import("../../generated/prisma/models").ClauseDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get aIAnalysis(): import("../../generated/prisma/models").AIAnalysisDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get riskFinding(): import("../../generated/prisma/models").RiskFindingDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get notification(): import("../../generated/prisma/models").NotificationDelegate<import("@prisma/client/runtime/client").InternalArgs, {
        omit: import("../../generated/prisma/internal/prismaNamespace").GlobalOmitConfig | undefined;
    }>;
    get $transaction(): {
        <P extends import("../../generated/prisma/internal/prismaNamespace").PrismaPromise<any>[]>(arg: [...P], options?: {
            isolationLevel?: import("../../generated/prisma/internal/prismaNamespace").TransactionIsolationLevel;
        }): import("@prisma/client/runtime/client").JsPromise<import("@prisma/client/runtime/client").UnwrapTuple<P>>;
        <R>(fn: (prisma: Omit<import("../../generated/prisma/internal/class").PrismaClient, import("@prisma/client/runtime/client").ITXClientDenyList>) => import("@prisma/client/runtime/client").JsPromise<R>, options?: {
            maxWait?: number;
            timeout?: number;
            isolationLevel?: import("../../generated/prisma/internal/prismaNamespace").TransactionIsolationLevel;
        }): import("@prisma/client/runtime/client").JsPromise<R>;
    };
    get $queryRaw(): <T = unknown>(query: TemplateStringsArray | import("../../generated/prisma/internal/prismaNamespace").Sql, ...values: any[]) => import("../../generated/prisma/internal/prismaNamespace").PrismaPromise<T>;
    get $executeRaw(): <T = unknown>(query: TemplateStringsArray | import("../../generated/prisma/internal/prismaNamespace").Sql, ...values: any[]) => import("../../generated/prisma/internal/prismaNamespace").PrismaPromise<number>;
}
