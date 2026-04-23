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
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            supabaseId: string;
            tenantId: string;
            email: string;
            avatarUrl: string | null;
            role: UserRole;
        };
        tenant: {
            id: string;
            domain: string | null;
            name: string;
            plan: Plan;
            aiTokensUsed: number;
            aiTokenLimit: number;
            billingCycleStart: Date;
            createdAt: Date;
            updatedAt: Date;
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
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        supabaseId: string;
        tenantId: string;
        email: string;
        avatarUrl: string | null;
        role: UserRole;
    }) | null>;
}
export {};
