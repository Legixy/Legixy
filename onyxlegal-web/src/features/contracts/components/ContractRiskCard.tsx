'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Sparkles, Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/shared/components/Modal';
import { toast } from 'sonner';

type RiskLevel = 'high_risk' | 'needs_action' | 'verified_safe' | 'ai_suggested_fix';

interface Props {
  title: string;
  type: string;
  status: string;
  date: string;
  riskLevel: RiskLevel;
  aiDiagnosis: string;
  businessImpact: string;
}

const config = {
  high_risk: {
    icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    badgeText: 'HIGH RISK',
    badgeClass: 'bg-red-100 text-red-700 border-red-200',
    footerBg: 'bg-[#FFF8F8]',
    labelColor: 'text-red-500',
    bodyColor: 'text-red-800',
    actionText: '✨ Fix with AI',
    actionClass: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    actionVariant: 'default' as const,
  },
  needs_action: {
    icon: AlertTriangle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    badgeText: 'NEEDS ACTION',
    badgeClass: 'bg-rose-50 text-rose-600 border-rose-200',
    footerBg: 'bg-[#FFF8F8]',
    labelColor: 'text-red-500',
    bodyColor: 'text-red-800',
    actionText: 'Renegotiate',
    actionClass: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    actionVariant: 'outline' as const,
  },
  verified_safe: {
    icon: ShieldCheck,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    badgeText: 'VERIFIED SAFE',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    footerBg: 'bg-[#F6FFFA]',
    labelColor: 'text-emerald-600',
    bodyColor: 'text-emerald-900',
    actionText: 'View Standard Clause',
    actionClass: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    actionVariant: 'outline' as const,
  },
  ai_suggested_fix: {
    icon: Sparkles,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badgeText: 'AI SUGGESTED FIX',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    footerBg: 'bg-[#FFFDF5]',
    labelColor: 'text-amber-600',
    bodyColor: 'text-amber-900',
    actionText: 'Compare Versions',
    actionClass: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
    actionVariant: 'outline' as const,
  },
};

// ── Modal content per risk level ──────────────────────────────────────────────

function FixWithAIModal({ title, onClose }: { title: string; onClose: () => void }) {
  const [applied, setApplied] = useState(false);
  const handleApply = () => {
    setApplied(true);
    toast.success('AI Fix Applied!', { description: `${title} — Payment clause updated to industry standard.` });
    setTimeout(onClose, 1200);
  };
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
        <Bot className="text-indigo-500 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-sm font-semibold text-indigo-800">Onyx AI Recommendation</p>
          <p className="text-sm text-indigo-700 mt-1">Replace Net 90 payment term with Net 30, per MSME Samadhaan Act 2023, which mandates payment within 45 days for MSME vendors.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1.5">Before</p>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 font-mono text-xs text-slate-500 line-through decoration-red-300">
            Client shall pay within 90 days of receipt.
          </div>
        </div>
        <div>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1.5">After (AI Fix)</p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 font-mono text-xs text-slate-800">
            Client shall pay within 30 days of receipt, per MSME norms.
          </div>
        </div>
      </div>
      <Button
        onClick={handleApply}
        disabled={applied}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
      >
        {applied ? '✓ Applied' : '✨ Apply Fix to Contract'}
      </Button>
    </div>
  );
}

function RenegotiateModal({ title, onClose }: { title: string; onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    setSent(true);
    toast.success('Renegotiation request sent!', { description: `${title} — Counterparty notified with AI-suggested terms.` });
    setTimeout(onClose, 1400);
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Onyx AI has prepared revised terms. Review before sending to the counterparty.</p>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">AI Suggested Terms</p>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>Cap auto-renewal clause to 1 year at current rates</li>
          <li>Add 30-day opt-out notice window before renewal</li>
          <li>Price increase capped at CPI + 3%</li>
        </ul>
      </div>
      <Button onClick={handleSend} disabled={sent} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10">
        {sent ? '✓ Request Sent' : 'Send Renegotiation Request'}
      </Button>
    </div>
  );
}

function StandardClauseModal() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg">
        <ShieldCheck className="text-emerald-500" size={18} />
        <p className="text-sm font-medium text-emerald-800">All terms are within standard parameters</p>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Liability Cap', value: '2× Annual Contract Value — Industry standard' },
          { label: 'IP Ownership', value: 'Mutual assignment with carve-outs — Balanced' },
          { label: 'Termination', value: '30-day notice — Standard' },
          { label: 'Governing Law', value: 'Indian Contract Act 1872 — Compliant' },
        ].map((row) => (
          <div key={row.label} className="flex justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
            <span className="text-xs font-semibold text-slate-500">{row.label}</span>
            <span className="text-xs text-slate-800 text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompareVersionsModal() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Comparing AI-suggested version vs. current contract version.</p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">Current Version</p>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 space-y-2 font-mono text-slate-600">
            <p className="line-through decoration-red-400">No indemnification cap defined.</p>
            <p className="line-through decoration-red-400">Vendor liability unlimited.</p>
            <p className="line-through decoration-red-400">No breach notification timeline.</p>
          </div>
        </div>
        <div>
          <p className="font-bold text-emerald-600 uppercase tracking-wider mb-2 text-[10px]">AI Suggested Fix</p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-2 font-mono text-slate-800">
            <p>Indemnification capped at ₹50L.</p>
            <p>Vendor liability = 1× annual fees.</p>
            <p>Breach notification within 72 hrs.</p>
          </div>
        </div>
      </div>
      <Button
        onClick={() => toast.success('AI version accepted', { description: 'Indemnification cap applied to contract.' })}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-10"
      >
        <Sparkles size={14} className="mr-1.5" />
        Accept AI Version
      </Button>
    </div>
  );
}

// ── Main Card Component ───────────────────────────────────────────────────────

export function ContractRiskCard({ title, type, status, date, riskLevel, aiDiagnosis, businessImpact }: Props) {
  const c = config[riskLevel];
  const Icon = c.icon;
  const [modal, setModal] = useState(false);

  const handleAction = () => setModal(true);

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
        {/* ── Card Header ─────── */}
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-9 h-9 rounded-full ${c.iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={c.iconColor} size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h3 className="font-semibold text-slate-900 text-[15px] leading-tight">{title}</h3>
                <Badge
                  variant="outline"
                  className={`${c.badgeClass} text-[10px] tracking-wider uppercase px-2 py-0.5 pointer-events-none font-semibold`}
                >
                  {c.badgeText}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[11px]">{type}</span>
                <span className="text-slate-300 mx-0.5">•</span>
                <span>{status}</span>
                <span className="text-slate-300 mx-0.5">•</span>
                <span>{date}</span>
              </div>
            </div>
          </div>

          <Button
            variant={c.actionVariant}
            onClick={handleAction}
            className={`${c.actionClass} h-9 text-sm shrink-0`}
          >
            {c.actionText}
          </Button>
        </div>

        {/* ── AI Diagnosis Footer ── */}
        <div className={`${c.footerBg} px-6 py-4 border-t border-slate-100 grid grid-cols-2 gap-8`}>
          <div>
            <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${c.labelColor} mb-1.5`}>AI Diagnosis</p>
            <p className={`text-[13px] font-medium leading-snug ${c.bodyColor}`}>{aiDiagnosis}</p>
          </div>
          <div>
            <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${c.labelColor} mb-1.5`}>Business Impact</p>
            <p className={`text-[13px] font-bold leading-snug ${c.bodyColor}`}>{businessImpact}</p>
          </div>
        </div>
      </div>

      {/* ── Action Modals ── */}
      {riskLevel === 'high_risk' && (
        <Modal open={modal} onClose={() => setModal(false)} title={`Fix with AI — ${title}`} maxWidth="max-w-2xl">
          <FixWithAIModal title={title} onClose={() => setModal(false)} />
        </Modal>
      )}
      {riskLevel === 'needs_action' && (
        <Modal open={modal} onClose={() => setModal(false)} title={`Renegotiate — ${title}`} maxWidth="max-w-lg">
          <RenegotiateModal title={title} onClose={() => setModal(false)} />
        </Modal>
      )}
      {riskLevel === 'verified_safe' && (
        <Modal open={modal} onClose={() => setModal(false)} title={`Standard Clause Review — ${title}`} maxWidth="max-w-lg">
          <StandardClauseModal />
        </Modal>
      )}
      {riskLevel === 'ai_suggested_fix' && (
        <Modal open={modal} onClose={() => setModal(false)} title={`Compare Versions — ${title}`} maxWidth="max-w-2xl">
          <CompareVersionsModal />
        </Modal>
      )}
    </>
  );
}
