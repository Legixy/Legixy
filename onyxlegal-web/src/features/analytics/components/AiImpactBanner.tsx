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
      className="w-full rounded-2xl px-8 py-7 flex items-center justify-between my-8 text-white relative overflow-hidden cursor-pointer group"
      onClick={() => router.push('/dashboard/analytics')}
      style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #3730A3 70%, #4338CA 100%)',
        backgroundSize: '200% 200%',
        boxShadow: '0 8px 32px rgba(30, 27, 75, 0.25), 0 2px 8px rgba(30, 27, 75, 0.15)',
        transition: 'all 0.5s var(--onyx-ease)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(30, 27, 75, 0.35), 0 4px 12px rgba(30, 27, 75, 0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(30, 27, 75, 0.25), 0 2px 8px rgba(30, 27, 75, 0.15)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Animated glow blobs */}
      <div className="absolute -top-10 left-1/4 w-80 h-48 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-700" />
      <div className="absolute -bottom-8 right-1/4 w-56 h-36 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute top-1/2 right-[10%] w-32 h-32 bg-cyan-400/8 rounded-full blur-[50px] pointer-events-none animate-float" />

      {/* Left: Icon + Title */}
      <div className="flex items-center gap-4 relative z-10">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
        >
          <Sparkles className="text-indigo-300" size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display font-bold text-[17px] leading-tight">Onyx AI Impact</p>
            <ArrowUpRight size={14} className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
          <p className="text-[13px] text-indigo-200/50 mt-0.5">Value generated this month through automated risk resolution.</p>
        </div>
      </div>

      {/* Right: 3 Metrics — animated */}
      <div className="flex items-center gap-10 relative z-10">
        <div className="text-right">
          <p className="text-[28px] font-extrabold text-emerald-400 tracking-tight leading-none tabular-nums">
            ₹{costSaved.toFixed(1)}<span className="text-base font-bold ml-0.5 text-emerald-400/80">L</span>
          </p>
          <p className="text-[10px] font-bold tracking-widest text-indigo-300/50 mt-1.5 uppercase">Cost Saved</p>
        </div>

        <div className="w-px h-12 bg-white/10 rounded-full" />

        <div className="text-right">
          <p className="text-[28px] font-extrabold text-indigo-300 tracking-tight leading-none tabular-nums">
            {riskReduced}<span className="text-base font-bold ml-0.5 text-indigo-300/80">%</span>
          </p>
          <p className="text-[10px] font-bold tracking-widest text-indigo-300/50 mt-1.5 uppercase">Risk Reduced</p>
        </div>

        <div className="w-px h-12 bg-white/10 rounded-full" />

        <div className="text-right">
          <p className="text-[28px] font-extrabold text-amber-400 tracking-tight leading-none tabular-nums">
            {timeSaved}<span className="text-base font-bold ml-0.5 text-amber-400/80">hrs</span>
          </p>
          <p className="text-[10px] font-bold tracking-widest text-indigo-300/50 mt-1.5 uppercase">Time Saved</p>
        </div>
      </div>
    </div>
  );
}
