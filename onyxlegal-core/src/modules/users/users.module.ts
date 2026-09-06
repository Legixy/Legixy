import { Module } from '@nestjs/common';
import { ComplianceAuditService } from '../compliance/audit/compliance-audit.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ComplianceAuditService],
  exports: [UsersService],
})
export class UsersModule {}
