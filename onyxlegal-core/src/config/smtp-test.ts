#!/usr/bin/env node
/**
 * Prove delivery, end to end, in one command.
 *
 *   npm run smtp:test -- someone@example.com
 *
 * WHY THIS EXISTS
 * ---------------
 * SMTP credentials have been the critical path for twelve slices. When they
 * finally arrive, the question is "do they work?", and the honest way to
 * answer it is to send one real message and read the result — not to inspect
 * configuration and infer.
 *
 * It renders the SAME message the scheduler sends, through the SAME sender
 * class, so a success here means the reminder path works and not merely that
 * a socket opened. There is deliberately no separate "test template": a test
 * that exercises different code proves something about different code.
 *
 * Sends to ONE address you name on the command line. Never to a licence
 * owner, never to a tenant's real users — running a delivery test must not be
 * able to email a client by accident.
 */

import * as dotenv from 'dotenv';
import { MailerService } from '../common/mailer/mailer.service';
import { EmailReminderSender } from '../modules/compliance/delivery/email-sender';
import type { ReminderMessage } from '../modules/compliance/delivery/channel';

dotenv.config();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

/**
 * A representative message: two licences for one recipient, one inside a
 * week and one inside a month. Batching is the interesting case — a sender
 * that works for one line and breaks for two is a bug that only shows up on
 * a real tenant.
 */
function sampleMessage(recipient: string): ReminderMessage {
  const days = (n: number): string => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  return {
    recipientEmail: recipient,
    recipientName: 'Nadia Al-Otaibi',
    appUrl: process.env.APP_URL ?? 'http://localhost:3000',
    lines: [
      {
        licenseId: 'demo-1',
        licenseName: 'Balady Municipal Licence — Exit 9 Showroom',
        siteName: 'Exit 9 Showroom',
        expiryDate: days(12),
        daysRemaining: 12,
      },
      {
        licenseId: 'demo-2',
        licenseName: 'Civil Defence Certificate — Al-Khumrah Warehouse',
        siteName: 'Al-Khumrah Warehouse',
        expiryDate: days(26),
        daysRemaining: 26,
      },
    ],
  };
}

async function main(): Promise<void> {
  const recipient = process.argv[2];

  console.log(`\n${BOLD}Legixy delivery test${RESET}\n`);

  if (!recipient || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)) {
    console.error(`${RED}Give one email address to send to.${RESET}`);
    console.error(`${DIM}  npm run smtp:test -- you@example.com${RESET}\n`);
    process.exit(1);
  }

  const mailer = new MailerService();
  const sender = new EmailReminderSender(mailer);

  // ── Configured? ─────────────────────────────────────────────────────────
  if (!sender.isAvailable()) {
    console.error(`${RED}✗ No delivery channel.${RESET}`);
    console.error(`${DIM}  SMTP_HOST is not set, so there is nothing to test.${RESET}`);
    console.error(`${DIM}  Required: SMTP_HOST${RESET}`);
    console.error(`${DIM}  Optional: SMTP_PORT (587), SMTP_USER, SMTP_PASS, SMTP_FROM${RESET}`);
    console.error(
      `${DIM}  SMTP_PASS is required whenever SMTP_USER is set.${RESET}\n`,
    );
    process.exit(1);
  }

  const message = sampleMessage(recipient);

  console.log(`${DIM}Host      ${process.env.SMTP_HOST}:${process.env.SMTP_PORT ?? 587}${RESET}`);
  console.log(`${DIM}From      ${process.env.SMTP_FROM ?? 'noreply@legixy.com'}${RESET}`);
  console.log(`${DIM}To        ${recipient}${RESET}`);
  console.log(`${DIM}Auth      ${process.env.SMTP_USER ? 'username + password' : 'none'}${RESET}`);
  console.log('');

  // ── Send ────────────────────────────────────────────────────────────────
  const started = Date.now();
  const result = await sender.send(message);
  const elapsed = Date.now() - started;

  if (result.ok) {
    console.log(`${GREEN}${BOLD}✓ Delivered in ${elapsed}ms.${RESET}`);
    console.log(`${DIM}  Check ${recipient}. Two licences, batched into one message.${RESET}`);
    console.log(
      `${DIM}  This is the same sender the hourly sweep uses — nothing else needs proving.${RESET}\n`,
    );
    process.exit(0);
  }

  // ── Failure, stated precisely ───────────────────────────────────────────
  console.error(`${RED}${BOLD}✗ Not delivered.${RESET}`);
  console.error(`${RED}  ${result.reason}${RESET}`);
  console.error('');
  console.error(`${YELLOW}  Common causes:${RESET}`);
  console.error(`${DIM}    · Wrong port. 587 needs STARTTLS; 465 needs implicit TLS.${RESET}`);
  console.error(`${DIM}    · SMTP_USER set without SMTP_PASS — authentication fails at send.${RESET}`);
  console.error(`${DIM}    · The from-address is not one this relay is allowed to send as.${RESET}`);
  console.error(`${DIM}    · Outbound 587 blocked by the host's firewall.${RESET}\n`);
  process.exit(1);
}

main().catch((error) => {
  // The message may carry credentials; print the class, not the body.
  console.error(`\n${RED}Delivery test crashed: ${(error as Error).name}${RESET}`);
  console.error(`${DIM}${(error as Error).message.slice(0, 200)}${RESET}\n`);
  process.exit(1);
});
