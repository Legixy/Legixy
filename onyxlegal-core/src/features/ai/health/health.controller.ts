/**
 * Health Check Controller
 * 
 * Endpoints:
 * - GET /health - Full health status
 * - GET /health/live - Kubernetes liveness probe
 * - GET /health/ready - Kubernetes readiness probe
 */

import { Controller, Get, HttpCode } from '@nestjs/common';
import {
  HealthCheckService,
  LivenessProbeService,
  ReadinessProbeService,
} from '../health/healthCheck';

@Controller('health')
export class HealthCheckController {
  constructor(
    private readonly healthCheck: HealthCheckService,
    private readonly livenessProbe: LivenessProbeService,
    private readonly readinessProbe: ReadinessProbeService,
  ) {}

  /**
   * GET /health
   * Full health status including all checks
   */
  @Get()
  async getHealth() {
    return this.healthCheck.check();
  }

  /**
   * GET /health/live
   * Kubernetes liveness probe (is pod alive?)
   * Returns 200 if alive, 500 otherwise
   */
  @Get('live')
  @HttpCode(200)
  async getLiveness() {
    const result = await this.livenessProbe.probe();
    if (!result.alive) {
      // Return error but don't throw to allow proper response
      return { ...result, statusCode: 503 };
    }
    return result;
  }

  /**
   * GET /health/ready
   * Kubernetes readiness probe (can pod accept traffic?)
   * Returns 200 if ready, 503 otherwise
   */
  @Get('ready')
  @HttpCode(200)
  async getReadiness() {
    const result = await this.readinessProbe.probe();
    if (!result.ready) {
      // Return error but don't throw to allow proper response
      return { ...result, statusCode: 503 };
    }
    return result;
  }

  /**
   * GET /metrics (note: different from /health)
   * Prometheus metrics endpoint
   * This should be in a separate controller but listed for reference
   */
}
