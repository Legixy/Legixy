/**
 * Circuit Breaker Service
 * Prevents cascading failures by stopping requests when error rate is too high.
 * 
 * States:
 * - CLOSED: Normal operation, all requests pass through
 * - OPEN: Too many errors, fail fast without processing
 * - HALF_OPEN: Attempting recovery with limited requests
 * 
 * Configuration:
 * - failureThreshold: 5 errors within 60s to open circuit
 * - successThreshold: 3 successful requests to close circuit
 * - timeout: 30s before attempting to recover (HALF_OPEN)
 */

import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

const logger = new Logger('CircuitBreaker');

// Configuration
const FAILURE_THRESHOLD = 5; // errors needed to open circuit
const SUCCESS_THRESHOLD = 3; // successes needed to close circuit from HALF_OPEN
const FAILURE_WINDOW = 60; // seconds to count failures over
const TIMEOUT = 30; // seconds before attempting recovery

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStatus {
  state: CircuitState;
  failures: number;
  successes: number;
  nextRetryAt: Date;
  openedAt?: Date;
}

/**
 * Get current circuit state and stats.
 */
async function getCircuitStatus(
  redis: Redis,
  serviceKey: string,
): Promise<CircuitStatus> {
  try {
    const state = (await redis.hget(serviceKey, 'state')) as CircuitState | null;
    const failures = parseInt((await redis.hget(serviceKey, 'failures')) || '0', 10);
    const successes = parseInt((await redis.hget(serviceKey, 'successes')) || '0', 10);
    const lastFailureTime = parseInt((await redis.hget(serviceKey, 'lastFailureTime')) || '0', 10);
    const openedAt = parseInt((await redis.hget(serviceKey, 'openedAt')) || '0', 10);

    // Calculate if circuit should transition from OPEN to HALF_OPEN
    let currentState = state || 'CLOSED';
    if (currentState === 'OPEN') {
      const timeSinceOpened = Date.now() - (openedAt || 0);
      if (timeSinceOpened > TIMEOUT * 1000) {
        currentState = 'HALF_OPEN';
        await redis.hset(serviceKey, 'state', 'HALF_OPEN');
        logger.log(`[CircuitBreaker] ${serviceKey}: OPEN → HALF_OPEN (timeout)`);
      }
    }

    return {
      state: currentState,
      failures,
      successes,
      nextRetryAt: new Date(
        (openedAt || Date.now()) + TIMEOUT * 1000,
      ),
      openedAt: openedAt ? new Date(openedAt) : undefined,
    };
  } catch (error) {
    logger.error(
      `[CircuitBreaker] Status check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      nextRetryAt: new Date(),
    };
  }
}

/**
 * Record a successful call.
 * If in HALF_OPEN and threshold reached, close circuit.
 */
export async function recordSuccess(
  redis: Redis,
  serviceKey: string,
): Promise<CircuitStatus> {
  try {
    const status = await getCircuitStatus(redis, serviceKey);

    if (status.state === 'CLOSED') {
      // Reset failure counter on success
      await redis.hset(serviceKey, 'failures', 0);
      return status;
    }

    if (status.state === 'HALF_OPEN') {
      const newSuccesses = (status.successes || 0) + 1;
      await redis.hset(serviceKey, 'successes', newSuccesses);

      if (newSuccesses >= SUCCESS_THRESHOLD) {
        // Circuit recovered, close it
        await redis.hset(serviceKey, [
          'state', 'CLOSED',
          'failures', 0,
          'successes', 0,
          'lastFailureTime', 0,
        ]);
        logger.log(`[CircuitBreaker] ${serviceKey}: HALF_OPEN → CLOSED (recovered)`);
        return {
          state: 'CLOSED',
          failures: 0,
          successes: 0,
          nextRetryAt: new Date(),
        };
      }

      logger.log(
        `[CircuitBreaker] ${serviceKey}: Success in HALF_OPEN (${newSuccesses}/${SUCCESS_THRESHOLD})`,
      );
    }

    return status;
  } catch (error) {
    logger.error(
      `[CircuitBreaker] Record success failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      nextRetryAt: new Date(),
    };
  }
}

/**
 * Record a failed call.
 * If threshold reached, open circuit.
 */
export async function recordFailure(
  redis: Redis,
  serviceKey: string,
): Promise<CircuitStatus> {
  try {
    const status = await getCircuitStatus(redis, serviceKey);
    const now = Date.now();

    // Clean up old failures outside window
    const lastFailureTime = parseInt((await redis.hget(serviceKey, 'lastFailureTime')) || '0', 10);
    if (lastFailureTime && now - lastFailureTime > FAILURE_WINDOW * 1000) {
      // Reset counter if outside failure window
      await redis.hset(serviceKey, 'failures', 0);
    }

    // Increment failure counter
    const newFailures = (status.failures || 0) + 1;
    await redis.hset(serviceKey, [
      'failures', newFailures,
      'lastFailureTime', now,
    ]);

    if (newFailures >= FAILURE_THRESHOLD) {
      // Too many failures, open circuit
      await redis.hset(serviceKey, [
        'state', 'OPEN',
        'openedAt', now,
        'successes', 0,
      ]);
      logger.warn(
        `[CircuitBreaker] ${serviceKey}: CLOSED → OPEN (${newFailures} failures)`,
      );

      return {
        state: 'OPEN',
        failures: newFailures,
        successes: 0,
        nextRetryAt: new Date(now + TIMEOUT * 1000),
        openedAt: new Date(now),
      };
    }

    return status;
  } catch (error) {
    logger.error(
      `[CircuitBreaker] Record failure failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      nextRetryAt: new Date(),
    };
  }
}

/**
 * Check if request should be allowed (circuit open = false).
 */
export async function canAttempt(
  redis: Redis,
  serviceKey: string,
): Promise<{
  allowed: boolean;
  state: CircuitState;
  reason?: string;
}> {
  try {
    const status = await getCircuitStatus(redis, serviceKey);

    if (status.state === 'CLOSED') {
      return {
        allowed: true,
        state: 'CLOSED',
      };
    }

    if (status.state === 'OPEN') {
      return {
        allowed: false,
        state: 'OPEN',
        reason: `Circuit breaker OPEN. Retry after ${status.nextRetryAt.toISOString()}`,
      };
    }

    // HALF_OPEN - allow limited attempts
    return {
      allowed: true,
      state: 'HALF_OPEN',
      reason: 'Circuit in HALF_OPEN state, attempting recovery',
    };
  } catch (error) {
    logger.error(
      `[CircuitBreaker] Can attempt check failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return {
      allowed: true,
      state: 'CLOSED',
    };
  }
}

/**
 * Manually reset circuit to CLOSED state (admin operation).
 */
export async function resetCircuit(
  redis: Redis,
  serviceKey: string,
): Promise<boolean> {
  try {
    await redis.hset(serviceKey, [
      'state', 'CLOSED',
      'failures', 0,
      'successes', 0,
      'lastFailureTime', 0,
      'openedAt', 0,
    ]);
    logger.log(`[CircuitBreaker] ${serviceKey}: Manually reset to CLOSED`);
    return true;
  } catch (error) {
    logger.error(
      `[CircuitBreaker] Reset failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return false;
  }
}

/**
 * Get stats for all open circuits (for monitoring dashboard).
 */
export async function getOpenCircuits(
  redis: Redis,
): Promise<Array<{ serviceKey: string; state: CircuitState; failures: number }>> {
  try {
    const keys = await redis.keys('circuit:*');
    const circuits: Array<{ serviceKey: string; state: CircuitState; failures: number }> = [];

    for (const key of keys) {
      const state = (await redis.hget(key, 'state')) as CircuitState;
      const failures = parseInt((await redis.hget(key, 'failures')) || '0', 10);

      if (state === 'OPEN') {
        circuits.push({
          serviceKey: key,
          state,
          failures,
        });
      }
    }

    return circuits;
  } catch (error) {
    logger.error(
      `[CircuitBreaker] Get open circuits failed: ${error instanceof Error ? error.message : String(error)}`,
      error,
    );
    return [];
  }
}

/**
 * Wrapper to automatically handle success/failure recording.
 */
export async function executeWithCircuitBreaker<T>(
  redis: Redis,
  serviceKey: string,
  fn: () => Promise<T>,
): Promise<T> {
  // Check if circuit allows attempt
  const attempt = await canAttempt(redis, serviceKey);
  if (!attempt.allowed) {
    throw new Error(
      `Circuit Breaker OPEN for ${serviceKey}. ${attempt.reason}`,
    );
  }

  try {
    // Execute function
    const result = await fn();

    // Record success
    await recordSuccess(redis, serviceKey);

    return result;
  } catch (error) {
    // Record failure
    await recordFailure(redis, serviceKey);

    // Re-throw original error
    throw error;
  }
}
