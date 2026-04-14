'use client';

import { useState, useMemo } from 'react';
import { ContractRiskCard } from '@/features/contracts/components/ContractRiskCard';
import { Plus, Filter, Search, FileSignature, AlertTriangle, Shield, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useContracts, useContractStats } from '@/shared/api';

const statusFilters = ['All', 'Draft', 'In Review', 'Sent', 'Signed', 'Active', 'Expired'] as const;

export default function ContractsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Fetch contracts data
  const { data: contractsResponse, isLoading, error } = useContracts({
    status: activeFilter === 'All' ? undefined : activeFilter.toUpperCase(),
    search: searchQuery || undefined,
    page: 1,
    limit: 50,
  });

  // Fetch stats
  const { data: stats } = useContractStats();

  const contracts = contractsResponse?.data || [];

  // Filter and search
  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (searchQuery) {
        return c.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [contracts, searchQuery]);

  return (
    <div className="w-full flex flex-col pt-2 pb-12 animate-fade-up">

      {/* ── Page Header ──────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Contracts</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Manage and monitor all your legal agreements in one place.</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/contracts/create')}
          className="text-white gap-2 h-10 shrink-0 rounded-xl text-sm font-semibold px-5"
          style={{
            background: 'var(--onyx-gradient)',
            boxShadow: '0 4px 16px rgba(79, 70, 229, 0.25)',
            transition: 'all 0.3s var(--onyx-ease)',
          }}
        >
          <Plus size={16} />
          New Contract
        </Button>
      </div>

      {/* ── Stats Row ────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats?.totalContracts ?? 0, icon: FileSignature, color: 'text-indigo-600', bg: 'bg-indigo-50', glow: 'rgba(79, 70, 229, 0.06)' },
          { label: 'High Risk', value: stats?.highRiskClauses ?? 0, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', glow: 'rgba(239, 68, 68, 0.06)' },
          { label: 'Active', value: stats?.activeContracts ?? 0, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50', glow: 'rgba(16, 185, 129, 0.06)' },
          { label: 'Drafts', value: stats?.draftContracts ?? 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', glow: 'rgba(245, 158, 11, 0.06)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl px-4 py-4 flex items-center gap-3"
            style={{
              border: '1px solid var(--border)',
              boxShadow: `var(--onyx-shadow-sm), 0 0 20px ${stat.glow}`,
              transition: 'all 0.3s var(--onyx-ease)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `var(--onyx-shadow-md), 0 0 24px ${stat.glow}`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = `var(--onyx-shadow-sm), 0 0 20px ${stat.glow}`;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon size={17} className={stat.color} />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ─────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-white text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              style={activeFilter === f ? { boxShadow: 'var(--onyx-shadow-sm)' } : undefined}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-8 pr-3 bg-white rounded-xl text-xs outline-none w-56 placeholder:text-slate-400"
            style={{
              border: '1px solid var(--border)',
              transition: 'all 0.3s var(--onyx-ease)',
            }}
            onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.08)'; e.currentTarget.style.borderColor = '#818CF8'; }}
            onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>
      </div>

      {/* ── Loading State ────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="onyx-shimmer w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--onyx-gradient)' }}>
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-slate-400 ml-3 text-sm font-medium">Loading contracts...</p>
        </div>
      )}

      {/* ── Error State ──────────────────────────── */}
      {error && !isLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="text-red-500" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-900">Failed to load contracts</p>
            <p className="text-xs text-red-700 mt-0.5">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      )}

      {/* ── Empty State ──────────────────────────– */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <FileSignature className="text-slate-400" size={24} />
          </div>
          <p className="text-slate-600 font-medium">No contracts found</p>
          <p className="text-slate-400 text-sm mt-1">Create your first contract or adjust filters</p>
          <Button
            onClick={() => router.push('/dashboard/contracts/create')}
            className="mt-4 text-white gap-2 h-9 rounded-lg text-sm font-semibold px-4"
            style={{ background: 'var(--onyx-gradient)' }}
          >
            <Plus size={14} />
            Create Contract
          </Button>
        </div>
      )}

      {/* ── Contract Cards ───────────────────────── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-5">
          {filtered.map((contract) => (
            <div
              key={contract.id}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
            >
              <ContractRiskCard
                title={contract.title}
                type={contract.template?.category || 'Document'}
                status={contract.status}
                date={new Date(contract.createdAt).toLocaleDateString()}
                riskLevel={contract.riskScore ? (contract.riskScore > 70 ? 'high_risk' : contract.riskScore > 40 ? 'needs_action' : 'verified_safe') : 'verified_safe'}
                aiDiagnosis={`Contract value: ${contract.contractValue || 'N/A'} ${contract.currency}`}
                businessImpact={`Created by ${contract.createdBy?.name || 'Unknown'} on ${new Date(contract.createdAt).toLocaleDateString()}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
