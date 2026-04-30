'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateContract, useUploadContract } from '@/shared/api';
import { useFormState } from '@/shared/hooks';
import { ArrowLeft, Loader2, AlertCircle, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type InputMode = 'paste' | 'upload';

export default function CreateContractPage() {
  const router = useRouter();
  const createMutation = useCreateContract();
  const uploadMutation = useUploadContract();
  const formState = useFormState({
    title: '',
    content: '',
    contractValue: '',
    currency: 'INR',
    effectiveDate: '',
    expirationDate: '',
  });

  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [partyName, setPartyName] = useState('');
  const [parties, setParties] = useState<Array<{ name: string; email?: string; role: string }>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!formState.values.title) {
      formState.setValue('title', file.name.replace(/\.(pdf|docx)$/i, '').replace(/[-_]/g, ' '));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

    if (!formState.values.title.trim()) {
      formState.setError('title', 'Title is required');
      return;
    }

    if (inputMode === 'upload') {
      if (!selectedFile) {
        formState.setError('title', 'Please select a PDF or DOCX file');
        return;
      }
      uploadMutation.mutate(
        { file: selectedFile, title: formState.values.title },
        { onSuccess: (c) => router.push(`/dashboard/contracts/${c.id}`) },
      );
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
    if (formState.values.effectiveDate) data.effectiveDate = formState.values.effectiveDate;
    if (formState.values.expirationDate) data.expirationDate = formState.values.expirationDate;

    createMutation.mutate(data, {
      onSuccess: (newContract) => router.push(`/dashboard/contracts/${newContract.id}`),
    });
  };

  const isPending = createMutation.isPending || uploadMutation.isPending;
  const mutationError = createMutation.error ?? uploadMutation.error;
  const errorMessage = (mutationError as Error | null)?.message || 'Unknown error occurred';

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
      {mutationError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
          <AlertCircle className="text-red-500" size={18} />
          <div>
            <p className="text-sm font-semibold text-red-900">Failed to create contract</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
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

        {/* Contract Content — mode toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-900">
              Contract Content
            </label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-3 py-1.5 transition-colors ${inputMode === 'paste' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1.5 transition-colors ${inputMode === 'upload' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                Upload PDF / DOCX
              </button>
            </div>
          </div>

          {inputMode === 'upload' ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleFileChange}
              />
              {!selectedFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload size={24} />
                  <span className="text-sm font-medium">Click to select a file</span>
                  <span className="text-xs text-slate-400">PDF or DOCX — text extracted automatically</span>
                </button>
              ) : (
                <div className="w-full px-4 py-4 rounded-lg border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">{selectedFile.name}</p>
                      <p className="text-xs text-emerald-600">{(selectedFile.size / 1024).toFixed(0)} KB — text will be extracted on upload</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="text-emerald-600 hover:text-red-600 transition-colors ml-4"
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <textarea
              value={formState.values.content}
              onChange={(e) => formState.setValue('content', e.target.value)}
              placeholder="Paste contract text here"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 outline-none text-sm transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono"
              rows={8}
            />
          )}
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
            disabled={isPending}
            className="flex-1 text-white gap-2"
            style={{
              background: 'var(--onyx-gradient)',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {isPending
              ? inputMode === 'upload' ? 'Uploading...' : 'Creating...'
              : inputMode === 'upload' ? 'Upload & Extract' : 'Create Contract'
            }
          </Button>
        </div>

      </form>

    </div>
  );
}
