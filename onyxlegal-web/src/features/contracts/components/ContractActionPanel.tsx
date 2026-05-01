'use client';

import { useState, useCallback } from 'react';
import {
  Download,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { RiskHeroCard }      from './RiskHeroCard';
import { BusinessImpactCard } from './BusinessImpactCard';
import { RiskItemCard }       from './RiskItemCard';
import { FixAllButton }       from './FixAllButton';
import { ProgressBar }        from './ProgressBar';

import type { SimpleRisk, RiskSummary, BulkFixResult } from '@/lib/api';
import { contracts as contractsApi } from '@/lib/api';
import {
  useContractActionPanel,
  useContractProgress,
  useApplyFix,
  useApplyBulkFixes,
} from '@/shared/api/contracts';

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    DRAFT:     { label: 'Draft',        color: '#64748B', bg: 'rgba(100,116,139,0.08)', icon: Clock       },
    IN_REVIEW: { label: 'Needs Review', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: AlertCircle  },
    REVIEWED:  { label: 'Safe',         color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: ShieldCheck  },
    SAFE:      { label: 'Safe',         color: '#10B981', bg: 'rgba(16,185,129,0.08)', icon: ShieldCheck  },
    FAILED:    { label: 'Failed',       color: '#EF4444', bg: 'rgba(239,68,68,0.08)',  icon: AlertCircle  },
  };
  const cfg = map[status] ?? map.DRAFT;
  const Icon = cfg.icon;
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.12em]"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon size={12} />
      {cfg.label}
    </div>
  );
}

// ── Skeleton loaders ───────────────────────────────────────────────────────────

function SkeletonCard({ h = 'h-40' }: { h?: string }) {
  return (
    <div
      className={`${h} rounded-3xl skeleton`}
      style={{ border: '1px solid var(--border)' }}
    />
  );
}

// ── Section divider label ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  contractId:    string;
  contractTitle?: string;
}

export function ContractActionPanel({ contractId, contractTitle }: Props) {
  const router = useRouter();

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { data: apiData, isLoading: isPanelLoading } = useContractActionPanel(contractId);
  const { data: _progressData }                       = useContractProgress(contractId);
  const { mutateAsync: applyFix }                     = useApplyFix();
  const { mutateAsync: applyBulkFixes }               = useApplyBulkFixes();

  // ── Data — only use real API data, no mock fallback ───────────────────────
  const hasRisks = !!apiData && (apiData.riskSummary?.topThreats?.length ?? 0) > 0;
  const summary: RiskSummary | null = hasRisks
    ? { ...apiData!.riskSummary, topThreats: apiData!.riskSummary.topThreats }
    : null;

  const initialScore: number = apiData?.riskScore ?? 0;

  // ── Local state ───────────────────────────────────────────────────────────
  const [fixedSet,    setFixedSet]    = useState<Set<string>>(new Set());
  const [fixingSet,   setFixingSet]   = useState<Set<string>>(new Set());
  const [bulkResult,  setBulkResult]  = useState<BulkFixResult | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  const threats         = summary?.topThreats ?? [];
  const allFixed        = threats.length > 0 && (fixedSet.size >= threats.length || bulkResult !== null);
  const currentScore    = Math.max(0, initialScore - fixedSet.size * Math.round(initialScore / (summary?.totalRisks || 1)));
  const afterScore      = bulkResult
    ? Math.max(0, initialScore - (bulkResult.riskReductionPercent ?? 0))
    : currentScore;

  const contractStatus  = bulkResult ? 'REVIEWED' : (apiData?.status || 'IN_REVIEW');

  const estimatedLoss   = threats.reduce((acc, r) => {
    const m = r.businessImpact?.match(/₹([\d,]+)/);
    return acc + (m ? parseInt(m[1].replace(/,/g, ''), 10) : 100_000);
  }, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFixSingle = useCallback(async (clauseId: string) => {
    if (fixingSet.has(clauseId)) return;
    setFixingSet((p) => new Set(p).add(clauseId));
    try {
      await applyFix({ contractId, clauseId });
      setFixedSet((p) => new Set(p).add(clauseId));
    } catch {
      // error toast fired by mutation hook
    } finally {
      setFixingSet((p) => { const n = new Set(p); n.delete(clauseId); return n; });
    }
  }, [contractId, applyFix, fixingSet]);

  const handleFixAll = useCallback(async () => {
    const res = await applyBulkFixes({ contractId });
    setBulkResult(res);
    setFixedSet(new Set(threats.map((r, i) => r.clauseId || `c-${i}`)));
    return {
      riskReductionPercent: res.riskReductionPercent,
      estimatedSavings:     res.estimatedSavings,
      appliedFixes:         res.appliedFixes,
      riskScoreBefore:      initialScore,
      riskScoreAfter:       Math.max(0, initialScore - res.riskReductionPercent),
    };
  }, [contractId, applyBulkFixes, threats, initialScore]);

  const handleDownload = useCallback(async () => {
    const toastId = toast.loading('Preparing download…');
    try {
      const { blob, filename } = await contractsApi.download(contractId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download ready', { id: toastId, description: filename });
    } catch {
      toast.error('Download failed', { id: toastId, description: 'Please try again.' });
    }
  }, [contractId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isPanelLoading) {
    return (
      <div className="w-full space-y-4">
        <SkeletonCard h="h-44" />
        <SkeletonCard h="h-36" />
        <SkeletonCard h="h-16" />
        <SkeletonCard h="h-28" />
        <SkeletonCard h="h-28" />
        <SkeletonCard h="h-28" />
      </div>
    );
  }

  // ── Not analyzed yet ──────────────────────────────────────────────────────
  if (!apiData) {
    return (
      <div className="w-full animate-fade-up">
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: 'var(--accent)', border: '1px solid rgba(61,53,211,0.10)' }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-md)' }}
          >
            <Sparkles size={28} className="text-white" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            No analysis yet
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto mb-6 leading-relaxed">
            Run an AI analysis to detect risks, get fix suggestions, and protect yourself before signing.
          </p>
          <button
            onClick={() => router.push(`/dashboard/contracts/${contractId}/analyze`)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
          >
            <Sparkles size={14} />
            Analyze with AI
          </button>
        </div>
      </div>
    );
  }

  // ── Analyzed — no risks found ─────────────────────────────────────────────
  if (!hasRisks) {
    return (
      <div className="w-full space-y-5 animate-fade-up">
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: '#059669', boxShadow: 'var(--shadow-md)' }}
          >
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h2 className="font-display text-xl font-semibold text-emerald-900 mb-2">
            Contract looks safe
          </h2>
          <p className="text-sm text-emerald-700 max-w-sm mx-auto mb-6 leading-relaxed">
            AI found no high-risk clauses. The terms are fair and balanced — safe to proceed.
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#059669', boxShadow: 'var(--shadow-sm)' }}
          >
            <Download size={14} />
            Download Contract
          </button>
        </div>
      </div>
    );
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-5">

      {/* ── 1. RISK HERO ───────────────────────────────────────────────── */}
      <RiskHeroCard
        riskScore={allFixed ? afterScore : initialScore}
        totalRisks={allFixed ? 0 : (summary?.totalRisks ?? 0)}
      />

      {/* ── 2. BUSINESS IMPACT ─────────────────────────────────────────── */}
      {!allFixed && summary && (
        <BusinessImpactCard
          estimatedLoss={estimatedLoss}
          criticalIssues={summary.critical + summary.high}
          riskReductionPercent={57}
          currency="₹"
        />
      )}

      {/* ── 3. FIX ALL CTA — visible early so user sees it immediately ─── */}
      <div>
        <FixAllButton
          fixableCount={summary?.fixableSoonCount ?? 0}
          isAllFixed={allFixed}
          onFixAll={handleFixAll}
        />
      </div>

      {/* ── 4. PROGRESS ────────────────────────────────────────────────── */}
      <ProgressBar
        before={initialScore}
        after={afterScore}
        showAfter={bulkResult !== null || fixedSet.size > 0}
        label="Risk Progress"
      />

      {/* ── 5. TOP RISKS LIST ───────────────────────────────────────────── */}
      {!allFixed && threats.length > 0 && (
        <div>
          <SectionLabel>⚠️ Top Risks — {fixedSet.size}/{threats.length} resolved</SectionLabel>
          <div className="space-y-3">
            {threats.map((risk, idx) => {
              const cId = risk.clauseId || `c-${idx}`;
              return (
                <RiskItemCard
                  key={cId}
                  risk={risk}
                  clauseId={cId}
                  isFixed={fixedSet.has(cId)}
                  isFixing={fixingSet.has(cId)}
                  onFix={handleFixSingle}
                  index={idx}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── 6. CONTRACT STATUS BAR ─────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-4 flex items-center justify-between animate-fade-up"
        style={{
          animationDelay: '160ms',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--onyx-shadow-sm)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <FileCheck size={15} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-0.5">
              Contract Status
            </p>
            <p className="text-[13px] font-semibold text-slate-800 max-w-[180px] truncate">
              {contractTitle || 'Untitled Contract'}
            </p>
          </div>
        </div>
        <StatusBadge status={contractStatus} />
      </div>

      {/* ── 7. DOWNLOAD — only after all fixed ─────────────────────────── */}
      {allFixed && (
        <button
          id="download-safe-contract-btn"
          onClick={handleDownload}
          className="w-full rounded-2xl text-white font-display font-black text-[15px] flex items-center justify-center gap-3 animate-bounce-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
          style={{
            height: '60px',
            background: '#059669',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Download size={20} />
          Download Safe Contract
        </button>
      )}
    </div>
  );
}
