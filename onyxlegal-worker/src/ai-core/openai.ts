import OpenAI from 'openai';
import { env } from '../config/env';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

/**
 * Common configuration for OnyxLegal structured outputs
 */
export const ASYNC_AI_CONFIG = {
  model: 'gpt-4o-mini', // 90% cheaper than 4o, good for extraction
  fallbackModel: 'gpt-4o', // For deep reasoning
  temperature: 0, // Deterministic logic
};
