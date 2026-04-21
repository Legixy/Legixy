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
exports.ReadinessProbeService = exports.LivenessProbeService = exports.HealthCheckService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
const logger = new common_1.Logger('HealthCheck');
const startTime = Date.now();
async function checkDatabase(prisma) {
    const start = Date.now();
    try {
        await prisma.$queryRaw `SELECT 1`;
        return {
            status: 'ok',
            latency: Date.now() - start,
        };
    }
    catch (error) {
        logger.error(`Database check failed: ${error instanceof Error ? error.message : String(error)}`);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function checkRedis(redis) {
    const start = Date.now();
    try {
        await redis.ping();
        return {
            status: 'ok',
            latency: Date.now() - start,
        };
    }
    catch (error) {
        logger.error(`Redis check failed: ${error instanceof Error ? error.message : String(error)}`);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function checkQueue(queue) {
    try {
        const counts = await queue.getJobCounts();
        return {
            status: 'ok',
            depth: (counts.waiting || 0) + (counts.delayed || 0),
            active: counts.active || 0,
            failed: counts.failed || 0,
        };
    }
    catch (error) {
        logger.error(`Queue check failed: ${error instanceof Error ? error.message : String(error)}`);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function checkWorker() {
    try {
        return {
            status: 'ok',
            paused: false,
        };
    }
    catch (error) {
        logger.error(`Worker check failed: ${error instanceof Error ? error.message : String(error)}`);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
async function checkAIEngine() {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return {
                status: 'error',
                error: 'OPENAI_API_KEY not configured',
            };
        }
        return {
            status: 'ok',
            model: 'gpt-4o-mini',
        };
    }
    catch (error) {
        logger.error(`AI Engine check failed: ${error instanceof Error ? error.message : String(error)}`);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
let HealthCheckService = class HealthCheckService {
    prisma;
    redis;
    queue;
    constructor(prisma, redis, queue) {
        this.prisma = prisma;
        this.redis = redis;
        this.queue = queue;
    }
    async check() {
        const results = await Promise.allSettled([
            checkDatabase(this.prisma),
            checkRedis(this.redis),
            checkQueue(this.queue),
            checkWorker(),
            checkAIEngine(),
        ]);
        const [dbResult, redisResult, queueResult, workerResult, aiResult] = results.map((r) => r.status === 'fulfilled'
            ? r.value
            : { status: 'error', error: 'Check timeout or failed' });
        const checks = {
            database: dbResult,
            redis: redisResult,
            queue: queueResult,
            worker: workerResult,
            ai_engine: aiResult,
        };
        const errorCount = Object.values(checks).filter((c) => c.status === 'error').length;
        const totalChecks = Object.keys(checks).length;
        let status = 'healthy';
        if (errorCount === totalChecks) {
            status = 'unhealthy';
        }
        else if (errorCount > 0) {
            status = 'degraded';
        }
        return {
            status,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - startTime) / 1000),
            checks,
        };
    }
};
exports.HealthCheckService = HealthCheckService;
exports.HealthCheckService = HealthCheckService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ioredis_1.Redis,
        bullmq_1.Queue])
], HealthCheckService);
let LivenessProbeService = class LivenessProbeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async probe() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                alive: true,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger.error(`Liveness probe failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                alive: false,
                timestamp: new Date().toISOString(),
            };
        }
    }
};
exports.LivenessProbeService = LivenessProbeService;
exports.LivenessProbeService = LivenessProbeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LivenessProbeService);
let ReadinessProbeService = class ReadinessProbeService {
    prisma;
    redis;
    queue;
    constructor(prisma, redis, queue) {
        this.prisma = prisma;
        this.redis = redis;
        this.queue = queue;
    }
    async probe() {
        try {
            const [dbOk, redisOk, queueOk] = await Promise.all([
                checkDatabase(this.prisma),
                checkRedis(this.redis),
                checkQueue(this.queue),
            ]);
            const ready = dbOk.status === 'ok' &&
                redisOk.status === 'ok' &&
                queueOk.status === 'ok';
            return {
                ready,
                timestamp: new Date().toISOString(),
                checks: {
                    database: dbOk.status,
                    redis: redisOk.status,
                    queue: queueOk.status,
                },
            };
        }
        catch (error) {
            logger.error(`Readiness probe failed: ${error instanceof Error ? error.message : String(error)}`);
            return {
                ready: false,
                timestamp: new Date().toISOString(),
            };
        }
    }
};
exports.ReadinessProbeService = ReadinessProbeService;
exports.ReadinessProbeService = ReadinessProbeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ioredis_1.Redis,
        bullmq_1.Queue])
], ReadinessProbeService);
//# sourceMappingURL=healthCheck.js.map