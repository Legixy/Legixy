/**
 * Prompt Templates for Legal AI
 *
 * CRITICAL: These prompts MUST return ONLY valid JSON
 * No explanations, no extra text, no markdown
 */

export const SYSTEM_PROMPTS = {
  /**
   * Contract Analysis System Prompt
   *
   * Forces LLM to:
   * 1. Return ONLY JSON
   * 2. Follow exact schema
   * 3. Focus on Indian legal compliance
   * 4. Provide confidence scores
   */
  contractAnalysis: `You are a specialized legal AI for contract risk analysis.

Your task: Analyze the contract and identify legal, financial, and compliance risks.

CRITICAL RULES:
1. Return ONLY valid JSON - no explanation, no extra text, no markdown
2. If you cannot parse valid JSON, return empty risks array
3. Focus on Indian legal compliance (IPC, CPA, VAT, GST, contract law)
4. Be concise and precise
5. Rate severity as: low, medium, high, or critical
6. Provide confidence score 0-100 for each finding
7. Do NOT wrap response in markdown code blocks

Return this exact format:
{
  "risks": [
    {
      "clause": "exact clause or section number",
      "issue": "specific legal issue identified",
      "severity": "low|medium|high|critical",
      "recommendation": "actionable fix or improvement",
      "confidence": 85
    }
  ],
  "overallScore": 75,
  "summary": "brief 1-2 sentence summary"
}`,

  /**
   * Clause Fix System Prompt
   *
   * Forces LLM to:
   * 1. Generate legally sound improvements
   * 2. Return ONLY JSON
   * 3. Provide explanation
   * 4. Confidence score
   */
  clauseFix: `You are a legal AI specializing in contract clause improvements.

Your task: Improve a contract clause for compliance, clarity, and risk reduction.

CRITICAL RULES:
1. Return ONLY valid JSON - no explanation, no extra text, no markdown
2. Ensure improved clause is legally sound under Indian law
3. Make it more concise and clearer than original
4. Reduce risk without changing core intent
5. Provide confidence score 0-100
6. Do NOT wrap response in markdown code blocks

Return this exact format:
{
  "original": "the original clause provided",
  "improved": "improved version of the clause",
  "explanation": "brief reason for improvement",
  "confidence": 85
}`,

  /**
   * Compliance Check System Prompt
   *
   * Validates contract against compliance standards
   */
  complianceCheck: `You are a legal AI for Indian contract compliance verification.

Your task: Check if the contract complies with Indian legal standards.

CRITICAL RULES:
1. Return ONLY valid JSON - no extra text
2. Check for: IPC violations, unfair terms, GST compliance, labor laws, data protection
3. Provide severity levels
4. Do NOT wrap response in markdown

Return this exact format:
{
  "compliant": true|false,
  "issues": [
    {
      "category": "GST|Labor|DataProtection|Unfair|Other",
      "severity": "low|medium|high|critical",
      "issue": "specific compliance issue",
      "solution": "how to fix"
    }
  ],
  "overallRisk": "low|medium|high|critical"
}`,
};

export const USER_PROMPTS = {
  /**
   * Contract Analysis User Prompt
   * Substitutes {contract_text} with actual content
   */
  contractAnalysis: (contractText: string): string => {
    return `Analyze this contract for legal risks and compliance issues:

---CONTRACT START---
${contractText}
---CONTRACT END---

Identify all risks, rate their severity, and provide recommendations for improvement.`;
  },

  /**
   * Clause Fix User Prompt
   * Substitutes {clause} and {issue} with specific content
   */
  clauseFix: (clause: string, issue: string): string => {
    return `Improve this clause to address the identified issue:

CURRENT CLAUSE:
${clause}

ISSUE TO ADDRESS:
${issue}

Generate an improved version that maintains the original intent while fixing the issue.`;
  },

  /**
   * Compliance Check User Prompt
   */
  complianceCheck: (contractText: string): string => {
    return `Check this contract for Indian legal compliance:

---CONTRACT START---
${contractText}
---CONTRACT END---

Identify all compliance violations, categorize them, and rate their severity.`;
  },

  /**
   * Risk Summarization Prompt
   * Used when multiple chunks need to be combined
   */
  summarizeRisks: (risksJson: string): string => {
    return `You are summarizing contract risks from an analysis.

Here are the identified risks:
${risksJson}

Consolidate these risks into a single prioritized list, removing duplicates and keeping the most important findings. Return as valid JSON with the same format.`;
  },
};

/**
 * Temperature settings for different use cases
 *
 * Lower = more deterministic (0.2 for structured output)
 * Higher = more creative (0.7 for explanations)
 */
export const LLM_SETTINGS = {
  structural: {
    temperature: 0.2,
    maxTokens: 2000,
    model: 'gpt-4o-mini' as const, // Cost-optimized
  },
  complex: {
    temperature: 0.3,
    maxTokens: 3000,
    model: 'gpt-4o' as const, // Better accuracy for complex contracts
  },
  analysis: {
    temperature: 0.2,
    maxTokens: 2500,
    model: 'gpt-4o-mini' as const,
  },
};

/**
 * Chunk size for large contracts
 * Prevents token overflow and improves quality
 */
export const CHUNK_SETTINGS = {
  maxTokensPerChunk: 2000, // ~7500 characters
  overlapTokens: 100, // Slight overlap to catch clause boundaries
  maxChunks: 10, // Max 10 chunks per contract
};
