'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useContractById } from '@/shared/api';
import { ContractActionPanel } from '@/features/contracts/components/ContractActionPanel';

export default function ContractActionsPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const { data: contract, isLoading } = useContractById(contractId);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col animate-fade-up">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900 tracking-tight">
            Review & Fix Risks
          </h1>
          {isLoading ? (
            <div className="h-4 w-40 bg-slate-200 rounded mt-1 animate-pulse" />
          ) : (
            <p className="text-sm text-slate-500 mt-0.5">
              {contract?.title || 'Contract'}
            </p>
          )}
        </div>
      </div>

      {/* ── Action Panel ──────────────────────────── */}
      <ContractActionPanel
        contractId={contractId}
        contractTitle={contract?.title}
      />
    </div>
  );
}
