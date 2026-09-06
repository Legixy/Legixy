import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';

// Infrastructure
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { AiOrchestratorModule } from './modules/ai-orchestrator/ai-orchestrator.module';
import { AIModule } from './features/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { UsersModule } from './modules/users/users.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { MailerModule } from './common/mailer/mailer.module';
import { HealthModule } from './modules/health/health.module';
import { logLevel, REDACT_PATHS } from './config/logging';

// Conditionally register BullMQ only if Redis is configured
const bullModuleImport = BullModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    connection: {
      url: config.get<string>('REDIS_URL', 'redis://localhost:6379'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 500, 3000);
      },
    },
  }),
});

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Structured Logging ────────────────────────────────
    // Redaction is configured here rather than at any call site, because a
    // call site can be forgotten. See config/logging.ts for what and why.
    LoggerModule.forRoot({
      pinoHttp: {
        level: logLevel(),
        redact: { paths: REDACT_PATHS, censor: '[redacted]' },
        // Pretty output on a laptop; raw JSON in a deployment, where a log
        // shipper needs to parse it and nobody is reading it by eye.
        transport:
          (process.env.NODE_ENV ?? 'development') === 'development'
            ? { target: 'pino-pretty', options: { singleLine: true, colorize: true } }
            : undefined,
      },
    }),

    // ── BullMQ (Redis queues) — will retry gracefully ─────
    bullModuleImport,

    // ── Database ──────────────────────────────────────────
    DatabaseModule,

    // ── Outbound email (single shared transport) ──────────
    MailerModule,

    // ── Features ──────────────────────────────────────────
    AuthModule,
    ContractsModule,
    TemplatesModule,
    AiOrchestratorModule,
    AIModule,
    AnalyticsModule,
    NotificationsModule,

    // ── Compliance (sites & licences) ─────────────────────
    ComplianceModule,
    UsersModule,
    InvitationsModule,
    HealthModule,
  ],
  providers: [
    // Global JWT auth guard — every route requires auth unless @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global RFC 7807 error handler
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
