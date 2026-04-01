import { createContractAnalysisWorker } from './queues/contract-analysis.worker';
import { prisma } from './utils/prisma';
import { redis } from './utils/redis';

async function bootstrap() {
  console.log('🚀 OnyxLegal Worker Node Booting...');

  try {
    // 1. Check Redis
    await redis.ping();

    // 2. Check DB
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to database');

    // 3. Start workers
    const contractWorker = createContractAnalysisWorker();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      await contractWorker.close();
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Boot failed:', error);
    process.exit(1);
  }
}

bootstrap();
