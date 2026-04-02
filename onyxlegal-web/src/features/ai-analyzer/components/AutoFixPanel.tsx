'use client';

import { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/shared/components/Modal';
import { toast } from 'sonner';

export function AutoFixPanel() {
  const [accepted, setAccepted] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [editText, setEditText] = useState('Client shall pay within 45 days of receipt, per MSME norms.');
  const [question, setQuestion] = useState('');

  const handleAccept = () => {
    setAccepted(true);
    toast.success('Fix applied to contract!', {
      description: 'Payment terms updated to 45 days — MSME compliant. Contract saved.',
    });
  };

  const handleEditSave = () => {
    setEditOpen(false);
    toast.success('Manual edit saved', {
      description: 'Your custom clause has been applied to the contract.',
    });
  };

  const handleAskAI = () => {
    if (!question.trim()) return;
    setAskOpen(false);
    toast.loading('Onyx AI is thinking...', { duration: 2000 });
    setTimeout(() => {
      toast.success('AI Response ready', {
        description: 'Net 30 is better than Net 45 here — aligns with standard B2B SaaS contracts.',
        duration: 6000,
      });
    }, 2000);
    setQuestion('');
  };

  return (
    <>
      <div className="flex-1 onyx-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="font-display text-[11px] font-bold tracking-[0.14em] text-slate-600 uppercase">
            AI Auto-Fix Suggestions
          </h2>
          <span
            className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
            style={{ background: 'var(--onyx-gradient)' }}
          >
            1
          </span>
        </div>

        <div
          className="rounded-xl overflow-hidden p-5"
          style={{ background: 'var(--onyx-gradient-subtle)', border: '1px solid rgba(79, 70, 229, 0.08)' }}
        >
          <div className="flex items-center gap-2 mb-1 text-slate-900">
            <Sparkles className="text-indigo-500" size={15} />
            <h3 className="font-display font-semibold text-sm">Standardize Payment Terms</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5 font-medium">In &quot;Acme Master Services Agreement&quot;</p>

          <div className="space-y-3 mb-5">
            {/* Before */}
            <div>
              <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-t-xl">
                Before (High Risk)
              </div>
              <div
                className="rounded-b-xl p-3.5 font-mono text-[13px] text-slate-400 line-through decoration-red-300/60"
                style={{ background: '#FFF8F8', border: '1px solid rgba(239, 68, 68, 0.1)', borderTop: 'none' }}
              >
                Client shall pay within 90 days of receipt.
              </div>
            </div>

            {/* After */}
            <div>
              <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-t-xl">
                After (AI Fix)
              </div>
              <div
                className="rounded-b-xl p-3.5 font-mono text-[13px] text-slate-800"
                style={{ background: '#F6FFFA', border: '1px solid rgba(16, 185, 129, 0.1)', borderTop: 'none' }}
              >
                {editText}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {accepted ? (
            <div className="flex items-center gap-2 justify-center py-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 size={18} />
              Fix Applied Successfully
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <Button
                onClick={handleAccept}
                className="w-full text-white h-10 text-sm rounded-xl font-semibold"
                style={{
                  background: 'var(--onyx-gradient)',
                  boxShadow: '0 3px 12px rgba(79, 70, 229, 0.2)',
                  transition: 'all 0.3s var(--onyx-ease)',
                }}
              >
                <Sparkles size={14} className="mr-1.5" />
                Accept Fix
              </Button>
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  className="flex-1 text-slate-600 bg-white hover:bg-slate-50 h-9 text-sm rounded-xl"
                  style={{ border: '1px solid var(--border)', transition: 'all 0.3s var(--onyx-ease)' }}
                >
                  Edit Manually
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAskOpen(true)}
                  className="flex-1 text-slate-600 bg-white hover:bg-slate-50 h-9 text-sm rounded-xl"
                  style={{ border: '1px solid var(--border)', transition: 'all 0.3s var(--onyx-ease)' }}
                >
                  Ask AI
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Manually Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Clause Manually">
        <p className="text-xs text-slate-500 mb-3">Edit the AI-suggested fix before applying it to the contract.</p>
        <textarea
          className="w-full h-28 rounded-xl p-3 text-sm font-mono text-slate-800 focus:outline-none resize-none"
          style={{ border: '1px solid var(--border)', transition: 'all 0.3s var(--onyx-ease)' }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.currentTarget.style.borderColor = '#818CF8'; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleEditSave}
            className="flex-1 text-white h-9 text-sm rounded-xl"
            style={{ background: 'var(--onyx-gradient)', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)' }}
          >
            Save &amp; Apply
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 h-9 text-sm rounded-xl" style={{ border: '1px solid var(--border)' }}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Ask AI Modal */}
      <Modal open={askOpen} onClose={() => setAskOpen(false)} title="Ask Onyx AI">
        <p className="text-xs text-slate-500 mb-3">Ask a legal question about this clause or the suggested fix.</p>
        <input
          type="text"
          className="w-full rounded-xl px-3 h-10 text-sm text-slate-800 focus:outline-none"
          style={{ border: '1px solid var(--border)', transition: 'all 0.3s var(--onyx-ease)' }}
          onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'; e.currentTarget.style.borderColor = '#818CF8'; }}
          onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          placeholder='e.g. "Is Net 30 better than Net 45 for B2B SaaS?"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAskAI(); }}
        />
        <Button
          onClick={handleAskAI}
          className="w-full mt-3 text-white h-9 text-sm rounded-xl"
          style={{ background: 'var(--onyx-gradient)', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)' }}
        >
          <Sparkles size={14} className="mr-1.5" />
          Ask AI
        </Button>
      </Modal>
    </>
  );
}
