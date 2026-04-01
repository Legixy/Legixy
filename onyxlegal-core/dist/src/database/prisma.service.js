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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("../../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
let PrismaService = PrismaService_1 = class PrismaService {
    config;
    logger = new common_1.Logger(PrismaService_1.name);
    client;
    constructor(config) {
        this.config = config;
        const databaseUrl = this.config.get('DATABASE_URL', '');
        let connectionString;
        try {
            const url = new URL(databaseUrl.replace('prisma+postgres://', 'http://'));
            const apiKey = url.searchParams.get('api_key') || '';
            const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
            connectionString = decoded.databaseUrl;
        }
        catch {
            connectionString = databaseUrl;
        }
        const adapter = new adapter_pg_1.PrismaPg({ connectionString });
        this.client = new client_1.PrismaClient({ adapter });
    }
    async onModuleInit() {
        await this.client.$connect();
        this.logger.log('Database connected');
    }
    async onModuleDestroy() {
        await this.client.$disconnect();
        this.logger.log('Database disconnected');
    }
    get tenant() { return this.client.tenant; }
    get user() { return this.client.user; }
    get template() { return this.client.template; }
    get contract() { return this.client.contract; }
    get contractVersion() { return this.client.contractVersion; }
    get clause() { return this.client.clause; }
    get aIAnalysis() { return this.client.aIAnalysis; }
    get riskFinding() { return this.client.riskFinding; }
    get notification() { return this.client.notification; }
    get $transaction() { return this.client.$transaction.bind(this.client); }
    get $queryRaw() { return this.client.$queryRaw.bind(this.client); }
    get $executeRaw() { return this.client.$executeRaw.bind(this.client); }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map