import { AIEngine } from '../services/aiEngine';
import { PrismaService } from '../../../database/prisma.service';
import { Queue } from 'bullmq';
export declare class ContractAnalysisWorker {
    private logger;
    private worker;
    private aiEngine;
    private prisma;
    private websocketGateway;
    private dlqQueue;
    constructor(redisConnection: any, aiEngine: AIEngine, prisma: PrismaService, dlqQueue: Queue, concurrency?: number);
    private processorFn;
    private attachEventHandlers;
    private mapRiskLevel;
    private emitEvent;
    attachWebSocketGateway(gateway: any): void;
    start(): Promise<void>;
    shutdown(): Promise<void>;
    getStats(): any;
}
