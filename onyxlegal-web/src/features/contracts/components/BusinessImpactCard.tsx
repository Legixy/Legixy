'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingDown, AlertTriangle, Zap } from 'lucide-react';

// ── Currency formatter ─────────────────────────────────────────────────────────
function fmt(n: number, currency = '₹'): string {
  if (n >= 10000000) return `${currency}${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${currency}${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${currency}${(n / 1000).toFixed(0)}K`;
  return `${currency}${n.toLocaleString('en-IN')}`;
}

// ── Animated number ────────────────────────────────────────────────────────────
function AnimatedValue({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <>{prefix}{display.toLocaleString('en-IN')}</>;
}

interface Props {
  estimatedLoss: number;
  criticalIssues: number;
  riskReductionPercent: number;
  currency?: string;
}

export function BusinessImpactCard({
  estimatedLoss,
  criticalIssues,
  riskReductionPercent,
  currency = '₹',
}: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl animate-fade-up"
      style={{
        animationDelay: '80ms',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.05) 0%, rgba(124,58,237,0.04) 50%, rgba(255,255,255,0.8) 100%)',
        border: '1.5px solid rgba(79,70,229,0.12)',
        boxShadow: '0 0 0 1px rgba(79,70,229,0.04), 0 8px 40px rgba(79,70,229,0.08), var(--onyx-shadow-sm)',
      }}
    >
      {/* ── Glow accent ─────────────────────────────────────────────────── */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent 70%)',
        }}
      />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(79,70,229,0.08)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--onyx-gradient)', boxShadow: '0 4px 12px rgba(79,70,229,0.25)' }}
        >
          <TrendingDown size={15} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Business Impact
          </p>
          <p className="text-xs font-semibold text-slate-600">What this contract could cost you</p>
        </div>
      </div>

      {/* ── Metrics ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'rgba(79,70,229,0.08)' }}>
        {/* Metric 1 — Loss */}
        <div className="px-5 py-5 flex flex-col gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
              boxShadow: '0 3px 10px rgba(239,68,68,0.15)',
            }}
          >
            <TrendingDown size={16} style={{ color: '#DC2626' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mt-1">
            You may lose
          </p>
          <p className="font-display text-xl font-black text-red-600 leading-none">
            {fmt(estimatedLoss, currency)}
          </p>
          <p className="text-[11px] font-medium text-slate-500 leading-snug">
            if things go wrong
          </p>
        </div>

        {/* Metric 2 — Critical issues */}
        <div className="px-5 py-5 flex flex-col gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              boxShadow: '0 3px 10px rgba(245,158,11,0.15)',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#D97706' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mt-1">
            Critical issues
          </p>
          <p className="font-display text-xl font-black text-amber-600 leading-none">
            <AnimatedValue value={criticalIssues} />
          </p>
          <p className="text-[11px] font-medium text-slate-500 leading-snug">
            found in your contract
          </p>
        </div>

        {/* Metric 3 — Reduction */}
        <div className="px-5 py-5 flex flex-col gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
              boxShadow: '0 3px 10px rgba(16,185,129,0.15)',
            }}
          >
            <Zap size={16} style={{ color: '#059669' }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 mt-1">
            Fix now & save
          </p>
          <p className="font-display text-xl font-black text-emerald-600 leading-none">
            <AnimatedValue value={riskReductionPercent} />%
          </p>
          <p className="text-[11px] font-medium text-slate-500 leading-snug">
            risk reduction possible
          </p>
        </div>
      </div>

      {/* ── Call-out banner ──────────────────────────────────────────────── */}
      <div
        className="mx-4 mb-4 mt-3 rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(124,58,237,0.04))',
          border: '1px solid rgba(79,70,229,0.1)',
        }}
      >
        <div className="text-lg">💡</div>
        <p className="text-[12px] font-semibold text-indigo-800 leading-snug">
          Fixing these {criticalIssues} issue{criticalIssues !== 1 ? 's' : ''} could protect you from up to{' '}
          <span className="font-black text-indigo-900">{fmt(estimatedLoss, currency)}</span> in potential loss.
        </p>
      </div>
    </div>
  );
}
