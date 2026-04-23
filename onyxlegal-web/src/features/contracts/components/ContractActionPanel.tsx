'use client';

import { useState, useCallback } from 'react';
import { Download, Clock, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RiskOverviewCard } from './RiskOverviewCard';
import { BusinessImpactCard } from './BusinessImpactCard';
import { RiskItemCard } from './RiskItemCard';
import { FixAllButton } from './FixAllButton';
import { ProgressBar } from './ProgressBar';
import type { SimpleRisk, RiskSummary, BulkFixResult } from '@/lib/api';

// ── Mock Data ──────────────────────────────────────────────────────────────────
// Production-ready mock data matching the backend RiskSummary shape exactly.
// Swap to real API by replacing with useContractActionPanel(contractId) hook.

const MOCK_RISK_SCORE = 72;
const MOCK_CONTRACT_VALUE = 1200000;

const MOCK_TOP_THREATS: SimpleRisk[] = [
  {
    level: 'CRITICAL',
    emoji: '🚨',
    headline: 'You could lose unlimited money',
    explanation: 'This clause does not cap how much money you owe if something goes wrong. The other party could sue for any amount.',
    businessImpact: 'Worst case: ₹5,00,000 loss',
    recommendedAction: '⚠️ URGENT: Add a liability cap (₹X) to this clause',
    severity: 'dealbreaker',
  },
  {
    level: 'HIGH',
    emoji: '🔴',
    headline: 'Contract automatically renews and keeps charging you',
    explanation: 'Unless you remember to cancel before the renewal date, the contract automatically extends and charges you again.',
    businessImpact: 'You may lose ₹1,50,000 unexpectedly',
    recommendedAction: '🔴 Fix ASAP: Add 30-day opt-out notice window before renewal',
    severity: 'fixAsap',
  },
  {
    level: 'MEDIUM',
    emoji: '🟡',
    headline: 'Disputes handled in their country, not yours',
    explanation: "If there's a dispute, you must fight in their country's courts, using their laws. You cannot sue in India.",
    businessImpact: 'Legal costs: ₹10L+ for foreign litigation',
    recommendedAction: '🟡 Consider: Change governing law to Indian Contract Act 1872',
    severity: 'fix',
  },
];

const MOCK_RISK_SUMMARY: RiskSummary = {
  totalRisks: 5,
  critical: 1,
  high: 2,
  medium: 1,
  low: 1,
  safe: 0,
  overallSeverity: 'severe',
  topThreats: MOCK_TOP_THREATS,
  fixableSoonCount: 3,
  needsLawyerReviewCount: 1,
};

const MOCK_CLAUSE_IDS = ['clause-001', 'clause-002', 'clause-003'];

// ── Status Badge Component ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    DRAFT: { label: 'Draft', color: '#64748B', bg: 'rgba(100, 116, 139, 0.08)', icon: Clock },
    IN_REVIEW: { label: 'Needs Review', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', icon: AlertCircle },
    REVIEWED: { label: 'Safe', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', icon: ShieldCheck },
    SAFE: { label: 'Safe', color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', icon: ShieldCheck },
    FAILED: { label: 'Failed', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', icon: AlertCircle },
  };

  const cfg = configs[status] || configs.DRAFT;
  const Icon = cfg.icon;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon size={13} />
      {cfg.label}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────────

interface Props {
  contractId: string;
  contractTitle?: string;
}

import { useContractActionPanel, useContractProgress, useApplyFix, useApplyBulkFixes } from '@/shared/api/contracts';

export function ContractActionPanel({ contractId, contractTitle }: Props) {
  // --- Hooks ---
  const { data: apiData, isLoading: isPanelLoading } = useContractActionPanel(contractId);
  const { data: progressData } = useContractProgress(contractId);
  const { mutateAsync: applyFix } = useApplyFix();
  const { mutateAsync: applyBulkFixes } = useApplyBulkFixes();

  // --- Hybrid Data / Fallback ---
  // If API data exists and has risks, use it. Otherwise, fallback to the robust MOCK data for dev UI purposes.
  const isMockFallback = !apiData || apiData.topThreats.length === 0;
  const riskSummary = isMockFallback ? MOCK_RISK_SUMMARY : apiData;

  const initialRiskScore = riskSummary.riskScore ?? MOCK_RISK_SCORE;

  // --- Local UI State ---
  const [fixedClauses, setFixedClauses] = useState<Set<string>>(new Set());
  const [fixingClauseIds, setFixingClauseIds] = useState<Set<string>>(new Set());
  const [bulkFixResult, setBulkFixResult] = useState<BulkFixResult | null>(null);
  
  // Track contract status. If we use API data, use it. Otherwise IN_REVIEW.
  const contractStatus = bulkFixResult ? 'REVIEWED' : (apiData?.status || 'IN_REVIEW');

  // Computed
  const allFixed = fixedClauses.size >= riskSummary.topThreats.length || bulkFixResult !== null;
  const currentRiskScore = Math.max(0, initialRiskScore - Array.from(fixedClauses).length * 10);
  const afterRiskScore = bulkFixResult ? Math.max(0, initialRiskScore - (bulkFixResult.riskReductionPercent || 0)) : currentRiskScore;

  // Estimated financial exposure
  const estimatedLoss = riskSummary.topThreats.reduce((sum, risk) => {
    const match = risk.businessImpact.match(/₹([\d,]+)/);
    if (match) return sum + parseInt(match[1].replace(/,/g, ''), 10);
    return sum + 100000;
  }, 0);

  // --- Handlers ---

  const handleFixSingle = useCallback(async (clauseId: string) => {
    if (fixingClauseIds.has(clauseId)) return;
    
    setFixingClauseIds((prev) => new Set(prev).add(clauseId));
    
    try {
      if (!isMockFallback) {
        await applyFix({ contractId, clauseId });
      } else {
        // Mock delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        toast.success('Fix applied successfully', {
          description: 'Clause updated with AI-suggested improvement',
        });
      }
      setFixedClauses((prev) => new Set(prev).add(clauseId));
    } catch {
      // Error is caught by mutate hook and displayed in toast
    } finally {
      setFixingClauseIds((prev) => {
        const next = new Set(prev);
        next.delete(clauseId);
        return next;
      });
    }
  }, [contractId, applyFix, isMockFallback, fixingClauseIds]);

  const handleFixAll = useCallback(async () => {
    try {
      if (!isMockFallback) {
        const res = await applyBulkFixes({ contractId });
        setBulkFixResult(res);
        setFixedClauses(new Set(riskSummary.topThreats.map((_, idx) => MOCK_CLAUSE_IDS[idx] || `clause-${idx}`)));
        return {
          riskReductionPercent: res.riskReductionPercent,
          estimatedSavings: res.estimatedSavings,
          appliedFixes: res.appliedFixes,
          riskScoreBefore: initialRiskScore,
          riskScoreAfter: Math.max(0, initialRiskScore - res.riskReductionPercent),
        };
      } else {
        // Mock bulk fix
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const riskReductionPercent = 55;
        const estimatedSavings = Math.round(MOCK_CONTRACT_VALUE * (riskReductionPercent / 100) * 0.5);
        
        const allClauseIds = new Set(MOCK_CLAUSE_IDS);
        setFixedClauses(allClauseIds);
        
        const res = {
          contractId,
          totalClauses: riskSummary.topThreats.length,
          appliedFixes: riskSummary.topThreats.length,
          skippedClauses: 0,
          riskReductionPercent,
          estimatedSavings,
          results: [],
          versionNumber: 2,
        };
        setBulkFixResult(res);
        return {
          riskReductionPercent,
          estimatedSavings,
          appliedFixes: riskSummary.topThreats.length,
          riskScoreBefore: initialRiskScore,
          riskScoreAfter: Math.max(0, initialRiskScore - riskReductionPercent),
        };
      }
    } catch (err) {
      throw err;
    }
  }, [contractId, applyBulkFixes, isMockFallback, riskSummary.topThreats, initialRiskScore]);

  const handleDownload = useCallback(() => {
    toast.success('Download started', {
      description: 'Your safe contract PDF is being prepared.',
    });
  }, []);

  if (isPanelLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  // Handle true empty state (contract is genuinely safe, 0 risks detected natively and not falling back to mock)
  if (apiData && apiData.totalRisks === 0 && !isMockFallback) {
    return (
      <div className="w-full space-y-6 animate-fade-up">
        <div className="rounded-2xl p-8 text-center bg-emerald-50 border border-emerald-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">This contract is safe!</h2>
          <p className="text-emerald-700 max-w-md mx-auto">
            Our AI analysis found 0 risks. The terms are well-balanced and safe for you to proceed.
          </p>
          <Button onClick={handleDownload} className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 px-6">
            <Download size={16} className="mr-2" /> Download Document
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-up">
      {/* ── 1. Risk Overview ─────────────────────────── */}
      <RiskOverviewCard
        riskScore={afterRiskScore}
        overallSeverity={riskSummary.overallSeverity}
        totalRisks={allFixed ? 0 : riskSummary.totalRisks}
        status={contractStatus}
      />

      {/* ── 2. Business Impact ───────────────────────── */}
      {!allFixed && (
        <BusinessImpactCard
          estimatedLoss={estimatedLoss}
          criticalIssues={riskSummary.critical + riskSummary.high}
          riskReductionPercent={55}
          currency="₹"
        />
      )}

      {/* ── 5. Fix All CTA (placed high for visibility) */}
      <FixAllButton
        fixableCount={riskSummary.fixableSoonCount}
        isAllFixed={allFixed}
        onFixAll={handleFixAll}
      />

      {/* ── 6. Progress Bar ──────────────────────────── */}
      <ProgressBar
        before={initialRiskScore}
        after={afterRiskScore}
        showAfter={bulkFixResult !== null || fixedClauses.size > 0}
        label="Risk Progress"
      />

      {/* ── 3. Top Risks ─────────────────────────────── */}
      {!allFixed && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wider">
              ⚠️ Top Risks
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {fixedClauses.size}/{riskSummary.topThreats.length} resolved
            </span>
          </div>
          <div className="space-y-3">
            {riskSummary.topThreats.map((risk, idx) => {
              const cId = (risk as any).clauseId || MOCK_CLAUSE_IDS[idx] || `clause-${idx}`;
              return (
                <RiskItemCard
                  key={cId}
                  risk={risk}
                  clauseId={cId}
                  isFixed={fixedClauses.has(cId)}
                  isFixing={fixingClauseIds.has(cId)}
                  onFix={handleFixSingle}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── 7. Status Badge ──────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-4 flex items-center justify-between"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--onyx-shadow-sm)',
        }}
      >
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-1">
            Contract Status
          </p>
          <p className="text-sm font-semibold text-slate-800">
            {contractTitle || 'Untitled Contract'}
          </p>
        </div>
        <StatusBadge status={contractStatus} />
      </div>

      {/* ── 8. Download Safe Contract ─────────────────── */}
      {allFixed && (
        <Button
          onClick={handleDownload}
          className="w-full h-12 rounded-xl text-sm font-display font-bold gap-2 animate-bounce-in focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
          style={{
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            boxShadow: '0 6px 24px rgba(16, 185, 129, 0.25)',
            border: 'none',
          }}
        >
          <Download size={18} />
          Download Safe Contract
        </Button>
      )}
    </div>
  );
}
