import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AIAnalysisGateway } from '../websocket/analysis.gateway';
import { AIEngine } from '../services/aiEngine';
import { PrismaService } from '../../../database/prisma.service';
export declare class WorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly gateway;
    private readonly prisma;
    private readonly aiEngine;
    private readonly dlqQueue;
    private readonly logger;
    private workerInstance;
    constructor(config: ConfigService, gateway: AIAnalysisGateway, prisma: PrismaService, aiEngine: AIEngine, dlqQueue: Queue);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
}
