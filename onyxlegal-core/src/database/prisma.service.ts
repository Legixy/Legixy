import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * PrismaService — thin wrapper around PrismaClient for NestJS DI.
 *
 * Prisma 7 requires an explicit adapter. We use @prisma/adapter-pg
 * which connects to the Prisma Postgres local dev server or any
 * standard PostgreSQL database.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly client: InstanceType<typeof PrismaClient>;

  constructor(private readonly config: ConfigService) {
    // Extract the raw Postgres URL from the Prisma Postgres proxy URL
    // prisma+postgres://... contains a base64 JSON with the actual database URL
    const databaseUrl = this.config.get<string>('DATABASE_URL', '');

    // For Prisma Postgres local: decode the api_key to get the actual postgres:// URL
    let connectionString: string;
    try {
      const url = new URL(databaseUrl.replace('prisma+postgres://', 'http://'));
      const apiKey = url.searchParams.get('api_key') || '';
      const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
      connectionString = decoded.databaseUrl;
    } catch {
      // Fallback: assume it's a direct postgres:// URL
      connectionString = databaseUrl;
    }

    const adapter = new PrismaPg({ connectionString });
    this.client = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.client.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    this.logger.log('Database disconnected');
  }

  // ── Model Delegates ─────────────────────────────────────
  get tenant() { return this.client.tenant; }
  get user() { return this.client.user; }
  get template() { return this.client.template; }
  get contract() { return this.client.contract; }
  get contractVersion() { return this.client.contractVersion; }
  get clause() { return this.client.clause; }
  get aIAnalysis() { return this.client.aIAnalysis; }
  get riskFinding() { return this.client.riskFinding; }
  get notification() { return this.client.notification; }

  // ── Raw query & transaction support ─────────────────────
  get $transaction() { return this.client.$transaction.bind(this.client); }
  get $queryRaw() { return this.client.$queryRaw.bind(this.client); }
  get $executeRaw() { return this.client.$executeRaw.bind(this.client); }
}
