import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ContractAnalysisWorker } from './contractAnalysis.worker';
import { AIAnalysisGateway } from '../websocket/analysis.gateway';
import { AIEngine } from '../services/aiEngine';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private workerInstance: ContractAnalysisWorker | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly gateway: AIAnalysisGateway,
    private readonly prisma: PrismaService,
    private readonly aiEngine: AIEngine,
    @InjectQueue('contract-analysis-dlq') private readonly dlqQueue: Queue,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    let connection: Record<string, unknown>;

    try {
      const url = new URL(redisUrl);
      connection = {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
        ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
      };
    } catch {
      this.logger.warn(`Could not parse REDIS_URL "${redisUrl}", falling back to localhost`);
      connection = { host: 'localhost', port: 6379 };
    }

    this.workerInstance = new ContractAnalysisWorker(
      connection,
      this.aiEngine,
      this.prisma,
      this.dlqQueue,
      2,
    );

    this.workerInstance.attachWebSocketGateway(this.gateway);
    this.workerInstance.start();
    this.logger.log('ContractAnalysisWorker started with WebSocket gateway attached');
  }

  async onModuleDestroy() {
    await this.workerInstance?.shutdown();
    this.logger.log('ContractAnalysisWorker shut down');
  }
}
