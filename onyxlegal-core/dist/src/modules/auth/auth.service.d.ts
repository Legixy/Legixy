import { PrismaService } from '../../database/prisma.service';
import { Plan, UserRole } from 'generated/prisma/client';
interface SignupInput {
    supabaseId: string;
    email: string;
    name: string;
    companyName: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    signup(input: SignupInput): Promise<{
        user: {
            id: string;
            supabaseId: string;
            tenantId: string;
            email: string;
            name: string | null;
            avatarUrl: string | null;
            role: UserRole;
            createdAt: Date;
            updatedAt: Date;
        };
        tenant: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            plan: Plan;
            domain: string | null;
            aiTokensUsed: number;
            aiTokenLimit: number;
            billingCycleStart: Date;
        };
        isNew: boolean;
    }>;
    getProfile(supabaseId: string): Promise<({
        tenant: {
            id: string;
            name: string;
            plan: Plan;
            aiTokensUsed: number;
            aiTokenLimit: number;
        };
    } & {
        id: string;
        supabaseId: string;
        tenantId: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
}
export {};
