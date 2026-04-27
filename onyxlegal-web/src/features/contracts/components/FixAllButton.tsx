'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, PartyPopper, ShieldCheck, ArrowRight } from 'lucide-react';

function fmt(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

interface FixResult {
  riskReductionPercent: number;
  estimatedSavings: number;
  appliedFixes: number;
  riskScoreBefore: number;
  riskScoreAfter: number;
}

interface Props {
  fixableCount: number;
  isAllFixed: boolean;
  onFixAll: () => Promise<FixResult>;
}

export function FixAllButton({ fixableCount, isAllFixed, onFixAll }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [shimmer, setShimmer] = useState(false);

  // shimmer loop while idle
  useEffect(() => {
    if (loading || result || isAllFixed) return;
    const t = setInterval(() => setShimmer((p) => !p), 3000);
    return () => clearInterval(t);
  }, [loading, result, isAllFixed]);

  const handleClick = async () => {
    if (loading || isAllFixed || result) return;
    setLoading(true);
    try {
      const res = await onFixAll();
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS STATE ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div
        className="rounded-3xl overflow-hidden animate-bounce-in"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.05) 100%)',
          border: '1.5px solid rgba(16,185,129,0.25)',
          boxShadow: '0 0 40px rgba(16,185,129,0.12), var(--onyx-shadow-md)',
        }}
      >
        {/* Confetti header */}
        <div
          className="px-6 py-5 flex flex-col items-center text-center gap-3"
          style={{ borderBottom: '1px solid rgba(16,185,129,0.12)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10B981, #059669)',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
            }}
          >
            <PartyPopper size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-black text-emerald-900">
              All issues fixed! 🎉
            </h3>
            <p className="text-[13px] font-medium text-emerald-700 mt-0.5">
              Your contract is now much safer to sign.
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(16,185,129,0.12)' }}>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-500 mb-1.5">
              Risk score
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-display text-lg font-black text-red-400 line-through decoration-red-300/60">
                {result.riskScoreBefore}
              </span>
              <ArrowRight size={14} className="text-emerald-400" />
              <span className="font-display text-lg font-black text-emerald-600">
                {result.riskScoreAfter}
              </span>
            </div>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-500 mb-1.5">
              Risk avoided
            </p>
            <p className="font-display text-lg font-black text-emerald-700">
              {fmt(result.estimatedSavings)}
            </p>
          </div>
          <div className="px-4 py-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-500 mb-1.5">
              Fixes applied
            </p>
            <p className="font-display text-lg font-black text-emerald-700">
              {result.appliedFixes}
            </p>
          </div>
        </div>

        {/* Callout */}
        <div className="px-5 pb-5 pt-3">
          <div
            className="rounded-xl px-4 py-3 text-center"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
            }}
          >
            <p className="text-[13px] font-bold text-emerald-800">
              You avoided approx{' '}
              <span className="font-black text-emerald-900">{fmt(result.estimatedSavings)}</span>{' '}
              in potential risk 🛡️
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── ALREADY FIXED ────────────────────────────────────────────────────────────
  if (isAllFixed) {
    return (
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4 animate-fade-up"
        style={{
          background: 'rgba(16,185,129,0.05)',
          border: '1.5px solid rgba(16,185,129,0.18)',
          boxShadow: '0 0 20px rgba(16,185,129,0.07)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
        >
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-[14px] font-bold text-emerald-900">All issues are resolved</p>
          <p className="text-[12px] font-medium text-emerald-700 mt-0.5">
            Your contract is safe and ready to download.
          </p>
        </div>
      </div>
    );
  }

  // ── DEFAULT CTA ──────────────────────────────────────────────────────────────
  return (
    <button
      id="fix-all-btn"
      onClick={handleClick}
      disabled={loading || fixableCount === 0}
      className="group relative w-full rounded-2xl text-white font-display font-black text-[16px] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        height: '68px',
        background: loading
          ? 'linear-gradient(135deg, #818CF8, #A78BFA)'
          : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 60%, #6D28D9 100%)',
        boxShadow: loading
          ? 'none'
          : '0 8px 32px rgba(79,70,229,0.38), 0 2px 8px rgba(79,70,229,0.20), inset 0 1px 0 rgba(255,255,255,0.15)',
        transition: 'all 0.4s var(--onyx-ease)',
      }}
    >
      {/* Animated shimmer sweep */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 60%, transparent 100%)',
          transform: shimmer && !loading ? 'translateX(100%)' : 'translateX(-100%)',
          transition: shimmer ? 'transform 0.8s ease' : 'none',
        }}
      />

      {/* Hover lift glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(255,255,255,0.14), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-center gap-3">
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Applying all AI fixes…</span>
          </>
        ) : (
          <>
            <Sparkles
              size={20}
              className="group-hover:scale-110 transition-transform duration-300"
            />
            <span>
              Fix All {fixableCount} Issues
            </span>
            <div
              className="ml-1 px-2.5 py-0.5 rounded-lg text-[11px] font-black"
              style={{ background: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}
            >
              AI
            </div>
          </>
        )}
      </div>
    </button>
  );
}
