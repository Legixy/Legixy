/**
 * /src/features/ai/services/aiEngine.ts
 *
 * Core AI engine service for contract analysis
 * Connects to real LLM (OpenAI GPT-4o)
 * Handles: chunking, analysis, fix generation, cost tracking
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisResult {
  risks: RiskItem[];
  suggestions: SuggestionItem[];
  score: number; // 0-100
  tokensUsed: number;
  modelUsed: string;
}

export interface RiskItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  clause: string;
  impact: string;
  suggestion: string;
  legalRef: string;
  estimatedImpact?: number; // in ₹
  suggestedFix?: string;
  fixConfidence?: number;
}

export interface SuggestionItem {
  id: string;
  type: 'improvement' | 'missing_clause' | 'optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Chunk large contracts into 4000-token chunks
 * For handling contracts > 8000 tokens
 */
function chunkContract(text: string, chunkSize: number = 4000): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    const estimatedTokens = Math.ceil(word.length / 4); // rough estimate
    if (currentLength + estimatedTokens > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
      currentLength = 0;
    }
    currentChunk.push(word);
    currentLength += estimatedTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

/**
 * Analyze contract using OpenAI GPT-4o
 */
export async function analyzeContract(contractText: string): Promise<AnalysisResult> {
  try {
    const chunks = chunkContract(contractText);

    const analysisPrompt = `You are a legal contract expert. Analyze this contract and return ONLY valid JSON (no markdown, no code blocks).

Contract:
${contractText.slice(0, 8000)}

Return JSON with this exact structure (do NOT include markdown formatting):
{
  "risks": [
    {
      "id": "risk-1",
      "severity": "high",
      "title": "Uncapped Liability",
      "clause": "Section 4.2 states...",
      "impact": "Exposes company to unlimited financial liability",
      "suggestion": "Add liability cap of ₹1 crore",
      "legalRef": "Indian Contract Act, Section 73",
      "estimatedImpact": 500000
    }
  ],
  "suggestions": [
    {
      "id": "sugg-1",
      "type": "missing_clause",
      "title": "Add Data Protection Clause",
      "description": "Contract is missing GDPR/DPA compliance clause",
      "priority": "high"
    }
  ],
  "score": 65
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost savings, switch to gpt-4o for complex contracts
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3, // Lower temp for consistency
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';

    // Remove markdown code blocks if present
    let cleanedContent = content;
    if (cleanedContent.includes('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedContent.includes('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedContent.trim());

    return {
      ...result,
      tokensUsed: response.usage?.total_tokens || 0,
      modelUsed: 'gpt-4o-mini',
    };
  } catch (error) {
    console.error('Contract analysis error:', error);
    throw new Error(`Failed to analyze contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate improved clause text
 */
export async function generateClauseFix(
  originalClause: string,
  issue: string,
  jurisdiction: string = 'India'
): Promise<{
  original: string;
  improved: string;
  explanation: string;
  confidenceScore: number;
  tokensUsed: number;
}> {
  try {
    const prompt = `You are a legal expert. Generate an improved version of this clause.

Original Clause:
${originalClause}

Issue to Fix:
${issue}

Jurisdiction:
${jurisdiction}

Return ONLY valid JSON (no markdown):
{
  "improved": "The improved clause text here...",
  "explanation": "Why this is better and compliant...",
  "confidenceScore": 92
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '{}';

    // Remove markdown if present
    let cleanedContent = content;
    if (cleanedContent.includes('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedContent.includes('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedContent.trim());

    return {
      original: originalClause,
      improved: result.improved,
      explanation: result.explanation,
      confidenceScore: result.confidenceScore || 85,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('Clause fix generation error:', error);
    throw new Error(`Failed to generate fix: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract individual clauses from contract
 */
export async function extractClauses(
  contractText: string
): Promise<{
  clauses: Array<{
    type: string;
    section: string;
    text: string;
  }>;
  tokensUsed: number;
}> {
  try {
    const prompt = `Extract all important clauses from this contract. Return ONLY valid JSON (no markdown):

Contract:
${contractText.slice(0, 8000)}

Return:
{
  "clauses": [
    {
      "type": "PAYMENT_TERMS",
      "section": "Section 3.1",
      "text": "Full clause text..."
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '{"clauses": []}';

    // Remove markdown if present
    let cleanedContent = content;
    if (cleanedContent.includes('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (cleanedContent.includes('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '');
    }

    const result = JSON.parse(cleanedContent.trim());

    return {
      clauses: result.clauses || [],
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('Clause extraction error:', error);
    throw new Error(`Failed to extract clauses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate compliance score
 */
export function calculateComplianceScore(risks: RiskItem[]): number {
  if (risks.length === 0) return 100;

  const severityWeights = {
    critical: 15,
    high: 10,
    medium: 5,
    low: 2,
  };

  let totalDeduction = 0;
  for (const risk of risks) {
    totalDeduction += severityWeights[risk.severity as keyof typeof severityWeights] || 0;
  }

  return Math.max(0, 100 - totalDeduction);
}
