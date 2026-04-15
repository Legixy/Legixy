/**
 * /src/features/ai/components/AiTransparencyPanel.tsx
 *
 * Show AI confidence, reasoning, and safety metrics
 * Trust layer: user understands what AI is doing and why
 */

'use client';

import { AlertCircle, CheckCircle2, Zap, TrendingDown, Shield } from 'lucide-react';

export interface AIRecommendation {
  id: string;
  suggestion: string;
  confidenceScore: number; // 0-100
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskAfterFix: 'low' | 'medium' | 'high';
  complianceFlags: string[];
  legalReference?: string;
}

interface AiTransparencyPanelProps {
  recommendation: AIRecommendation;
  className?: string;
}

function getConfidenceColor(score: number): string {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50';
  if (score >= 75) return 'text-amber-600 bg-amber-50';
  return 'text-red-600 bg-red-50';
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'low':
      return 'bg-emerald-50 text-emerald-700';
    case 'medium':
      return 'bg-amber-50 text-amber-700';
    case 'high':
      return 'bg-red-50 text-red-700';
    default:
      return 'bg-slate-50 text-slate-700';
  }
}

export function AiTransparencyPanel({
  recommendation,
  className = '',
}: AiTransparencyPanelProps) {
  return (
    <div className={`space-y-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4 ${className}`}>
      {/* Title */}
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-indigo-600" />
        <h4 className="font-semibold text-slate-900">AI Recommendation Details</h4>
      </div>

      {/* Confidence Score */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-700">AI Confidence Score</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                recommendation.confidenceScore >= 90
                  ? 'bg-emerald-600'
                  : recommendation.confidenceScore >= 75
                    ? 'bg-amber-600'
                    : 'bg-red-600'
              }`}
              style={{ width: `${recommendation.confidenceScore}%` }}
            />
          </div>
          <div className={`px-3 py-1 rounded-lg text-sm font-bold ${getConfidenceColor(recommendation.confidenceScore)}`}>
            {recommendation.confidenceScore}%
          </div>
        </div>
        <p className="text-xs text-slate-600">
          {recommendation.confidenceScore >= 90
            ? '✓ High confidence in this recommendation'
            : recommendation.confidenceScore >= 75
              ? '⚠️ Moderate confidence - review carefully'
              : '⚠️ Low confidence - consult legal team'}
        </p>
      </div>

      {/* Reasoning */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-700">AI Reasoning</p>
        <div className="bg-white rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
          {recommendation.reasoning}
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Current Risk</p>
          <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 ${getRiskColor(recommendation.riskLevel)}`}>
            <AlertCircle className="w-3 h-3" />
            {recommendation.riskLevel.toUpperCase()}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-700 mb-1">Risk After Fix</p>
          <div className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1 ${getRiskColor(recommendation.riskAfterFix)}`}>
            <TrendingDown className="w-3 h-3" />
            {recommendation.riskAfterFix.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Compliance Flags */}
      {recommendation.complianceFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-700">Compliance Considerations</p>
          <ul className="space-y-1">
            {recommendation.complianceFlags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-600 shrink-0" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Legal Reference */}
      {recommendation.legalReference && (
        <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-slate-700 mb-0.5">Legal Reference</p>
            <p className="text-xs text-slate-600">{recommendation.legalReference}</p>
          </div>
        </div>
      )}

      {/* Trust Statement */}
      <div className="pt-2 border-t border-indigo-200 text-center">
        <p className="text-xs text-indigo-700">
          ✓ This recommendation is reversible and auditable. You can undo any change at any time.
        </p>
      </div>
    </div>
  );
}
