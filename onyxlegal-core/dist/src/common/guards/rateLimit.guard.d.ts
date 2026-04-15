import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
export declare class RateLimitGuard implements CanActivate {
    private prisma;
    private logger;
    private requestCounts;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private incrementAndGet;
    resetLimits(): void;
}
