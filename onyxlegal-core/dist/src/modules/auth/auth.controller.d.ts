import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { AuthenticatedUser } from './jwt.strategy';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
            supabaseId: string;
            tenantId: string;
            email: string;
            name: string | null;
            avatarUrl: string | null;
            role: import("../../../generated/prisma/enums").UserRole;
            createdAt: Date;
            updatedAt: Date;
        }) | null;
    }>;
}
