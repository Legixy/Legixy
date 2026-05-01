'use client';

import { AlertTriangle, TrendingUp, Shield, FileSignature, Loader2 } from 'lucide-react';
import { useRiskOverview } from '@/shared/api/analytics';
import { useDashboardMetrics } from '@/shared/api/analytics';
import { useContracts } from '@/shared/api';
import { useRouter } from 'next/navigation';

const CLAUSE_LABELS: Record<string, string> = {
  PAYMENT_TERMS: 'Payment Terms',
  LIABILITY_LIMITATION: 'Liability Limitation',
  INDEMNIFICATION: 'Indemnification',
  TERMINATION: 'Termination Rights',
  IP_OWNERSHIP: 'IP Ownership',
  CONFIDENTIALITY: 'Confidentiality',
  GOVERNING_LAW: 'Governing Law',
  FORCE_MAJEURE: 'Force Majeure',
  NON_COMPETE: 'Non-Compete',
  ARBITRATION: 'Arbitration',
};

function clauseLabel(type: string): string {
  return CLAUSE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high':   return 'text-red-600 bg-red-50';
    case 'medium': return 'text-amber-600 bg-amber-50';
    default:       return 'text-emerald-600 bg-emerald-50';
  }
}

function getBarColor(severity: string) {
  switch (severity) {
    case 'high':   return '#ef4444';
    case 'medium': return '#f59e0b';
    default:       return '#10b981';
  }
}

export function RiskInsightsPanel() {
  const router = useRouter();
  const { data: riskData, isLoading: riskLoading } = useRiskOverview();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: contractsResp, isLoading: contractsLoading } = useContracts({ limit: 20 });

  const isLoading = riskLoading || metricsLoading || contractsLoading;

  // Compliance score from backend (riskReduced = % of clauses resolved)
  const complianceScore = metrics?.riskReduced ?? 0;

  // Top risk clauses from riskByClauseType
  const rawByType = (riskData?.riskByClauseType as { type: string; _count: number }[]) ?? [];
  const maxCount = rawByType.reduce((m, r) => Math.max(m, r._count), 1);
  const topClauses = rawByType.slice(0, 5).map((r, i) => ({
    name: clauseLabel(r.type),
    count: r._count,
    percentage: Math.round((r._count / maxCount) * 100),
    severity: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
  }));

  // Most risky contract
  const contracts = contractsResp?.data ?? [];
  const riskiest = contracts
    .filter((c) => c.riskScore != null)
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))[0] ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="h-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Score */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Overall Compliance Score
          </h3>
          <span className="text-xs text-slate-500">AI Calculated</span>
        </div>

        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="80" cy="80" r="70" fill="none"
                stroke="#4f46e5"
                strokeWidth="8"
                strokeDasharray={`${(Math.min(complianceScore, 100) / 100) * 440} 440`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-slate-900">{complianceScore}</p>
              <p className="text-xs text-slate-600">out of 100</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Status</p>
            <p className={`text-sm font-semibold ${complianceScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {complianceScore >= 80 ? 'Good' : 'Needs Review'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Resolved</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {metrics?.resolvedClauses ?? 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">High Risk</p>
            <p className="text-sm font-semibold text-red-600">{metrics?.highRiskClauses ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Top Risk Clause Types */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Most Common Risk Clauses
        </h3>

        {topClauses.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No high-risk clauses detected yet.</p>
        ) : (
          <div className="space-y-4">
            {topClauses.map((clause) => (
              <div key={clause.name} className="flex items-center gap-4">
                <div className="w-36 shrink-0">
                  <p className="text-sm font-medium text-slate-900 leading-tight">{clause.name}</p>
                  <p className="text-xs text-slate-500">{clause.count} clause{clause.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${clause.percentage}%`, background: getBarColor(clause.severity) }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getSeverityColor(clause.severity)}`}>
                    {clause.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most Risky Contract */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <FileSignature className="w-5 h-5 text-indigo-600" />
          Highest Risk Contract
        </h3>

        {!riskiest ? (
          <p className="text-sm text-slate-400 text-center py-6">No analyzed contracts yet.</p>
        ) : (
          <div className="p-4 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-slate-900 truncate">{riskiest.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 capitalize">{riskiest.status.toLowerCase().replace('_', ' ')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-red-600">{riskiest.riskScore}</p>
                <p className="text-xs text-slate-600">risk score</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-red-100">
              <p className="text-xs text-slate-600">
                {riskiest.clauses?.filter((c) => ['HIGH', 'CRITICAL'].includes(c.riskLevel)).length ?? 0} high-risk clauses
              </p>
              <button
                onClick={() => router.push(`/dashboard/contracts/${riskiest.id}/actions`)}
                className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Review Issues →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
