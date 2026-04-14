/**
 * /src/features/contracts/components/ContractIntelligentCard.tsx
 *
 * Upgraded contract card showing:
 * - Risk level (color-coded)
 * - AI summary (1-line insight)
 * - Status badge
 * - Hover interactions with quick actions
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ShieldCheck, Eye, Zap, ArrowRight, MoreVertical } from 'lucide-react';

export interface ContractIntelligentCardProps {
  id: string;
  title: string;
  status: 'draft' | 'in-review' | 'sent' | 'signed' | 'expired';
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  aiSummary: string;
  companyName?: string;
  updatedAt?: string;
  onAnalyze?: (id: string) => void;
}

const riskConfig = {
  high: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'High Risk',
    icon: AlertTriangle,
  },
  medium: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Medium Risk',
    icon: AlertTriangle,
  },
  low: {
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Low Risk',
    icon: ShieldCheck,
  },
  none: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Safe',
    icon: ShieldCheck,
  },
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  'in-review': { label: 'In Review', color: 'bg-blue-100 text-blue-700' },
  sent: { label: 'Sent', color: 'bg-indigo-100 text-indigo-700' },
  signed: { label: 'Signed', color: 'bg-emerald-100 text-emerald-700' },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700' },
};

export function ContractIntelligentCard({
  id,
  title,
  status,
  riskLevel,
  aiSummary,
  companyName,
  updatedAt,
  onAnalyze,
}: ContractIntelligentCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const risk = riskConfig[riskLevel];
  const statusInfo = statusConfig[status];
  const RiskIcon = risk.icon;

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 p-4 transition-all duration-300 cursor-pointer
        ${isHovered ? 'shadow-lg scale-[1.02]' : 'shadow-sm'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/dashboard/contracts/${id}`)}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
          {companyName && <p className="text-xs text-slate-500 mt-0.5">{companyName}</p>}
        </div>

        {/* Risk Badge */}
        <div className={`shrink-0 ml-2 px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${risk.bg} ${risk.color}`}>
          <RiskIcon className="w-3 h-3" />
          {risk.label}
        </div>
      </div>

      {/* AI Insight */}
      <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
        💡 {aiSummary}
      </p>

      {/* Status Badge */}
      <div className="mb-4 flex items-center gap-2">
        <span className={`text-xs font-medium px-2 py-1 rounded ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {updatedAt && <span className="text-xs text-slate-400">• {updatedAt}</span>}
      </div>

      {/* Hover Actions */}
      {isHovered && (
        <div className="flex gap-2 animate-in fade-in duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/contracts/${id}`);
            }}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze?.(id);
            }}
            className="flex-1 text-xs font-medium py-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors flex items-center justify-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Analyze
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium py-2 px-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer */}
      {!isHovered && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${risk.bg}`} />
            {riskLevel === 'high' ? '⚠️ Needs attention' : 'Safe to proceed'}
          </div>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </div>
      )}
    </div>
  );
}
