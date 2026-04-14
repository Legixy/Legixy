'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { useDashboardMetrics, useContractStats } from '@/shared/api';
import { Sparkles, FileSignature, AlertTriangle, Shield, TrendingDown, Clock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiCommandCenter } from '@/features/ai/components/AiCommandCenter';
import { AiActivityFeed } from '@/features/ai/components/AiActivityFeed';
import { AiRecommendedActions } from '@/features/ai/components/AiRecommendedActions';
import { AiAlerts } from '@/features/ai/components/AiAlerts';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: stats } = useContractStats();

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── AI COMMAND CENTER (Top Priority) ─────────────── */}
      <div className="mb-8">
        <AiCommandCenter />
      </div>

      {/* ── AI ALERTS ────────────────────────────────────── */}
      <div className="mb-8">
        <AiAlerts />
      </div>

      {/* ── AI RECOMMENDED ACTIONS ───────────────────────── */}
      <div className="mb-8">
        <AiRecommendedActions />
      </div>

      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
            {metricsLoading ? 'Loading insights...' : 'OnyxAI has analyzed your legal operations and prioritized your next steps.'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/contracts/create')}
          className="text-white gap-2 h-10 shrink-0 rounded-xl text-sm font-semibold px-5"
          style={{
            background: 'var(--onyx-gradient)',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.25), 0 1px 3px rgba(79, 70, 229, 0.1)',
            transition: 'all 0.3s var(--onyx-ease)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(79, 70, 229, 0.35), 0 2px 6px rgba(79, 70, 229, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(79, 70, 229, 0.25), 0 1px 3px rgba(79, 70, 229, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px) scale(1)';
          }}
        >
          <Sparkles size={15} className="text-indigo-200" />
          New Contract
        </Button>
      </div>

      {/* ── AI Impact Metrics ─────────────────────────────── */}
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-600/80 uppercase flex items-center gap-1.5 mb-5">
          <Sparkles size={12} />
          AI Impact Overview
        </p>
      </div>
      
      {metricsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <p className="text-slate-500 ml-2 text-sm">Loading metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {/* Cost Saved */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-600 uppercase">Cost Saved</p>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingDown size={18} className="text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {metrics?.costSavedFormatted || '₹0'}
            </p>
            <p className="text-xs text-slate-500 mt-2">through AI automation</p>
          </div>

          {/* Risk Reduced */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-600 uppercase">Risk Reduced</p>
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {metrics?.riskReduced || 0}%
            </p>
            <p className="text-xs text-slate-500 mt-2">identified and mitigated</p>
          </div>

          {/* Time Saved */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-600 uppercase">Time Saved</p>
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock size={18} className="text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {metrics?.timeSavedHours || 0}h
            </p>
            <p className="text-xs text-slate-500 mt-2">legal review hours saved</p>
          </div>

          {/* AI Usage */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-600 uppercase">AI Usage</p>
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Zap size={18} className="text-indigo-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {metrics?.aiUsage ? Math.round((metrics.aiUsage.tokensUsed / metrics.aiUsage.tokenLimit) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-500 mt-2">of monthly tokens used</p>
          </div>
        </div>
      )}

      {/* ── Contracts Overview ─────────────────────────────– */}
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-600/80 uppercase flex items-center gap-1.5 mb-5">
          <FileSignature size={12} />
          Contracts Overview
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Contracts', value: metrics?.totalContracts || 0, icon: FileSignature, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active', value: metrics?.activeContracts || 0, icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'High Risk', value: metrics?.highRiskClauses || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Resolved', value: metrics?.resolvedClauses || 0, icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">{stat.label}</p>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Create Contract */}
        <div
          className="bg-white rounded-xl p-8 border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => router.push('/dashboard/contracts/create')}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
            <Sparkles size={24} className="text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">Create New Contract</h3>
          <p className="text-sm text-slate-500">Start a fresh contract or upload an existing one</p>
        </div>

        {/* View Analytics */}
        <div
          className="bg-white rounded-xl p-8 border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => router.push('/dashboard/analytics')}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <TrendingDown size={24} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-1">View Analytics</h3>
          <p className="text-sm text-slate-500">Deep dive into contracts, risks, and AI impact</p>
        </div>
      </div>

      {/* ── Analyses This Month ────────────────────────────– */}
      <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-900">Analyses This Month</p>
          <span className="text-2xl font-bold text-indigo-600">{metrics?.analysesThisMonth || 0}</span>
        </div>
        <p className="text-xs text-slate-600">
          You're using OnyxAI effectively. Keep analyzing contracts to maximize risk mitigation.
        </p>
      </div>

      {/* ── AI ACTIVITY FEED ─────────────────────────────── */}
      <div className="mt-8">
        <AiActivityFeed />
      </div>

    </div>
  );
}
