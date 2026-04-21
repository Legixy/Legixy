import { HealthCheckService, LivenessProbeService, ReadinessProbeService } from '../health/healthCheck';
export declare class HealthCheckController {
    private readonly healthCheck;
    private readonly livenessProbe;
    private readonly readinessProbe;
    constructor(healthCheck: HealthCheckService, livenessProbe: LivenessProbeService, readinessProbe: ReadinessProbeService);
    getHealth(): Promise<import("../health/healthCheck").HealthCheckResult>;
    getLiveness(): Promise<{
        alive: boolean;
        timestamp: string;
    } | {
        statusCode: number;
        alive: boolean;
        timestamp: string;
    }>;
    getReadiness(): Promise<{
        ready: boolean;
        timestamp: string;
        checks?: Record<string, "ok" | "error">;
    } | {
        statusCode: number;
        ready: boolean;
        timestamp: string;
        checks?: Record<string, "ok" | "error">;
    }>;
}
