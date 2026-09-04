'use client';

import { useState } from 'react';
import { Sparkles, Shield, Briefcase, FileText, Users, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/shared/components/Modal';
import { toast } from 'sonner';

interface Props {
  isRecommended?: boolean;
  score: number;
  title: string;
  description: string;
  socialProof: string;
  iconType: 'briefcase' | 'shield' | 'document';
  previewClauses?: { label: string; text: string }[];
}

const iconMap = {
  briefcase: { icon: Briefcase, color: 'text-slate-500' },
  shield: { icon: Shield, color: 'text-slate-500' },
  document: { icon: FileText, color: 'text-slate-500' },
};

const defaultClauses = {
  briefcase: [
    { label: 'Payment Terms', text: 'Client shall pay within 30 days of invoice. Late payments accrue 1.5% monthly interest.' },
    { label: 'IP Ownership', text: 'All deliverables remain AI-owned until full payment. License granted upon receipt.' },
    { label: 'Liability Cap', text: 'Maximum liability capped at 2× total contract value. Excludes gross negligence.' },
  ],
  shield: [
    { label: 'Confidentiality', text: 'Both parties agree to protect disclosed information for 3 years post-termination.' },
    { label: 'Permitted Use', text: 'Confidential information may only be used for evaluating a potential business relationship.' },
    { label: 'Exceptions', text: 'Does not apply to publicly available information or disclosures required by law.' },
  ],
  document: [
    { label: 'Compensation', text: 'Base salary + variable component. Salary reviewed annually. ESOP vesting over 4 years.' },
    { label: 'Non-Compete', text: '6-month non-compete within same industry geography post-employment.' },
    { label: 'Probation', text: '90-day probation period with mutual termination rights.' },
  ],
};

const primaryBtn = {
  background: 'var(--primary)',
  color: '#fff',
  boxShadow: 'var(--shadow-sm)',
};

const inputStyle = { border: '1px solid var(--border)', transition: 'all 150ms var(--ease-standard)' };
const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,53,211,0.10)';
  e.currentTarget.style.borderColor = 'var(--primary)';
};
const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.boxShadow = 'none';
  e.currentTarget.style.borderColor = 'var(--border)';
};

export function TemplateDiscoveryCard({ isRecommended, score, title, description, socialProof, iconType, previewClauses }: Props) {
  const IconData = iconMap[iconType];
  const Icon = IconData.icon;
  const [previewOpen, setPreviewOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [step, setStep] = useState(1);
  const clauses = previewClauses ?? defaultClauses[iconType];

  const handleSetupComplete = () => {
    setSetupOpen(false);
    setStep(1);
    toast.success('Contract setup started!', {
      description: `${title} is being generated with Onyx AI. You'll get a notification when it's ready.`,
      duration: 5000,
    });
  };

  return (
    <>
      <div
        className="relative bg-white rounded-xl flex flex-col overflow-hidden"
        style={{
          border: isRecommended ? '2px solid var(--primary)' : '1px solid var(--border)',
          boxShadow: isRecommended ? 'var(--shadow-md)' : 'var(--shadow-sm)',
          transition: 'box-shadow 250ms var(--ease-out), transform 250ms var(--ease-out)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = isRecommended ? 'var(--shadow-md)' : 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-2">
              <Icon size={18} className={IconData.color} />
              {isRecommended && (
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: 'var(--accent)', color: 'var(--accent-foreground)' }}
                >
                  Recommended
                </span>
              )}
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 text-[11px] rounded border-emerald-100">
              <Shield size={10} className="mr-1 inline-block -mt-0.5" /> {score}/100
            </Badge>
          </div>
          <h3 className="font-display text-[17px] text-slate-900 mb-2 leading-snug">{title}</h3>
          <p className="text-[13px] text-slate-500 leading-relaxed flex-1">{description}</p>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Users size={12} className="opacity-60 shrink-0" /> {socialProof}
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewOpen(true)}
            className="w-full h-9 text-[13px] rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            <Info size={13} className="mr-1.5 text-slate-400" /> Preview Details
          </Button>
          <Button
            onClick={() => setSetupOpen(true)}
            className="w-full h-9 text-[13px] rounded-lg font-medium"
            style={primaryBtn}
          >
            <Sparkles size={13} className="mr-1.5 opacity-80" /> Start Contract Setup
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${title} — Preview`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 py-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 font-semibold text-[11px] rounded border-emerald-100">
              <Shield size={10} className="mr-1 inline-block" />Risk Score: {score}/100
            </Badge>
            <span className="text-xs text-slate-400">{socialProof}</span>
          </div>
          <p className="text-sm text-slate-600">{description}</p>
          <div className="space-y-3">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Key Clauses</p>
            {clauses.map((clause) => (
              <div key={clause.label} className="rounded-lg p-3.5" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-xs font-semibold text-slate-700">{clause.label}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-5">{clause.text}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => { setPreviewOpen(false); setTimeout(() => setSetupOpen(true), 200); }}
            className="w-full h-9 text-[13px] rounded-lg font-medium"
            style={primaryBtn}
          >
            <Sparkles size={13} className="mr-1.5 opacity-80" /> Start Contract Setup
          </Button>
        </div>
      </Modal>

      {/* Setup Wizard Modal */}
      <Modal open={setupOpen} onClose={() => { setSetupOpen(false); setStep(1); }} title="Smart Contract Setup" maxWidth="max-w-md">
        <div className="space-y-4">
          {/* Step progress */}
          <div className="flex items-center gap-1.5 mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="flex-1 h-0.5 rounded-full transition-all duration-500"
                style={{ background: s <= step ? 'var(--primary)' : 'var(--border)' }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 text-right">Step {step} of 3</p>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Who is the counterparty?</p>
              <input className="w-full h-10 rounded-lg px-3 text-sm text-slate-800 focus:outline-none" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Company or individual name" />
              <input className="w-full h-10 rounded-lg px-3 text-sm text-slate-800 focus:outline-none" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Email address" />
              <Button onClick={() => setStep(2)} className="w-full h-9 text-[13px] rounded-lg font-medium" style={primaryBtn}>Next →</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Contract value & duration?</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Contract Value (₹)</label>
                  <input className="w-full h-10 rounded-lg px-3 text-sm text-slate-800 focus:outline-none" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="e.g. 5,00,000" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Duration</label>
                  <select className="w-full h-10 rounded-lg px-3 text-sm text-slate-700 focus:outline-none bg-white" style={{ border: '1px solid var(--border)' }}>
                    <option>6 months</option><option>1 year</option><option>2 years</option><option>Custom</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-9 text-[13px] rounded-lg" style={{ border: '1px solid var(--border)' }}>← Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 h-9 text-[13px] rounded-lg font-medium" style={primaryBtn}>Next →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Review & Generate</p>
              <div className="rounded-lg p-4" style={{ background: 'var(--accent)', border: '1px solid rgba(61,53,211,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--accent-foreground)' }}>Onyx AI is ready</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--accent-foreground)', opacity: 0.8 }}>
                  We&apos;ll generate a fully compliant {title} with standard risk protections. Risk score guaranteed ≥ {score}/100.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-9 text-[13px] rounded-lg" style={{ border: '1px solid var(--border)' }}>← Back</Button>
                <Button onClick={handleSetupComplete} className="flex-1 h-9 text-[13px] rounded-lg font-medium" style={primaryBtn}>
                  <Sparkles size={13} className="mr-1.5 opacity-80" /> Generate
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
