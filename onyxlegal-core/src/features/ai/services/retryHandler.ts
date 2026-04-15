import { Logger } from '@nestjs/common';
import {
  ContractAnalysis,
  ClauseFix,
  ComplianceCheck,
  FALLBACK_VALUES,
  validateContractAnalysis,
  validateClauseFix,
  validateComplianceCheck,
} from './outputSchemas';
import { AIClient } from './aiClient';

/**
 * Retry Handler with Fallback System
 *
 * Ensures ZERO crashes:
 * 1. Try LLM call
 * 2. Validate output
 * 3. If fails → retry (max 3)
 * 4. If still fails → return SAFE fallback
 */
export class RetryHandler {
  private readonly logger = new Logger('RetryHandler');
  private readonly maxRetries = 3;

  constructor(private aiClient: AIClient) {}

  /**
   * Retry with fallback for contract analysis
   * GUARANTEED: Always returns valid ContractAnalysis or safe fallback
   */
  async analyzeContractWithRetry(
    systemPrompt: string,
    userPrompt: string,
    contractId?: string,
  ): Promise<{
    result: ContractAnalysis;
    success: boolean;
    attemptsUsed: number;
    error?: string;
  }> {
    let lastError: string = '';
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      attemptsUsed = attempt;

      try {
        this.logger.log(
          `📊 Analyzing contract (attempt ${attempt}/${this.maxRetries})` +
            (contractId ? ` | contract: ${contractId}` : ''),
        );

        // Call LLM
        const llmResult = await this.aiClient.callLLM(
          systemPrompt,
          userPrompt,
          'gpt-4o-mini',
        );

        this.logger.debug(
          `✅ LLM returned (${llmResult.tokens.totalTokens} tokens): ${llmResult.content.substring(0, 100)}...`,
        );

        // Validate output
        try {
          const validated = validateContractAnalysis(llmResult.content);

          this.logger.log(
            `✅ Contract analysis validated | ` +
              `risks: ${validated.risks.length} | ` +
              `score: ${validated.overallScore} | ` +
              `attempts: ${attempt}`,
          );

          return {
            result: validated,
            success: true,
            attemptsUsed: attempt,
          };
        } catch (validationError) {
          const validationMsg =
            validationError instanceof Error
              ? validationError.message
              : 'Unknown validation error';

          lastError = validationMsg;

          this.logger.warn(
            `⚠️ Validation failed (attempt ${attempt}/${this.maxRetries}) | ` +
              `error: ${validationMsg}`,
          );

          if (attempt < this.maxRetries) {
            await this.exponentialBackoff(attempt);
          }
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(
          `⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
            `error: ${lastError}`,
        );

        if (attempt < this.maxRetries) {
          await this.exponentialBackoff(attempt);
        }
      }
    }

    // All retries exhausted - return fallback
    this.logger.error(
      `❌ Contract analysis failed after ${this.maxRetries} attempts | ` +
        `error: ${lastError} | ` +
        `returning fallback` +
        (contractId ? ` | contract: ${contractId}` : ''),
    );

    return {
      result: FALLBACK_VALUES.contractAnalysis(),
      success: false,
      attemptsUsed: this.maxRetries,
      error: lastError,
    };
  }

  /**
   * Retry with fallback for clause fixing
   * GUARANTEED: Always returns valid ClauseFix or safe fallback
   */
  async generateClauseFixWithRetry(
    systemPrompt: string,
    userPrompt: string,
    clauseId?: string,
  ): Promise<{
    result: ClauseFix;
    success: boolean;
    attemptsUsed: number;
    error?: string;
  }> {
    let lastError: string = '';
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      attemptsUsed = attempt;

      try {
        this.logger.log(
          `🔧 Generating clause fix (attempt ${attempt}/${this.maxRetries})` +
            (clauseId ? ` | clause: ${clauseId}` : ''),
        );

        // Call LLM
        const llmResult = await this.aiClient.callLLM(
          systemPrompt,
          userPrompt,
          'gpt-4o-mini',
        );

        // Validate output
        try {
          const validated = validateClauseFix(llmResult.content);

          this.logger.log(
            `✅ Clause fix validated | ` +
              `confidence: ${validated.confidence} | ` +
              `attempts: ${attempt}`,
          );

          return {
            result: validated,
            success: true,
            attemptsUsed: attempt,
          };
        } catch (validationError) {
          const validationMsg =
            validationError instanceof Error
              ? validationError.message
              : 'Unknown validation error';

          lastError = validationMsg;

          this.logger.warn(
            `⚠️ Validation failed (attempt ${attempt}/${this.maxRetries}) | ` +
              `error: ${validationMsg}`,
          );

          if (attempt < this.maxRetries) {
            await this.exponentialBackoff(attempt);
          }
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(
          `⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
            `error: ${lastError}`,
        );

        if (attempt < this.maxRetries) {
          await this.exponentialBackoff(attempt);
        }
      }
    }

    // All retries exhausted - return fallback
    this.logger.error(
      `❌ Clause fix generation failed after ${this.maxRetries} attempts | ` +
        `error: ${lastError} | ` +
        `returning fallback` +
        (clauseId ? ` | clause: ${clauseId}` : ''),
    );

    return {
      result: FALLBACK_VALUES.clauseFix(),
      success: false,
      attemptsUsed: this.maxRetries,
      error: lastError,
    };
  }

  /**
   * Retry with fallback for compliance check
   * GUARANTEED: Always returns valid ComplianceCheck or safe fallback
   */
  async checkComplianceWithRetry(
    systemPrompt: string,
    userPrompt: string,
    contractId?: string,
  ): Promise<{
    result: ComplianceCheck;
    success: boolean;
    attemptsUsed: number;
    error?: string;
  }> {
    let lastError: string = '';
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      attemptsUsed = attempt;

      try {
        this.logger.log(
          `✔️ Checking compliance (attempt ${attempt}/${this.maxRetries})` +
            (contractId ? ` | contract: ${contractId}` : ''),
        );

        // Call LLM
        const llmResult = await this.aiClient.callLLM(
          systemPrompt,
          userPrompt,
          'gpt-4o-mini',
        );

        // Validate output
        try {
          const validated = validateComplianceCheck(llmResult.content);

          this.logger.log(
            `✅ Compliance check validated | ` +
              `compliant: ${validated.compliant} | ` +
              `risk: ${validated.overallRisk} | ` +
              `attempts: ${attempt}`,
          );

          return {
            result: validated,
            success: true,
            attemptsUsed: attempt,
          };
        } catch (validationError) {
          const validationMsg =
            validationError instanceof Error
              ? validationError.message
              : 'Unknown validation error';

          lastError = validationMsg;

          this.logger.warn(
            `⚠️ Validation failed (attempt ${attempt}/${this.maxRetries}) | ` +
              `error: ${validationMsg}`,
          );

          if (attempt < this.maxRetries) {
            await this.exponentialBackoff(attempt);
          }
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : 'Unknown error';

        this.logger.warn(
          `⚠️ LLM call failed (attempt ${attempt}/${this.maxRetries}) | ` +
            `error: ${lastError}`,
        );

        if (attempt < this.maxRetries) {
          await this.exponentialBackoff(attempt);
        }
      }
    }

    // All retries exhausted - return fallback
    this.logger.error(
      `❌ Compliance check failed after ${this.maxRetries} attempts | ` +
        `error: ${lastError} | ` +
        `returning fallback` +
        (contractId ? ` | contract: ${contractId}` : ''),
    );

    return {
      result: FALLBACK_VALUES.complianceCheck(),
      success: false,
      attemptsUsed: this.maxRetries,
      error: lastError,
    };
  }

  /**
   * Exponential backoff delay
   * Attempt 1: 1s, Attempt 2: 2s, Attempt 3: 4s
   */
  private async exponentialBackoff(attemptNumber: number): Promise<void> {
    const delayMs = Math.pow(2, attemptNumber - 1) * 1000;
    this.logger.debug(`⏳ Waiting ${delayMs}ms before retry...`);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
