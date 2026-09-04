import { ReminderChannel } from 'generated/prisma/client';

/**
 * How a reminder reaches a person.
 *
 * ONE interface, one implementation today (email). Adding WhatsApp is a new
 * class plus a configuration value — the scheduler holds a `ReminderSender`
 * and never names a channel.
 *
 * Deliberately NOT built here: a WhatsApp stub, per-user channel preferences,
 * channel routing rules. Those are speculative until Meta approval exists.
 */

/** One licence needing attention, as the recipient will see it. */
export interface ReminderLine {
  licenseId: string;
  licenseName: string;
  /** Site name, or null for a company-wide licence. */
  siteName: string | null;
  /** Calendar date, "YYYY-MM-DD". */
  expiryDate: string;
  daysRemaining: number;
}

export interface ReminderMessage {
  recipientEmail: string;
  recipientName: string | null;
  /** All of this recipient's due licences, batched into one message. */
  lines: ReminderLine[];
  /**
   * The tenant's copy address, when one is set and this message is going to
   * an owner. Null on a message that is already addressed TO the copy
   * address, so it never receives the same licence twice in one sweep.
   */
  copyEmail?: string | null;
  /**
   * True when this batch is licences with NO owner, addressed to the copy
   * address. The renderer says so: a person receiving a reminder about a
   * licence nobody is responsible for should be told that, because assigning
   * an owner is the fix.
   */
  unowned?: boolean;
  /** Deep link into the application. */
  appUrl: string;
}

/** A failure that says what went wrong without leaking a stack trace. */
export interface SendFailure {
  ok: false;
  reason: string;
}
export interface SendSuccess {
  ok: true;
  channel: ReminderChannel;
}
export type SendResult = SendSuccess | SendFailure;

export abstract class ReminderSender {
  abstract readonly channel: ReminderChannel;
  /** True when this channel is actually usable right now. */
  abstract isAvailable(): boolean;
  abstract send(message: ReminderMessage): Promise<SendResult>;
}
