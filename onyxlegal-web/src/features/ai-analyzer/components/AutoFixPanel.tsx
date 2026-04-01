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
      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-slate-700 uppercase">
            AI Auto-Fix Suggestions
          </h2>
          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">
            1
          </span>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50 p-5">
          <div className="flex items-center gap-2 mb-1 text-slate-900">
            <Sparkles className="text-indigo-500" size={15} />
            <h3 className="font-semibold text-sm">Standardize Payment Terms</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5 font-medium">In &quot;Acme Master Services Agreement&quot;</p>

          <div className="space-y-3 mb-5">
            {/* Before */}
            <div>
              <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-t-lg">
                Before (High Risk)
              </div>
              <div className="bg-[#FFF8F8] border border-red-100 border-t-0 rounded-b-lg p-3.5 font-mono text-[13px] text-slate-400 line-through decoration-red-300">
                Client shall pay within 90 days of receipt.
              </div>
            </div>

            {/* After */}
            <div>
              <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1.5 uppercase tracking-wider rounded-t-lg">
                After (AI Fix)
              </div>
              <div className="bg-[#F6FFFA] border border-emerald-100 border-t-0 rounded-b-lg p-3.5 font-mono text-[13px] text-slate-800">
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10 text-sm"
              >
                <Sparkles size={14} className="mr-1.5" />
                Accept Fix
              </Button>
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                  className="flex-1 text-slate-600 bg-white border-slate-200 hover:bg-slate-50 h-9 text-sm"
                >
                  Edit Manually
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAskOpen(true)}
                  className="flex-1 text-slate-600 bg-white border-slate-200 hover:bg-slate-50 h-9 text-sm"
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
          className="w-full h-28 rounded-lg border border-slate-200 p-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button onClick={handleEditSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm">
            Save &amp; Apply
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1 border-slate-200 h-9 text-sm">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Ask AI Modal */}
      <Modal open={askOpen} onClose={() => setAskOpen(false)} title="Ask Onyx AI">
        <p className="text-xs text-slate-500 mb-3">Ask a legal question about this clause or the suggested fix.</p>
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 h-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          placeholder='e.g. "Is Net 30 better than Net 45 for B2B SaaS?"'
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAskAI(); }}
        />
        <Button onClick={handleAskAI} className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm">
          <Sparkles size={14} className="mr-1.5" />
          Ask AI
        </Button>
      </Modal>
    </>
  );
}
