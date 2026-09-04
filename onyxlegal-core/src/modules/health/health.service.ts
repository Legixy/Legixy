import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import {
  googleSignInConfigured,
  isDevelopmentEnv,
  validateEnvironment,
} from '../../config/environment';

/**
 * What an operator needs to know before a demo, and no more.
 *
 * TWO ENDPOINTS, DELIBERATELY
 * ---------------------------
 * Slice 8 declined to publish delivery status on the `@Public()` health route
 * and was right to: "no SMTP configured" tells an anonymous caller that
 * notifications are not being sent, which is operational reconnaissance.
 *
 * But an operator ten minutes from a client demo genuinely needs to know it,
 * and hiding it from everyone meant it was only discoverable by reading the
 * source. So it is split:
 *
 *   · liveness  — public, says "the process is up" and nothing else
 *   · readiness — authenticated, says what is actually wrong
 *
 * The readiness report is honest about the uncomfortable parts. The product
 * tracks reminders it cannot send whenever SMTP is unset, and an operator who
 * does not know that will promise a client something that will not happen.
 */

export interface ReadinessCheck {
  name: string;
  ok: boolean;
  /** Plain language. Read aloud in a room, this should make sense. */
  detail: string;
  /** True when this does not block running, but an operator should know. */
  advisory?: boolean;
}

export interface ReadinessReport {
  ok: boolean;
  checkedAt: string;
  region: string;
  checks: ReadinessCheck[];
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Liveness. Public.
   *
   * Reveals nothing: no version, no region, no dependency state, no
   * configuration. "Is this process answering?" — that is the whole question.
   */
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  /** Readiness. Authenticated. Says what is actually wrong. */
  async readiness(): Promise<ReadinessReport> {
    const checks: ReadinessCheck[] = [];

    checks.push(await this.database());
    checks.push(await this.migrations());
    checks.push(await this.scheduler());
    checks.push(this.delivery());
    checks.push(this.encryption());
    checks.push(this.environment());
    checks.push(this.googleSignIn());

    return {
      ok: checks.every((c) => c.ok || c.advisory),
      checkedAt: new Date().toISOString(),
      region: process.env.DATA_REGION ?? '(not declared)',
      checks,
    };
  }

  private async database(): Promise<ReadinessCheck> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { name: 'database', ok: true, detail: 'PostgreSQL is reachable.' };
    } catch (error) {
      // The message may carry a connection string. Never echo it.
      this.logger.error(`Database unreachable: ${(error as Error).name}`);
      return {
        name: 'database',
        ok: false,
        detail: 'PostgreSQL is not reachable. Nothing will work until it is.',
      };
    }
  }

  /**
   * Migrations applied and current.
   *
   * Reads Prisma's own `_prisma_migrations` table rather than shelling out to
   * the CLI, because a deployed container has no CLI and no schema directory.
   */
  private async migrations(): Promise<ReadinessCheck> {
    try {
      const rows = await this.prisma.$queryRaw<
        { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
      >`SELECT migration_name, finished_at, rolled_back_at
          FROM _prisma_migrations
         ORDER BY started_at DESC`;

      if (rows.length === 0) {
        return {
          name: 'migrations',
          ok: false,
          detail:
            'No migrations recorded. The schema may have been created by `db push`, '
            + 'which leaves no history and cannot be verified.',
        };
      }

      const pending = rows.filter((r) => r.finished_at === null && r.rolled_back_at === null);
      const rolledBack = rows.filter((r) => r.rolled_back_at !== null);

      if (pending.length > 0) {
        return {
          name: 'migrations',
          ok: false,
          detail: `${pending.length} migration(s) started but never finished: ${pending
            .map((r) => r.migration_name)
            .join(', ')}.`,
        };
      }
      if (rolledBack.length > 0) {
        return {
          name: 'migrations',
          ok: false,
          detail: `${rolledBack.length} migration(s) rolled back. The schema is not in a known state.`,
        };
      }

      return {
        name: 'migrations',
        ok: true,
        detail: `${rows.length} migration(s) applied. Latest: ${rows[0].migration_name}.`,
      };
    } catch {
      return {
        name: 'migrations',
        ok: false,
        detail:
          'Could not read the migration history table. The schema is not in a known state.',
      };
    }
  }

  /**
   * Scheduler registered, and when it last swept.
   *
   * "Last swept" is derived from the most recent reminder the dispatcher
   * touched, not from an in-memory counter — an in-memory value resets on
   * restart and would report a fresh process as healthy when it had never
   * run. This asks the database, which is the only witness that survives.
   */
  private async scheduler(): Promise<ReadinessCheck> {
    const enabled = this.config.get<string>('REMINDER_SCHEDULER_ENABLED') !== 'false';

    if (!enabled) {
      return {
        name: 'scheduler',
        ok: true,
        advisory: true,
        detail:
          'Disabled by REMINDER_SCHEDULER_ENABLED=false. This instance serves the API '
          + 'but sends nothing. Correct for a second instance; wrong for the only one.',
      };
    }

    try {
      const last = await this.prisma.licenseReminder.findFirst({
        where: { sentAt: { not: null } },
        orderBy: { sentAt: 'desc' },
        select: { sentAt: true },
      });

      return {
        name: 'scheduler',
        ok: true,
        detail: last?.sentAt
          ? `Enabled, hourly. Last delivery recorded ${last.sentAt.toISOString()}.`
          : 'Enabled, hourly. No delivery has ever been recorded.',
      };
    } catch {
      return { name: 'scheduler', ok: false, detail: 'Could not read reminder state.' };
    }
  }

  /**
   * The one an operator most needs and is least likely to guess.
   *
   * With no SMTP host the product still computes every reminder, schedules
   * it, and defers it forever. Nothing looks broken. This says it plainly.
   */
  private delivery(): ReadinessCheck {
    const host = process.env.SMTP_HOST;

    if (!host) {
      return {
        name: 'delivery',
        ok: false,
        advisory: true,
        detail:
          'NO DELIVERY CHANNEL. SMTP_HOST is not set, so reminders are computed and '
          + 'scheduled but never sent. The register is accurate; nobody is told. '
          + 'Deliveries resume automatically the moment a channel is configured — '
          + 'nothing is lost in the meantime.',
      };
    }

    const from = process.env.SMTP_FROM ?? 'noreply@legixy.com';
    return {
      name: 'delivery',
      ok: true,
      // Host and from-address only. Never the user, never the password.
      detail: `Email configured, sending as ${from}.`,
    };
  }

  private encryption(): ReadinessCheck {
    const key = process.env.DOCUMENT_ENCRYPTION_KEY;
    const development = isDevelopmentEnv();

    if (key && key.length >= 32) {
      return {
        name: 'document-encryption',
        ok: true,
        detail: 'A document encryption key is configured.',
      };
    }

    if (development) {
      const permitted = process.env.ALLOW_INSECURE_DEV_DOCUMENT_ENCRYPTION === 'true';
      return {
        name: 'document-encryption',
        ok: false,
        advisory: true,
        detail: permitted
          ? 'RUNNING ON THE DEVELOPMENT KEY. Documents written now are not meaningfully '
            + 'encrypted. Never point this instance at real client files.'
          : 'No encryption key set. Uploads are refused (development default).',
      };
    }

    // Outside development this cannot happen — the storage constructor throws.
    return {
      name: 'document-encryption',
      ok: false,
      detail: 'No usable DOCUMENT_ENCRYPTION_KEY. The application should not have started.',
    };
  }

  private environment(): ReadinessCheck {
    const report = validateEnvironment();
    if (report.ok && report.warnings.length === 0) {
      return { name: 'environment', ok: true, detail: 'All required variables are set and valid.' };
    }
    if (report.ok) {
      return {
        name: 'environment',
        ok: true,
        advisory: true,
        detail: report.warnings.join(' '),
      };
    }
    return { name: 'environment', ok: false, detail: report.errors.join(' ') };
  }

  private googleSignIn(): ReadinessCheck {
    return googleSignInConfigured()
      ? { name: 'google-sign-in', ok: true, detail: 'Configured.' }
      : {
          name: 'google-sign-in',
          ok: true,
          advisory: true,
          detail:
            'Not configured, so the "Continue with Google" button is hidden. '
            + 'Email and password sign-in is unaffected.',
        };
  }
}
