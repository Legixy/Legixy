/**
 * /src/features/ai/components/AiFixPreviewModal.tsx
 *
 * Modal showing before/after comparison of AI-suggested fixes
 * Allows user to approve or reject the suggested change
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Check, X, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FixPreviewData {
  id: string;
  title: string;
  explanation: string;
  original: {
    title: string;
    content: string;
  };
  suggested: {
    title: string;
    content: string;
  };
  impact: {
    riskReduction: number;
    implications: string[];
  };
  confirmationText?: string;
}

interface AiFixPreviewModalProps {
  isOpen: boolean;
  data: FixPreviewData | null;
  isLoading?: boolean;
  onApprove: () => void;
  onCancel: () => void;
}

/**
 * Highlight differences between original and suggested text
 */
function highlightDifferences(original: string, suggested: string): string {
  // Simple word-level diff highlighting
  const origWords = original.split(/(\s+)/);
  const suggWords = suggested.split(/(\s+)/);

  return suggested; // For now, just return suggested text - highlight logic can be enhanced
}

export function AiFixPreviewModal({
  isOpen,
  data,
  isLoading = false,
  onApprove,
  onCancel,
}: AiFixPreviewModalProps) {
  const [copied, setCopied] = useState<'original' | 'suggested' | null>(null);

  if (!isOpen || !data) return null;

  const handleCopy = (type: 'original' | 'suggested') => {
    const text = type === 'original' ? data.original.content : data.suggested.content;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-indigo-50 to-blue-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{data.title}</h2>
              <p className="text-xs text-slate-600 mt-0.5">AI-Suggested Fix Preview</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Why AI recommends this fix:</strong>
            </p>
            <p className="text-sm text-blue-800 mt-2">{data.explanation}</p>
          </div>

          {/* Risk Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs font-medium text-red-600 mb-1">⚠️ Current Risk</p>
              <p className="text-sm text-red-900">High exposure</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-xs font-medium text-emerald-600 mb-1">✓ After Fix</p>
              <p className="text-sm text-emerald-900">{data.impact.riskReduction}% risk reduction</p>
            </div>
          </div>

          {/* Implications */}
          {data.impact.implications.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs font-medium text-amber-900 mb-2">📋 Implications of this change:</p>
              <ul className="space-y-1">
                {data.impact.implications.map((item, idx) => (
                  <li key={idx} className="text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-amber-600 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Clause Comparison */}
          <div className="space-y-4">
            {/* Original Clause */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Original Clause</p>
                  <p className="text-xs text-slate-600 mt-0.5">{data.original.title}</p>
                </div>
                <button
                  onClick={() => handleCopy('original')}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                >
                  {copied === 'original' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
              <div className="bg-red-50 p-4">
                <p className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {data.original.content}
                </p>
              </div>
            </div>

            {/* Suggested Clause */}
            <div className="border border-emerald-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    AI-Suggested Fix
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">{data.suggested.title}</p>
                </div>
                <button
                  onClick={() => handleCopy('suggested')}
                  className="p-2 hover:bg-emerald-200 rounded transition-colors"
                >
                  {copied === 'suggested' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-emerald-600" />
                  )}
                </button>
              </div>
              <div className="bg-emerald-50 p-4">
                <p className="text-xs text-emerald-900 whitespace-pre-wrap font-mono leading-relaxed">
                  {highlightDifferences(data.original.content, data.suggested.content)}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          {data.confirmationText && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-900">
                <strong>ℹ️ Note:</strong> {data.confirmationText}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Applying...' : 'Approve & Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
