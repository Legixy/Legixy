"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const LIMITS_BY_PLAN = {
    FREE: { perHour: 10, perMonth: 100 },
    STARTER: { perHour: 50, perMonth: 1000 },
    GROWTH: { perHour: 200, perMonth: 5000 },
    BUSINESS: { perHour: -1, perMonth: -1 },
};
let RateLimitGuard = class RateLimitGuard {
    prisma;
    logger = new common_1.Logger('RateLimitGuard');
    requestCounts = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            return true;
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { plan: true },
        });
        if (!tenant) {
            this.logger.warn(`Tenant ${user.tenantId} not found`);
            return true;
        }
        const limits = LIMITS_BY_PLAN[tenant.plan];
        if (!limits) {
            this.logger.warn(`Unknown plan: ${tenant.plan}`);
            return true;
        }
        if (limits.perHour === -1 && limits.perMonth === -1) {
            return true;
        }
        if (limits.perHour > 0) {
            const hourlyKey = `rl:hourly:${user.tenantId}:${Math.floor(Date.now() / 3600000)}`;
            const hourlyCount = await this.incrementAndGet(hourlyKey, 3600);
            if (hourlyCount > limits.perHour) {
                this.logger.warn(`Tenant ${user.tenantId} exceeded hourly limit: ${hourlyCount}/${limits.perHour}`);
                throw new common_1.ForbiddenException(`Rate limit exceeded: ${hourlyCount}/${limits.perHour} analyses per hour. Upgrade your plan.`);
            }
        }
        if (limits.perMonth > 0) {
            const now = new Date();
            const monthlyKey = `rl:monthly:${user.tenantId}:${now.getFullYear()}-${now.getMonth()}`;
            const monthlyCount = await this.incrementAndGet(monthlyKey, 2592000);
            if (monthlyCount > limits.perMonth) {
                this.logger.warn(`Tenant ${user.tenantId} exceeded monthly limit: ${monthlyCount}/${limits.perMonth}`);
                throw new common_1.ForbiddenException(`Monthly rate limit exceeded: ${monthlyCount}/${limits.perMonth} analyses. Upgrade your plan.`);
            }
        }
        return true;
    }
    async incrementAndGet(key, ttlSeconds) {
        const now = Date.now();
        const entry = this.requestCounts.get(key);
        if (!entry || entry.resetTime < now) {
            this.requestCounts.set(key, {
                count: 1,
                resetTime: now + ttlSeconds * 1000,
            });
            return 1;
        }
        entry.count++;
        return entry.count;
    }
    resetLimits() {
        this.requestCounts.clear();
        this.logger.log('Rate limits reset');
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RateLimitGuard);
//# sourceMappingURL=rateLimit.guard.js.map