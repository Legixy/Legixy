'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { SimpleRisk } from '@/lib/api';

// ── Severity configs ───────────────────────────────────────────────────────────
const SEV = {
  dealbreaker: {
    leftBg: 'linear-gradient(180deg, #EF4444, #DC2626)',
    borderColor: 'rgba(239,68,68,0.18)',
    badgeBg: 'rgba(239,68,68,0.08)',
    badgeColor: '#B91C1C',
    impactColor: '#991B1B',
    glow: '0 0 24px rgba(239,68,68,0.10)',
    hoverGlow: '0 0 32px rgba(239,68,68,0.18)',
    tag: 'CRITICAL',
    tagBg: 'rgba(239,68,68,0.10)',
    tagColor: '#991B1B',
  },
  fixAsap: {
    leftBg: 'linear-gradient(180deg, #F97316, #EA580C)',
    borderColor: 'rgba(249,115,22,0.18)',
    badgeBg: 'rgba(249,115,22,0.08)',
    badgeColor: '#C2410C',
    impactColor: '#9A3412',
    glow: '0 0 24px rgba(249,115,22,0.10)',
    hoverGlow: '0 0 32px rgba(249,115,22,0.18)',
    tag: 'HIGH',
    tagBg: 'rgba(249,115,22,0.10)',
    tagColor: '#C2410C',
  },
  fix: {
    leftBg: 'linear-gradient(180deg, #F59E0B, #D97706)',
    borderColor: 'rgba(245,158,11,0.18)',
    badgeBg: 'rgba(245,158,11,0.08)',
    badgeColor: '#B45309',
    impactColor: '#92400E',
    glow: '0 0 24px rgba(245,158,11,0.08)',
    hoverGlow: '0 0 32px rgba(245,158,11,0.16)',
    tag: 'MEDIUM',
    tagBg: 'rgba(245,158,11,0.10)',
    tagColor: '#B45309',
  },
  ignore: {
    leftBg: 'linear-gradient(180deg, #10B981, #059669)',
    borderColor: 'rgba(16,185,129,0.15)',
    badgeBg: 'rgba(16,185,129,0.08)',
    badgeColor: '#047857',
    impactColor: '#065F46',
    glow: '0 0 24px rgba(16,185,129,0.06)',
    hoverGlow: '0 0 24px rgba(16,185,129,0.10)',
    tag: 'LOW',
    tagBg: 'rgba(16,185,129,0.10)',
    tagColor: '#047857',
  },
};

interface Props {
  risk: SimpleRisk;
  clauseId: string;
  isFixed: boolean;
  isFixing?: boolean;
  onFix: (clauseId: string) => Promise<void>;
  index?: number;
}

export function RiskItemCard({ risk, clauseId, isFixed, isFixing = false, onFix, index = 0 }: Props) {
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState(isFixed);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  // sync from parent
  if (isFixed && !fixed) setFixed(true);

  const s = SEV[risk.severity] ?? SEV.ignore;
  const busy = loading || isFixing;

  const handleFix = async () => {
    if (fixed || busy) return;
    setLoading(true);
    try {
      await onFix(clauseId);
      setFixed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white"
      style={{
        border: `1.5px solid ${fixed ? 'rgba(16,185,129,0.2)' : s.borderColor}`,
        boxShadow: fixed
          ? '0 4px 16px rgba(16,185,129,0.08)'
          : hovered
          ? `var(--onyx-shadow-md), ${s.hoverGlow}`
          : `var(--onyx-shadow-sm), ${s.glow}`,
        transform: !fixed && hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.35s var(--onyx-ease)',
        opacity: fixed ? 0.72 : 1,
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Left severity stripe ─────────────────────────────────────────── */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: fixed ? 'linear-gradient(180deg, #10B981, #059669)' : s.leftBg }}
      />

      <div className="pl-5 pr-4 pt-4 pb-4">
        <div className="flex items-start gap-3">
          {/* ── Emoji ─────────────────────────────────────────────────────── */}
          <span className="text-[22px] leading-none mt-0.5 flex-shrink-0 select-none">
            {fixed ? '✅' : risk.emoji}
          </span>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Top row: tag + headline */}
            <div className="flex items-start gap-2 flex-wrap mb-1.5">
              {!fixed && (
                <span
                  className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: s.tagBg, color: s.tagColor }}
                >
                  {s.tag}
                </span>
              )}
              <h4
                className={`font-display text-[14px] font-bold leading-snug flex-1 ${
                  fixed ? 'text-emerald-700 line-through decoration-emerald-300/50' : 'text-slate-900'
                }`}
              >
                {risk.headline}
              </h4>
            </div>

            {/* Explanation */}
            <p className="text-[13px] text-slate-500 leading-relaxed mb-2.5">
              {risk.explanation}
            </p>

            {/* Impact pill */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl"
                style={{
                  background: fixed ? 'rgba(16,185,129,0.08)' : s.badgeBg,
                  color: fixed ? '#047857' : s.impactColor,
                }}
              >
                {fixed ? '✓ Risk eliminated' : `💸 ${risk.businessImpact}`}
              </span>

              {/* Expand toggle */}
              {!fixed && risk.recommendedAction && (
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {expanded ? 'Less' : 'See fix'}
                  {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>

            {/* Expandable suggested fix */}
            <div
              style={{
                maxHeight: expanded ? '120px' : '0px',
                opacity: expanded ? 1 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.35s var(--onyx-ease), opacity 0.25s ease',
              }}
            >
              <div
                className="mt-3 rounded-xl px-4 py-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(124,58,237,0.03))',
                  border: '1px solid rgba(79,70,229,0.10)',
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-400 mb-1">
                  AI Suggested Fix
                </p>
                <p className="text-[12px] font-medium text-indigo-800 leading-snug">
                  {risk.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {/* ── Fix button ────────────────────────────────────────────────── */}
          <div className="flex-shrink-0 pt-0.5">
            {fixed ? (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center animate-bounce-in"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
              >
                <Check size={15} className="text-white" />
              </div>
            ) : (
              <button
                onClick={handleFix}
                disabled={busy}
                className="h-9 px-4 rounded-xl text-[13px] font-bold text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                style={{
                  background: busy
                    ? 'linear-gradient(135deg, #818CF8, #A78BFA)'
                    : 'var(--onyx-gradient)',
                  boxShadow: busy ? 'none' : '0 4px 14px rgba(79,70,229,0.30)',
                  transition: 'all 0.25s var(--onyx-ease)',
                }}
              >
                {busy ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {busy ? 'Fixing…' : 'Fix this'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
