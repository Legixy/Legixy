'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useContractById, useTriggerAnalysis, useAnalysisResults } from '@/shared/api';
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AnalyzePage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  // Fetch contract details
  const { data: contract, isLoading: contractLoading } = useContractById(contractId);

  // Mutation to trigger analysis
  const triggerMutation = useTriggerAnalysis();

  // State for analysis
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Query to poll for results
  const { data: results, isLoading: resultsLoading } = useAnalysisResults(contractId, {
    enabled: !!analysisId, // Only poll if we have triggered analysis
  });

  // Check if analysis is complete
  const analyses = results?.analyses || [];
  const latestAnalysis = (analyses[0] as any) || null;
  const isComplete = latestAnalysis?.status === 'COMPLETED';

  const handleTriggerAnalysis = async () => {
    triggerMutation.mutate(contractId, {
      onSuccess: (result) => {
        setAnalysisId(result.analysisId);
      },
    });
  };

  // Auto-trigger analysis on mount or when user clicks
  useEffect(() => {
    if (contract && !analysisId) {
      handleTriggerAnalysis();
    }
  }, [contract, analysisId]);

  // Auto-redirect to results when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        router.push(`/dashboard/contracts/${contractId}/results`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, contractId, router]);

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            AI Analysis in Progress
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">
            {contract?.title || 'Contract'} — OnyxAI is analyzing your document
          </p>
        </div>
      </div>

      {/* ── Loading / Processing State ────────────────────────────────── */}
      {!isComplete && (
        <div className="max-w-2xl mx-auto">

          {/* Loading animation */}
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-24 h-24 mb-6">
              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: 'radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)',
                }}
              />

              {/* Middle rotating ring */}
              <div
                className="absolute inset-2 rounded-full border-2 border-transparent"
                style={{
                  borderTopColor: '#4F46E5',
                  borderRightColor: '#7C3AED',
                  animation: 'spin 3s linear infinite',
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.1))',
                }}
              />

              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--onyx-gradient)' }}
                >
                  <Sparkles className="w-7 h-7 text-white animate-pulse" />
                </div>
              </div>
            </div>

            {/* Status messages */}
            <p className="text-slate-900 font-semibold text-lg text-center">
              {analysisId ? 'Analyzing contract...' : 'Starting analysis...'}
            </p>
            <p className="text-slate-500 text-sm text-center mt-2 max-w-md">
              OnyxAI is extracting clauses, assessing risks, and generating insights.
              This usually takes 30-60 seconds.
            </p>

            {/* Progress steps */}
            <div className="mt-8 space-y-3 w-full max-w-md">
              {[
                { label: 'Segmenting document', icon: '📄' },
                { label: 'Extracting clauses', icon: '✂️' },
                { label: 'Analyzing risks', icon: '⚠️' },
                { label: 'Generating suggestions', icon: '💡' },
              ].map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-lg">{step.icon}</span>
                  <p className="text-sm text-slate-600 flex-1">{step.label}</p>
                  {idx === 0 ? (
                    <Loader2 size={16} className="text-indigo-600 animate-spin" />
                  ) : idx < 2 ? (
                    <div className="w-4 h-4 rounded-full bg-slate-300" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-slate-200" />
                  )}
                </div>
              ))}
            </div>

            {/* Debug info */}
            {analysisId && (
              <p className="text-xs text-slate-400 mt-8 text-center">
                Analysis ID: {analysisId.slice(0, 8)}...
              </p>
            )}
          </div>

          {/* Error state */}
          {triggerMutation.error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mt-6">
              <AlertCircle className="text-red-500" size={18} />
              <div>
                <p className="text-sm font-semibold text-red-900">Analysis failed</p>
                <p className="text-xs text-red-700 mt-1">
                  {triggerMutation.error instanceof Error ? triggerMutation.error.message : 'Unknown error'}
                </p>
                <button
                  onClick={handleTriggerAnalysis}
                  className="text-xs text-red-600 font-semibold mt-2 hover:text-red-700"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ── Analysis Complete ────────────────────────────────── */}
      {isComplete && latestAnalysis && (
        <div className="space-y-6">

          {/* Success banner */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckCircle className="text-emerald-600" size={20} />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Analysis complete!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {latestAnalysis.riskFindings?.length || 0} risk findings • {latestAnalysis.riskFindings?.length || 0} recommendations
              </p>
            </div>
          </div>

          {/* Results summary */}
          {latestAnalysis.riskFindings && latestAnalysis.riskFindings.length > 0 ? (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Key Findings</h2>
              <div className="space-y-3">
                {latestAnalysis.riskFindings.map((finding: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 capitalize">
                          {finding.title || finding.severity}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">{finding.description || finding.recommendation}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 capitalize ${
                          finding.severity === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : finding.severity === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {finding.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle className="text-emerald-600" size={18} />
              <div>
                <p className="text-sm font-semibold text-emerald-900">No risks detected</p>
                <p className="text-xs text-emerald-700 mt-0.5">This contract appears safe based on AI analysis</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
              className="flex-1"
            >
              View Contract
            </Button>
            <Button
              onClick={() => handleTriggerAnalysis()}
              className="flex-1 text-white gap-2"
              style={{ background: 'var(--onyx-gradient)' }}
            >
              <Sparkles size={14} />
              Re-analyze
            </Button>
          </div>

        </div>
      )}

    </div>
  );
}
