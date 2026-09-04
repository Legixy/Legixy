import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Worker } from 'bullmq';
import { ReminderDispatchService } from './reminder-dispatch.service';
import { DocumentRetentionService } from '../documents/document-retention.service';
import { ReminderSender } from '../delivery/channel';

export const REMINDER_QUEUE = 'compliance-reminders';
/** Daily retention purge, on the same queue and worker as the sweep. */
const PURGE_NAME = 'document-retention-purge';
const PURGE_JOB_ID = 'document-retention-purge-daily';
/** Fixed key so repeated boots replace the schedule rather than stacking it. */
const REPEATABLE_JOB_ID = 'compliance-reminder-sweep';
const SWEEP_NAME = 'sweep';

/**
 * Runs the reminder sweep on a schedule.
 *
 * QUEUE ISOLATION
 * ---------------
 * `compliance-reminders` is a NEW queue name, verified unused. It deliberately
 * does not touch `contract-analysis`, which has two competing consumers (Core's
 * in-process AI worker and the standalone Gemini worker) — a known collision
 * this slice must not extend into.
 *
 * DUPLICATION SAFETY
 * ------------------
 * Hourly, not daily: the sweep must get several chances to land inside the
 * tenant's business-hours window, and a missed hour must not cost a day.
 *
 * If Core is ever run as more than one instance, three things prevent a double
 * send, in increasing order of authority:
 *   1. the repeatable job is registered with a fixed jobId, so BullMQ keeps one
 *   2. the sweep is idempotent — it only selects PENDING, unclaimed rows
 *   3. every send is gated by a database compare-and-swap claim
 * Only (3) is load-bearing. The others are hygiene.
 */
@Injectable()
export class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private worker: Worker | null = null;

  constructor(
    @InjectQueue(REMINDER_QUEUE) private readonly queue: Queue,
    private readonly dispatch: ReminderDispatchService,
    private readonly retention: DocumentRetentionService,
    private readonly sender: ReminderSender,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Opt-out for test runs and for anyone who does not want a live scheduler.
    if (this.config.get<string>('REMINDER_SCHEDULER_ENABLED') === 'false') {
      this.logger.warn('Reminder scheduler disabled by configuration');
      return;
    }

    const connection = this.redisConnection();

    try {
      this.worker = new Worker(
        REMINDER_QUEUE,
        async (job) => {
          // Two repeatable jobs share this queue and this worker. Retention is
          // not a reminder, but it is the same kind of thing — a scheduled
          // sweep — and a second queue would mean a second Redis connection
          // and a second failure mode for no benefit.
          if (job.name === PURGE_NAME) {
            return await this.retention.purgeExpired();
          }

          const outcome = await this.dispatch.sweep();
          this.logger.log(
            `Reminder sweep: sent=${outcome.sent} undeliverable=${outcome.undeliverable} ` +
              `failed=${outcome.failed} skipped=${outcome.skipped} ` +
              `deferred=${outcome.deferred} noChannel=${outcome.deferredNoChannel}`,
          );
          return outcome;
        },
        { connection, concurrency: 1 },
      );

      this.worker.on('failed', (job, error) => {
        // A broken sweep must be loud. Silence here means reminders stop
        // arriving and nobody finds out until a licence lapses.
        this.logger.error(`Reminder sweep failed: ${error.message}`);
      });

      await this.queue.add(
        SWEEP_NAME,
        {},
        {
          jobId: REPEATABLE_JOB_ID,
          repeat: { pattern: '0 * * * *' }, // hourly, on the hour
          removeOnComplete: 24,
          removeOnFail: 24,
        },
      );

      await this.queue.add(
        PURGE_NAME,
        {},
        {
          jobId: PURGE_JOB_ID,
          // 03:20 daily — off the hour so it never lands on a sweep, and in
          // the small hours so a large purge competes with nothing.
          repeat: { pattern: '20 3 * * *' },
          removeOnComplete: 7,
          removeOnFail: 7,
        },
      );

      this.logger.log(
        `Reminder sweep scheduled hourly and document retention purge daily ` +
          `on "${REMINDER_QUEUE}"`,
      );

      // Say it at boot, not only when a sweep runs. A reminder system that
      // cannot send is the one failure this product must never have quietly.
      if (!this.sender.isAvailable()) {
        this.logger.warn(
          '='.repeat(70) +
            '\nNO DELIVERY CHANNEL IS CONFIGURED.\n' +
            'Reminders will be scheduled and tracked, but NOTHING WILL BE ' +
            'SENT.\nSet SMTP_HOST to enable email delivery.\n' +
            '='.repeat(70),
        );
      }
    } catch (error) {
      // Redis being unavailable must not stop the API from serving requests.
      this.logger.error(
        `Could not schedule reminder sweep: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }

  private redisConnection(): Record<string, unknown> {
    const url = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        ...(parsed.password
          ? { password: decodeURIComponent(parsed.password) }
          : {}),
        ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
      };
    } catch {
      return { host: 'localhost', port: 6379 };
    }
  }
}
