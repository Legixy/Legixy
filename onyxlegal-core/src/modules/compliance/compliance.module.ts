import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ComplianceAuditService } from './audit/compliance-audit.service';
import { LicensesController } from './licenses/licenses.controller';
import { LicensesService } from './licenses/licenses.service';
import { SitesController } from './sites/sites.controller';
import { SitesService } from './sites/sites.service';
import { RemindersService } from './reminders/reminders.service';
import { CoverageService } from './coverage/coverage.service';
import { ReminderDispatchService } from './reminders/reminder-dispatch.service';
import {
  ReminderSchedulerService,
  REMINDER_QUEUE,
} from './reminders/reminder-scheduler.service';
import { ReminderSender } from './delivery/channel';
import { EmailReminderSender } from './delivery/email-sender';
import { DocumentsService } from './documents/documents.service';
import { DocumentRetentionService } from './documents/document-retention.service';
import { ComplianceNotificationsController } from './notifications/compliance-notifications.controller';
import { ComplianceNotificationsService } from './notifications/compliance-notifications.service';
import { RenewalWorkflowController } from './renewal/renewal-workflow.controller';
import { RenewalWorkflowService } from './renewal/renewal-workflow.service';
import { ImportController } from './import/import.controller';
import { ImportService } from './import/import.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { DocumentsController } from './documents/documents.controller';
import {
  DocumentStorage,
  LocalDocumentStorage,
} from './documents/document-storage';
import { RenewalService } from './renewal/renewal.service';
import { RenewalController } from './renewal/renewal.controller';
import { CoverageController } from './coverage/coverage.controller';
import { CatalogueController } from './catalogue/catalogue.controller';
import { DeliverySettingsController } from './delivery/delivery-settings.controller';
import { DeliverySettingsService } from './delivery/delivery-settings.service';
import { YearAheadService } from './dashboard/year-ahead.service';

/**
 * Compliance domain — sites and licences.
 *
 * Deliberately isolated from the contract/AI modules: it shares only the
 * platform primitives (PrismaService, auth, validation, error filter) and
 * has no dependency on the contract domain in either direction.
 *
 * Reminder OBLIGATIONS are persisted here; scheduling and delivery are not.
 *
 * Not present yet, by design — each is its own slice:
 *   · documents (needs object storage)
 *   · reminder scheduling + delivery (needs a scheduler and a channel)
 *   · dashboard aggregation
 */
@Module({
  imports: [
    // A NEW queue. Never `contract-analysis`, which already has two competing
    // consumers — see the slice report.
    BullModule.registerQueue({ name: REMINDER_QUEUE }),
  ],
  controllers: [
    DeliverySettingsController,
    SitesController,
    LicensesController,
    CoverageController,
    DashboardController,
    ComplianceNotificationsController,
    ImportController,
    RenewalWorkflowController,
    CatalogueController,
    DocumentsController,
    RenewalController,
  ],
  providers: [
    YearAheadService,
    DeliverySettingsService,
    SitesService,
    LicensesService,
    ComplianceAuditService,
    RemindersService,
    CoverageService,
    DashboardService,
    ComplianceNotificationsService,
    ImportService,
    RenewalWorkflowService,
    ReminderDispatchService,
    ReminderSchedulerService,
    // One channel today. Swapping in WhatsApp later is a change to this
    // binding, not to the scheduler.
    { provide: ReminderSender, useClass: EmailReminderSender },
    DocumentsService,
    DocumentRetentionService,
    RenewalService,
    // Encrypted local filesystem. Swapping in S3 is a change to this binding
    // only — no caller knows where bytes live.
    { provide: DocumentStorage, useClass: LocalDocumentStorage },
  ],
  exports: [
    SitesService,
    LicensesService,
    RemindersService,
    CoverageService,
    DashboardService,
    DocumentsService,
    DocumentRetentionService,
    RenewalService,
  ],
})
export class ComplianceModule {}
