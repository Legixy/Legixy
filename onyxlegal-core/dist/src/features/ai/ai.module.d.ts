import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AIEngine } from './services/aiEngine';
import { ContractAnalysisWorker } from './workers/contractAnalysis.worker';
import { AIAnalysisGateway } from './websocket/analysis.gateway';
export declare class AIModule implements OnModuleInit, OnModuleDestroy {
    private configService;
    private prisma;
    private aiEngine;
    private gateway;
    private contractWorker;
    private worker;
    private wsGateway;
    constructor(configService: ConfigService, prisma: PrismaService, aiEngine: AIEngine, gateway: AIAnalysisGateway, contractWorker: ContractAnalysisWorker);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
