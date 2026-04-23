'use client';

import { useState } from 'react';
import { Loader2, Sparkles, PartyPopper, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  fixableCount: number;
  isAllFixed: boolean;
  onFixAll: () => Promise<{
    riskReductionPercent: number;
    estimatedSavings: number;
    appliedFixes: number;
    riskScoreBefore: number;
    riskScoreAfter: number;
  }>;
}

function formatSavings(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function FixAllButton({ fixableCount, isAllFixed, onFixAll }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    riskReductionPercent: number;
    estimatedSavings: number;
    appliedFixes: number;
    riskScoreBefore: number;
    riskScoreAfter: number;
  } | null>(null);

  const handleFixAll = async () => {
    if (loading || isAllFixed) return;
    setLoading(true);
    try {
      const res = await onFixAll();
      setResult(res);
    } catch {
      // Error handled by parent via toast
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE — show results
  if (result) {
    return (
      <div
        className="rounded-2xl overflow-hidden animate-bounce-in"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(5, 150, 105, 0.04))',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.08)',
        }}
      >
        <div className="px-6 py-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
            <PartyPopper size={24} className="text-white" />
          </div>

          <h3 className="font-display text-lg font-bold text-emerald-900 mb-2">
            All issues fixed! 🎉
          </h3>

          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Risk score</p>
              <p className="text-sm font-bold text-slate-800">
                <span className="text-red-500 line-through decoration-red-300/60">{result.riskScoreBefore}%</span>
                <span className="mx-1.5 text-slate-300">→</span>
                <span className="text-emerald-600">{result.riskScoreAfter}%</span>
              </p>
            </div>
            <div className="w-px h-8 bg-emerald-200" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Risk avoided</p>
              <p className="text-sm font-bold text-emerald-700">
                {formatSavings(result.estimatedSavings)}
              </p>
            </div>
            <div className="w-px h-8 bg-emerald-200" />
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Fixes applied</p>
              <p className="text-sm font-bold text-emerald-700">
                {result.appliedFixes} clauses
              </p>
            </div>
          </div>

          <p className="text-sm text-emerald-700 font-medium">
            You avoided approx {formatSavings(result.estimatedSavings)} in potential risk
          </p>
        </div>
      </div>
    );
  }

  // ALL FIXED STATE
  if (isAllFixed) {
    return (
      <div
        className="rounded-2xl px-6 py-5 flex items-center gap-4"
        style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">All issues are resolved</p>
          <p className="text-xs text-emerald-700 mt-0.5">Your contract is safe and ready to go</p>
        </div>
      </div>
    );
  }

  // DEFAULT — CTA Button
  return (
    <button
      onClick={handleFixAll}
      disabled={loading || fixableCount === 0}
      className="group relative w-full rounded-2xl text-white font-display font-bold text-base overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
      style={{
        background: 'var(--onyx-gradient)',
        boxShadow: loading
          ? '0 4px 16px rgba(79, 70, 229, 0.15)'
          : '0 8px 32px rgba(79, 70, 229, 0.3), 0 0 0 1px rgba(79, 70, 229, 0.1)',
        transition: 'all 0.4s var(--onyx-ease)',
        height: '60px',
      }}
    >
      {/* Shimmer effect */}
      {!loading && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          }}
        />
      )}

      <div className="relative flex items-center justify-center gap-2.5">
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Fixing all issues...</span>
          </>
        ) : (
          <>
            <Sparkles size={20} className="group-hover:scale-110 transition-transform duration-300" />
            <span>Fix All {fixableCount} Issues</span>
          </>
        )}
      </div>
    </button>
  );
}
