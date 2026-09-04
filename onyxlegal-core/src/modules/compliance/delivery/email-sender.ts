import { Injectable, Logger } from '@nestjs/common';
import { ReminderChannel } from 'generated/prisma/client';
import { MailerService } from '../../../common/mailer/mailer.service';
import { ReminderMessage, ReminderSender, SendResult } from './channel';

/**
 * Email delivery.
 *
 * DATA MINIMISATION — the important part of this file
 * ---------------------------------------------------
 * Email is not a controlled channel, and this system holds data that falls
 * under Saudi PDPL. The message therefore carries only what a person needs to
 * decide to act: which licence, where, when it expires, and a link.
 *
 * It deliberately contains NO licence number, national ID, iqama number, GOSI
 * reference, or attachment. Those stay behind authentication. A test asserts
 * the rendered body contains none of them, so a future edit that adds one
 * fails the build rather than quietly leaking into an inbox.
 */
@Injectable()
export class EmailReminderSender extends ReminderSender {
  readonly channel = ReminderChannel.EMAIL;
  private readonly logger = new Logger(EmailReminderSender.name);

  constructor(private readonly mailer: MailerService) {
    super();
  }

  isAvailable(): boolean {
    return this.mailer.isConfigured;
  }

  async send(message: ReminderMessage): Promise<SendResult> {
    try {
      const body = renderReminderText(message);
      await this.mailer.send({
        to: message.recipientEmail,
        cc: message.copyEmail ?? null,
        subject: renderSubject(message),
        text: body,
      });
      return { ok: true, channel: this.channel };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown delivery error';
      this.logger.warn(
        `Reminder email to ${message.recipientEmail} failed: ${reason}`,
      );
      // Truncated, and never a stack trace — this string is shown in the UI.
      return { ok: false, reason: reason.slice(0, 300) };
    }
  }
}

export function renderSubject(message: ReminderMessage): string {
  if (message.lines.length === 1) {
    const line = message.lines[0];
    return line.daysRemaining < 0
      ? `Expired: ${line.licenseName}`
      : `${line.licenseName} expires in ${line.daysRemaining} days`;
  }
  return `${message.lines.length} licences need your attention`;
}

/**
 * The message body.
 *
 * Plain text on purpose: it renders identically everywhere, cannot carry a
 * tracking pixel, and makes the minimisation rule easy to verify by reading.
 */
export function renderReminderText(message: ReminderMessage): string {
  const greeting = message.recipientName
    ? `Hello ${message.recipientName},`
    : 'Hello,';

  const lines = message.lines.map((line) => {
    const where = line.siteName ?? 'Company-wide';
    const when =
      line.daysRemaining < 0
        ? `expired ${Math.abs(line.daysRemaining)} days ago`
        : line.daysRemaining === 0
          ? 'expires today'
          : `expires in ${line.daysRemaining} days`;
    return `  • ${line.licenseName} (${where}) — ${when}, on ${line.expiryDate}`;
  });

  /*
    The lead line changes when the batch is licences with NO owner.

    "A licence you are responsible for" would be untrue on that message — the
    recipient is the tenant's copy address precisely BECAUSE nobody is
    responsible. Saying so is also the useful part: assigning an owner is the
    fix, and the reader is the person who can do it.
  */
  const subject = message.unowned
    ? message.lines.length === 1
      ? 'A licence with nobody assigned is coming up for renewal.'
      : 'Some licences with nobody assigned are coming up for renewal.'
    : message.lines.length === 1
      ? 'A licence you are responsible for is coming up for renewal.'
      : 'Some licences you are responsible for are coming up for renewal.';

  return [
    greeting,
    '',
    subject,
    '',
    ...lines,
    '',
    ...(message.unowned
      ? [
          'Nobody is assigned to ' +
            (message.lines.length === 1 ? 'it' : 'these') +
            ', so this went to your workspace copy address. Assigning an owner ' +
            'sends future reminders to them directly.',
          '',
        ]
      : []),
    `Open the full record here: ${message.appUrl}`,
    '',
    'Licence numbers and documents are not included in this email.',
    'Sign in to see them.',
  ].join('\n');
}
