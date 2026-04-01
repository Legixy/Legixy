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
    <div className="w-full flex flex-col pt-4 pb-12 animate-in fade-in duration-500">

      {/* ── Welcome Header ─────────────────────────────────── */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Onyx AI has analyzed your legal operations and prioritized your next steps.
          </p>
        </div>
        {/* Navigates to Templates page to start a new contract */}
        <Button
          onClick={() => router.push('/dashboard/templates')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2 h-10 shrink-0"
        >
          <Sparkles size={16} className="text-indigo-200" />
          Start Smart Contract Setup
        </Button>
      </div>

      {/* ── AI Priority Actions ─────────────────────────────── */}
      <div className="mb-1">
        <p className="text-xs font-bold tracking-[0.15em] text-indigo-600 uppercase flex items-center gap-1.5 mb-4">
          <Sparkles size={13} />
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
