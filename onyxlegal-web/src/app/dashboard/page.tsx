'use client';

import { PriorityAlertCard } from '@/features/contracts/components/PriorityAlertCard';
import { AiImpactBanner } from '@/features/analytics/components/AiImpactBanner';
import { AutoFixPanel } from '@/features/ai-analyzer/components/AutoFixPanel';
import { DocumentFeedPanel } from '@/features/contracts/components/DocumentFeedPanel';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm leading-relaxed">
            Onyx AI has analyzed your legal operations and prioritized your next steps.
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/templates')}
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
          Start Smart Contract Setup
        </Button>
      </div>

      {/* ── AI Priority Actions ─────────────────────────────── */}
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[0.16em] text-indigo-600/80 uppercase flex items-center gap-1.5 mb-5">
          <Sparkles size={12} />
          AI Priority Actions
        </p>
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <PriorityAlertCard
          severity="resolved"
          title="Risk Auto-Resolved"
          subtitle="AI applied standard indemnity clause."
          riskMessage=""
        />
        <PriorityAlertCard
          severity="warning"
          title="Close pending signature"
          subtitle="Priya Singh Offer"
          riskMessage="Signature delayed by 3 days. Risk of losing candidate."
          primaryAction="Send Reminder"
          secondaryAction="Review Details"
        />
        <PriorityAlertCard
          severity="notice"
          title="Review expiring agreement"
          subtitle="AWS Hosting Agreement"
          riskMessage="Auto-renews in 2 days with 15% price hike."
          primaryAction="Renegotiate"
          secondaryAction="Review Details"
        />
      </div>

      {/* ── AI Impact Banner ────────────────────────────────── */}
      <AiImpactBanner />

      {/* ── Bottom Split Row ────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        <AutoFixPanel />
        <DocumentFeedPanel />
      </div>

    </div>
  );
}
