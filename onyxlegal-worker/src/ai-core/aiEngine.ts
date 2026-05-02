/**
 * aiEngine.ts — Main contract analysis orchestration
 *
 * Responsibilities:
 *  1. Detect contract size and route to single-pass or chunked analysis
 *  2. Call Gemini via geminiClient (with retry + timeout)
 *  3. Parse and Zod-validate every response
 *  4. Merge chunk results and deduplicate risks
 *  5. ALWAYS return a safe value — never throw to the caller
 *
 * Two exported surfaces:
 *  - analyzeContract()          → unified output for the API / UI layer
 *  - analyzeContractForWorker() → two-phase output for the DB-oriented BullMQ worker
 */

import { callGemini, callGeminiWithUsage, GEMINI_MODEL } from './geminiClient';
import {
  buildAnalysisPrompt,
  buildChunkPrompt,
  buildExtractionPrompt,
  buildRiskPrompt,
  LEGAL_SYSTEM_INSTRUCTION,
} from './promptTemplates';
import {
  ContractAnalysisOutput,
  ContractAnalysisOutputSchema,
  RiskFinding,
  ClauseExtractionOutput,
  ClauseExtractionSchema,
  RiskDetectionOutput,
  RiskDetectionSchema,
  FALLBACK_ANALYSIS,
  FALLBACK_EXTRACTION,
  FALLBACK_RISK,
  parseAndValidate,
} from './outputSchemas';

// ─── Chunking constants ────────────────────────────────────────────────────────

// Contracts under this word count are analysed in a single Gemini call.
// gemini-1.5-flash supports 1M tokens, but single-pass above ~6 000 words
// degrades extraction quality — chunking yields more precise clause detection.
const SINGLE_PASS_WORD_LIMIT = 6_000;

// Words per chunk. 3 500 words ≈ 4 500 tokens, well inside flash limits.
// We add a 150-word overlap between chunks to avoid splitting a clause across pages.
const CHUNK_WORD_SIZE = 3_500;
const CHUNK_OVERLAP_WORDS = 150;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= SINGLE_PASS_WORD_LIMIT) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_WORD_SIZE, words.length);
    chunks.push(words.slice(start, end).join(' '));
    // Advance by (chunk size - overlap) so adjacent chunks share context
    start += CHUNK_WORD_SIZE - CHUNK_OVERLAP_WORDS;
  }

  return chunks;
}

const SEVERITY_ORDER: Record<RiskFinding['severity'], number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

function deduplicateAndSort(risks: RiskFinding[]): RiskFinding[] {
  // Fingerprint on first 100 chars of the clause — catches cross-chunk duplication
  const seen = new Set<string>();
  const unique = risks.filter(r => {
    const key = r.clause.substring(0, 100).toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    // Secondary sort: higher confidence first within the same severity band
    return bySeverity !== 0 ? bySeverity : b.confidence - a.confidence;
  });
}

function mergeChunkResults(
  chunks: Array<{ risks: RiskFinding[]; summary: string }>
): { risks: RiskFinding[]; summary: string } {
  const allRisks = chunks.flatMap(c => c.risks);
  const risks = deduplicateAndSort(allRisks);

  // Build a composite summary from non-trivial chunk summaries
  const meaningfulSummaries = chunks
    .map(c => c.summary)
    .filter(s => s && !s.toLowerCase().includes('no significant risks'));

  const summary =
    meaningfulSummaries.length > 0
      ? meaningfulSummaries.join(' ')
      : 'Contract analyzed across multiple sections. See individual risk findings for details.';

  return { risks, summary };
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * analyzeContract — unified entry point for the API / UI layer.
 *
 * Input:  raw contract text (any size)
 * Output: ContractAnalysisOutput — always valid, never throws
 */
export async function analyzeContract(
  contractText: string
): Promise<ContractAnalysisOutput> {
  const startMs = Date.now();

  try {
    const wordCount = countWords(contractText);
    console.log(
      `[aiEngine] Analyzing contract — ${wordCount} words, model: ${GEMINI_MODEL}`
    );

    let risks: RiskFinding[];
    let summary: string;

    if (wordCount <= SINGLE_PASS_WORD_LIMIT) {
      // ── Single-pass path ──────────────────────────────────────────────────
      const prompt = buildAnalysisPrompt(contractText);
      const raw = await callGemini(prompt, { systemInstruction: LEGAL_SYSTEM_INSTRUCTION });

      const parsed = parseAndValidate<{ risks: RiskFinding[]; summary: string }>(
        raw,
        ContractAnalysisOutputSchema.omit({ processingTimeMs: true }),
        { risks: [], summary: '' }
      );

      risks = deduplicateAndSort(parsed.risks);
      summary = parsed.summary;
    } else {
      // ── Chunked path ──────────────────────────────────────────────────────
      const chunks = chunkText(contractText);
      console.log(
        `[aiEngine] Large contract — splitting into ${chunks.length} chunks`
      );

      // Analyse chunks concurrently; each chunk is independently safe
      const chunkResults = await Promise.all(
        chunks.map(async (chunk, i) => {
          const prompt = buildChunkPrompt(chunk, i, chunks.length);
          const raw = await callGemini(prompt, {
            systemInstruction: LEGAL_SYSTEM_INSTRUCTION,
          }).catch(err => {
            console.error(`[aiEngine] Chunk ${i + 1} failed:`, err.message);
            return '{"risks":[],"summary":""}';
          });

          return parseAndValidate<{ risks: RiskFinding[]; summary: string }>(
            raw,
            ContractAnalysisOutputSchema.omit({ processingTimeMs: true }),
            { risks: [], summary: '' }
          );
        })
      );

      const merged = mergeChunkResults(chunkResults);
      risks = merged.risks;
      summary = merged.summary;
    }

    const result: ContractAnalysisOutput = {
      risks,
      summary,
      processingTimeMs: Date.now() - startMs,
    };

    // Final schema gate — belt-and-suspenders before sending to the UI
    const validated = ContractAnalysisOutputSchema.safeParse(result);
    if (!validated.success) {
      console.error('[aiEngine] Final schema validation failed:', validated.error.flatten());
      return { ...FALLBACK_ANALYSIS, processingTimeMs: Date.now() - startMs };
    }

    console.log(
      `[aiEngine] Done — ${risks.length} risks found in ${result.processingTimeMs}ms`
    );
    return validated.data;
  } catch (err) {
    console.error('[aiEngine] Unhandled analysis error:', err);
    return { ...FALLBACK_ANALYSIS, processingTimeMs: Date.now() - startMs };
  }
}

// ─── Worker pipeline API ───────────────────────────────────────────────────────

export interface WorkerAnalysisResult {
  extractionData: ClauseExtractionOutput;
  riskData: RiskDetectionOutput;
  totalTokens: number;
  processingTimeMs: number;
}

/**
 * analyzeContractForWorker — two-phase pipeline used by the BullMQ worker.
 *
 * Phase 1 extracts clauses; Phase 2 scores them against standard parameters.
 * Each phase uses callGeminiWithUsage so the worker can track token billing.
 * Always returns a safe value — never throws.
 */
export async function analyzeContractForWorker(
  contractText: string,
  standardParameters: string = 'General B2B SaaS norms'
): Promise<WorkerAnalysisResult> {
  const startMs = Date.now();
  let totalTokens = 0;

  try {
    // Phase 1 — clause extraction
    console.log('[aiEngine/worker] Phase 1: extracting clauses…');
    const extractionPrompt = buildExtractionPrompt(contractText);

    const { text: extractRaw, totalTokens: extractTokens } = await callGeminiWithUsage(
      extractionPrompt,
      { systemInstruction: LEGAL_SYSTEM_INSTRUCTION }
    );
    totalTokens += extractTokens;

    const extractionData = parseAndValidate(
      extractRaw,
      ClauseExtractionSchema,
      FALLBACK_EXTRACTION
    );

    if (extractionData.clauses.length === 0) {
      console.warn('[aiEngine/worker] No clauses extracted — returning fallback');
      return {
        extractionData: FALLBACK_EXTRACTION,
        riskData: FALLBACK_RISK,
        totalTokens,
        processingTimeMs: Date.now() - startMs,
      };
    }

    // Phase 2 — risk analysis
    console.log(
      `[aiEngine/worker] Phase 2: analysing ${extractionData.clauses.length} clauses…`
    );
    const clausesPlainText = extractionData.clauses
      .map((c, i) => `[Clause ${i + 1} — ${c.type}]\n${c.originalText}`)
      .join('\n\n');

    const riskPrompt = buildRiskPrompt(clausesPlainText, standardParameters);
    const { text: riskRaw, totalTokens: riskTokens } = await callGeminiWithUsage(
      riskPrompt,
      { systemInstruction: LEGAL_SYSTEM_INSTRUCTION }
    );
    totalTokens += riskTokens;

    const riskData = parseAndValidate(riskRaw, RiskDetectionSchema, FALLBACK_RISK);

    return {
      extractionData,
      riskData,
      totalTokens,
      processingTimeMs: Date.now() - startMs,
    };
  } catch (err) {
    console.error('[aiEngine/worker] Unhandled error:', err);
    return {
      extractionData: FALLBACK_EXTRACTION,
      riskData: FALLBACK_RISK,
      totalTokens,
      processingTimeMs: Date.now() - startMs,
    };
  }
}

// Re-export calculateComplianceScore so existing callers are unaffected
export function calculateComplianceScore(
  risks: Array<{ severity: 'low' | 'medium' | 'high' | 'critical' }>
): number {
  if (risks.length === 0) return 100;
  const weights = { critical: 15, high: 10, medium: 5, low: 2 };
  const deduction = risks.reduce(
    (sum, r) => sum + (weights[r.severity] ?? 0),
    0
  );
  return Math.max(0, 100 - deduction);
}
