import { Global, Module } from '@nestjs/common';
import { MailerService } from './mailer.service';

/** Global so both auth (password reset) and compliance (reminders) share it. */
@Global()
@Module({
  providers: [MailerService],
  exports: [MailerService],
})
export class MailerModule {}
