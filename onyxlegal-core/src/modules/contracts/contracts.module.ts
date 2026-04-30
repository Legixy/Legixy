import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractActionPanelController } from '../../features/contracts/controllers/contractActionPanel.controller';
import { RiskFormatterService } from '../../features/contracts/services/riskFormatter.service';
import { ContractFixService } from '../../features/contracts/services/contractFix.service';
import { ContractHistoryService } from '../../features/contracts/services/contractHistory.service';

@Module({
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
