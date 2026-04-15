import { z } from 'zod';

/**
 * STRICT Output Validation Schemas
 *
 * These schemas REJECT any invalid JSON
 * If LLM output doesn't match - we get safe fallback
 */

// Single Risk Item Schema
export const RiskItemSchema = z.object({
  clause: z.string().min(1, 'Clause is required'),
  issue: z.string().min(1, 'Issue is required'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  recommendation: z.string().min(1, 'Recommendation is required'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .transform((n) => Math.round(n)), // Ensure integer
});

export type RiskItem = z.infer<typeof RiskItemSchema>;

// Contract Analysis Schema
export const ContractAnalysisSchema = z.object({
  risks: z
    .array(RiskItemSchema)
    .default([])
    .refine((risks) => risks.length <= 50, {
      message: 'Maximum 50 risks allowed per analysis',
    }),
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .transform((n) => Math.round(n)),
  summary: z.string().min(0).max(500).optional(),
});

export type ContractAnalysis = z.infer<typeof ContractAnalysisSchema>;

// Clause Fix Schema
export const ClauseFixSchema = z.object({
  original: z.string().min(1, 'Original clause is required'),
  improved: z.string().min(1, 'Improved clause is required'),
  explanation: z.string().min(1, 'Explanation is required'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .transform((n) => Math.round(n)),
});

export type ClauseFix = z.infer<typeof ClauseFixSchema>;

// Compliance Check Schema
export const ComplianceIssueSchema = z.object({
  category: z.enum([
    'GST',
    'Labor',
    'DataProtection',
    'Unfair',
    'Tax',
    'Other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  issue: z.string().min(1),
  solution: z.string().min(1),
});

export const ComplianceCheckSchema = z.object({
  compliant: z.boolean(),
  issues: z.array(ComplianceIssueSchema).default([]),
  overallRisk: z.enum(['low', 'medium', 'high', 'critical']),
});

export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;

/**
 * Safe Fallback Values
 *
 * Used when AI analysis completely fails
 * These are neutral, conservative defaults
 */
export const FALLBACK_VALUES = {
  contractAnalysis: (): ContractAnalysis => ({
    risks: [],
    overallScore: 50, // Neutral - let human review
    summary: 'Unable to analyze contract. Please review manually.',
  }),

  clauseFix: (): ClauseFix => ({
    original: '',
    improved: '',
    explanation: 'Unable to generate improvement. Please consult a lawyer.',
    confidence: 0,
  }),

  complianceCheck: (): ComplianceCheck => ({
    compliant: false, // Conservative default
    issues: [],
    overallRisk: 'medium', // Conservative default
  }),
};

/**
 * Validation Utility Functions
 */

/**
 * Parse and validate contract analysis JSON
 * Returns parsed data or throws error with details
 */
export function validateContractAnalysis(jsonString: string): ContractAnalysis {
  try {
    // Handle markdown-wrapped JSON
    let cleanJson = jsonString.trim();

    // Remove markdown code block if present
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\n?/, '') // Remove opening ```
        .replace(/\n?```$/, ''); // Remove closing ```
    }

    // Remove any leading/trailing whitespace
    cleanJson = cleanJson.trim();

    // Parse JSON
    const parsed = JSON.parse(cleanJson);

    // Validate against schema
    return ContractAnalysisSchema.parse(parsed);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid contract analysis JSON: ${errorMsg}`);
  }
}

/**
 * Parse and validate clause fix JSON
 */
export function validateClauseFix(jsonString: string): ClauseFix {
  try {
    let cleanJson = jsonString.trim();

    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
    }

    cleanJson = cleanJson.trim();
    const parsed = JSON.parse(cleanJson);

    return ClauseFixSchema.parse(parsed);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid clause fix JSON: ${errorMsg}`);
  }
}

/**
 * Parse and validate compliance check JSON
 */
export function validateComplianceCheck(jsonString: string): ComplianceCheck {
  try {
    let cleanJson = jsonString.trim();

    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson
        .replace(/^```(?:json)?\n?/, '')
        .replace(/\n?```$/, '');
    }

    cleanJson = cleanJson.trim();
    const parsed = JSON.parse(cleanJson);

    return ComplianceCheckSchema.parse(parsed);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid compliance check JSON: ${errorMsg}`);
  }
}
