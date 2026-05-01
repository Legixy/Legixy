'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

function useAnimatedCount(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export function AiImpactBanner() {
  const costSaved = useAnimatedCount(1.2, 1200);
  const riskReduced = useAnimatedCount(42, 1400);
  const timeSaved = useAnimatedCount(18, 1000);
  const router = useRouter();

  return (
    <div
      className="w-full rounded-xl px-8 py-7 flex items-center justify-between my-8 text-white cursor-pointer group"
      onClick={() => router.push('/dashboard/analytics')}
      style={{
        background: '#0F172A',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'var(--shadow-md)',
        transition: 'box-shadow 250ms var(--ease-out), transform 250ms var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Left: Icon + Title */}
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <Sparkles className="text-slate-300" size={18} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display font-semibold text-[16px] leading-tight text-white">Onyx AI Impact</p>
            <ArrowUpRight size={13} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          <p className="text-[13px] text-slate-400 mt-0.5">Value generated this month through automated risk resolution.</p>
        </div>
      </div>

      {/* Right: 3 Metrics */}
      <div className="flex items-center gap-10">
        <div className="text-right">
          <p className="text-[26px] font-semibold text-emerald-400 tracking-tight leading-none tabular-nums">
            ₹{costSaved.toFixed(1)}<span className="text-sm font-semibold ml-0.5 text-emerald-400/70">L</span>
          </p>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 mt-1.5 uppercase">Cost Saved</p>
        </div>

        <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="text-right">
          <p className="text-[26px] font-semibold text-slate-200 tracking-tight leading-none tabular-nums">
            {riskReduced}<span className="text-sm font-semibold ml-0.5 text-slate-400">%</span>
          </p>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 mt-1.5 uppercase">Risk Reduced</p>
        </div>

        <div className="w-px h-10" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="text-right">
          <p className="text-[26px] font-semibold text-amber-400 tracking-tight leading-none tabular-nums">
            {timeSaved}<span className="text-sm font-semibold ml-0.5 text-amber-400/70">hrs</span>
          </p>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-slate-500 mt-1.5 uppercase">Time Saved</p>
        </div>
      </div>
    </div>
  );
}
