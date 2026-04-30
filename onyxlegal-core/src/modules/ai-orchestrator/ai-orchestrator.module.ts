import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiOrchestratorController } from './ai-orchestrator.controller';
import { AiOrchestratorService } from './ai-orchestrator.service';
import { RateLimitGuard } from '../../common/guards/rateLimit.guard';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'contract-analysis',
    }),
    BullModule.registerQueue({
      name: 'contract-analysis-dlq',
    }),
  ],
  controllers: [AiOrchestratorController],
  providers: [AiOrchestratorService, RateLimitGuard],
  exports: [AiOrchestratorService],
})
export class AiOrchestratorModule {}
