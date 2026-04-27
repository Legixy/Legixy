'use client';

import { useEffect, useRef, useState } from 'react';

function color(score: number) {
  if (score <= 30) return { bar: '#10B981', glow: 'rgba(16,185,129,0.35)', label: 'Low Risk' };
  if (score <= 60) return { bar: '#F59E0B', glow: 'rgba(245,158,11,0.35)', label: 'Medium Risk' };
  return { bar: '#EF4444', glow: 'rgba(239,68,68,0.35)', label: 'High Risk' };
}

interface Props {
  before: number;   // 0-100
  after: number;    // 0-100
  showAfter: boolean;
  label?: string;
}

function AnimBar({ value, c, delay = 0 }: { value: number; c: ReturnType<typeof color>; delay?: number }) {
  const [w, setW] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const duration = 900;
      const animate = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setW(Math.round(eased * value));
        if (t < 1) raf.current = requestAnimationFrame(animate);
      };
      raf.current = requestAnimationFrame(animate);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf.current);
    };
  }, [value, delay]);

  return (
    <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
      <div
        className="h-full rounded-full"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg, ${c.bar}, ${c.bar}CC)`,
          boxShadow: `0 0 10px ${c.glow}`,
          transition: 'width 0.06s linear',
        }}
      />
    </div>
  );
}

export function ProgressBar({ before, after, showAfter, label }: Props) {
  const cb = color(before);
  const ca = color(after);
  const improvement = before - after;

  return (
    <div
      className="rounded-3xl px-6 py-5 animate-fade-up"
      style={{
        animationDelay: '120ms',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--onyx-shadow-sm)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-base">📊</span>
          <h3 className="font-display text-sm font-black text-slate-900 uppercase tracking-[0.1em]">
            {label ?? 'Risk Progress'}
          </h3>
        </div>
        {showAfter && improvement > 0 && (
          <span
            className="text-[11px] font-black px-2.5 py-1 rounded-lg animate-bounce-in"
            style={{
              background: 'rgba(16,185,129,0.10)',
              color: '#059669',
            }}
          >
            ↓ {improvement} pts improved
          </span>
        )}
      </div>

      {/* Before */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
            {showAfter ? 'Before fixes' : 'Current risk'}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: `${cb.bar}15`, color: cb.bar }}
            >
              {cb.label}
            </span>
            <span className="text-[13px] font-black tabular-nums" style={{ color: cb.bar }}>
              {before}
            </span>
          </div>
        </div>
        <AnimBar value={before} c={cb} delay={0} />
      </div>

      {/* After */}
      <div
        style={{
          maxHeight: showAfter ? '80px' : '0px',
          opacity: showAfter ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.5s var(--onyx-ease), opacity 0.4s ease',
        }}
      >
        <div className="mb-2 mt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
              After fixes
            </span>
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                style={{ background: `${ca.bar}15`, color: ca.bar }}
              >
                {ca.label}
              </span>
              <span className="text-[13px] font-black tabular-nums" style={{ color: ca.bar }}>
                {after}
              </span>
            </div>
          </div>
          <AnimBar value={after} c={ca} delay={300} />
        </div>
      </div>

      {/* Before/after comparison labels */}
      {showAfter && (
        <div
          className="mt-4 flex items-center justify-center gap-3 rounded-xl px-4 py-2.5 animate-fade-up"
          style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.10)' }}
        >
          <span className="text-sm font-black text-red-400 line-through decoration-red-300/60">
            {before}%
          </span>
          <span className="text-slate-300">→</span>
          <span className="text-sm font-black text-emerald-600">
            {after}%
          </span>
          <span className="text-[12px] font-semibold text-emerald-700">
            risk score
          </span>
        </div>
      )}
    </div>
  );
}
