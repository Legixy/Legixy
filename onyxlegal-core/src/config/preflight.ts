#!/usr/bin/env node
/**
 * Preflight — what you run ten minutes before a client demo.
 *
 * WHO THIS IS FOR
 * ---------------
 * Someone who did not write it, under time pressure, who needs one answer:
 * can I show this now, yes or no. So the output leads with GO or NO-GO, every
 * failure names the variable or service at fault, and there is no line that
 * requires knowing the codebase to interpret.
 *
 * Exit code is the contract: 0 means go, 1 means stop. That makes it usable
 * from a script as well as by eye.
 *
 * NEVER PRINTS A SECRET. Variables marked `secret` are reported as SET or
 * NOT SET and never by value — the point of this tool is that it can be run
 * over someone's shoulder, or pasted into a chat, without leaking anything.
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  ENVIRONMENT,
  IN_KINGDOM_REGIONS,
  googleSignInConfigured,
  isDevelopmentEnv,
  validateEnvironment,
} from './environment';

dotenv.config();

const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const pass = (m: string) => console.log(`  ${GREEN}✓${RESET} ${m}`);
const fail = (m: string) => console.log(`  ${RED}✗${RESET} ${m}`);
const warn = (m: string) => console.log(`  ${YELLOW}!${RESET} ${m}`);
const note = (m: string) => console.log(`    ${DIM}${m}${RESET}`);

function heading(text: string): void {
  console.log(`\n${BOLD}${text}${RESET}`);
}

async function main(): Promise<void> {
  const problems: string[] = [];
  const advisories: string[] = [];

  console.log(`\n${BOLD}Legixy preflight${RESET}`);
  console.log(`${DIM}${new Date().toISOString()}${RESET}`);

  // ── Environment ─────────────────────────────────────────────────────────
  heading('Configuration');
  const report = validateEnvironment();

  for (const problem of report.errors) {
    fail(problem);
    problems.push(problem);
  }
  for (const warning of report.warnings) {
    warn(warning);
    advisories.push(warning);
  }
  if (report.errors.length === 0) {
    pass(`All ${ENVIRONMENT.filter((v) => v.requirement === 'required').length} required variables set and valid.`);
  }
  if (report.defaulted.length > 0) {
    note(`Running on defaults: ${report.defaulted.join(', ')}`);
  }

  // ── Residency ───────────────────────────────────────────────────────────
  heading('Data residency');
  const region = process.env.DATA_REGION ?? '';
  const offshore = region !== '' && region !== 'local' && !IN_KINGDOM_REGIONS.includes(region);
  if (!region) {
    // Already counted by validateEnvironment above; shown here for context
    // but not double-counted, or the verdict says "2 problems" for one.
    fail('DATA_REGION is not declared — see Configuration above.');
  } else if (offshore) {
    warn(`DATA_REGION is "${region}" — outside Saudi Arabia.`);
    note('Synthetic demo data only. Do NOT upload real client documents here.');
    advisories.push(`offshore region ${region}`);
  } else if (region === 'local') {
    pass('DATA_REGION is "local" — a laptop. Nothing leaves this machine.');
  } else {
    pass(`DATA_REGION is "${region}" — inside the Kingdom.`);
  }

  // ── Database ────────────────────────────────────────────────────────────
  heading('Database');
  let prisma: PrismaClient | null = null;
  try {
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
    await prisma.$queryRaw`SELECT 1`;
    pass('PostgreSQL reachable.');

    const migrations = await prisma.$queryRaw<
      { migration_name: string; finished_at: Date | null }[]
    >`SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY started_at DESC`;

    const unfinished = migrations.filter((m) => m.finished_at === null);
    if (migrations.length === 0) {
      fail('No migrations recorded — the schema cannot be verified.');
      problems.push('no migrations recorded');
    } else if (unfinished.length > 0) {
      fail(`${unfinished.length} migration(s) unfinished.`);
      problems.push('unfinished migrations');
    } else {
      pass(`${migrations.length} migration(s) applied. Latest: ${migrations[0].migration_name}.`);
    }

    // ── Demo readiness ────────────────────────────────────────────────────
    heading('Demo data');
    const tenants = await prisma.tenant.count();
    const licences = await prisma.license.count();
    const withoutLadder = await prisma.license.count({
      where: { expiryDate: { not: null }, reminders: { none: {} } },
    });

    if (tenants === 0 || licences === 0) {
      warn('No demo data. Run `npm run demo:reset`.');
      advisories.push('no demo data');
    } else {
      pass(`${tenants} tenant(s), ${licences} licence(s) on record.`);
      if (withoutLadder > 0) {
        // The Slice 4 bug: rows written past the service layer never get
        // reminders, and nothing looks wrong until nothing is ever sent.
        fail(`${withoutLadder} licence(s) have an expiry but NO reminders. Run \`npm run demo:reset\`.`);
        problems.push(`${withoutLadder} licences without a reminder ladder`);
      } else {
        pass('Every licence with an expiry has a reminder ladder.');
      }
    }
  } catch (error) {
    // Never echo the error body: a Prisma connection error contains the URL.
    fail(`PostgreSQL is NOT reachable (${(error as Error).name}).`);
    problems.push('database unreachable');
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
  }

  // ── Delivery ────────────────────────────────────────────────────────────
  heading('Delivery');
  if (!process.env.SMTP_HOST) {
    warn('NO DELIVERY CHANNEL — SMTP_HOST is not set.');
    note('Reminders are computed and scheduled but never sent.');
    note('Nothing is lost: delivery resumes the moment a channel is configured.');
    note('If the demo includes "a reminder arrives", this is a NO-GO for that step.');
    // validateEnvironment already warns about this; not double-counted.
  } else {
    pass(`Email configured, sending as ${process.env.SMTP_FROM ?? 'noreply@legixy.com'}.`);
    note('Run `npm run smtp:test -- you@example.com` to prove it end to end.');
  }

  // ── Encryption ──────────────────────────────────────────────────────────
  heading('Document encryption');
  const key = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (key && key.length >= 32) {
    pass('Encryption key configured.');
  } else if (isDevelopmentEnv()) {
    warn('No encryption key — development. Uploads are refused unless explicitly allowed.');
    advisories.push('no encryption key (development)');
  } else {
    fail('No usable DOCUMENT_ENCRYPTION_KEY. The application will refuse to start.');
    problems.push('no encryption key');
  }

  // ── Sign-in ─────────────────────────────────────────────────────────────
  heading('Sign-in');
  pass('Email and password: available.');
  if (googleSignInConfigured()) {
    pass('Google: configured.');
  } else {
    note('Google: not configured, so the button is hidden. Email sign-in is unaffected.');
  }

  // ── Verdict ─────────────────────────────────────────────────────────────
  console.log('');
  if (problems.length === 0 && advisories.length === 0) {
    console.log(`${GREEN}${BOLD}  GO — everything checks out.${RESET}\n`);
    process.exit(0);
  }
  const uniqueAdvisories = [...new Set(advisories)];
  if (problems.length === 0) {
    console.log(`${YELLOW}${BOLD}  GO, WITH CAVEATS${RESET}`);
    console.log(`${DIM}  The system will run. These will be visible in the demo:${RESET}`);
    for (const a of uniqueAdvisories) console.log(`    · ${a}`);
    console.log('');
    process.exit(0);
  }
  console.log(`${RED}${BOLD}  NO-GO — ${problems.length} problem(s) must be fixed:${RESET}`);
  for (const p of problems) console.log(`    · ${p}`);
  console.log('');
  process.exit(1);
}

main().catch((error) => {
  console.error(`\n${RED}Preflight itself failed: ${(error as Error).message}${RESET}\n`);
  process.exit(1);
});
