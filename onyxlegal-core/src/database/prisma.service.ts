import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
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

    // POOL SIZE
    // ---------
    // @prisma/adapter-pg wraps a node-postgres Pool, which defaults to 10
    // connections per client. That is fine for one process and wrong for
    // several: eight Jest workers each open their own pool, so 8 x 10 plus a
    // running dev server sits at Postgres's default max_connections of 100.
    // The result was an intermittent wall of beforeAll failures that looked
    // like the integration suites corrupting each other's data — they do not;
    // each cleans up only its own tenant ids. It was connection starvation.
    //
    // Bounded here so parallel test workers are safe, and so a deployment can
    // size the pool to its database rather than inherit a default.
    const poolSize = Number(process.env.DATABASE_POOL_SIZE);
    const max =
      Number.isFinite(poolSize) && poolSize > 0 ? poolSize : undefined;

    const adapter = new PrismaPg({ connectionString, ...(max ? { max } : {}) });
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
  get tenant() {
    return this.client.tenant;
  }
  get user() {
    return this.client.user;
  }
  get template() {
    return this.client.template;
  }
  get contract() {
    return this.client.contract;
  }
  get contractVersion() {
    return this.client.contractVersion;
  }
  get clause() {
    return this.client.clause;
  }
  get aIAnalysis() {
    return this.client.aIAnalysis;
  }
  get riskFinding() {
    return this.client.riskFinding;
  }
  get notification() {
    return this.client.notification;
  }

  // ── Compliance domain ───────────────────────────────────
  get site() {
    return this.client.site;
  }
  get license() {
    return this.client.license;
  }
  get licenseReminder() {
    return this.client.licenseReminder;
  }
  get authority() {
    return this.client.authority;
  }
  get licenseType() {
    return this.client.licenseType;
  }
  get tenantLicenseRequirement() {
    return this.client.tenantLicenseRequirement;
  }
  get licenseDocument() {
    return this.client.licenseDocument;
  }
  get complianceAuditLog() {
    return this.client.complianceAuditLog;
  }
  get reminderRead() {
    return this.client.reminderRead;
  }
  get licenseRenewal() {
    return this.client.licenseRenewal;
  }
  get tenantInvitation() {
    return this.client.tenantInvitation;
  }

  // ── Raw query & transaction support ─────────────────────
  get $transaction() {
    return this.client.$transaction.bind(this.client);
  }
  get $queryRaw() {
    return this.client.$queryRaw.bind(this.client);
  }
  get $executeRaw() {
    return this.client.$executeRaw.bind(this.client);
  }
}
