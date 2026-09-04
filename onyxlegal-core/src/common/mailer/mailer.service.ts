import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

/**
 * The single outbound email path.
 *
 * Extracted from AuthService, which previously built a transport inline for
 * password resets. There is deliberately ONE sending path in this codebase —
 * a second would drift in configuration and failure behaviour.
 *
 * NOT CONFIGURED IS NOT AN ERROR
 * ------------------------------
 * When SMTP_HOST is absent, `isConfigured` is false and `send` refuses rather
 * than throwing. Callers must treat that as an explicit "no channel available"
 * outcome and record it honestly, never as a successful send.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  get isConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST);
  }

  private getTransport(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    }
    return this.transporter;
  }

  /**
   * Send one message. Throws on transport failure so the caller can record the
   * reason and retry — swallowing it would make a failed reminder look sent.
   */
  async send(message: {
    to: string;
    /**
     * Carbon copy. Used for the tenant's reminder copy address.
     *
     * `cc` rather than `bcc` deliberately: the licence owner should be able
     * to see that their compliance manager was told too. A hidden copy of a
     * message about someone's own responsibilities is the kind of thing that
     * damages trust when it is discovered.
     */
    cc?: string | null;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    if (!this.isConfigured) {
      throw new Error('No email transport configured (SMTP_HOST is not set)');
    }

    await this.getTransport().sendMail({
      from: process.env.SMTP_FROM || 'noreply@legixy.com',
      to: message.to,
      ...(message.cc ? { cc: message.cc } : {}),
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    this.logger.log(`Email sent to ${message.to}: ${message.subject}`);
  }
}
