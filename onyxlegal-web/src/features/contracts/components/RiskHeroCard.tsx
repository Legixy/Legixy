'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react';

// ── Risk configuration ─────────────────────────────────────────────────────────
function getRiskConfig(score: number) {
  if (score <= 30) {
    return {
      label: 'Safe',
      color: '#10B981',
      colorDark: '#059669',
      colorLight: 'rgba(16, 185, 129, 0.08)',
      colorMid: 'rgba(16, 185, 129, 0.18)',
      colorGlow: 'rgba(16, 185, 129, 0.22)',
      icon: ShieldCheck,
      headline: '✅ This contract looks safe',
      subtext: 'Our AI found no major issues. You\'re good to proceed.',
      gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      trackColor: 'rgba(16, 185, 129, 0.12)',
    };
  }
  if (score <= 60) {
    return {
      label: 'Medium Risk',
      color: '#F59E0B',
      colorDark: '#D97706',
      colorLight: 'rgba(245, 158, 11, 0.08)',
      colorMid: 'rgba(245, 158, 11, 0.18)',
      colorGlow: 'rgba(245, 158, 11, 0.22)',
      icon: Shield,
      headline: '⚠️ This contract has MEDIUM RISK',
      subtext: 'There are issues that could cost you money if left unfixed.',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      trackColor: 'rgba(245, 158, 11, 0.12)',
    };
  }
  return {
    label: 'High Risk',
    color: '#EF4444',
    colorDark: '#DC2626',
    colorLight: 'rgba(239, 68, 68, 0.08)',
    colorMid: 'rgba(239, 68, 68, 0.18)',
    colorGlow: 'rgba(239, 68, 68, 0.22)',
    icon: ShieldAlert,
    headline: '🚨 This contract has HIGH RISK',
    subtext: 'This could lead to serious financial loss or legal problems.',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    trackColor: 'rgba(239, 68, 68, 0.12)',
  };
}

interface Props {
  riskScore: number;
  totalRisks: number;
}

export function RiskHeroCard({ riskScore, totalRisks }: Props) {
  const cfg = getRiskConfig(riskScore);
  const Icon = cfg.icon;

  // ── Animated score counter ────────────────────────────────────────────────
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const duration = 1400;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(eased * riskScore));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [riskScore]);

  // ── SVG arc ───────────────────────────────────────────────────────────────
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const arc = (display / 100) * circ;

  // ── Pulsing ring animation ────────────────────────────────────────────────
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-3xl animate-fade-up"
      style={{
        background: `linear-gradient(135deg, ${cfg.colorLight} 0%, rgba(255,255,255,0.6) 100%)`,
        border: `1.5px solid ${cfg.colorMid}`,
        boxShadow: `0 0 0 1px ${cfg.colorLight}, 0 8px 40px ${cfg.colorGlow}, var(--onyx-shadow-md)`,
      }}
    >
      {/* ── Radial glow overlay ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 90% 10%, ${cfg.colorMid}, transparent 70%)`,
        }}
      />

      {/* ── Subtle pattern ──────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
          color: cfg.color,
        }}
      />

      <div className="relative px-7 py-7 flex items-center gap-8">
        {/* ── Gauge ─────────────────────────────────────────────────────── */}
        <div className="relative flex-shrink-0">
          {/* Outer pulse ring */}
          {riskScore > 60 && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${cfg.color}`,
                opacity: pulse ? 0 : 0.6,
                transform: pulse ? 'scale(1.18)' : 'scale(1)',
                transition: 'opacity 1.4s ease-out, transform 1.4s ease-out',
              }}
            />
          )}
          <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx="66" cy="66" r={radius} fill="none" stroke={cfg.trackColor} strokeWidth="9" strokeLinecap="round" />
            {/* Progress */}
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              stroke={cfg.color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ - arc}
              style={{
                filter: `drop-shadow(0 0 8px ${cfg.color}60)`,
                transition: 'stroke-dashoffset 0.08s linear',
              }}
            />
          </svg>
          {/* Center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <span
              className="font-display text-[34px] font-black tabular-nums leading-none"
              style={{ color: cfg.color }}
            >
              {display}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color, opacity: 0.6 }}>
              / 100
            </span>
          </div>
        </div>

        {/* ── Info ──────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Label badge */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: cfg.gradient }}
            >
              <Icon size={15} className="text-white" />
            </div>
            <span
              className="text-[11px] font-black uppercase tracking-[0.14em] px-3 py-1.5 rounded-lg"
              style={{ color: cfg.color, background: cfg.colorMid }}
            >
              {cfg.label}
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-display text-xl font-black tracking-tight leading-tight mb-2"
            style={{ color: riskScore > 60 ? '#7F1D1D' : riskScore > 30 ? '#78350F' : '#064E3B' }}
          >
            {cfg.headline}
          </h2>

          {/* Subtext */}
          <p className="text-sm font-medium leading-relaxed" style={{ color: riskScore > 60 ? '#991B1B' : '#64748B' }}>
            {cfg.subtext}
          </p>

          {/* Risk count pill */}
          {totalRisks > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }}
              />
              <span className="text-xs font-bold" style={{ color: cfg.colorDark }}>
                {totalRisks} issue{totalRisks !== 1 ? 's' : ''} need your attention
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
