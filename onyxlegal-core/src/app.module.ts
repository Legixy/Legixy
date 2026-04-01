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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

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
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: { singleLine: true, colorize: true },
        },
      },
    }),

    // ── BullMQ (Redis queues) — will retry gracefully ─────
    bullModuleImport,

    // ── Database ──────────────────────────────────────────
    DatabaseModule,

    // ── Features ──────────────────────────────────────────
    AuthModule,
    ContractsModule,
    TemplatesModule,
    AiOrchestratorModule,
    AnalyticsModule,
    NotificationsModule,
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
