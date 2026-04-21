/**
 * Observability - Metrics Layer
 * 
 * Exports Prometheus metrics for monitoring:
 * - Queue depth (waiting, active, failed)
 * - Job processing time (histogram)
 * - Job success/failure rates (counters)
 * - Tenant quota usage
 * - Circuit breaker states
 * - Error rates by type
 * 
 * Metrics exposed at GET /metrics (Prometheus format)
 * 
 * Note: Requires 'prom-client' package to be installed
 * npm install prom-client
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('Observability.Metrics');

// Lazy-load prom-client to handle when not installed
let promClient: any;
let isAvailable = false;

try {
  promClient = require('prom-client');
  isAvailable = true;
  logger.log('Prometheus metrics enabled');
} catch (error) {
  logger.warn('prom-client not installed. Metrics disabled. Install with: npm install prom-client');
}

// Create stub metrics if not available
const createStubMetric = (type: string, name: string) => ({
  inc: () => {},
  dec: () => {},
  set: () => {},
  observe: () => {},
  labels: () => ({
    inc: () => {},
    dec: () => {},
    set: () => {},
    observe: () => {},
  }),
});

// ============================================================================
// Queue Metrics
// ============================================================================

export const queueDepthGauge = isAvailable
  ? new promClient.Gauge({
      name: 'queue_depth_total',
      help: 'Total jobs waiting in queue',
      labelNames: ['queue_name'],
    })
  : createStubMetric('Gauge', 'queue_depth_total');

export const queueActiveGauge = isAvailable
  ? new promClient.Gauge({
      name: 'queue_active_jobs',
      help: 'Currently processing jobs',
      labelNames: ['queue_name'],
    })
  : createStubMetric('Gauge', 'queue_active_jobs');

export const queueFailedGauge = isAvailable
  ? new promClient.Gauge({
      name: 'queue_failed_jobs',
      help: 'Failed jobs in queue',
      labelNames: ['queue_name'],
    })
  : createStubMetric('Gauge', 'queue_failed_jobs');

// ============================================================================
// Job Processing Metrics
// ============================================================================

export const jobProcessingHistogram = isAvailable
  ? new promClient.Histogram({
      name: 'job_processing_duration_ms',
      help: 'Job processing time in milliseconds',
      labelNames: ['queue_name', 'job_type', 'status'],
      buckets: [100, 500, 1000, 5000, 10000, 30000, 60000],
    })
  : createStubMetric('Histogram', 'job_processing_duration_ms');

export const jobCounter = isAvailable
  ? new promClient.Counter({
      name: 'jobs_total',
      help: 'Total jobs processed',
      labelNames: ['queue_name', 'job_type', 'status'],
    })
  : createStubMetric('Counter', 'jobs_total');

export const jobRetryCounter = isAvailable
  ? new promClient.Counter({
      name: 'job_retries_total',
      help: 'Total job retries',
      labelNames: ['queue_name', 'job_type', 'reason'],
    })
  : createStubMetric('Counter', 'job_retries_total');

// ============================================================================
// Analysis Specific Metrics
// ============================================================================

export const analysisCompletedCounter = isAvailable
  ? new promClient.Counter({
      name: 'analyses_completed_total',
      help: 'Total analyses completed successfully',
      labelNames: ['analysis_type', 'tenant_id'],
    })
  : createStubMetric('Counter', 'analyses_completed_total');

export const analysisFailedCounter = isAvailable
  ? new promClient.Counter({
      name: 'analyses_failed_total',
      help: 'Total analyses failed',
      labelNames: ['analysis_type', 'reason'],
    })
  : createStubMetric('Counter', 'analyses_failed_total');

export const tokenUsageHistogram = isAvailable
  ? new promClient.Histogram({
      name: 'analysis_tokens_used',
      help: 'Tokens used per analysis',
      labelNames: ['model', 'tenant_id'],
      buckets: [100, 500, 1000, 5000, 10000, 50000],
    })
  : createStubMetric('Histogram', 'analysis_tokens_used');

export const analysisTimeHistogram = isAvailable
  ? new promClient.Histogram({
      name: 'analysis_duration_ms',
      help: 'Analysis processing time in milliseconds',
      labelNames: ['analysis_type'],
      buckets: [100, 500, 1000, 5000, 10000, 30000],
    })
  : createStubMetric('Histogram', 'analysis_duration_ms');

// ============================================================================
// Rate Limiting Metrics
// ============================================================================

export const rateLimitRejectionCounter = isAvailable
  ? new promClient.Counter({
      name: 'rate_limit_rejections_total',
      help: 'Requests rejected due to rate limiting',
      labelNames: ['tenant_id', 'plan'],
    })
  : createStubMetric('Counter', 'rate_limit_rejections_total');

export const tenantQuotaGauge = isAvailable
  ? new promClient.Gauge({
      name: 'tenant_quota_used_percent',
      help: 'Percentage of daily quota used',
      labelNames: ['tenant_id', 'plan'],
    })
  : createStubMetric('Gauge', 'tenant_quota_used_percent');

// ============================================================================
// Circuit Breaker Metrics
// ============================================================================

export const circuitBreakerStateGauge = isAvailable
  ? new promClient.Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (1=CLOSED, 2=HALF_OPEN, 3=OPEN)',
      labelNames: ['service_key'],
    })
  : createStubMetric('Gauge', 'circuit_breaker_state');

export const circuitBreakerTripsCounter = isAvailable
  ? new promClient.Counter({
      name: 'circuit_breaker_trips_total',
      help: 'Times circuit breaker has been tripped',
      labelNames: ['service_key', 'reason'],
    })
  : createStubMetric('Counter', 'circuit_breaker_trips_total');

// ============================================================================
// Error Metrics
// ============================================================================

export const errorCounter = isAvailable
  ? new promClient.Counter({
      name: 'errors_total',
      help: 'Total errors',
      labelNames: ['error_type', 'service'],
    })
  : createStubMetric('Counter', 'errors_total');

export const dlqEntryCounter = isAvailable
  ? new promClient.Counter({
      name: 'dlq_entries_total',
      help: 'Jobs added to dead letter queue',
      labelNames: ['reason'],
    })
  : createStubMetric('Counter', 'dlq_entries_total');

// ============================================================================
// Performance Metrics
// ============================================================================

export const apiResponseTimeHistogram = isAvailable
  ? new promClient.Histogram({
      name: 'api_response_time_ms',
      help: 'API response time in milliseconds',
      labelNames: ['method', 'endpoint', 'status'],
      buckets: [10, 50, 100, 500, 1000, 5000],
    })
  : createStubMetric('Histogram', 'api_response_time_ms');

export const redisOperationTimeHistogram = isAvailable
  ? new promClient.Histogram({
      name: 'redis_operation_time_ms',
      help: 'Redis operation time in milliseconds',
      labelNames: ['operation', 'status'],
      buckets: [1, 5, 10, 50, 100, 500],
    })
  : createStubMetric('Histogram', 'redis_operation_time_ms');

export const databaseQueryTimeHistogram = isAvailable
  ? new promClient.Histogram({
      name: 'database_query_time_ms',
      help: 'Database query time in milliseconds',
      labelNames: ['query_type', 'status'],
      buckets: [10, 50, 100, 500, 1000, 5000],
    })
  : createStubMetric('Histogram', 'database_query_time_ms');

// ============================================================================
// System Metrics
// ============================================================================

export const activeConnectionsGauge = isAvailable
  ? new promClient.Gauge({
      name: 'active_connections_total',
      help: 'Active database connections',
      labelNames: ['connection_type'],
    })
  : createStubMetric('Gauge', 'active_connections_total');

export const memoryUsageGauge = isAvailable
  ? new promClient.Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
    })
  : createStubMetric('Gauge', 'memory_usage_bytes');

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Record job completion metric.
 */
export function recordJobCompletion(
  queueName: string,
  jobType: string,
  durationMs: number,
  status: 'success' | 'failure' | 'retry',
) {
  try {
    jobProcessingHistogram
      .labels(queueName, jobType, status)
      .observe(durationMs);
    jobCounter.labels(queueName, jobType, status).inc();
  } catch (error) {
    logger.error(
      `Failed to record job completion: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record analysis completion.
 */
export function recordAnalysisCompletion(
  analysisType: string,
  tenantId: string,
  durationMs: number,
  tokensUsed: number,
  modelUsed: string,
) {
  try {
    analysisCompletedCounter.labels(analysisType, tenantId).inc();
    analysisTimeHistogram.labels(analysisType).observe(durationMs);
    tokenUsageHistogram.labels(modelUsed, tenantId).observe(tokensUsed);
  } catch (error) {
    logger.error(
      `Failed to record analysis completion: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record analysis failure.
 */
export function recordAnalysisFailure(
  analysisType: string,
  reason: string,
) {
  try {
    analysisFailedCounter.labels(analysisType, reason).inc();
  } catch (error) {
    logger.error(
      `Failed to record analysis failure: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record rate limit rejection.
 */
export function recordRateLimitRejection(
  tenantId: string,
  plan: string,
) {
  try {
    rateLimitRejectionCounter.labels(tenantId, plan).inc();
  } catch (error) {
    logger.error(
      `Failed to record rate limit rejection: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Update circuit breaker state metric.
 */
export function updateCircuitBreakerState(
  serviceKey: string,
  state: 'CLOSED' | 'HALF_OPEN' | 'OPEN',
) {
  try {
    const stateValue = state === 'CLOSED' ? 1 : state === 'HALF_OPEN' ? 2 : 3;
    circuitBreakerStateGauge.labels(serviceKey).set(stateValue);
  } catch (error) {
    logger.error(
      `Failed to update circuit breaker state: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record circuit breaker trip.
 */
export function recordCircuitBreakerTrip(
  serviceKey: string,
  reason: string,
) {
  try {
    circuitBreakerTripsCounter.labels(serviceKey, reason).inc();
  } catch (error) {
    logger.error(
      `Failed to record circuit breaker trip: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record error.
 */
export function recordError(errorType: string, service: string) {
  try {
    errorCounter.labels(errorType, service).inc();
  } catch (error) {
    logger.error(
      `Failed to record error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record DLQ entry.
 */
export function recordDLQEntry(reason: string) {
  try {
    dlqEntryCounter.labels(reason).inc();
  } catch (error) {
    logger.error(
      `Failed to record DLQ entry: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Record API response time.
 */
export function recordApiResponseTime(
  method: string,
  endpoint: string,
  status: number,
  durationMs: number,
) {
  try {
    apiResponseTimeHistogram
      .labels(method, endpoint, String(status))
      .observe(durationMs);
  } catch (error) {
    logger.error(
      `Failed to record API response time: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Get all metrics in Prometheus format.
 */
export async function getMetrics(): Promise<string> {
  try {
    if (!isAvailable || !promClient.register) {
      return '# Prometheus metrics disabled (prom-client not installed)\n';
    }
    return await promClient.register.metrics();
  } catch (error) {
    logger.error(
      `Failed to get metrics: ${error instanceof Error ? error.message : String(error)}`,
    );
    return '';
  }
}

/**
 * Get metric registry for custom use.
 */
export function getRegistry() {
  if (!isAvailable || !promClient.register) {
    return null;
  }
  return promClient.register;
}
