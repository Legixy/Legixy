'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  riskScore: number;
  overallSeverity: 'clean' | 'minor' | 'significant' | 'severe' | 'critical';
  totalRisks: number;
  status: string;
}

function getRiskConfig(score: number) {
  if (score <= 30) {
    return {
      label: 'Safe',
      color: '#10B981',
      colorLight: 'rgba(16, 185, 129, 0.08)',
      colorMid: 'rgba(16, 185, 129, 0.15)',
      glowClass: 'onyx-glow-emerald',
      icon: ShieldCheck,
      headline: 'Your contract looks safe',
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
    };
  }
  if (score <= 60) {
    return {
      label: 'Medium Risk',
      color: '#F59E0B',
      colorLight: 'rgba(245, 158, 11, 0.08)',
      colorMid: 'rgba(245, 158, 11, 0.15)',
      glowClass: 'onyx-glow-amber',
      icon: Shield,
      headline: 'Your contract has some risks',
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
    };
  }
  return {
    label: 'High Risk',
    color: '#EF4444',
    colorLight: 'rgba(239, 68, 68, 0.08)',
    colorMid: 'rgba(239, 68, 68, 0.15)',
    glowClass: 'onyx-glow-red',
    icon: ShieldAlert,
    headline: 'Your contract has HIGH RISK',
    gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
  };
}

export function RiskOverviewCard({ riskScore, overallSeverity, totalRisks, status }: Props) {
  const config = getRiskConfig(riskScore);
  const Icon = config.icon;
  const [animatedScore, setAnimatedScore] = useState(0);
  const arcRef = useRef<SVGCircleElement>(null);

  // Animate score on mount
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * riskScore));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [riskScore]);

  // SVG arc calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (animatedScore / 100) * circumference;

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: config.colorLight,
        border: `1px solid ${config.colorMid}`,
        boxShadow: `var(--onyx-shadow-sm), 0 0 30px ${config.colorLight}`,
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at top right, ${config.colorMid}, transparent 70%)`,
        }}
      />

      <div className="relative px-7 py-6 flex items-center gap-8">
        {/* Risk Gauge */}
        <div className="relative flex-shrink-0">
          <svg width="136" height="136" viewBox="0 0 136 136" className="transform -rotate-90">
            {/* Background track */}
            <circle
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <circle
              ref={arcRef}
              cx="68"
              cy="68"
              r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - arcLength}
              style={{
                transition: 'stroke-dashoffset 0.1s ease-out',
                filter: `drop-shadow(0 0 6px ${config.color}40)`,
              }}
            />
          </svg>
          {/* Center score */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display text-3xl font-bold tabular-nums"
              style={{ color: config.color }}
            >
              {animatedScore}
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              / 100
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: config.gradient }}
            >
              <Icon size={16} className="text-white" />
            </div>
            <span
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
              style={{
                color: config.color,
                background: config.colorMid,
              }}
            >
              {config.label}
            </span>
          </div>

          <h2
            className="font-display text-xl font-bold tracking-tight mb-1.5"
            style={{ color: riskScore > 60 ? '#991B1B' : riskScore > 30 ? '#92400E' : '#065F46' }}
          >
            {config.headline}
          </h2>

          <p className="text-sm text-slate-500 leading-relaxed">
            {totalRisks === 0
              ? 'No issues found. Your contract is ready to go.'
              : `We found ${totalRisks} issue${totalRisks === 1 ? '' : 's'} that ${totalRisks === 1 ? 'needs' : 'need'} your attention.`}
          </p>
        </div>
      </div>
    </div>
  );
}
