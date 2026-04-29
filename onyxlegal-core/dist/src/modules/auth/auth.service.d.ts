import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { Plan, UserRole } from 'generated/prisma/client';
interface SignupInput {
    supabaseId: string;
    email: string;
    name: string;
    companyName: string;
}
interface RegisterInput {
    email: string;
    password: string;
    name: string;
    companyName: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService);
    register(input: RegisterInput): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
        };
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
        };
    }>;
    signup(input: SignupInput): Promise<{
        user: {
            id: string;
            name: string | null;
            createdAt: Date;
            updatedAt: Date;
            supabaseId: string | null;
            tenantId: string;
            email: string;
            avatarUrl: string | null;
            role: UserRole;
            password: string | null;
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
    getProfile(userId: string): Promise<({
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
        supabaseId: string | null;
        tenantId: string;
        email: string;
        avatarUrl: string | null;
        role: UserRole;
        password: string | null;
    }) | null>;
    private issueToken;
}
export {};
