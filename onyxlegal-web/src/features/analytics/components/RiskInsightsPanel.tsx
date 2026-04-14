/**
 * /src/features/analytics/components/RiskInsightsPanel.tsx
 *
 * Legal intelligence dashboard showing:
 * - Top risk clauses (bar chart)
 * - Most risky contract
 * - Compliance score (0-100)
 */

'use client';

import { AlertTriangle, TrendingUp, Shield, FileSignature } from 'lucide-react';

interface TopRiskClause {
  name: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  percentage: number;
}

interface RiskyContract {
  id: string;
  title: string;
  riskScore: number;
  issues: number;
}

const mockTopClauses: TopRiskClause[] = [
  { name: 'Liability Limitation', count: 12, severity: 'high', percentage: 85 },
  { name: 'Termination Rights', count: 9, severity: 'high', percentage: 64 },
  { name: 'Indemnification', count: 7, severity: 'medium', percentage: 50 },
  { name: 'Payment Terms', count: 5, severity: 'medium', percentage: 36 },
  { name: 'IP Rights', count: 3, severity: 'low', percentage: 21 },
];

const mockRiskyContract: RiskyContract = {
  id: '1',
  title: 'Vendor Agreement - TechCorp Inc',
  riskScore: 89,
  issues: 12,
};

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-50';
    case 'medium':
      return 'text-amber-600 bg-amber-50';
    case 'low':
      return 'text-emerald-600 bg-emerald-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
}

export function RiskInsightsPanel() {
  const complianceScore = 72;

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
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
            {/* Circular Progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${(complianceScore / 100) * 440} 440`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-slate-900">{complianceScore}</p>
              <p className="text-xs text-slate-600">out of 100</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Status</p>
            <p className="text-sm font-semibold text-amber-600">Needs Review</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Trend</p>
            <p className="text-sm font-semibold text-emerald-600 flex items-center justify-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +5%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 mb-1">Target</p>
            <p className="text-sm font-semibold text-slate-900">85+</p>
          </div>
        </div>
      </div>

      {/* Top Risk Clauses */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Most Common Risk Clauses
        </h3>

        <div className="space-y-4">
          {mockTopClauses.map((clause) => (
            <div key={clause.name} className="flex items-center gap-4">
              {/* Label */}
              <div className="w-32">
                <p className="text-sm font-medium text-slate-900">{clause.name}</p>
                <p className="text-xs text-slate-500">{clause.count} occurrences</p>
              </div>

              {/* Bar */}
              <div className="flex-1">
                <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-linear-to-r ${
                      clause.severity === 'high'
                        ? 'from-red-500 to-red-600'
                        : clause.severity === 'medium'
                          ? 'from-amber-500 to-amber-600'
                          : 'from-emerald-500 to-emerald-600'
                    } transition-all duration-500`}
                    style={{ width: `${clause.percentage}%` }}
                  />
                </div>
              </div>

              {/* Percentage */}
              <div className="w-12 text-right">
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getSeverityColor(clause.severity)}`}>
                  {clause.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most Risky Contract */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <FileSignature className="w-5 h-5 text-indigo-600" />
          Most Risky Contract
        </h3>

        <div className="p-4 rounded-lg bg-red-50 border border-red-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{mockRiskyContract.title}</p>
              <p className="text-xs text-slate-600 mt-1">ID: {mockRiskyContract.id}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">{mockRiskyContract.riskScore}</p>
              <p className="text-xs text-slate-600">risk score</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-red-100">
            <p className="text-xs text-slate-600">
              <strong>{mockRiskyContract.issues}</strong> issues found
            </p>
            <button className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
              Review Issues →
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-900 mb-3">Recommendations:</p>
          <ul className="space-y-2">
            <li className="text-xs text-slate-600 flex items-start gap-2">
              <span className="text-indigo-600 font-bold mt-0.5">•</span>
              Review liability limitation clause - exceeds industry standard
            </li>
            <li className="text-xs text-slate-600 flex items-start gap-2">
              <span className="text-indigo-600 font-bold mt-0.5">•</span>
              Update termination rights to include 60-day notice period
            </li>
            <li className="text-xs text-slate-600 flex items-start gap-2">
              <span className="text-indigo-600 font-bold mt-0.5">•</span>
              Add mutual indemnification clause for balanced protection
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
