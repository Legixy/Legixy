'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { useDashboardMetrics, useContractStats } from '@/shared/api';
import { Sparkles, FileSignature, AlertTriangle, Shield, TrendingDown, Clock, Zap, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiCommandCenter } from '@/features/ai/components/AiCommandCenter';
import { AiActivityFeed } from '@/features/ai/components/AiActivityFeed';
import { AiRecommendedActions } from '@/features/ai/components/AiRecommendedActions';
import { AiAlerts } from '@/features/ai/components/AiAlerts';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: stats } = useContractStats();

  const firstName = user?.name?.split(' ')[0] || 'there';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="font-display text-3xl text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-[15px] leading-relaxed">
            {metricsLoading ? 'Loading insights…' : 'OnyxAI has analyzed your legal operations and prioritized your next steps.'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/contracts/create')}
          className="gap-2 h-10 shrink-0 text-sm font-medium px-5"
          style={{
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Plus size={15} />
          New Contract
        </Button>
      </div>

      {/* ── AI COMMAND CENTER ────────────────────────────────── */}
      <div className="mb-8">
        <AiCommandCenter />
      </div>

      {/* ── AI ALERTS ────────────────────────────────────────── */}
      <div className="mb-8">
        <AiAlerts />
      </div>

      {/* ── AI RECOMMENDED ACTIONS ───────────────────────────── */}
      <div className="mb-8">
        <AiRecommendedActions />
      </div>

      {/* ── AI Impact Metrics ─────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          <Sparkles size={11} />
          AI Impact Overview
        </p>
      </div>

      {metricsLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
          Loading metrics…
        </div>
      ) : metricsError ? (
        <div className="flex items-center gap-2 py-6 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
          Could not load metrics — backend may be starting up.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Cost Saved', value: metrics?.costSavedFormatted || '₹0', sub: 'through AI automation', icon: TrendingDown, color: 'var(--success)' },
            { label: 'Risk Reduced', value: `${metrics?.riskReduced || 0}%`, sub: 'identified & mitigated', icon: AlertTriangle, color: 'var(--danger)' },
            { label: 'Time Saved', value: `${metrics?.timeSavedHours || 0}h`, sub: 'legal review hours', icon: Clock, color: 'var(--muted-foreground)' },
            { label: 'AI Usage', value: `${metrics?.aiUsage ? Math.round((metrics.aiUsage.tokensUsed / metrics.aiUsage.tokenLimit) * 100) : 0}%`, sub: 'of monthly tokens', icon: Zap, color: 'var(--primary)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card-hover bg-white border p-5"
              style={{ borderColor: 'var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-semibold" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Contracts Overview ────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] uppercase flex items-center gap-1.5" style={{ color: 'var(--muted-foreground)' }}>
          <FileSignature size={11} />
          Contracts Overview
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Contracts', value: metrics?.totalContracts || 0, icon: FileSignature, color: 'var(--muted-foreground)' },
          { label: 'Active', value: metrics?.activeContracts || 0, icon: Shield, color: 'var(--success)' },
          { label: 'High Risk', value: metrics?.highRiskClauses || 0, icon: AlertTriangle, color: 'var(--danger)' },
          { label: 'Resolved', value: metrics?.resolvedClauses || 0, icon: Sparkles, color: 'var(--teal)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border px-4 py-4 flex items-center gap-3"
            style={{ borderColor: 'var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-xs)' }}
          >
            <stat.icon size={16} style={{ color: stat.color, flexShrink: 0 }} />
            <div>
              <p className="text-xl font-semibold leading-none" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{stat.value}</p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: 'var(--muted-foreground)' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5 mb-10">
        <div
          className="card-hover bg-white border p-7 cursor-pointer"
          style={{ borderColor: 'var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}
          onClick={() => router.push('/dashboard/contracts/create')}
        >
          <Plus size={18} className="mb-4" style={{ color: 'var(--primary)' }} />
          <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Create New Contract</h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Start a fresh contract or upload an existing one</p>
        </div>

        <div
          className="card-hover bg-white border p-7 cursor-pointer"
          style={{ borderColor: 'var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}
          onClick={() => router.push('/dashboard/analytics')}
        >
          <TrendingDown size={18} className="mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--foreground)' }}>View Analytics</h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Deep dive into contracts, risks, and AI impact</p>
        </div>
      </div>

      {/* ── Analyses This Month ───────────────────────────────── */}
      <div
        className="bg-white border px-6 py-5 flex items-center justify-between mb-10"
        style={{ borderColor: 'var(--border)', borderRadius: '12px', borderLeft: '3px solid var(--primary)', boxShadow: 'var(--shadow-xs)' }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>Analyses This Month</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            You&apos;re using OnyxAI effectively. Keep analyzing to maximize risk mitigation.
          </p>
        </div>
        <span className="text-3xl font-semibold" style={{ color: 'var(--primary)', letterSpacing: '-0.03em' }}>
          {metrics?.analysesThisMonth || 0}
        </span>
      </div>

      {/* ── AI ACTIVITY FEED ──────────────────────────────────── */}
      <AiActivityFeed />

    </div>
  );
}
