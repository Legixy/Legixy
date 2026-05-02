import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { withRetry, isGeminiRetryable } from './retryHandler';

// ─── Model selection ───────────────────────────────────────────────────────────
// gemini-1.5-flash: 1M-token context, fast (~1-2s), cost-effective — primary choice
// gemini-1.5-pro:  better reasoning for large or complex contracts (set MODEL_TIER=pro)
const FLASH_MODEL = 'gemini-1.5-flash';
const PRO_MODEL = 'gemini-1.5-pro';

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL_TIER === 'pro' ? PRO_MODEL : FLASH_MODEL;

const TIMEOUT_MS = 10_000; // Hard 10s timeout per call

// ─── Client singleton ──────────────────────────────────────────────────────────

let _genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!_genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

// ─── Model factory ─────────────────────────────────────────────────────────────

function buildModel(systemInstruction: string): GenerativeModel {
  return getClient().getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction,
    generationConfig: {
      temperature: 0.2,        // Low randomness — deterministic for legal analysis
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json', // Native JSON enforcement — no markdown wrapping
    },
  });
}

// ─── Timeout wrapper ───────────────────────────────────────────────────────────

function raceTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`[geminiClient] Timeout: ${label} exceeded ${ms}ms`)),
        ms
      )
    ),
  ]);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface GeminiCallOptions {
  timeoutMs?: number;
  retryAttempts?: number;
  systemInstruction?: string;
}

/**
 * Core call: sends a prompt to Gemini, returns the raw text response.
 * Handles timeout + exponential-backoff retry internally.
 * Callers must parse and validate the response themselves.
 */
export async function callGemini(
  userPrompt: string,
  options: GeminiCallOptions = {}
): Promise<string> {
  const {
    timeoutMs = TIMEOUT_MS,
    retryAttempts = 3,
    systemInstruction = 'You are a legal AI assistant. Output only valid JSON.',
  } = options;

  return withRetry(
    async () => {
      const model = buildModel(systemInstruction);

      const result = await raceTimeout(
        model.generateContent(userPrompt),
        timeoutMs,
        'generateContent'
      );

      const text = result.response.text();

      // Gemini occasionally returns an empty body on transient errors
      if (!text || text.trim() === '') {
        throw new Error('[geminiClient] Received empty response from Gemini');
      }

      // Log token usage for billing / cost tracking
      const usage = result.response.usageMetadata;
      if (usage) {
        console.log(
          `[geminiClient] Tokens — prompt: ${usage.promptTokenCount}, ` +
          `output: ${usage.candidatesTokenCount}, ` +
          `total: ${usage.totalTokenCount}`
        );
      }

      return text;
    },
    {
      maxAttempts: retryAttempts,
      initialDelayMs: 500,
      maxDelayMs: 4000,
      backoffFactor: 2,
      shouldRetry: isGeminiRetryable,
    }
  );
}

/**
 * Convenience: call Gemini and return token counts alongside text.
 * Used by the worker to track billing per job.
 */
export async function callGeminiWithUsage(
  userPrompt: string,
  options: GeminiCallOptions = {}
): Promise<{ text: string; totalTokens: number }> {
  const { timeoutMs = TIMEOUT_MS, retryAttempts = 3, systemInstruction = 'You are a legal AI assistant. Output only valid JSON.' } = options;

  let totalTokens = 0;

  const text = await withRetry(
    async () => {
      const model = buildModel(systemInstruction);
      const result = await raceTimeout(model.generateContent(userPrompt), timeoutMs, 'generateContent');
      const t = result.response.text();
      if (!t || t.trim() === '') throw new Error('[geminiClient] Empty response');
      totalTokens += result.response.usageMetadata?.totalTokenCount ?? 0;
      return t;
    },
    {
      maxAttempts: retryAttempts,
      initialDelayMs: 500,
      maxDelayMs: 4000,
      backoffFactor: 2,
      shouldRetry: isGeminiRetryable,
    }
  );

  return { text, totalTokens };
}
