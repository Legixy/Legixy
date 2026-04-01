import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiOrchestratorController } from './ai-orchestrator.controller';
import { AiOrchestratorService } from './ai-orchestrator.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'contract-analysis',
    }),
  ],
  controllers: [AiOrchestratorController],
  providers: [AiOrchestratorService],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}
