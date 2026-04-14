'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useContractById, useAnalysisResults, useSuggestions, useAcceptClauseFix } from '@/shared/api';
import { ArrowLeft, Sparkles, AlertTriangle, AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClauseResult {
  id: string;
  originalText: string;
  suggestedText: string | null;
  riskLevel: string;
  riskReason: string | null;
  type?: string;
  isAccepted: boolean;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  // Fetch data
  const { data: contract } = useContractById(contractId);
  const { data: results } = useAnalysisResults(contractId);
  const { data: suggestionsData } = useSuggestions(contractId);
  const acceptFixMutation = useAcceptClauseFix();

  // Local state
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>(null);

  // Process results
  const analyses = results?.analyses || [];
  const latestAnalysis = (analyses[0] as any) || null;
  const riskFindings = latestAnalysis?.riskFindings || [];
  const clauses = (suggestionsData?.suggestions || []) as ClauseResult[];

  // Calculate stats
  const totalClauses = clauses.length;
  const acceptedClauses = clauses.filter((c) => c.isAccepted).length;
  const highRiskCount = riskFindings.filter((r: any) => r.severity === 'HIGH').length;
  const mediumRiskCount = riskFindings.filter((r: any) => r.severity === 'MEDIUM').length;

  const handleAcceptFix = (clauseId: string) => {
    acceptFixMutation.mutate({ contractId, clauseId });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'HIGH' || severity === 'CRITICAL') return AlertCircle;
    if (severity === 'MEDIUM') return AlertTriangle;
    return CheckCircle;
  };

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Analysis Results
            </h1>
            <p className="text-slate-500 mt-0.5 text-sm">{contract?.title || 'Contract'}</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/dashboard/contracts/${contractId}/analyze`)}
          className="text-white gap-2 h-10 rounded-xl text-sm font-semibold px-4"
          style={{ background: 'var(--onyx-gradient)' }}
        >
          <Sparkles size={14} />
          Re-analyze
        </Button>
      </div>

      {/* ── Risk Summary Cards ────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Clauses', value: totalClauses, color: 'bg-indigo-50', icon: '📄', accent: 'text-indigo-600' },
          { label: 'High Risk', value: highRiskCount, color: 'bg-red-50', icon: '🔴', accent: 'text-red-600' },
          { label: 'Medium Risk', value: mediumRiskCount, color: 'bg-amber-50', icon: '🟠', accent: 'text-amber-600' },
          { label: 'Accepted Fixes', value: acceptedClauses, color: 'bg-emerald-50', icon: '✅', accent: 'text-emerald-600' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 border border-slate-200`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Risk Findings (Summary) ────────────────────────── */}
      {riskFindings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Key Risk Findings</h2>
          <div className="space-y-3">
            {riskFindings.slice(0, 3).map((finding: any, idx: number) => {
              const Icon = getSeverityIcon(finding.severity);
              return (
                <div key={idx} className={`p-4 rounded-xl border ${getSeverityColor(finding.severity)}`}>
                  <div className="flex items-start gap-3">
                    <Icon size={18} className="mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{finding.title || finding.type}</p>
                      <p className="text-xs mt-1 opacity-90">{finding.description || finding.recommendation}</p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-white bg-opacity-60 rounded shrink-0 capitalize">
                      {finding.severity}
                    </span>
                  </div>
                </div>
              );
            })}
            {riskFindings.length > 3 && (
              <div className="text-center">
                <button className="text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                  View all {riskFindings.length} findings
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Clauses with Suggestions ────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Clause Analysis</h2>
        <div className="space-y-3">
          {clauses.length > 0 ? (
            clauses.map((clause) => (
              <div
                key={clause.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden transition-all"
              >
                {/* Header (always visible) */}
                <button
                  onClick={() =>
                    setExpandedClauseId(expandedClauseId === clause.id ? null : clause.id)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getSeverityColor(clause.riskLevel)}`}
                    >
                      {clause.type || 'CLAUSE'} • {clause.riskLevel}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                        {clause.originalText.substring(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {clause.isAccepted && (
                      <Check size={16} className="text-emerald-600 shrink-0" />
                    )}
                    {expandedClauseId === clause.id ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedClauseId === clause.id && (
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 space-y-4">

                    {/* Original text */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Original Text</p>
                      <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 max-h-24 overflow-y-auto">
                        {clause.originalText}
                      </div>
                    </div>

                    {/* Risk reason */}
                    {clause.riskReason && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">Risk Assessment</p>
                        <div className="p-3 rounded-lg bg-white border border-red-200 text-sm text-slate-700">
                          {clause.riskReason}
                        </div>
                      </div>
                    )}

                    {/* Suggested fix */}
                    {clause.suggestedText && !clause.isAccepted && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase">AI Suggested Fix</p>
                        <div className="bg-white p-3 rounded-lg border border-emerald-200 font-mono text-xs text-slate-700 max-h-24 overflow-y-auto">
                          {clause.suggestedText}
                        </div>
                        <Button
                          onClick={() => handleAcceptFix(clause.id)}
                          disabled={acceptFixMutation.isPending}
                          className="w-full mt-3 text-white gap-2"
                          style={{
                            background: 'var(--onyx-gradient)',
                            opacity: acceptFixMutation.isPending ? 0.7 : 1,
                          }}
                        >
                          {acceptFixMutation.isPending ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Accepting...
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              Accept Fix
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Already accepted */}
                    {clause.isAccepted && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <CheckCircle size={16} className="text-emerald-600" />
                        <p className="text-sm font-semibold text-emerald-700">Fix accepted</p>
                      </div>
                    )}

                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No clauses to review</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────── */}
      <div className="flex gap-3 mt-8 pt-8 border-t border-slate-200">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          Back to Contract
        </Button>
        <Button
          className="flex-1 text-white gap-2"
          style={{ background: 'var(--onyx-gradient)' }}
          onClick={() => router.push(`/dashboard/contracts/${contractId}`)}
        >
          <CheckCircle size={16} />
          Done Reviewing
        </Button>
      </div>

    </div>
  );
}
