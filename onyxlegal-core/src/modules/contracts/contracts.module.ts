import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractActionPanelController } from '../../features/contracts/controllers/contractActionPanel.controller';
import { RiskFormatterService } from '../../features/contracts/services/riskFormatter.service';
import { ContractFixService } from '../../features/contracts/services/contractFix.service';
import { ContractHistoryService } from '../../features/contracts/services/contractHistory.service';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit
    }),
  ],
  controllers: [ContractsController, ContractActionPanelController],
  providers: [
    ContractsService,
    RiskFormatterService,
    ContractFixService,
    ContractHistoryService,
  ],
  exports: [ContractsService],
})
export class ContractsModule {}
