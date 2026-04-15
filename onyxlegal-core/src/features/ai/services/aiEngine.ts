import { Injectable, Logger } from '@nestjs/common';
import { AIClient } from './aiClient';
import { RetryHandler } from './retryHandler';
import {
  SYSTEM_PROMPTS,
  USER_PROMPTS,
  CHUNK_SETTINGS,
} from './promptTemplates';
import {
  ContractAnalysis,
  ClauseFix,
  ComplianceCheck,
} from './outputSchemas';

/**
 * Production-Grade AI Engine
 *
 * Features:
 * - Contract analysis with chunking
 * - Clause fix generation
 * - Compliance checking
 * - Token tracking and cost control
 * - Robust error handling with fallbacks
 * - Deterministic output
 */
@Injectable()
export class AIEngine {
  private readonly logger = new Logger('AIEngine');
  private readonly aiClient: AIClient;
  private readonly retryHandler: RetryHandler;

  constructor() {
    this.aiClient = new AIClient();
    this.retryHandler = new RetryHandler(this.aiClient);
  }

  /**
   * Analyze a contract for risks and compliance issues
   *
   * Handles:
   * - Large contracts (auto-chunking)
   * - Multiple risk types
   * - Confidence scoring
   * - Fallback on failure
   */
  async analyzeContract(
    contractText: string,
    contractId?: string,
  ): Promise<{
    analysis: ContractAnalysis;
    success: boolean;
    tokensUsed: number;
    duration: number;
    chunksProcessed: number;
  }> {
    const startTime = Date.now();
    this.logger.log(`📄 Starting contract analysis${contractId ? ` | id: ${contractId}` : ''}`);

    try {
      // Step 1: Chunk large contracts
      const chunks = this.chunkContract(contractText);
      this.logger.log(`📦 Contract split into ${chunks.length} chunks`);

      if (chunks.length === 0) {
        this.logger.error('Contract is empty');
        return {
          analysis: {
            risks: [],
            overallScore: 50,
            summary: 'Contract is empty',
          },
          success: false,
          tokensUsed: 0,
          duration: Date.now() - startTime,
          chunksProcessed: 0,
        };
      }

      // Step 2: Analyze each chunk
      const chunkAnalyses: ContractAnalysis[] = [];
      let totalTokensUsed = 0;

      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(
          `🔍 Analyzing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`,
        );

        const userPrompt = USER_PROMPTS.contractAnalysis(chunks[i]);

        const { result, success, error } =
          await this.retryHandler.analyzeContractWithRetry(
            SYSTEM_PROMPTS.contractAnalysis,
            userPrompt,
            contractId ? `${contractId}-chunk-${i}` : undefined,
          );

        chunkAnalyses.push(result);

        // Track tokens
        const stats = this.aiClient.getTokenStats();
        totalTokensUsed = stats.totalPromptTokens + stats.totalCompletionTokens;

        if (!success && error) {
          this.logger.warn(`⚠️ Chunk ${i + 1} analysis had issues: ${error}`);
        }
      }

      // Step 3: Merge results
      const mergedAnalysis = this.mergeAnalyses(chunkAnalyses);

      const duration = Date.now() - startTime;

      this.logger.log(
        `✅ Contract analysis complete | ` +
          `risks: ${mergedAnalysis.risks.length} | ` +
          `score: ${mergedAnalysis.overallScore} | ` +
          `chunks: ${chunks.length} | ` +
          `tokens: ${totalTokensUsed} | ` +
          `duration: ${duration}ms`,
      );

      return {
        analysis: mergedAnalysis,
        success: true,
        tokensUsed: totalTokensUsed,
        duration,
        chunksProcessed: chunks.length,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `❌ Contract analysis error: ${errorMsg}${contractId ? ` | contract: ${contractId}` : ''}`,
      );

      // Return safe fallback
      return {
        analysis: {
          risks: [],
          overallScore: 50,
          summary: `Analysis failed: ${errorMsg}`,
        },
        success: false,
        tokensUsed: 0,
        duration: Date.now() - startTime,
        chunksProcessed: 0,
      };
    }
  }

  /**
   * Generate an improved version of a clause
   *
   * Handles:
   * - Single clause improvement
   * - Legal compliance
   * - Confidence scoring
   * - Error recovery
   */
  async generateClauseFix(
    clause: string,
    issue: string,
    clauseId?: string,
  ): Promise<{
    fix: ClauseFix;
    success: boolean;
    tokensUsed: number;
    duration: number;
  }> {
    const startTime = Date.now();
    this.logger.log(
      `🔧 Generating clause fix${clauseId ? ` | id: ${clauseId}` : ''}`,
    );

    try {
      const userPrompt = USER_PROMPTS.clauseFix(clause, issue);

      const { result, success, error } =
        await this.retryHandler.generateClauseFixWithRetry(
          SYSTEM_PROMPTS.clauseFix,
          userPrompt,
          clauseId,
        );

      const stats = this.aiClient.getTokenStats();
      const tokensUsed = stats.totalPromptTokens + stats.totalCompletionTokens;
      const duration = Date.now() - startTime;

      if (!success) {
        this.logger.warn(`⚠️ Clause fix generation had issues: ${error}`);
      }

      this.logger.log(
        `✅ Clause fix generated | ` +
          `confidence: ${result.confidence} | ` +
          `tokens: ${tokensUsed} | ` +
          `duration: ${duration}ms`,
      );

      return {
        fix: result,
        success,
        tokensUsed,
        duration,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `❌ Clause fix generation error: ${errorMsg}${clauseId ? ` | clause: ${clauseId}` : ''}`,
      );

      return {
        fix: {
          original: clause,
          improved: clause,
          explanation: `Generation failed: ${errorMsg}`,
          confidence: 0,
        },
        success: false,
        tokensUsed: 0,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Check contract for compliance violations
   *
   * Handles:
   * - Indian legal standards
   * - Multiple compliance categories
   * - Risk severity rating
   * - Solutions
   */
  async checkCompliance(
    contractText: string,
    contractId?: string,
  ): Promise<{
    check: ComplianceCheck;
    success: boolean;
    tokensUsed: number;
    duration: number;
  }> {
    const startTime = Date.now();
    this.logger.log(
      `✔️ Checking compliance${contractId ? ` | id: ${contractId}` : ''}`,
    );

    try {
      const userPrompt = USER_PROMPTS.complianceCheck(contractText);

      const { result, success, error } =
        await this.retryHandler.checkComplianceWithRetry(
          SYSTEM_PROMPTS.complianceCheck,
          userPrompt,
          contractId,
        );

      const stats = this.aiClient.getTokenStats();
      const tokensUsed = stats.totalPromptTokens + stats.totalCompletionTokens;
      const duration = Date.now() - startTime;

      if (!success) {
        this.logger.warn(`⚠️ Compliance check had issues: ${error}`);
      }

      this.logger.log(
        `✅ Compliance check complete | ` +
          `compliant: ${result.compliant} | ` +
          `issues: ${result.issues.length} | ` +
          `tokens: ${tokensUsed} | ` +
          `duration: ${duration}ms`,
      );

      return {
        check: result,
        success,
        tokensUsed,
        duration,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `❌ Compliance check error: ${errorMsg}${contractId ? ` | contract: ${contractId}` : ''}`,
      );

      return {
        check: {
          compliant: false,
          issues: [],
          overallRisk: 'medium',
        },
        success: false,
        tokensUsed: 0,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get current token usage statistics
   */
  getTokenStats() {
    return this.aiClient.getTokenStats();
  }

  /**
   * Reset token statistics
   */
  resetTokenStats(): void {
    this.aiClient.resetTokenStats();
  }

  /**
   * INTERNAL: Chunk large contracts to prevent token overflow
   *
   * Strategy:
   * 1. Split by paragraph/section
   * 2. Respect max tokens per chunk
   * 3. Add slight overlap for continuity
   * 4. Cap at max chunks
   */
  private chunkContract(contractText: string): string[] {
    const maxChars =
      CHUNK_SETTINGS.maxTokensPerChunk * 4; // ~4 chars per token

    if (contractText.length <= maxChars) {
      return [contractText];
    }

    const paragraphs = contractText.split('\n\n').filter((p) => p.trim());
    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      const potentialChunk = currentChunk
        ? `${currentChunk}\n\n${paragraph}`
        : paragraph;

      if (potentialChunk.length > maxChars && currentChunk) {
        // Current chunk is full, save it
        chunks.push(currentChunk);
        currentChunk = paragraph;
      } else {
        currentChunk = potentialChunk;
      }

      // Stop if we've hit max chunks (prevent runaway)
      if (chunks.length >= CHUNK_SETTINGS.maxChunks) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        break;
      }
    }

    // Add remaining
    if (currentChunk && chunks.length < CHUNK_SETTINGS.maxChunks) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * INTERNAL: Merge multiple chunk analyses into one
   *
   * Strategy:
   * 1. Combine all risks
   * 2. Remove duplicates (by clause)
   * 3. Sort by severity
   * 4. Calculate average overall score
   */
  private mergeAnalyses(analyses: ContractAnalysis[]): ContractAnalysis {
    if (analyses.length === 0) {
      return {
        risks: [],
        overallScore: 50,
        summary: 'No analyses performed',
      };
    }

    if (analyses.length === 1) {
      return analyses[0];
    }

    // Combine all risks
    const allRisks = analyses.flatMap((a) => a.risks);

    // Remove duplicates (same clause)
    const uniqueRisks: { [key: string]: typeof allRisks[0] } = {};
    for (const risk of allRisks) {
      const key = risk.clause.toLowerCase();
      if (!uniqueRisks[key] || risk.confidence > uniqueRisks[key].confidence) {
        uniqueRisks[key] = risk;
      }
    }

    // Convert back to array and sort by severity
    const severityRank = { critical: 0, high: 1, medium: 2, low: 3 };
    const mergedRisks = Object.values(uniqueRisks).sort((a, b) => {
      return (
        severityRank[a.severity as keyof typeof severityRank] -
        severityRank[b.severity as keyof typeof severityRank]
      );
    });

    // Average overall score
    const avgScore = Math.round(
      analyses.reduce((sum, a) => sum + a.overallScore, 0) / analyses.length,
    );

    // Build summary
    const summary =
      `Contract analyzed in ${analyses.length} sections. ` +
      `${mergedRisks.length} risks identified. ` +
      `Overall compliance score: ${avgScore}/100.`;

    return {
      risks: mergedRisks,
      overallScore: avgScore,
      summary,
    };
  }
}
