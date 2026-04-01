'use client';

import { useState } from 'react';
import { ContractRiskCard } from '@/features/contracts/components/ContractRiskCard';
import { Plus, Filter, Search, FileSignature, AlertTriangle, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const statusFilters = ['All', 'Draft', 'In Review', 'Sent', 'Signed', 'Active'] as const;

export default function ContractsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  return (
    <div className="w-full flex flex-col pt-2 pb-12 animate-in fade-in duration-500">

      {/* ── Page Header ──────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contracts</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Manage and monitor all your legal agreements in one place.</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/templates')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2 h-10 shrink-0"
        >
          <Plus size={16} />
          New Contract
        </Button>
      </div>

      {/* ── Stats Row ────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: '4', icon: FileSignature, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'High Risk', value: '1', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Verified Safe', value: '1', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pending Action', value: '2', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
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
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeFilter === f
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 w-56 transition-all placeholder:text-slate-400"
          />
        </div>
        <Button variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50">
          <Filter size={13} />
          Filter
        </Button>
      </div>

      {/* ── Contract Cards ───────────────────────── */}
      <div className="flex flex-col gap-4">
        <ContractRiskCard
          title="Globex Master Service Agreement"
          type="MSA"
          status="Draft"
          date="Mar 14, 2026"
          riskLevel="high_risk"
          aiDiagnosis="Payment clause (Net 90) severely deviates from standard startup norms."
          businessImpact="May delay revenue by 45 days (₹ impact: ₹1.2L)"
        />
        <ContractRiskCard
          title="WeWork Facility Lease"
          type="Lease"
          status="Signed"
          date="Mar 10, 2026"
          riskLevel="needs_action"
          aiDiagnosis="Auto-renewal triggers in 14 days with a 12% price hike."
          businessImpact="Costs an extra ₹40K/month."
        />
        <ContractRiskCard
          title="Acme Corp Software License"
          type="Vendor"
          status="Signed"
          date="Today, 10:24 AM"
          riskLevel="verified_safe"
          aiDiagnosis="All terms fall within acceptable company risk parameters."
          businessImpact="No immediate financial or legal risk."
        />
        <ContractRiskCard
          title="Cloudflare Web Services"
          type="Vendor"
          status="Draft"
          date="Mar 15, 2026"
          riskLevel="ai_suggested_fix"
          aiDiagnosis="Indemnification caps are unbalanced in favor of the vendor."
          businessImpact="Exposes company to uncapped liability in case of data breach."
        />
      </div>
    </div>
  );
}
