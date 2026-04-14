'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useContractById } from '@/shared/api';
import { Loader2, AlertCircle, ArrowLeft, Eye, Download, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const { data: contract, isLoading, error } = useContractById(contractId);

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── Header with Back ──────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          {isLoading ? (
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
          ) : (
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              {contract?.title || 'Contract'}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Eye size={14} />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={14} />
            Export
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 size={14} />
            Share
          </Button>
        </div>
      </div>

      {/* ── Loading State ────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <div className="onyx-shimmer w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--onyx-gradient)' }}>
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-slate-400 ml-3 text-sm font-medium">Loading contract details...</p>
        </div>
      )}

      {/* ── Error State ──────────────────────────– */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="text-red-500" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-900">Failed to load contract</p>
            <p className="text-xs text-red-700 mt-0.5">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      )}

      {/* ── Content Area ──────────────────────────– */}
      {!isLoading && !error && contract && (
        <div className="grid grid-cols-3 gap-6">

          {/* Left: Main Content */}
          <div className="col-span-2 space-y-6">

            {/* Contract Text */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Contract Content</h2>
              <div className="bg-slate-50 rounded-lg p-4 max-h-96 overflow-y-auto border border-slate-200">
                <p className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {contract.content || 'No content available'}
                </p>
              </div>
            </div>

            {/* Contract Metadata */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Contract Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Status</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1 capitalize">{contract.status.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Created</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{new Date(contract.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Contract Value</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {contract.contractValue ? `${contract.contractValue} ${contract.currency}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase">Template</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{contract.template?.name || 'Custom'}</p>
                </div>
              </div>
            </div>

            {/* Parties */}
            {contract.parties && contract.parties.length > 0 && (
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Parties</h2>
                <div className="space-y-3">
                  {(contract.parties as any[]).map((party, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-sm font-semibold text-slate-900">{party.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Role: {party.role}</p>
                      {party.email && <p className="text-xs text-slate-500">{party.email}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right: Actions & Analysis */}
          <div className="col-span-1 space-y-4">

            {/* AI Analysis Button */}
            <Button
              onClick={() => router.push(`/dashboard/contracts/${contractId}/analyze`)}
              className="w-full text-white gap-2 h-10 rounded-xl text-sm font-semibold"
              style={{
                background: 'var(--onyx-gradient)',
                boxShadow: '0 4px 16px rgba(79, 70, 229, 0.25)',
              }}
            >
              <Sparkles size={16} className="text-indigo-200" />
              Analyze with AI
            </Button>

            {/* Risk Score Card */}
            {contract.riskScore !== null && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase mb-2">Risk Score</p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-bold text-slate-900">{contract.riskScore}</p>
                  <p className="text-xs text-slate-500 mb-1">/100</p>
                </div>
                <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      contract.riskScore > 70 ? 'bg-red-500' : contract.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(contract.riskScore, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Created By */}
            {contract.createdBy && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase mb-2">Created By</p>
                <p className="text-sm font-semibold text-slate-900">{contract.createdBy.name}</p>
                <p className="text-xs text-slate-500 mt-1">{contract.createdBy.email}</p>
              </div>
            )}

            {/* Analyses Count */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium uppercase mb-2">AI Analyses</p>
              <p className="text-2xl font-bold text-slate-900">{contract._count?.analyses || 0}</p>
              <p className="text-xs text-slate-500 mt-1">analyses performed</p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
