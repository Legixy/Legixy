import { Module } from '@nestjs/common';
import { ComplianceAuditService } from '../compliance/audit/compliance-audit.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

/**
 * DatabaseModule and MailerModule are both @Global, so only the audit writer
 * needs providing here. It is a thin service over PrismaService and is
 * provided rather than imported because ComplianceModule does not export it.
 */
@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, ComplianceAuditService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
