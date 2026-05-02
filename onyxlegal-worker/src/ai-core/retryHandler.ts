export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  // Return false to abort immediately without retrying (e.g. auth errors)
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 8000,
  backoffFactor: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, initialDelayMs, maxDelayMs, backoffFactor, shouldRetry } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: unknown;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const abortEarly = shouldRetry ? !shouldRetry(error, attempt) : false;
      if (abortEarly || attempt === maxAttempts) break;

      console.warn(
        `[retryHandler] Attempt ${attempt}/${maxAttempts} failed: ${
          error instanceof Error ? error.message : String(error)
        }. Retrying in ${delayMs}ms…`
      );

      await sleep(delayMs);
      delayMs = Math.min(delayMs * backoffFactor, maxDelayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Classify Gemini API errors — returns false for errors we should NOT retry
export function isGeminiRetryable(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  // Auth and bad-request errors are permanent; everything else (rate limit, 500, timeout) is transient
  return !msg.includes('api key') && !msg.includes('invalid argument') && !msg.includes('permission denied');
}
