import { z } from 'zod';

// ─── Unified user-facing output (API / UI layer) ───────────────────────────────

export const RiskFindingSchema = z.object({
  clause: z.string().min(1, 'clause text is required'),
  riskType: z.string().min(1),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  explanation: z.string().min(1, 'explanation is required'),
  suggestedFix: z.string().min(1, 'suggestedFix is required'),
  confidence: z.number().int().min(0).max(100),
});
export type RiskFinding = z.infer<typeof RiskFindingSchema>;

export const ContractAnalysisOutputSchema = z.object({
  risks: z.array(RiskFindingSchema),
  summary: z.string().min(1),
  processingTimeMs: z.number().nonnegative(),
});
export type ContractAnalysisOutput = z.infer<typeof ContractAnalysisOutputSchema>;

// ─── Worker pipeline schemas (two-phase: extract then detect) ─────────────────

export const ClauseExtractionSchema = z.object({
  clauses: z.array(
    z.object({
      type: z.enum([
        'PAYMENT',
        'IP_OWNERSHIP',
        'LIABILITY',
        'TERMINATION',
        'CONFIDENTIALITY',
        'NON_COMPETE',
        'GOVERNING_LAW',
        'OTHER',
      ]),
      originalText: z.string().min(1),
    })
  ),
});
export type ClauseExtractionOutput = z.infer<typeof ClauseExtractionSchema>;

export const RiskDetectionSchema = z.object({
  score: z.number().min(0).max(100),
  clauses: z.array(
    z.object({
      originalText: z.string(),
      riskLevel: z.enum(['SAFE', 'NEEDS_REVIEW', 'HIGH_RISK']),
      businessImpact: z.string().nullable(),
      suggestedText: z.string().nullable(),
    })
  ),
});
export type RiskDetectionOutput = z.infer<typeof RiskDetectionSchema>;

// ─── Safe fallbacks — NEVER let undefined propagate to callers ─────────────────

export const FALLBACK_ANALYSIS: ContractAnalysisOutput = {
  risks: [],
  summary: 'Analysis temporarily unavailable. Please try again.',
  processingTimeMs: 0,
};

export const FALLBACK_EXTRACTION: ClauseExtractionOutput = {
  clauses: [],
};

export const FALLBACK_RISK: RiskDetectionOutput = {
  score: 0,
  clauses: [],
};

// ─── Parse helpers ─────────────────────────────────────────────────────────────

/**
 * Strip accidental markdown fences Gemini sometimes wraps around JSON
 * even when responseMimeType is set (defensive measure).
 */
export function stripMarkdownFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();
}

export function parseAndValidate<T>(
  raw: string,
  schema: z.ZodType<T>,
  fallback: T
): T {
  try {
    const cleaned = stripMarkdownFences(raw);
    const parsed = JSON.parse(cleaned);
    const result = schema.safeParse(parsed);
    if (result.success) return result.data;
    console.warn('[outputSchemas] Validation failed:', result.error.flatten());
    return fallback;
  } catch (err) {
    console.warn('[outputSchemas] JSON parse error:', err instanceof Error ? err.message : err);
    return fallback;
  }
}
