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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const contractAnalysis_worker_1 = require("./contractAnalysis.worker");
const analysis_gateway_1 = require("../websocket/analysis.gateway");
const aiEngine_1 = require("../services/aiEngine");
const prisma_service_1 = require("../../../database/prisma.service");
let WorkerService = WorkerService_1 = class WorkerService {
    config;
    gateway;
    prisma;
    aiEngine;
    dlqQueue;
    logger = new common_1.Logger(WorkerService_1.name);
    workerInstance = null;
    constructor(config, gateway, prisma, aiEngine, dlqQueue) {
        this.config = config;
        this.gateway = gateway;
        this.prisma = prisma;
        this.aiEngine = aiEngine;
        this.dlqQueue = dlqQueue;
    }
    onModuleInit() {
        const redisUrl = this.config.get('REDIS_URL', 'redis://localhost:6379');
        let connection;
        try {
            const url = new URL(redisUrl);
            connection = {
                host: url.hostname,
                port: parseInt(url.port || '6379', 10),
                ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
                ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
            };
        }
        catch {
            this.logger.warn(`Could not parse REDIS_URL "${redisUrl}", falling back to localhost`);
            connection = { host: 'localhost', port: 6379 };
        }
        this.workerInstance = new contractAnalysis_worker_1.ContractAnalysisWorker(connection, this.aiEngine, this.prisma, this.dlqQueue, 2);
        this.workerInstance.attachWebSocketGateway(this.gateway);
        this.workerInstance.start();
        this.logger.log('ContractAnalysisWorker started with WebSocket gateway attached');
    }
    async onModuleDestroy() {
        await this.workerInstance?.shutdown();
        this.logger.log('ContractAnalysisWorker shut down');
    }
};
exports.WorkerService = WorkerService;
exports.WorkerService = WorkerService = WorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)('contract-analysis-dlq')),
    __metadata("design:paramtypes", [config_1.ConfigService,
        analysis_gateway_1.AIAnalysisGateway,
        prisma_service_1.PrismaService,
        aiEngine_1.AIEngine,
        bullmq_2.Queue])
], WorkerService);
//# sourceMappingURL=worker.service.js.map