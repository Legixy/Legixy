'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Clock,
  FileText,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Zap,
} from 'lucide-react';

// ── Animated Counter Hook ──────────────────────────────────────────────────
function useCounter(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (end === 0) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, suffix, trend, trendLabel, icon: Icon, color, gradient,
}: {
  label: string; value: number; suffix?: string; trend?: 'up' | 'down';
  trendLabel?: string; icon: React.ElementType; color: string; gradient: string;
}) {
  const animatedValue = useCounter(value);
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} rounded-full blur-[40px] opacity-30 group-hover:opacity-50 transition-opacity`} />
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
          <Icon size={20} className="text-white" />
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{animatedValue}</span>
          {suffix && <span className="text-lg font-bold text-slate-400">{suffix}</span>}
        </div>
        {trendLabel && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Risk Gauge Bar ─────────────────────────────────────────────────────────
function RiskGauge({ label, value, color }: { label: string; value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => { setTimeout(() => setWidth(value), 200); }, [value]);
  return (
    <div className="flex items-center gap-4">
      <span className="text-xs font-medium text-slate-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right">{value}%</span>
    </div>
  );
}

// ── AI Activity Item ───────────────────────────────────────────────────────
function ActivityItem({ title, time, type }: { title: string; time: string; type: 'analysis' | 'fix' | 'alert' }) {
  const icons = { analysis: Sparkles, fix: Zap, alert: AlertTriangle };
  const colors = { analysis: 'text-indigo-500 bg-indigo-50', fix: 'text-emerald-500 bg-emerald-50', alert: 'text-amber-500 bg-amber-50' };
  const Icon = icons[type];
  const colorClass = colors[type];
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className={`w-7 h-7 rounded-lg ${colorClass} flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon size={13} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 font-medium leading-tight">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

// ── Main Analytics Page ────────────────────────────────────────────────────
export default function AnalyticsPage() {
  return (
    <div className="w-full flex flex-col pt-4 pb-12 animate-in fade-in duration-500">

      {/* ── Page Header ──────────────────────────── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-4">
          <BarChart3 size={13} />
          AI Analytics Dashboard
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Legal Operations Intelligence</h1>
        <p className="text-slate-500 mt-1 text-sm">Real-time insights powered by Onyx AI across your contract portfolio.</p>
      </div>

      {/* ── Stat Cards Grid ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Cost Saved"
          value={120}
          suffix="K"
          trend="up"
          trendLabel="+₹18K this week"
          icon={TrendingUp}
          color="bg-emerald-500"
          gradient="bg-emerald-400"
        />
        <StatCard
          label="Risk Reduced"
          value={42}
          suffix="%"
          trend="up"
          trendLabel="+8% vs last month"
          icon={Shield}
          color="bg-indigo-500"
          gradient="bg-indigo-400"
        />
        <StatCard
          label="Hours Saved"
          value={18}
          suffix="hrs"
          trend="up"
          trendLabel="3.2 hrs this week"
          icon={Clock}
          color="bg-amber-500"
          gradient="bg-amber-400"
        />
        <StatCard
          label="Contracts Active"
          value={24}
          trend="up"
          trendLabel="6 new this month"
          icon={FileText}
          color="bg-violet-500"
          gradient="bg-violet-400"
        />
      </div>

      {/* ── Charts Row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">

        {/* Risk Distribution */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-800">Risk Distribution by Clause Type</h2>
            <span className="text-xs text-slate-400 font-medium">Last 30 days</span>
          </div>
          <div className="space-y-4">
            <RiskGauge label="Payment Terms" value={78} color="bg-red-400" />
            <RiskGauge label="IP Ownership" value={45} color="bg-amber-400" />
            <RiskGauge label="Liability Cap" value={62} color="bg-red-400" />
            <RiskGauge label="Non-Compete" value={30} color="bg-emerald-400" />
            <RiskGauge label="Confidentiality" value={15} color="bg-emerald-400" />
            <RiskGauge label="Termination" value={52} color="bg-amber-400" />
            <RiskGauge label="Governing Law" value={8} color="bg-emerald-400" />
          </div>
        </div>

        {/* AI Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800">AI Activity Feed</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="flex flex-col">
            <ActivityItem title="Payment terms risk detected in Globex MSA" time="2 minutes ago" type="alert" />
            <ActivityItem title="Auto-fixed indemnity clause in Acme SLA" time="15 minutes ago" type="fix" />
            <ActivityItem title="Full risk analysis completed for WeWork Lease" time="1 hour ago" type="analysis" />
            <ActivityItem title="Non-compete clause flagged under Section 27" time="3 hours ago" type="alert" />
            <ActivityItem title="NDA template optimized for mutual protection" time="5 hours ago" type="fix" />
            <ActivityItem title="Quarterly compliance check completed" time="Yesterday" type="analysis" />
          </div>
        </div>
      </div>

      {/* ── AI Performance Summary ────────────────── */}
      <div className="bg-gradient-to-r from-[#1E1B4B] to-[#312E81] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute -top-10 right-1/4 w-80 h-48 bg-indigo-500/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-60 h-40 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Sparkles size={20} className="text-indigo-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Onyx AI Monthly Summary</h3>
              <p className="text-indigo-200/60 text-xs">Performance metrics for April 2026</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: 'Contracts Analyzed', value: '47', sub: 'Last 30 days' },
              { label: 'Clauses Reviewed', value: '312', sub: '92% auto-resolved' },
              { label: 'Avg. Processing Time', value: '2.4s', sub: 'Per clause' },
              { label: 'Accuracy Rate', value: '96.8%', sub: 'Verified by legal' },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-2xl font-extrabold mb-1">{m.value}</p>
                <p className="text-xs font-semibold text-indigo-200/80 uppercase tracking-wider">{m.label}</p>
                <p className="text-[10px] text-indigo-300/50 mt-0.5">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex items-center justify-center relative z-10">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-semibold transition-colors">
            <ArrowUpRight size={15} />
            Export Full Report
          </button>
        </div>
      </div>
    </div>
  );
}
