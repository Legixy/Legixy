"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHUNK_SETTINGS = exports.LLM_SETTINGS = exports.USER_PROMPTS = exports.SYSTEM_PROMPTS = void 0;
exports.SYSTEM_PROMPTS = {
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
exports.USER_PROMPTS = {
    contractAnalysis: (contractText) => {
        return `Analyze this contract for legal risks and compliance issues:

---CONTRACT START---
${contractText}
---CONTRACT END---

Identify all risks, rate their severity, and provide recommendations for improvement.`;
    },
    clauseFix: (clause, issue) => {
        return `Improve this clause to address the identified issue:

CURRENT CLAUSE:
${clause}

ISSUE TO ADDRESS:
${issue}

Generate an improved version that maintains the original intent while fixing the issue.`;
    },
    complianceCheck: (contractText) => {
        return `Check this contract for Indian legal compliance:

---CONTRACT START---
${contractText}
---CONTRACT END---

Identify all compliance violations, categorize them, and rate their severity.`;
    },
    summarizeRisks: (risksJson) => {
        return `You are summarizing contract risks from an analysis.

Here are the identified risks:
${risksJson}

Consolidate these risks into a single prioritized list, removing duplicates and keeping the most important findings. Return as valid JSON with the same format.`;
    },
};
exports.LLM_SETTINGS = {
    structural: {
        temperature: 0.2,
        maxTokens: 2000,
        model: 'gpt-4o-mini',
    },
    complex: {
        temperature: 0.3,
        maxTokens: 3000,
        model: 'gpt-4o',
    },
    analysis: {
        temperature: 0.2,
        maxTokens: 2500,
        model: 'gpt-4o-mini',
    },
};
exports.CHUNK_SETTINGS = {
    maxTokensPerChunk: 2000,
    overlapTokens: 100,
    maxChunks: 10,
};
//# sourceMappingURL=promptTemplates.js.map