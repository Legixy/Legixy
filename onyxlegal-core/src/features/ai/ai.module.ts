/**
 * AIModule Integration Setup
 *
 * Integrates:
 * - BullMQ Queues
 * - Worker Processors
 * - WebSocket Gateway
 * - Rate Limiting
 * - All AI Services
 */

import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebSocketGateway } from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AIEngine } from './services/aiEngine';
import { ContractAnalysisWorker } from './workers/contractAnalysis.worker';
import { AIAnalysisGateway } from './websocket/analysis.gateway';
import { RateLimitGuard } from '../../common/guards/rateLimit.guard';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'contract-analysis',
    }),
    BullModule.registerQueue({
      name: 'clause-fix',
    }),
  ],
  providers: [
    AIEngine,
    ContractAnalysisWorker,
    AIAnalysisGateway,
    RateLimitGuard,
  ],
  exports: [
    AIEngine,
    ContractAnalysisWorker,
    AIAnalysisGateway,
    RateLimitGuard,
  ],
})
export class AIModule implements OnModuleInit, OnModuleDestroy {
  private worker: ContractAnalysisWorker;
  private wsGateway: AIAnalysisGateway;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private aiEngine: AIEngine,
    private gateway: AIAnalysisGateway,
    private contractWorker: ContractAnalysisWorker,
  ) {
    this.wsGateway = gateway;
    this.worker = contractWorker;
  }

  async onModuleInit(): Promise<void> {
    console.log('🚀 Initializing AI Module');

    // Get Redis connection config
    const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';

    console.log('✅ AI Module initialized');
    console.log('   - BullMQ Queues: contract-analysis, clause-fix');
    console.log('   - Worker: ContractAnalysisWorker');
    console.log('   - WebSocket: AIAnalysisGateway');
    console.log('   - Rate Limiting: Enabled');
  }

  async onModuleDestroy(): Promise<void> {
    console.log('🛑 Destroying AI Module');
    await this.worker.shutdown();
    console.log('✅ AI Module destroyed');
  }
}
