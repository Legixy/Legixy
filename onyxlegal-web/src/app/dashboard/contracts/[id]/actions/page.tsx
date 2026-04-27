'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { useContractById } from '@/shared/api';
import { ContractActionPanel } from '@/features/contracts/components/ContractActionPanel';

export default function ContractActionsPage() {
  const router     = useRouter();
  const { id }     = useParams() as { id: string };
  const { data: contract, isLoading } = useContractById(id);

  return (
    /*
     * Full-bleed page — matches the dashboard background.
     * max-w-2xl keeps the decision screen focused and readable.
     */
    <div className="w-full max-w-2xl mx-auto pb-16 animate-fade-up">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--onyx-shadow-sm)',
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={17} className="text-slate-500" />
        </button>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--onyx-gradient)' }}
            >
              <Shield size={12} className="text-white" />
            </div>
            <h1 className="font-display text-[18px] font-black text-slate-900 tracking-tight">
              Review &amp; Fix Risks
            </h1>
          </div>

          {isLoading ? (
            <div className="h-3.5 w-44 bg-slate-200 rounded-md animate-pulse mt-1" />
          ) : (
            <p className="text-[13px] font-medium text-slate-400 truncate max-w-sm">
              {contract?.title ?? 'Contract'}
            </p>
          )}
        </div>

        {/* Risk score pill — quick at-a-glance */}
        {!isLoading && contract?.riskScore != null && (
          <div
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black"
            style={{
              background: contract.riskScore > 60
                ? 'rgba(239,68,68,0.08)'
                : contract.riskScore > 30
                ? 'rgba(245,158,11,0.08)'
                : 'rgba(16,185,129,0.08)',
              color: contract.riskScore > 60
                ? '#B91C1C'
                : contract.riskScore > 30
                ? '#92400E'
                : '#065F46',
            }}
          >
            Risk: {contract.riskScore}/100
          </div>
        )}
      </div>

      {/* ── Decision Panel ────────────────────────────────────────────────── */}
      <ContractActionPanel contractId={id} contractTitle={contract?.title} />
    </div>
  );
}
