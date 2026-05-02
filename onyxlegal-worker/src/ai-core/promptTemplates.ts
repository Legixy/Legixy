// ─── Shared system instruction (injected via Gemini's systemInstruction field) ──

export const LEGAL_SYSTEM_INSTRUCTION = `You are OnyxAI, an elite legal contract analysis engine trusted by senior corporate lawyers.

ABSOLUTE RULES:
1. Output ONLY valid JSON. No markdown. No code blocks. No explanatory prose.
2. Never fabricate or hallucinate clauses. Only cite text that exists verbatim in the contract.
3. Explanations must describe BUSINESS IMPACT — money, time, operational exposure.
4. Sort risks by severity: HIGH first, then MEDIUM, then LOW.
5. Confidence reflects extraction certainty, NOT severity. Do not let confidence override severity.

SEVERITY THRESHOLDS:
- HIGH: Immediate material risk — uncapped liability, auto-renewal traps, unilateral termination rights,
        unlimited IP assignment, payment > 60 days, penalty clauses without caps.
- MEDIUM: Negotiable exposure — unfavorable but bounded; standard deviations that weaken your position.
- LOW: Minor non-standard language with limited real-world impact.

EXPLANATION FORMAT:
BAD → "This clause may create legal ambiguity around IP ownership."
GOOD → "This clause assigns all IP created during the engagement to the client, including pre-existing tools and frameworks, leaving you with no ownership over your own codebase."`;

// ─── Single-pass analysis prompt (for contracts ≤ 6 000 words) ────────────────

export function buildAnalysisPrompt(contractText: string): string {
  return `CONTRACT TEXT:
"""
${contractText}
"""

Analyze this contract for legal and business risks. Return EXACTLY this JSON structure — no other text:

{
  "risks": [
    {
      "clause": "<verbatim text copied from the contract — do not paraphrase>",
      "riskType": "<one of: payment_terms | indemnity | termination | liability | ip_ownership | confidentiality | governing_law | non_compete | auto_renewal | other>",
      "severity": "<HIGH | MEDIUM | LOW>",
      "explanation": "<concrete business impact — what this means financially or operationally, in plain English>",
      "suggestedFix": "<a complete, ready-to-use rewritten clause that protects our interests>",
      "confidence": <integer 0–100>
    }
  ],
  "summary": "<2–3 sentence executive summary: overall risk level, the top concern, and recommended action>"
}

Rules:
- If no risks are found, return { "risks": [], "summary": "..." }.
- The "clause" field must be verbatim text from the contract.
- "suggestedFix" must be a complete usable clause, not a description of what to change.`;
}

// ─── Chunk analysis prompt (for each chunk of a large contract) ───────────────

export function buildChunkPrompt(
  chunkText: string,
  chunkIndex: number,
  totalChunks: number
): string {
  return `CONTRACT SECTION ${chunkIndex + 1} of ${totalChunks}:
"""
${chunkText}
"""

Analyze ONLY this section for legal and business risks. Return EXACTLY this JSON — no other text:

{
  "risks": [
    {
      "clause": "<verbatim text from this section>",
      "riskType": "<payment_terms | indemnity | termination | liability | ip_ownership | confidentiality | governing_law | non_compete | auto_renewal | other>",
      "severity": "<HIGH | MEDIUM | LOW>",
      "explanation": "<concrete business impact>",
      "suggestedFix": "<complete rewritten clause>",
      "confidence": <integer 0–100>
    }
  ],
  "summary": "<1 sentence: what risk was found in this section, or 'No significant risks in this section.'>"
}

If no risks in this section, return: { "risks": [], "summary": "No significant risks in this section." }`;
}

// ─── Worker Phase 1: clause extraction ────────────────────────────────────────

export function buildExtractionPrompt(contractText: string): string {
  return `CONTRACT TEXT:
"""
${contractText}
"""

Extract every distinct legal clause from this contract. Return EXACTLY this JSON — no other text:

{
  "clauses": [
    {
      "type": "<PAYMENT | IP_OWNERSHIP | LIABILITY | TERMINATION | CONFIDENTIALITY | NON_COMPETE | GOVERNING_LAW | OTHER>",
      "originalText": "<verbatim clause text, copied exactly from the contract>"
    }
  ]
}

Rules:
- Use verbatim text — do not paraphrase or summarize.
- Every substantive clause must appear. Do not omit clauses.
- If the contract has no recognizable clauses, return { "clauses": [] }.`;
}

// ─── Worker Phase 2: risk detection against standard parameters ───────────────

export function buildRiskPrompt(
  clausesText: string,
  standardParameters: string
): string {
  return `STANDARD PARAMETERS (what is acceptable for this contract type):
${standardParameters || 'Apply general B2B SaaS industry norms.'}

CLAUSES TO ANALYZE:
"""
${clausesText}
"""

For each clause, determine if it deviates materially from the Standard Parameters.
Return EXACTLY this JSON — no other text:

{
  "score": <integer 0–100, where 100 = zero risk, fully aligned with standard parameters>,
  "clauses": [
    {
      "originalText": "<exact same text as the input clause>",
      "riskLevel": "<SAFE | NEEDS_REVIEW | HIGH_RISK>",
      "businessImpact": "<one sentence concrete business impact, or null if SAFE>",
      "suggestedText": "<complete rewritten clause aligned with standard parameters, or null if SAFE>"
    }
  ]
}

Scoring guide:
- Each HIGH_RISK clause deducts 15 points.
- Each NEEDS_REVIEW clause deducts 5 points.
- SAFE clauses do not deduct points.
- Score floor is 0.`;
}
