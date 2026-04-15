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
exports.AIModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
const aiEngine_1 = require("./services/aiEngine");
const contractAnalysis_worker_1 = require("./workers/contractAnalysis.worker");
const analysis_gateway_1 = require("./websocket/analysis.gateway");
const rateLimit_guard_1 = require("../../common/guards/rateLimit.guard");
let AIModule = class AIModule {
    configService;
    prisma;
    aiEngine;
    gateway;
    contractWorker;
    worker;
    wsGateway;
    constructor(configService, prisma, aiEngine, gateway, contractWorker) {
        this.configService = configService;
        this.prisma = prisma;
        this.aiEngine = aiEngine;
        this.gateway = gateway;
        this.contractWorker = contractWorker;
        this.wsGateway = gateway;
        this.worker = contractWorker;
    }
    async onModuleInit() {
        console.log('🚀 Initializing AI Module');
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        console.log('✅ AI Module initialized');
        console.log('   - BullMQ Queues: contract-analysis, clause-fix');
        console.log('   - Worker: ContractAnalysisWorker');
        console.log('   - WebSocket: AIAnalysisGateway');
        console.log('   - Rate Limiting: Enabled');
    }
    async onModuleDestroy() {
        console.log('🛑 Destroying AI Module');
        await this.worker.shutdown();
        console.log('✅ AI Module destroyed');
    }
};
exports.AIModule = AIModule;
exports.AIModule = AIModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'contract-analysis',
            }),
            bullmq_1.BullModule.registerQueue({
                name: 'clause-fix',
            }),
        ],
        providers: [
            aiEngine_1.AIEngine,
            contractAnalysis_worker_1.ContractAnalysisWorker,
            analysis_gateway_1.AIAnalysisGateway,
            rateLimit_guard_1.RateLimitGuard,
        ],
        exports: [
            aiEngine_1.AIEngine,
            contractAnalysis_worker_1.ContractAnalysisWorker,
            analysis_gateway_1.AIAnalysisGateway,
            rateLimit_guard_1.RateLimitGuard,
        ],
    }),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        aiEngine_1.AIEngine,
        analysis_gateway_1.AIAnalysisGateway,
        contractAnalysis_worker_1.ContractAnalysisWorker])
], AIModule);
//# sourceMappingURL=ai.module.js.map