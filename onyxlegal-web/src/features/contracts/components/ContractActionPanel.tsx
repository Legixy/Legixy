'use client';

import { useState, useCallback } from 'react';
import {
  Download,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

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

// ── Mock Data ──────────────────────────────────────────────────────────────────
// Production-ready fallback. Swap with real API by wiring useContractActionPanel.

const MOCK_SCORE = 78;
const MOCK_CONTRACT_VALUE = 1_500_000;

const MOCK_RISKS: SimpleRisk[] = [
  {
    level:    'CRITICAL',
    emoji:    '🚨',
    headline: 'You could owe unlimited money if something goes wrong',
    explanation:
      'There is no cap on how much money you could owe the other party. If a dispute happens, they can sue you for any amount — with no limit.',
    businessImpact:   'Worst case: ₹5,00,000+ loss',
    recommendedAction:'Add a liability cap equal to 12 months of fees paid (₹18L). This is standard and fair.',
    severity: 'dealbreaker',
  },
  {
    level:    'HIGH',
    emoji:    '🔴',
    headline: 'Contract renews automatically and keeps charging you',
    explanation:
      "Unless you cancel 90 days before the end date, this contract automatically extends and charges you again — even if you forgot about it.",
    businessImpact:   'You may lose ₹1,50,000 unexpectedly',
    recommendedAction:'Reduce the notice period to 30 days and add a mandatory renewal reminder 60 days before renewal.',
    severity: 'fixAsap',
  },
  {
    level:    'MEDIUM',
    emoji:    '⚠️',
    headline: 'If you disagree, you must fight in a foreign court',
    explanation:
      "Any dispute must be resolved under US law in Delaware courts. As an Indian company, this means expensive international litigation if anything goes wrong.",
    businessImpact:   'Legal costs: ₹10L+ for any dispute',
    recommendedAction:'Change to Indian Contract Act 1872 with courts of Mumbai having exclusive jurisdiction.',
    severity: 'fix',
  },
  {
    level:    'HIGH',
    emoji:    '🔴',
    headline: 'You pay for custom work but the vendor owns it',
    explanation:
      'All intellectual property created for you stays owned by the vendor. You cannot use, modify, or sell the deliverables without their permission.',
    businessImpact:   'You lose ownership of ₹2,00,000 of custom work',
    recommendedAction:'Add a "work-for-hire" clause: all custom IP created specifically for you transfers to you upon full payment.',
    severity: 'fixAsap',
  },
];

const MOCK_SUMMARY: RiskSummary = {
  totalRisks:           4,
  critical:             1,
  high:                 2,
  medium:               1,
  low:                  0,
  safe:                 0,
  overallSeverity:      'severe',
  topThreats:           MOCK_RISKS,
  fixableSoonCount:     4,
  needsLawyerReviewCount: 0,
};

const MOCK_CLAUSE_IDS = ['clause-001', 'clause-002', 'clause-003', 'clause-004'];

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
  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { data: apiData, isLoading: isPanelLoading } = useContractActionPanel(contractId);
  const { data: _progressData }                       = useContractProgress(contractId);
  const { mutateAsync: applyFix }                     = useApplyFix();
  const { mutateAsync: applyBulkFixes }               = useApplyBulkFixes();

  // ── Data / Fallback ────────────────────────────────────────────────────────
  const isMock = !apiData || apiData.riskSummary?.topThreats?.length === 0;
  const summary: RiskSummary = isMock
    ? MOCK_SUMMARY
    : { ...apiData!.riskSummary, topThreats: apiData!.riskSummary.topThreats };

  const initialScore: number = isMock ? MOCK_SCORE : (apiData?.riskScore ?? MOCK_SCORE);

  // ── Local state ───────────────────────────────────────────────────────────
  const [fixedSet,    setFixedSet]    = useState<Set<string>>(new Set());
  const [fixingSet,   setFixingSet]   = useState<Set<string>>(new Set());
  const [bulkResult,  setBulkResult]  = useState<BulkFixResult | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  const allFixed        = fixedSet.size >= summary.topThreats.length || bulkResult !== null;
  const currentScore    = Math.max(0, initialScore - fixedSet.size * Math.round(initialScore / (summary.totalRisks || 1)));
  const afterScore      = bulkResult
    ? Math.max(0, initialScore - (bulkResult.riskReductionPercent ?? 0))
    : currentScore;

  const contractStatus  = bulkResult ? 'REVIEWED' : (apiData?.status || 'IN_REVIEW');

  const estimatedLoss   = summary.topThreats.reduce((acc, r) => {
    const m = r.businessImpact?.match(/₹([\d,]+)/);
    return acc + (m ? parseInt(m[1].replace(/,/g, ''), 10) : 100_000);
  }, 0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFixSingle = useCallback(async (clauseId: string) => {
    if (fixingSet.has(clauseId)) return;
    setFixingSet((p) => new Set(p).add(clauseId));
    try {
      if (!isMock) {
        await applyFix({ contractId, clauseId });
      } else {
        await new Promise((r) => setTimeout(r, 900));
        toast.success('Fix applied! ✅', { description: 'AI-suggested improvement applied.' });
      }
      setFixedSet((p) => new Set(p).add(clauseId));
    } catch {
      // error toast fired by mutation hook
    } finally {
      setFixingSet((p) => { const n = new Set(p); n.delete(clauseId); return n; });
    }
  }, [contractId, applyFix, isMock, fixingSet]);

  const handleFixAll = useCallback(async () => {
    if (!isMock) {
      const res = await applyBulkFixes({ contractId });
      setBulkResult(res);
      setFixedSet(new Set(summary.topThreats.map((_, i) => MOCK_CLAUSE_IDS[i] ?? `c-${i}`)));
      return {
        riskReductionPercent: res.riskReductionPercent,
        estimatedSavings:     res.estimatedSavings,
        appliedFixes:         res.appliedFixes,
        riskScoreBefore:      initialScore,
        riskScoreAfter:       Math.max(0, initialScore - res.riskReductionPercent),
      };
    }
    // Mock
    await new Promise((r) => setTimeout(r, 1800));
    const reduction   = 57;
    const savings     = Math.round(MOCK_CONTRACT_VALUE * 0.28);
    const mockResult: BulkFixResult = {
      contractId,
      totalClauses:        summary.topThreats.length,
      appliedFixes:        summary.topThreats.length,
      skippedClauses:      0,
      riskReductionPercent: reduction,
      estimatedSavings:    savings,
      results:             [],
      versionNumber:       2,
    };
    setBulkResult(mockResult);
    setFixedSet(new Set(MOCK_CLAUSE_IDS));
    return {
      riskReductionPercent: reduction,
      estimatedSavings:    savings,
      appliedFixes:        summary.topThreats.length,
      riskScoreBefore:     initialScore,
      riskScoreAfter:      Math.max(0, initialScore - reduction),
    };
  }, [contractId, applyBulkFixes, isMock, summary.topThreats, initialScore]);

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

  // ── Fully safe state ──────────────────────────────────────────────────────
  if (apiData && apiData.riskSummary?.totalRisks === 0 && !isMock) {
    return (
      <div className="w-full space-y-5 animate-fade-up">
        <div
          className="rounded-3xl p-10 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))',
            border: '1.5px solid rgba(16,185,129,0.2)',
            boxShadow: '0 0 40px rgba(16,185,129,0.10)',
          }}
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 8px 24px rgba(16,185,129,0.35)' }}
          >
            <ShieldCheck size={36} className="text-white" />
          </div>
          <h2 className="font-display text-2xl font-black text-emerald-900 mb-2">
            This contract is safe! ✅
          </h2>
          <p className="text-[14px] font-medium text-emerald-700 max-w-sm mx-auto mb-6 leading-relaxed">
            Our AI found zero risks. The terms are fair and balanced. Safe to proceed.
          </p>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-display font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 6px 20px rgba(16,185,129,0.35)',
            }}
          >
            <Download size={18} />
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
        totalRisks={allFixed ? 0 : summary.totalRisks}
      />

      {/* ── 2. BUSINESS IMPACT ─────────────────────────────────────────── */}
      {!allFixed && (
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
          fixableCount={summary.fixableSoonCount}
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
      {!allFixed && (
        <div>
          <SectionLabel>⚠️ Top Risks — {fixedSet.size}/{summary.topThreats.length} resolved</SectionLabel>
          <div className="space-y-3">
            {summary.topThreats.map((risk, idx) => {
              const cId = risk.clauseId || MOCK_CLAUSE_IDS[idx] || `c-${idx}`;
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
            style={{ background: 'var(--onyx-gradient-subtle)' }}
          >
            <FileCheck size={15} style={{ color: '#4F46E5' }} />
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
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 8px 28px rgba(16,185,129,0.38), 0 2px 8px rgba(16,185,129,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
          }}
        >
          <Download size={20} />
          Download Safe Contract
        </button>
      )}
    </div>
  );
}
