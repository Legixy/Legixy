import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

let connectionString = env.DATABASE_URL;
try {
  if (connectionString.startsWith('prisma+postgres://')) {
    const url = new URL(connectionString.replace('prisma+postgres://', 'http://'));
    const apiKey = url.searchParams.get('api_key') || '';
    const decoded = JSON.parse(Buffer.from(apiKey, 'base64').toString());
    connectionString = decoded.databaseUrl;
  }
} catch (e) {
  // Fallback to raw URL
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });
