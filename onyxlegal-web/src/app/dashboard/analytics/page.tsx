'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { useDashboardMetrics } from '@/shared/api/analytics';
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
import { RiskInsightsPanel } from '@/features/analytics/components/RiskInsightsPanel';

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

// ── Stat Card — flat icon, no gradient blobs, no colored glow ─────────────
function StatCard({
  label, value, suffix, trend, trendLabel, icon: Icon, iconColor,
}: {
  label: string; value: number; suffix?: string; trend?: 'up' | 'down';
  trendLabel?: string; icon: React.ElementType; iconColor: string;
}) {
  const animatedValue = useCounter(value);
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-red-500';

  return (
    <div
      className="bg-white rounded-xl p-5"
      style={{
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 250ms var(--ease-out), transform 250ms var(--ease-out)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-4 ${iconColor}`}>
        <Icon size={16} />
      </div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-2xl text-slate-900 tracking-tight">{animatedValue}</span>
        {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
      </div>
      {trendLabel && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trendColor}`}>
          <TrendIcon size={12} />
          {trendLabel}
        </div>
      )}
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
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%`, transition: 'width 1.2s var(--ease-out)' }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-8 text-right">{value}%</span>
    </div>
  );
}

// ── AI Activity Item ───────────────────────────────────────────────────────
function ActivityItem({ title, time, type }: { title: string; time: string; type: 'analysis' | 'fix' | 'alert' }) {
  const icons = { analysis: Sparkles, fix: Zap, alert: AlertTriangle };
  const colors = {
    analysis: 'text-indigo-500 bg-indigo-50',
    fix: 'text-emerald-500 bg-emerald-50',
    alert: 'text-amber-500 bg-amber-50',
  };
  const Icon = icons[type];
  const colorClass = colors[type];
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
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
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();

  const monthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleExportReport = () => {
    const rows = [
      ['Legixy Analytics Report', monthLabel],
      [''],
      ['Metric', 'Value', 'Notes'],
      ['Contracts Analyzed', '47', 'Last 30 days'],
      ['Clauses Reviewed', '312', '92% auto-resolved'],
      ['Avg. Processing Time', '2.4s', 'Per clause'],
      ['Accuracy Rate', '96.8%', 'Verified by legal'],
      [''],
      ['Risk Distribution by Clause Type', '', ''],
      ['Payment Terms', '78%', 'High risk'],
      ['Liability Cap', '62%', 'High risk'],
      ['IP Ownership', '45%', 'Medium risk'],
      ['Termination', '52%', 'Medium risk'],
      ['Non-Compete', '30%', 'Low risk'],
      ['Confidentiality', '15%', 'Low risk'],
      ['Governing Law', '8%', 'Low risk'],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legixy-analytics-${monthLabel.replace(' ', '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Zap className="w-6 h-6 animate-pulse" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pt-4 pb-12 animate-fade-up">

      {/* ── Page Header ──────────────────────────── */}
      <div className="mb-10">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-indigo-700 text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: 'var(--onyx-gradient-subtle)', border: '1px solid rgba(61,53,211,0.10)' }}
        >
          <BarChart3 size={13} />
          AI Analytics Dashboard
        </div>
        <h1 className="font-display text-3xl text-slate-900 tracking-tight">Legal Operations Intelligence</h1>
        <p className="text-slate-500 mt-1 text-[15px]">Real-time insights powered by Onyx AI across your contract portfolio.</p>
      </div>

      {/* ── Stat Cards Grid ──────────────────────── */}
      {metricsError && (
        <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
          <AlertTriangle size={14} className="text-amber-500 shrink-0" />
          Metrics unavailable — backend may be starting up. Showing last known values.
        </div>
      )}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 ${metricsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <StatCard
          label="Cost Saved"
          value={metrics?.costSaved ?? 0}
          suffix="K"
          trend="up"
          trendLabel="+₹18K this week"
          icon={TrendingUp}
          iconColor="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          label="Risk Reduced"
          value={metrics?.riskReduced ?? 0}
          suffix="%"
          trend="up"
          trendLabel="+8% vs last month"
          icon={Shield}
          iconColor="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          label="Hours Saved"
          value={metrics?.timeSavedHours ?? 0}
          suffix="hrs"
          trend="up"
          trendLabel="3.2 hrs this week"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50"
        />
        <StatCard
          label="Contracts Active"
          value={metrics?.activeContracts ?? 0}
          trend="up"
          trendLabel="6 new this month"
          icon={FileText}
          iconColor="text-slate-600 bg-slate-100"
        />
      </div>

      {/* ── Charts Row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">

        {/* Risk Distribution */}
        <div
          className="lg:col-span-3 bg-white rounded-xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[13px] font-semibold text-slate-800 tracking-tight">Risk Distribution by Clause Type</h2>
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
        <div
          className="lg:col-span-2 bg-white rounded-xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[13px] font-semibold text-slate-800 tracking-tight">AI Activity Feed</h2>
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

      {/* ── AI Performance Summary — clean dark card, no gradient, no blobs ── */}
      <div
        className="rounded-xl p-8"
        style={{
          background: '#0F172A',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <Sparkles size={16} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display text-lg text-white tracking-tight">Onyx AI Monthly Summary</h3>
              <p className="text-slate-500 text-xs mt-0.5">Performance metrics for {monthLabel}</p>
            </div>
          </div>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 transition-colors duration-150"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgb(203,213,225)'; }}
          >
            <ArrowUpRight size={13} />
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
          {[
            { label: 'Contracts Analyzed', value: '47', sub: 'Last 30 days' },
            { label: 'Clauses Reviewed', value: '312', sub: '92% auto-resolved' },
            { label: 'Avg. Processing Time', value: '2.4s', sub: 'Per clause' },
            { label: 'Accuracy Rate', value: '96.8%', sub: 'Verified by legal' },
          ].map((m) => (
            <div key={m.label}>
              <p className="font-display text-2xl text-white tracking-tight mb-1">{m.value}</p>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RISK INSIGHTS PANEL ──────────────────── */}
      <div className="mt-10">
        <RiskInsightsPanel />
      </div>
    </div>
  );
}
