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
      className="w-full bg-gradient-to-r from-[#1E1B4B] via-[#272366] to-[#312E81] rounded-2xl px-8 py-6 flex items-center justify-between shadow-lg shadow-indigo-900/10 my-8 text-white relative overflow-hidden cursor-pointer group"
      onClick={() => router.push('/dashboard/analytics')}
    >
      {/* Animated glow blobs */}
      <div className="absolute -top-8 left-1/4 w-72 h-40 bg-indigo-500/15 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/25 transition-all duration-700" />
      <div className="absolute -bottom-6 right-1/3 w-48 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />

      {/* Left: Icon + Title */}
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
          <Sparkles className="text-indigo-300" size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-base leading-tight">Onyx AI Impact</p>
            <ArrowUpRight size={14} className="text-indigo-300 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300" />
          </div>
          <p className="text-xs text-indigo-200/60 mt-0.5">Value generated this month through automated risk resolution.</p>
        </div>
      </div>

      {/* Right: 3 Metrics — animated */}
      <div className="flex items-center gap-8 relative z-10">
        <div className="text-right">
          <p className="text-2xl font-extrabold text-emerald-400 tracking-tight leading-none tabular-nums">
            ₹{costSaved.toFixed(1)}<span className="text-base font-bold ml-0.5">L</span>
          </p>
          <p className="text-[10px] font-bold tracking-widest text-slate-400/80 mt-1 uppercase">Cost Saved</p>
        </div>

        <div className="w-px h-10 bg-white/10" />

        <div className="text-right">
          <p className="text-2xl font-extrabold text-indigo-300 tracking-tight leading-none tabular-nums">
            {riskReduced}<span className="text-base font-bold ml-0.5">%</span>
          </p>
          <p className="text-[10px] font-bold tracking-widest text-slate-400/80 mt-1 uppercase">Risk Reduced</p>
        </div>

        <div className="w-px h-10 bg-white/10" />

        <div className="text-right">
          <p className="text-2xl font-extrabold text-amber-400 tracking-tight leading-none tabular-nums">
            {timeSaved}<span className="text-base font-bold ml-0.5">hrs</span>
          </p>
          <p className="text-[10px] font-bold tracking-widest text-slate-400/80 mt-1 uppercase">Time Saved</p>
        </div>
      </div>
    </div>
  );
}
