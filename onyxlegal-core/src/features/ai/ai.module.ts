import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIEngine } from './services/aiEngine';
import { AIAnalysisGateway } from './websocket/analysis.gateway';
import { WorkerService } from './workers/worker.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'contract-analysis' }),
    BullModule.registerQueue({ name: 'clause-fix' }),
    BullModule.registerQueue({ name: 'contract-analysis-dlq' }),
  ],
  providers: [AIEngine, AIAnalysisGateway, WorkerService],
  exports: [AIEngine, AIAnalysisGateway],
})
export class AIModule {}
