'use client';

import { useState, useMemo, useEffect } from 'react';
import { ContractRiskCard } from '@/features/contracts/components/ContractRiskCard';
import { Plus, Search, FileSignature, AlertTriangle, Shield, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { useContracts, useContractStats } from '@/shared/api';
import { SmartEmptyState } from '@/shared/components/SmartEmptyState';

const statusFilters = ['All', 'Draft', 'In Review', 'Sent', 'Signed', 'Active', 'Expired'] as const;

const statConfig = [
  { key: 'totalContracts',  label: 'Total',    icon: FileSignature, color: 'var(--muted-foreground)' },
  { key: 'highRiskClauses', label: 'High Risk', icon: AlertTriangle, color: 'var(--danger)'          },
  { key: 'activeContracts', label: 'Active',    icon: Shield,        color: 'var(--success)'         },
  { key: 'draftContracts',  label: 'Drafts',    icon: Clock,         color: 'var(--muted-foreground)' },
] as const;

export default function ContractsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const { data: contractsResponse, isLoading, error } = useContracts({
    status: activeFilter === 'All' ? undefined : activeFilter.toUpperCase().replace(/\s+/g, '_'),
    search: searchQuery || undefined,
    page: 1,
    limit: 50,
  });

  const { data: stats } = useContractStats();
  const contracts = contractsResponse?.data || [];

  const filtered = useMemo(() => {
    if (!searchQuery) return contracts;
    return contracts.filter((c) =>
      (c.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contracts, searchQuery]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col pt-2 pb-12 animate-fade-up">

      {/* ── Page Header ──────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-[26px] tracking-tight" style={{ color: 'var(--foreground)' }}>
            Contracts
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Manage and monitor all your legal agreements in one place.
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/contracts/create')}
          className="flex items-center gap-2 h-10 px-5 text-[14px] font-medium text-white transition-all duration-150"
          style={{
            background: 'var(--primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Plus size={15} />
          New Contract
        </button>
      </div>

      {/* ── Stats Row ────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statConfig.map((s) => (
          <div
            key={s.label}
            className="card-hover bg-white flex items-center gap-3 px-4 py-4"
            style={{ border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-xs)' }}
          >
            <s.icon size={16} style={{ color: s.color, flexShrink: 0 }} />
            <div>
              <p
                className="text-xl font-semibold leading-none"
                style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}
              >
                {stats?.[s.key] ?? 0}
              </p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ─────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        {/* Status pill filters */}
        <div
          className="flex items-center gap-1 p-1 overflow-x-auto"
          style={{ background: 'var(--secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}
        >
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-all duration-150"
              style={{
                borderRadius: '7px',
                background: activeFilter === f ? 'var(--card)' : 'transparent',
                color: activeFilter === f ? 'var(--primary)' : 'var(--muted-foreground)',
                boxShadow: activeFilter === f ? 'var(--shadow-xs)' : 'none',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative ml-auto">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            size={14}
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search contracts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 pr-4 text-[13px] w-56 transition-all duration-150"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--foreground)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,53,211,0.10)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────── */}
      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 mb-6 text-[13px]"
          style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '8px', color: 'var(--danger)' }}
        >
          <AlertCircle size={14} className="shrink-0" />
          Failed to load contracts — {(error as Error).message || 'backend unavailable'}. Please refresh.
        </div>
      )}

      {/* ── Loading State ────────────────────────── */}
      {isLoading && (
        <div className="flex items-center gap-3 py-16 justify-center text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
          Loading contracts…
        </div>
      )}

      {/* ── Empty State ──────────────────────────── */}
      {!isLoading && !error && filtered.length === 0 && (
        <SmartEmptyState
          type="contracts"
          onPrimaryAction={() => router.push('/dashboard/contracts/create')}
          onSecondaryAction={() => router.push('/dashboard/contracts/create')}
        />
      )}

      {/* ── Contract Cards ───────────────────────── */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((contract) => (
            <div
              key={contract.id}
              className="cursor-pointer transition-all duration-200 hover:scale-[1.005]"
              onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
            >
              <ContractRiskCard
                title={contract.title}
                type={contract.template?.category || 'Document'}
                status={contract.status}
                date={new Date(contract.createdAt).toLocaleDateString()}
                riskLevel={
                  contract.riskScore != null
                    ? contract.riskScore > 70
                      ? 'high_risk'
                      : contract.riskScore > 40
                        ? 'needs_action'
                        : 'verified_safe'
                    : 'not_analyzed'
                }
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
