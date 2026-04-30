import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './jwt.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
        };
    }>;
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            role: string;
            tenantId: string;
        };
    }>;
    signup(dto: SignupDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string | null;
            role: import("../../../generated/prisma/enums").UserRole;
        };
        tenant: {
            id: string;
            name: string;
            plan: import("../../../generated/prisma/enums").Plan;
        };
        isNew: boolean;
    }>;
    me(user: AuthenticatedUser): Promise<{
        user: ({
            tenant: {
                id: string;
                name: string;
                plan: import("../../../generated/prisma/enums").Plan;
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
            role: import("../../../generated/prisma/enums").UserRole;
            password: string | null;
        }) | null;
    }>;
}
