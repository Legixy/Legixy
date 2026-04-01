import { z } from 'zod';

export const ClauseExtractionSchema = z.object({
  clauses: z.array(z.object({
    type: z.enum([
      'PAYMENT', 'IP_OWNERSHIP', 'LIABILITY', 'TERMINATION', 'CONFIDENTIALITY',
      'NON_COMPETE', 'GOVERNING_LAW', 'OTHER'
    ]),
    originalText: z.string().describe('The verbatim text extracted from the document'),
  })).describe('An array of all extracted contract clauses.')
});

export const RiskDetectionSchema = z.object({
  score: z.number().min(0).max(100).describe('Overall risk safety score (0-100, where 100 means zero risk/highly favorable)'),
  clauses: z.array(z.object({
    originalText: z.string().describe('The verbatim text analyzed'),
    riskLevel: z.enum(['SAFE', 'NEEDS_REVIEW', 'HIGH_RISK']),
    businessImpact: z.string().nullable().describe('Short explanation of the potential risk if flagged, else null'),
    suggestedText: z.string().nullable().describe('AI generated compliant/favorable replacement text if flagged, else null'),
  }))
});

export const Prompts = {
  Extract: (contractText: string) => `
You are a top-tier legal AI assistant reading a contract.
Your job is to read the provided text and strictly segment it into distinct legal clauses.
Extract the VERBATIM text for each clause, without changing a single character.

Contract Text:
"""
${contractText}
"""
`,

  AnalyzeRisks: (clausesText: string, standardParameters: string) => `
You are Onyx AI, an expert M&A and SaaS contract lawyer.
Analyze the following clauses against the company's approved \`Standard Parameters\`.

Standard Parameters for this Template Type:
${standardParameters || 'Use general industry-standard B2B SaaS norms.'}

Clauses to analyze:
${clausesText}

Instructions:
1. Determine if each clause heavily deviates from the standard parameters.
2. If it deviates favorably for our company, it is SAFE.
3. If it exposes us to unlimited liability, >60 days payment terms, or unilateral termination, flag it HIGH_RISK.
4. If flagged, you MUST provide a non-nonsense, 1-sentence \`businessImpact\`.
5. If flagged, you MUST draft a \`suggestedText\` that is legally binding, fair, and aligns with the standard parameters.
6. Calculate an overall 0-100 score for the entire contract based on these clauses.
`
};
