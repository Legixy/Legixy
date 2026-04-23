'use client';

import { useEffect, useState, useRef } from 'react';

interface Props {
  /** Risk score before fixes (0–100) */
  before: number;
  /** Risk score after fixes (0–100) */
  after: number;
  /** Whether fixes have been applied */
  showAfter: boolean;
  /** Label override */
  label?: string;
}

function getBarColor(score: number): string {
  if (score <= 30) return '#10B981';
  if (score <= 60) return '#F59E0B';
  return '#EF4444';
}

export function ProgressBar({ before, after, showAfter, label }: Props) {
  const [animatedBefore, setAnimatedBefore] = useState(before);
  const [animatedAfter, setAnimatedAfter] = useState(after);
  const hasAnimatedBefore = useRef(false);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      if (!hasAnimatedBefore.current) {
        setAnimatedBefore(Math.round(eased * before));
      } else {
        setAnimatedBefore(before);
      }

      if (showAfter) {
        setAnimatedAfter(Math.round(eased * after));
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        hasAnimatedBefore.current = true;
      }
    };
    requestAnimationFrame(animate);
  }, [before, after, showAfter]);

  const beforeColor = getBarColor(before);
  const afterColor = getBarColor(after);

  return (
    <div
      className="rounded-2xl px-6 py-5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--onyx-shadow-sm)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wider">
          📊 {label || 'Risk Progress'}
        </h3>
        {showAfter && (
          <span className="text-xs font-semibold text-emerald-600 px-2 py-0.5 rounded-md bg-emerald-50">
            {before - after}% improved
          </span>
        )}
      </div>

      {/* Before bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {showAfter ? 'Before' : 'Current Risk'}
          </span>
          <span className="text-[13px] font-bold tabular-nums" style={{ color: beforeColor }}>
            {animatedBefore}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${animatedBefore}%`,
              background: `linear-gradient(90deg, ${beforeColor}, ${beforeColor}CC)`,
              boxShadow: showAfter ? 'none' : `0 0 12px ${beforeColor}30`,
            }}
          />
        </div>
      </div>

      {/* After bar */}
      {showAfter && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              After Fixes
            </span>
            <span className="text-[13px] font-bold tabular-nums" style={{ color: afterColor }}>
              {animatedAfter}
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${animatedAfter}%`,
                background: `linear-gradient(90deg, ${afterColor}, ${afterColor}CC)`,
                boxShadow: `0 0 12px ${afterColor}30`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
