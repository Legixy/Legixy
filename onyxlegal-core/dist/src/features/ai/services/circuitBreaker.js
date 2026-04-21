"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordSuccess = recordSuccess;
exports.recordFailure = recordFailure;
exports.canAttempt = canAttempt;
exports.resetCircuit = resetCircuit;
exports.getOpenCircuits = getOpenCircuits;
exports.executeWithCircuitBreaker = executeWithCircuitBreaker;
const common_1 = require("@nestjs/common");
const logger = new common_1.Logger('CircuitBreaker');
const FAILURE_THRESHOLD = 5;
const SUCCESS_THRESHOLD = 3;
const FAILURE_WINDOW = 60;
const TIMEOUT = 30;
async function getCircuitStatus(redis, serviceKey) {
    try {
        const state = (await redis.hget(serviceKey, 'state'));
        const failures = parseInt((await redis.hget(serviceKey, 'failures')) || '0', 10);
        const successes = parseInt((await redis.hget(serviceKey, 'successes')) || '0', 10);
        const lastFailureTime = parseInt((await redis.hget(serviceKey, 'lastFailureTime')) || '0', 10);
        const openedAt = parseInt((await redis.hget(serviceKey, 'openedAt')) || '0', 10);
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
            nextRetryAt: new Date((openedAt || Date.now()) + TIMEOUT * 1000),
            openedAt: openedAt ? new Date(openedAt) : undefined,
        };
    }
    catch (error) {
        logger.error(`[CircuitBreaker] Status check failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            state: 'CLOSED',
            failures: 0,
            successes: 0,
            nextRetryAt: new Date(),
        };
    }
}
async function recordSuccess(redis, serviceKey) {
    try {
        const status = await getCircuitStatus(redis, serviceKey);
        if (status.state === 'CLOSED') {
            await redis.hset(serviceKey, 'failures', 0);
            return status;
        }
        if (status.state === 'HALF_OPEN') {
            const newSuccesses = (status.successes || 0) + 1;
            await redis.hset(serviceKey, 'successes', newSuccesses);
            if (newSuccesses >= SUCCESS_THRESHOLD) {
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
            logger.log(`[CircuitBreaker] ${serviceKey}: Success in HALF_OPEN (${newSuccesses}/${SUCCESS_THRESHOLD})`);
        }
        return status;
    }
    catch (error) {
        logger.error(`[CircuitBreaker] Record success failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            state: 'CLOSED',
            failures: 0,
            successes: 0,
            nextRetryAt: new Date(),
        };
    }
}
async function recordFailure(redis, serviceKey) {
    try {
        const status = await getCircuitStatus(redis, serviceKey);
        const now = Date.now();
        const lastFailureTime = parseInt((await redis.hget(serviceKey, 'lastFailureTime')) || '0', 10);
        if (lastFailureTime && now - lastFailureTime > FAILURE_WINDOW * 1000) {
            await redis.hset(serviceKey, 'failures', 0);
        }
        const newFailures = (status.failures || 0) + 1;
        await redis.hset(serviceKey, [
            'failures', newFailures,
            'lastFailureTime', now,
        ]);
        if (newFailures >= FAILURE_THRESHOLD) {
            await redis.hset(serviceKey, [
                'state', 'OPEN',
                'openedAt', now,
                'successes', 0,
            ]);
            logger.warn(`[CircuitBreaker] ${serviceKey}: CLOSED → OPEN (${newFailures} failures)`);
            return {
                state: 'OPEN',
                failures: newFailures,
                successes: 0,
                nextRetryAt: new Date(now + TIMEOUT * 1000),
                openedAt: new Date(now),
            };
        }
        return status;
    }
    catch (error) {
        logger.error(`[CircuitBreaker] Record failure failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            state: 'CLOSED',
            failures: 0,
            successes: 0,
            nextRetryAt: new Date(),
        };
    }
}
async function canAttempt(redis, serviceKey) {
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
        return {
            allowed: true,
            state: 'HALF_OPEN',
            reason: 'Circuit in HALF_OPEN state, attempting recovery',
        };
    }
    catch (error) {
        logger.error(`[CircuitBreaker] Can attempt check failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return {
            allowed: true,
            state: 'CLOSED',
        };
    }
}
async function resetCircuit(redis, serviceKey) {
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
    }
    catch (error) {
        logger.error(`[CircuitBreaker] Reset failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return false;
    }
}
async function getOpenCircuits(redis) {
    try {
        const keys = await redis.keys('circuit:*');
        const circuits = [];
        for (const key of keys) {
            const state = (await redis.hget(key, 'state'));
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
    }
    catch (error) {
        logger.error(`[CircuitBreaker] Get open circuits failed: ${error instanceof Error ? error.message : String(error)}`, error);
        return [];
    }
}
async function executeWithCircuitBreaker(redis, serviceKey, fn) {
    const attempt = await canAttempt(redis, serviceKey);
    if (!attempt.allowed) {
        throw new Error(`Circuit Breaker OPEN for ${serviceKey}. ${attempt.reason}`);
    }
    try {
        const result = await fn();
        await recordSuccess(redis, serviceKey);
        return result;
    }
    catch (error) {
        await recordFailure(redis, serviceKey);
        throw error;
    }
}
//# sourceMappingURL=circuitBreaker.js.map