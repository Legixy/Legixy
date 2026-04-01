import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
});

redis.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});
