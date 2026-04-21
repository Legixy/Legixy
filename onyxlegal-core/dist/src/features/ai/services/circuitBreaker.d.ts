import { Redis } from 'ioredis';
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
interface CircuitStatus {
    state: CircuitState;
    failures: number;
    successes: number;
    nextRetryAt: Date;
    openedAt?: Date;
}
export declare function recordSuccess(redis: Redis, serviceKey: string): Promise<CircuitStatus>;
export declare function recordFailure(redis: Redis, serviceKey: string): Promise<CircuitStatus>;
export declare function canAttempt(redis: Redis, serviceKey: string): Promise<{
    allowed: boolean;
    state: CircuitState;
    reason?: string;
}>;
export declare function resetCircuit(redis: Redis, serviceKey: string): Promise<boolean>;
export declare function getOpenCircuits(redis: Redis): Promise<Array<{
    serviceKey: string;
    state: CircuitState;
    failures: number;
}>>;
export declare function executeWithCircuitBreaker<T>(redis: Redis, serviceKey: string, fn: () => Promise<T>): Promise<T>;
export {};
