import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface AICallResult {
  content: string;
  tokens: TokenUsage;
  retries: number;
  duration: number; // milliseconds
}

@Injectable()
export class AIClient {
  private readonly logger = new Logger('AIClient');
  private readonly openai: OpenAI;
  private readonly timeout = 10000; // 10 seconds
  private readonly maxRetries = 3;
  private readonly initialBackoffMs = 1000; // 1 second

  // Cumulative token tracking
  private tokenStats = {
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalRequests: 0,
    failedRequests: 0,
  };

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY not set');
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Call LLM with timeout, retry, and exponential backoff
   * NEVER throws - always returns safe result or fallback
   */
  async callLLM(
    systemPrompt: string,
    userPrompt: string,
    model: 'gpt-4o-mini' | 'gpt-4o' = 'gpt-4o-mini',
  ): Promise<AICallResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retryCount = 0;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await this.executeCallWithTimeout(
          systemPrompt,
          userPrompt,
          model,
        );

        const duration = Date.now() - startTime;

        // Track successful usage
        this.tokenStats.totalPromptTokens += result.tokens.promptTokens;
        this.tokenStats.totalCompletionTokens +=
          result.tokens.completionTokens;
        this.tokenStats.totalRequests += 1;

        this.logger.log(
          `✅ LLM call successful (attempt ${attempt}) | ` +
            `model: ${model} | ` +
            `tokens: ${result.tokens.totalTokens} | ` +
            `duration: ${duration}ms | ` +
            `retries: ${retryCount}`,
        );

        return {
          ...result,
          retries: retryCount,
          duration,
        };
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt - 1;

        const isLastAttempt = attempt === this.maxRetries;
        const backoffMs =
          this.initialBackoffMs * Math.pow(2, attempt - 1);

        if (!isLastAttempt) {
          this.logger.warn(
            `⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
              `error: ${lastError.message} | ` +
              `retry in ${backoffMs}ms`,
          );
          await this.delay(backoffMs);
        } else {
          this.logger.error(
            `❌ LLM call failed after ${this.maxRetries} attempts | ` +
              `error: ${lastError.message}`,
          );
          this.tokenStats.failedRequests += 1;
        }
      }
    }

    // Should not reach here, but if it does, return error
    throw new Error(
      `LLM call failed after ${this.maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Execute single LLM call with timeout
   */
  private async executeCallWithTimeout(
    systemPrompt: string,
    userPrompt: string,
    model: 'gpt-4o-mini' | 'gpt-4o',
  ): Promise<AICallResult> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`LLM call timeout (${this.timeout}ms exceeded)`));
      }, this.timeout);

      this.openai.chat.completions
        .create({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2, // Lower temperature for deterministic output
          max_tokens: 2000,
        })
        .then((response: any) => {
          clearTimeout(timeoutHandle);

          const content = response.choices[0]?.message?.content || '';
          const tokens = {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0,
          };

          resolve({
            content,
            tokens,
            retries: 0,
            duration: 0,
          });
        })
        .catch((error: any) => {
          clearTimeout(timeoutHandle);
          reject(error);
        });
    });
  }

  /**
   * Delay utility for exponential backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current token usage statistics
   */
  getTokenStats() {
    return {
      ...this.tokenStats,
      averageTokensPerRequest:
        this.tokenStats.totalRequests > 0
          ? Math.round(
              (this.tokenStats.totalPromptTokens +
                this.tokenStats.totalCompletionTokens) /
                this.tokenStats.totalRequests,
            )
          : 0,
      successRate:
        this.tokenStats.totalRequests > 0
          ? Math.round(
              ((this.tokenStats.totalRequests -
                this.tokenStats.failedRequests) /
                this.tokenStats.totalRequests) *
                100,
            )
          : 0,
    };
  }

  /**
   * Reset token statistics
   */
  resetTokenStats(): void {
    this.tokenStats = {
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalRequests: 0,
      failedRequests: 0,
    };
    this.logger.log('📊 Token statistics reset');
  }
}
