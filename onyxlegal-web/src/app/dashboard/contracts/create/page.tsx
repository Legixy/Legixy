'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateContract } from '@/shared/api';
import { useFormState } from '@/shared/hooks';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CreateContractPage() {
  const router = useRouter();
  const createMutation = useCreateContract();
  const formState = useFormState({
    title: '',
    content: '',
    contractValue: '',
    currency: 'INR',
    effectiveDate: '',
    expirationDate: '',
  });

  const [partyName, setPartyName] = useState('');
  const [parties, setParties] = useState<Array<{ name: string; email?: string; role: string }>>([]);

  const handleAddParty = () => {
    if (!partyName.trim()) return;
    setParties([...parties, { name: partyName, role: 'counterparty' }]);
    setPartyName('');
  };

  const handleRemoveParty = (index: number) => {
    setParties(parties.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formState.values.title.trim()) {
      formState.setError('title', 'Title is required');
      return;
    }

    const data: any = {
      title: formState.values.title,
      content: formState.values.content || undefined,
      parties: parties.length > 0 ? parties : undefined,
      currency: formState.values.currency,
    };

    if (formState.values.contractValue) {
      data.contractValue = parseFloat(formState.values.contractValue as string);
    }

    if (formState.values.effectiveDate) {
      data.effectiveDate = formState.values.effectiveDate;
    }

    if (formState.values.expirationDate) {
      data.expirationDate = formState.values.expirationDate;
    }

    createMutation.mutate(data, {
      onSuccess: (newContract) => {
        // Redirect to contract detail
        router.push(`/dashboard/contracts/${newContract.id}`);
      },
    });
  };

  const errorObj = createMutation.error as Error | null;
  const errorMessage: string = errorObj?.message || 'Unknown error occurred';

  return (
    <div className="w-full flex flex-col animate-fade-up">

      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Create New Contract
          </h1>
          <p className="text-slate-500 mt-0.5 text-sm">Start by entering basic information</p>
        </div>
      </div>

      {/* ── Error Alert ───────────────────────────– */}
      {createMutation.error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
          <AlertCircle className="text-red-500" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-900">Failed to create contract</p>
            <p className="text-xs text-red-700 mt-0.5">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── Form ──────────────────────────────────– */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Contract Title *
          </label>
          <input
            type="text"
            value={formState.values.title}
            onChange={(e) => formState.setValue('title', e.target.value)}
            placeholder="e.g., Vendor Service Agreement with Acme Corp"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {formState.errors.title && <p className="text-xs text-red-600 mt-1">{formState.errors.title}</p>}
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Contract Content
          </label>
          <textarea
            value={formState.values.content}
            onChange={(e) => formState.setValue('content', e.target.value)}
            placeholder="Paste contract text here (optional)"
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
            rows={6}
          />
        </div>

        {/* Contract Value */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Contract Value
            </label>
            <input
              type="number"
              value={formState.values.contractValue}
              onChange={(e) => formState.setValue('contractValue', e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Currency
            </label>
            <select
              value={formState.values.currency}
              onChange={(e) => formState.setValue('currency', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Effective Date
            </label>
            <input
              type="date"
              value={formState.values.effectiveDate}
              onChange={(e) => formState.setValue('effectiveDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Expiration Date
            </label>
            <input
              type="date"
              value={formState.values.expirationDate}
              onChange={(e) => formState.setValue('expirationDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Parties */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Contract Parties
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddParty())}
              placeholder="Party name"
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <Button
              type="button"
              onClick={handleAddParty}
              variant="outline"
              className="text-sm"
            >
              Add Party
            </Button>
          </div>
          <div className="space-y-2">
            {parties.map((party, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{party.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{party.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveParty(idx)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-6 border-t border-slate-200">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="flex-1 text-white gap-2"
            style={{
              background: 'var(--onyx-gradient)',
              opacity: createMutation.isPending ? 0.7 : 1,
            }}
          >
            {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {createMutation.isPending ? 'Creating...' : 'Create Contract'}
          </Button>
        </div>

      </form>

    </div>
  );
}
