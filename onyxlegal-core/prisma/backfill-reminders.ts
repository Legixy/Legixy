/**
 * One-off backfill for the duplicate reminder rows reported in Slice 6.
 *
 * Two distinct problems share one symptom:
 *
 *  1. Stale FAILED / UNDELIVERABLE rows left behind by an expiry change.
 *     reconcile() now retires these; this script just runs it.
 *
 *  2. Rows written by Slice 5's own backfill with a fixed date of 2026-09-07
 *     rather than one derived from the licence's expiry. Four carry status
 *     SENT with a sentAt in the FUTURE, which is not history — a delivery
 *     cannot have happened tomorrow. Preserving them would leave the demo
 *     asserting that a reminder was sent on a date unrelated to the licence.
 *     Those are deleted as corrupt seed data, and only those.
 *
 * Run: npx ts-node -r tsconfig-paths/register prisma/backfill-reminders.ts
 */

import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../src/database/prisma.service';
import { RemindersService } from '../src/modules/compliance/reminders/reminders.service';

async function main() {
  const config = {
    get: (k: string, f?: string) => process.env[k] ?? f,
  } as unknown as ConfigService;
  const prisma = new PrismaService(config);
  await prisma.onModuleInit();
  const reminders = new RemindersService(prisma);

  // ── 1. Delete provably fabricated deliveries ───────────────────────────
  const impossible = await prisma.licenseReminder.findMany({
    where: { status: 'SENT', sentAt: { gt: new Date() } },
    select: { id: true, licenseId: true, dueOn: true, sentAt: true },
  });
  if (impossible.length > 0) {
    await prisma.licenseReminder.deleteMany({
      where: { id: { in: impossible.map((r) => r.id) } },
    });
  }
  console.log(
    `  deleted ${impossible.length} reminder(s) "sent" in the future`,
  );

  // ── 2. Reconcile every licence so stale rows are retired ────────────────
  const licences = await prisma.license.findMany({ select: { id: true } });
  for (const licence of licences) {
    await reminders.reconcile(licence.id);
  }
  console.log(`  reconciled ${licences.length} licence(s)`);

  await prisma.onModuleDestroy();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
