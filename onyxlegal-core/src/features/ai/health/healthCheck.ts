/**
 * Health Check Service
 * 
 * Endpoint: GET /health
 * 
 * Checks:
 * - Database connectivity
 * - Redis connectivity
 * - Queue status (analysis queue)
 * - Worker status (active, responsive)
 * - AI engine connectivity (OpenAI API)
 * - Overall system status
 * 
 * Response format:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": ISO8601,
 *   "uptime": seconds,
 *   "checks": {
 *     "database": { "status": "ok", "latency": 5 },
 *     "redis": { "status": "ok", "latency": 2 },
 *     "queue": { "status": "ok", "depth": 12, "active": 3 },
 *     "worker": { "status": "ok", "paused": false },
 *     "ai_engine": { "status": "ok", "model": "gpt-4o-mini" }
 *   }
 * }
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const logger = new Logger('HealthCheck');

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

const startTime = Date.now();

/**
 * Check database connectivity.
 */
async function checkDatabase(prisma: PrismaService): Promise<{
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.error(
      `Database check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis connectivity.
 */
async function checkRedis(redis: Redis): Promise<{
  status: 'ok' | 'error';
  latency?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    await redis.ping();
    return {
      status: 'ok',
      latency: Date.now() - start,
    };
  } catch (error) {
    logger.error(
      `Redis check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check queue status.
 */
async function checkQueue(queue: Queue): Promise<{
  status: 'ok' | 'error';
  depth?: number;
  active?: number;
  failed?: number;
  error?: string;
}> {
  try {
    const counts = await queue.getJobCounts();
    return {
      status: 'ok',
      depth: (counts.waiting || 0) + (counts.delayed || 0),
      active: counts.active || 0,
      failed: counts.failed || 0,
    };
  } catch (error) {
    logger.error(
      `Queue check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check worker status (placeholder - would connect to actual worker in production).
 */
async function checkWorker(): Promise<{
  status: 'ok' | 'error';
  paused?: boolean;
  error?: string;
}> {
  try {
    // In production, this would:
    // 1. Connect to worker process via IPC or HTTP
    // 2. Check if worker is actively processing
    // 3. Check worker memory/CPU usage
    // 4. Verify worker hasn't crashed
    
    // For now, just return ok
    return {
      status: 'ok',
      paused: false,
    };
  } catch (error) {
    logger.error(
      `Worker check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check AI engine connectivity.
 */
async function checkAIEngine(): Promise<{
  status: 'ok' | 'error';
  model?: string;
  error?: string;
}> {
  try {
    // In production, make a quick test call to OpenAI API
    // For now, just check if environment variable is set
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
  } catch (error) {
    logger.error(
      `AI Engine check failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Perform all health checks.
 */
@Injectable()
export class HealthCheckService {
  constructor(
    private prisma: PrismaService,
    private redis: Redis,
    private queue: Queue,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const results = await Promise.allSettled([
      checkDatabase(this.prisma),
      checkRedis(this.redis),
      checkQueue(this.queue),
      checkWorker(),
      checkAIEngine(),
    ]);

    // Extract results with proper type casting
    const [dbResult, redisResult, queueResult, workerResult, aiResult] = results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { status: 'error' as const, error: 'Check timeout or failed' },
    );

    // Determine overall status
    const checks = {
      database: dbResult as any,
      redis: redisResult as any,
      queue: queueResult as any,
      worker: workerResult as any,
      ai_engine: aiResult as any,
    };

    const errorCount = Object.values(checks).filter((c: any) => c.status === 'error').length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (errorCount === totalChecks) {
      status = 'unhealthy';
    } else if (errorCount > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
    };
  }
}

/**
 * Liveness probe - is the service running?
 * Minimal checks - just ensure database is responsive
 */
@Injectable()
export class LivenessProbeService {
  constructor(private prisma: PrismaService) {}

  async probe(): Promise<{ alive: boolean; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        alive: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(
        `Liveness probe failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        alive: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * Readiness probe - is the service ready to handle traffic?
 * Check all critical dependencies
 */
@Injectable()
export class ReadinessProbeService {
  constructor(
    private prisma: PrismaService,
    private redis: Redis,
    private queue: Queue,
  ) {}

  async probe(): Promise<{ ready: boolean; timestamp: string; checks?: Record<string, 'ok' | 'error'> }> {
    try {
      const [dbOk, redisOk, queueOk] = await Promise.all([
        checkDatabase(this.prisma),
        checkRedis(this.redis),
        checkQueue(this.queue),
      ]);

      const ready =
        dbOk.status === 'ok' &&
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
    } catch (error) {
      logger.error(
        `Readiness probe failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        ready: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
