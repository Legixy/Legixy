"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryUsageGauge = exports.activeConnectionsGauge = exports.databaseQueryTimeHistogram = exports.redisOperationTimeHistogram = exports.apiResponseTimeHistogram = exports.dlqEntryCounter = exports.errorCounter = exports.circuitBreakerTripsCounter = exports.circuitBreakerStateGauge = exports.tenantQuotaGauge = exports.rateLimitRejectionCounter = exports.analysisTimeHistogram = exports.tokenUsageHistogram = exports.analysisFailedCounter = exports.analysisCompletedCounter = exports.jobRetryCounter = exports.jobCounter = exports.jobProcessingHistogram = exports.queueFailedGauge = exports.queueActiveGauge = exports.queueDepthGauge = void 0;
exports.recordJobCompletion = recordJobCompletion;
exports.recordAnalysisCompletion = recordAnalysisCompletion;
exports.recordAnalysisFailure = recordAnalysisFailure;
exports.recordRateLimitRejection = recordRateLimitRejection;
exports.updateCircuitBreakerState = updateCircuitBreakerState;
exports.recordCircuitBreakerTrip = recordCircuitBreakerTrip;
exports.recordError = recordError;
exports.recordDLQEntry = recordDLQEntry;
exports.recordApiResponseTime = recordApiResponseTime;
exports.getMetrics = getMetrics;
exports.getRegistry = getRegistry;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('Observability.Metrics');
let promClient;
let isAvailable = false;
try {
    promClient = require('prom-client');
    isAvailable = true;
    logger.log('Prometheus metrics enabled');
}
catch (error) {
    logger.warn('prom-client not installed. Metrics disabled. Install with: npm install prom-client');
}
const createStubMetric = (type, name) => ({
    inc: () => { },
    dec: () => { },
    set: () => { },
    observe: () => { },
    labels: () => ({
        inc: () => { },
        dec: () => { },
        set: () => { },
        observe: () => { },
    }),
});
exports.queueDepthGauge = isAvailable
    ? new promClient.Gauge({
        name: 'queue_depth_total',
        help: 'Total jobs waiting in queue',
        labelNames: ['queue_name'],
    })
    : createStubMetric('Gauge', 'queue_depth_total');
exports.queueActiveGauge = isAvailable
    ? new promClient.Gauge({
        name: 'queue_active_jobs',
        help: 'Currently processing jobs',
        labelNames: ['queue_name'],
    })
    : createStubMetric('Gauge', 'queue_active_jobs');
exports.queueFailedGauge = isAvailable
    ? new promClient.Gauge({
        name: 'queue_failed_jobs',
        help: 'Failed jobs in queue',
        labelNames: ['queue_name'],
    })
    : createStubMetric('Gauge', 'queue_failed_jobs');
exports.jobProcessingHistogram = isAvailable
    ? new promClient.Histogram({
        name: 'job_processing_duration_ms',
        help: 'Job processing time in milliseconds',
        labelNames: ['queue_name', 'job_type', 'status'],
        buckets: [100, 500, 1000, 5000, 10000, 30000, 60000],
    })
    : createStubMetric('Histogram', 'job_processing_duration_ms');
exports.jobCounter = isAvailable
    ? new promClient.Counter({
        name: 'jobs_total',
        help: 'Total jobs processed',
        labelNames: ['queue_name', 'job_type', 'status'],
    })
    : createStubMetric('Counter', 'jobs_total');
exports.jobRetryCounter = isAvailable
    ? new promClient.Counter({
        name: 'job_retries_total',
        help: 'Total job retries',
        labelNames: ['queue_name', 'job_type', 'reason'],
    })
    : createStubMetric('Counter', 'job_retries_total');
exports.analysisCompletedCounter = isAvailable
    ? new promClient.Counter({
        name: 'analyses_completed_total',
        help: 'Total analyses completed successfully',
        labelNames: ['analysis_type', 'tenant_id'],
    })
    : createStubMetric('Counter', 'analyses_completed_total');
exports.analysisFailedCounter = isAvailable
    ? new promClient.Counter({
        name: 'analyses_failed_total',
        help: 'Total analyses failed',
        labelNames: ['analysis_type', 'reason'],
    })
    : createStubMetric('Counter', 'analyses_failed_total');
exports.tokenUsageHistogram = isAvailable
    ? new promClient.Histogram({
        name: 'analysis_tokens_used',
        help: 'Tokens used per analysis',
        labelNames: ['model', 'tenant_id'],
        buckets: [100, 500, 1000, 5000, 10000, 50000],
    })
    : createStubMetric('Histogram', 'analysis_tokens_used');
exports.analysisTimeHistogram = isAvailable
    ? new promClient.Histogram({
        name: 'analysis_duration_ms',
        help: 'Analysis processing time in milliseconds',
        labelNames: ['analysis_type'],
        buckets: [100, 500, 1000, 5000, 10000, 30000],
    })
    : createStubMetric('Histogram', 'analysis_duration_ms');
exports.rateLimitRejectionCounter = isAvailable
    ? new promClient.Counter({
        name: 'rate_limit_rejections_total',
        help: 'Requests rejected due to rate limiting',
        labelNames: ['tenant_id', 'plan'],
    })
    : createStubMetric('Counter', 'rate_limit_rejections_total');
exports.tenantQuotaGauge = isAvailable
    ? new promClient.Gauge({
        name: 'tenant_quota_used_percent',
        help: 'Percentage of daily quota used',
        labelNames: ['tenant_id', 'plan'],
    })
    : createStubMetric('Gauge', 'tenant_quota_used_percent');
exports.circuitBreakerStateGauge = isAvailable
    ? new promClient.Gauge({
        name: 'circuit_breaker_state',
        help: 'Circuit breaker state (1=CLOSED, 2=HALF_OPEN, 3=OPEN)',
        labelNames: ['service_key'],
    })
    : createStubMetric('Gauge', 'circuit_breaker_state');
exports.circuitBreakerTripsCounter = isAvailable
    ? new promClient.Counter({
        name: 'circuit_breaker_trips_total',
        help: 'Times circuit breaker has been tripped',
        labelNames: ['service_key', 'reason'],
    })
    : createStubMetric('Counter', 'circuit_breaker_trips_total');
exports.errorCounter = isAvailable
    ? new promClient.Counter({
        name: 'errors_total',
        help: 'Total errors',
        labelNames: ['error_type', 'service'],
    })
    : createStubMetric('Counter', 'errors_total');
exports.dlqEntryCounter = isAvailable
    ? new promClient.Counter({
        name: 'dlq_entries_total',
        help: 'Jobs added to dead letter queue',
        labelNames: ['reason'],
    })
    : createStubMetric('Counter', 'dlq_entries_total');
exports.apiResponseTimeHistogram = isAvailable
    ? new promClient.Histogram({
        name: 'api_response_time_ms',
        help: 'API response time in milliseconds',
        labelNames: ['method', 'endpoint', 'status'],
        buckets: [10, 50, 100, 500, 1000, 5000],
    })
    : createStubMetric('Histogram', 'api_response_time_ms');
exports.redisOperationTimeHistogram = isAvailable
    ? new promClient.Histogram({
        name: 'redis_operation_time_ms',
        help: 'Redis operation time in milliseconds',
        labelNames: ['operation', 'status'],
        buckets: [1, 5, 10, 50, 100, 500],
    })
    : createStubMetric('Histogram', 'redis_operation_time_ms');
exports.databaseQueryTimeHistogram = isAvailable
    ? new promClient.Histogram({
        name: 'database_query_time_ms',
        help: 'Database query time in milliseconds',
        labelNames: ['query_type', 'status'],
        buckets: [10, 50, 100, 500, 1000, 5000],
    })
    : createStubMetric('Histogram', 'database_query_time_ms');
exports.activeConnectionsGauge = isAvailable
    ? new promClient.Gauge({
        name: 'active_connections_total',
        help: 'Active database connections',
        labelNames: ['connection_type'],
    })
    : createStubMetric('Gauge', 'active_connections_total');
exports.memoryUsageGauge = isAvailable
    ? new promClient.Gauge({
        name: 'memory_usage_bytes',
        help: 'Memory usage in bytes',
        labelNames: ['type'],
    })
    : createStubMetric('Gauge', 'memory_usage_bytes');
function recordJobCompletion(queueName, jobType, durationMs, status) {
    try {
        exports.jobProcessingHistogram
            .labels(queueName, jobType, status)
            .observe(durationMs);
        exports.jobCounter.labels(queueName, jobType, status).inc();
    }
    catch (error) {
        logger.error(`Failed to record job completion: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordAnalysisCompletion(analysisType, tenantId, durationMs, tokensUsed, modelUsed) {
    try {
        exports.analysisCompletedCounter.labels(analysisType, tenantId).inc();
        exports.analysisTimeHistogram.labels(analysisType).observe(durationMs);
        exports.tokenUsageHistogram.labels(modelUsed, tenantId).observe(tokensUsed);
    }
    catch (error) {
        logger.error(`Failed to record analysis completion: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordAnalysisFailure(analysisType, reason) {
    try {
        exports.analysisFailedCounter.labels(analysisType, reason).inc();
    }
    catch (error) {
        logger.error(`Failed to record analysis failure: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordRateLimitRejection(tenantId, plan) {
    try {
        exports.rateLimitRejectionCounter.labels(tenantId, plan).inc();
    }
    catch (error) {
        logger.error(`Failed to record rate limit rejection: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function updateCircuitBreakerState(serviceKey, state) {
    try {
        const stateValue = state === 'CLOSED' ? 1 : state === 'HALF_OPEN' ? 2 : 3;
        exports.circuitBreakerStateGauge.labels(serviceKey).set(stateValue);
    }
    catch (error) {
        logger.error(`Failed to update circuit breaker state: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordCircuitBreakerTrip(serviceKey, reason) {
    try {
        exports.circuitBreakerTripsCounter.labels(serviceKey, reason).inc();
    }
    catch (error) {
        logger.error(`Failed to record circuit breaker trip: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordError(errorType, service) {
    try {
        exports.errorCounter.labels(errorType, service).inc();
    }
    catch (error) {
        logger.error(`Failed to record error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordDLQEntry(reason) {
    try {
        exports.dlqEntryCounter.labels(reason).inc();
    }
    catch (error) {
        logger.error(`Failed to record DLQ entry: ${error instanceof Error ? error.message : String(error)}`);
    }
}
function recordApiResponseTime(method, endpoint, status, durationMs) {
    try {
        exports.apiResponseTimeHistogram
            .labels(method, endpoint, String(status))
            .observe(durationMs);
    }
    catch (error) {
        logger.error(`Failed to record API response time: ${error instanceof Error ? error.message : String(error)}`);
    }
}
async function getMetrics() {
    try {
        if (!isAvailable || !promClient.register) {
            return '# Prometheus metrics disabled (prom-client not installed)\n';
        }
        return await promClient.register.metrics();
    }
    catch (error) {
        logger.error(`Failed to get metrics: ${error instanceof Error ? error.message : String(error)}`);
        return '';
    }
}
function getRegistry() {
    if (!isAvailable || !promClient.register) {
        return null;
    }
    return promClient.register;
}
//# sourceMappingURL=metrics.js.map