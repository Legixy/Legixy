'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SimpleRisk } from '@/lib/api';

interface Props {
  risk: SimpleRisk;
  clauseId: string;
  isFixed: boolean;
  isFixing?: boolean;
  onFix: (clauseId: string) => Promise<void>;
}

function getSeverityConfig(severity: SimpleRisk['severity']) {
  switch (severity) {
    case 'dealbreaker':
      return {
        borderColor: 'rgba(239, 68, 68, 0.15)',
        bgHover: 'rgba(239, 68, 68, 0.02)',
        glow: '0 0 20px rgba(239, 68, 68, 0.06)',
        accentBg: 'rgba(239, 68, 68, 0.06)',
        accentColor: '#991B1B',
        impactColor: '#B91C1C',
      };
    case 'fixAsap':
      return {
        borderColor: 'rgba(239, 68, 68, 0.12)',
        bgHover: 'rgba(239, 68, 68, 0.02)',
        glow: '0 0 20px rgba(239, 68, 68, 0.05)',
        accentBg: 'rgba(239, 68, 68, 0.06)',
        accentColor: '#991B1B',
        impactColor: '#B91C1C',
      };
    case 'fix':
      return {
        borderColor: 'rgba(245, 158, 11, 0.15)',
        bgHover: 'rgba(245, 158, 11, 0.02)',
        glow: '0 0 20px rgba(245, 158, 11, 0.05)',
        accentBg: 'rgba(245, 158, 11, 0.06)',
        accentColor: '#92400E',
        impactColor: '#B45309',
      };
    default:
      return {
        borderColor: 'rgba(16, 185, 129, 0.15)',
        bgHover: 'rgba(16, 185, 129, 0.02)',
        glow: '0 0 20px rgba(16, 185, 129, 0.05)',
        accentBg: 'rgba(16, 185, 129, 0.06)',
        accentColor: '#065F46',
        impactColor: '#047857',
      };
  }
}

export function RiskItemCard({ risk, clauseId, isFixed, isFixing = false, onFix }: Props) {
  const [loading, setLoading] = useState(false);
  const [fixed, setFixed] = useState(isFixed);
  const config = getSeverityConfig(risk.severity);

  // Sync internal fixed state with props to handle optimistic UI
  if (isFixed && !fixed) {
    setFixed(true);
  }

  const handleFix = async () => {
    if (fixed || loading || isFixing) return;
    setLoading(true);
    try {
      await onFix(clauseId);
      // Let optimistic UI update it via props, but we can set it locally just in case
      setFixed(true);
    } catch {
      // Error handled by parent via toast
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = loading || isFixing;

  return (
    <div
      className={`rounded-2xl bg-white overflow-hidden transition-all duration-300 ${
        fixed ? 'opacity-60' : ''
      }`}
      style={{
        border: `1px solid ${fixed ? 'rgba(16, 185, 129, 0.2)' : config.borderColor}`,
        boxShadow: `var(--onyx-shadow-sm), ${config.glow}`,
        transition: 'all 0.4s var(--onyx-ease)',
      }}
      onMouseEnter={(e) => {
        if (!fixed) {
          e.currentTarget.style.boxShadow = `var(--onyx-shadow-md), ${config.glow}`;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `var(--onyx-shadow-sm), ${config.glow}`;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="px-5 py-4 flex items-start gap-4">
        {/* Emoji indicator */}
        <div className="text-2xl leading-none pt-0.5 flex-shrink-0">
          {fixed ? '✅' : risk.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-display text-[15px] font-semibold leading-snug mb-1 ${
              fixed ? 'text-emerald-700 line-through decoration-emerald-300/60' : 'text-slate-900'
            }`}
          >
            {fixed ? 'Fixed — ' : ''}{risk.headline}
          </h4>
          <p className="text-[13px] text-slate-500 leading-relaxed mb-2">
            {risk.explanation}
          </p>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{
              background: fixed ? 'rgba(16, 185, 129, 0.06)' : config.accentBg,
              color: fixed ? '#065F46' : config.impactColor,
            }}
          >
            {fixed ? '✓ Risk mitigated' : risk.businessImpact}
          </div>
        </div>

        {/* Fix button */}
        <div className="flex-shrink-0 pt-0.5">
          {fixed ? (
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Check size={16} className="text-emerald-600" />
            </div>
          ) : (
            <Button
              onClick={handleFix}
              disabled={isButtonDisabled}
              className="h-9 px-4 rounded-xl text-sm font-semibold text-white gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'var(--onyx-gradient)',
                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)',
                border: 'none',
              }}
            >
              {isButtonDisabled ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isButtonDisabled ? 'Fixing...' : 'Fix this'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
