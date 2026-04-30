import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIEngine } from './services/aiEngine';
import { AIAnalysisGateway } from './websocket/analysis.gateway';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'contract-analysis' }),
    BullModule.registerQueue({ name: 'clause-fix' }),
  ],
  providers: [AIEngine, AIAnalysisGateway],
  exports: [AIEngine, AIAnalysisGateway],
})
export class AIModule {}
