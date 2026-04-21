import { PrismaService } from '../../../database/prisma.service';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    checks: {
        database?: {
            status: 'ok' | 'error';
            latency?: number;
            error?: string;
        };
        redis?: {
            status: 'ok' | 'error';
            latency?: number;
            error?: string;
        };
        queue?: {
            status: 'ok' | 'error';
            depth?: number;
            active?: number;
            failed?: number;
            error?: string;
        };
        worker?: {
            status: 'ok' | 'error';
            paused?: boolean;
            error?: string;
        };
        ai_engine?: {
            status: 'ok' | 'error';
            model?: string;
            error?: string;
        };
    };
}
export declare class HealthCheckService {
    private prisma;
    private redis;
    private queue;
    constructor(prisma: PrismaService, redis: Redis, queue: Queue);
    check(): Promise<HealthCheckResult>;
}
export declare class LivenessProbeService {
    private prisma;
    constructor(prisma: PrismaService);
    probe(): Promise<{
        alive: boolean;
        timestamp: string;
    }>;
}
export declare class ReadinessProbeService {
    private prisma;
    private redis;
    private queue;
    constructor(prisma: PrismaService, redis: Redis, queue: Queue);
    probe(): Promise<{
        ready: boolean;
        timestamp: string;
        checks?: Record<string, 'ok' | 'error'>;
    }>;
}
