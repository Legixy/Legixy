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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("../../../generated/prisma/client");
const bcrypt = require("bcrypt");
const BCRYPT_ROUNDS = 12;
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async register(input) {
        const existing = await this.prisma.user.findFirst({
            where: { email: input.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email already registered.');
        }
        const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
        const tenant = await this.prisma.tenant.create({
            data: { name: input.companyName, plan: client_1.Plan.FREE, aiTokenLimit: 5000 },
        });
        const user = await this.prisma.user.create({
            data: {
                tenantId: tenant.id,
                email: input.email,
                name: input.name,
                role: client_1.UserRole.OWNER,
                password: hash,
            },
        });
        this.logger.log(`Registered new user ${input.email} (tenant: ${tenant.id})`);
        return this.issueToken(user);
    }
    async login(email, password) {
        const user = await this.prisma.user.findFirst({ where: { email } });
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid email or password.');
        }
        return this.issueToken(user);
    }
    async signup(input) {
        const existing = await this.prisma.user.findUnique({
            where: { supabaseId: input.supabaseId },
            include: { tenant: true },
        });
        if (existing) {
            this.logger.log(`User ${input.email} already registered`);
            return { user: existing, tenant: existing.tenant, isNew: false };
        }
        const emailExists = await this.prisma.user.findFirst({
            where: { email: input.email },
        });
        if (emailExists) {
            throw new common_1.ConflictException('Email already registered with another organization.');
        }
        const tenant = await this.prisma.tenant.create({
            data: { name: input.companyName, plan: client_1.Plan.FREE, aiTokenLimit: 5000 },
        });
        const user = await this.prisma.user.create({
            data: {
                supabaseId: input.supabaseId,
                tenantId: tenant.id,
                email: input.email,
                name: input.name,
                role: client_1.UserRole.OWNER,
            },
        });
        this.logger.log(`Created tenant "${input.companyName}" for ${input.email}`);
        return { user, tenant, isNew: true };
    }
    async getProfile(userId) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                tenant: {
                    select: { id: true, name: true, plan: true, aiTokensUsed: true, aiTokenLimit: true },
                },
            },
        });
    }
    issueToken(user) {
        const payload = { sub: user.id, email: user.email, role: user.role, type: 'local' };
        const token = this.jwt.sign(payload);
        return {
            access_token: token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map