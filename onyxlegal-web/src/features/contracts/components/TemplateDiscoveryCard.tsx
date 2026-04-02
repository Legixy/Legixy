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
  briefcase: { icon: Briefcase, bg: 'bg-emerald-50', color: 'text-emerald-600' },
  shield:    { icon: Shield,    bg: 'bg-indigo-50',  color: 'text-indigo-600'  },
  document:  { icon: FileText,  bg: 'bg-amber-50',   color: 'text-amber-600'  },
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

  const inputStyle = { border: '1px solid var(--border)', transition: 'all 0.3s var(--onyx-ease)' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.08)'; e.currentTarget.style.borderColor = '#818CF8'; };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; };
  const gradientBtn = { background: 'var(--onyx-gradient)', boxShadow: '0 2px 8px rgba(79,70,229,0.2)' };

  return (
    <>
      <div
        className="relative bg-white rounded-2xl flex flex-col overflow-hidden group"
        style={{
          border: isRecommended ? '2px solid #4F46E5' : '1px solid var(--border)',
          boxShadow: isRecommended ? '0 8px 32px rgba(79,70,229,0.12)' : 'var(--onyx-shadow-sm)',
          transition: 'all 0.4s var(--onyx-ease)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = isRecommended ? '0 12px 40px rgba(79,70,229,0.18)' : 'var(--onyx-shadow-lg)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = isRecommended ? '0 8px 32px rgba(79,70,229,0.12)' : 'var(--onyx-shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {isRecommended && (
          <div className="text-white text-[10px] font-bold uppercase tracking-[0.15em] py-2.5 px-4 flex items-center justify-center gap-1.5" style={{ background: 'var(--onyx-gradient)' }}>
            <Sparkles size={12} className="text-indigo-200" /> Recommended For You
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-5">
            <div className={`w-11 h-11 rounded-xl ${IconData.bg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={IconData.color} />
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 text-xs rounded-md border-transparent">
              <Shield size={11} className="mr-1 inline-block -mt-0.5" /> Risk Score: {score}/100
            </Badge>
          </div>
          <h3 className="font-display text-[18px] font-bold text-slate-900 mb-2 leading-snug">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed flex-1">{description}</p>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Users size={13} className="opacity-70 shrink-0" /> {socialProof}
          </div>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} className="w-full bg-white text-slate-700 hover:bg-slate-50 h-10 text-sm rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <Info size={15} className="text-slate-400 mr-2" /> Preview Details
          </Button>
          <Button onClick={() => setSetupOpen(true)} className="w-full text-white h-10 text-sm rounded-xl font-semibold" style={gradientBtn}>
            <Sparkles size={15} className="text-indigo-200 mr-2" /> Start Smart Contract Setup
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={`${title} — Preview`} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 py-2">
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 font-bold text-xs rounded-md border-transparent">
              <Shield size={11} className="mr-1 inline-block" />Risk Score: {score}/100
            </Badge>
            <span className="text-xs text-slate-400">{socialProof}</span>
          </div>
          <p className="text-sm text-slate-600">{description}</p>
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Clauses</p>
            {clauses.map((clause) => (
              <div key={clause.label} className="rounded-xl p-3.5" style={{ border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <p className="text-xs font-bold text-slate-700">{clause.label}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-5">{clause.text}</p>
              </div>
            ))}
          </div>
          <Button onClick={() => { setPreviewOpen(false); setTimeout(() => setSetupOpen(true), 200); }} className="w-full text-white h-10 rounded-xl" style={gradientBtn}>
            <Sparkles size={14} className="mr-1.5" /> Start Smart Contract Setup
          </Button>
        </div>
      </Modal>

      {/* Setup Wizard Modal */}
      <Modal open={setupOpen} onClose={() => { setSetupOpen(false); setStep(1); }} title="Smart Contract Setup" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 h-1 rounded-full transition-all duration-500" style={{ background: s <= step ? 'var(--onyx-gradient)' : '#E6E8EC' }} />
            ))}
          </div>
          <p className="text-xs text-slate-400 text-right">Step {step} of 3</p>

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Who is the counterparty?</p>
              <input className="w-full h-10 rounded-xl px-3 text-sm text-slate-800 focus:outline-none" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Company or individual name" />
              <input className="w-full h-10 rounded-xl px-3 text-sm text-slate-800 focus:outline-none" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="Email address" />
              <Button onClick={() => setStep(2)} className="w-full text-white h-10 rounded-xl" style={gradientBtn}>Next →</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Contract value & duration?</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Contract Value (₹)</label>
                  <input className="w-full h-10 rounded-xl px-3 text-sm text-slate-800 focus:outline-none" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} placeholder="e.g. 5,00,000" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">Duration</label>
                  <select className="w-full h-10 rounded-xl px-3 text-sm text-slate-700 focus:outline-none bg-white" style={{ border: '1px solid var(--border)' }}>
                    <option>6 months</option><option>1 year</option><option>2 years</option><option>Custom</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 text-sm rounded-xl" style={{ border: '1px solid var(--border)' }}>← Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 text-white h-10 text-sm rounded-xl" style={gradientBtn}>Next →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">Review & Generate</p>
              <div className="rounded-xl p-4" style={{ background: 'var(--onyx-gradient-subtle)', border: '1px solid rgba(79,70,229,0.08)' }}>
                <div className="flex items-center gap-2 mb-2"><Sparkles size={16} className="text-indigo-600" /><p className="text-sm font-bold text-indigo-800">Onyx AI is ready</p></div>
                <p className="text-xs text-indigo-600 leading-relaxed">We&apos;ll generate a fully compliant {title} with standard risk protections. Risk score guaranteed ≥ {score}/100.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-10 text-sm rounded-xl" style={{ border: '1px solid var(--border)' }}>← Back</Button>
                <Button onClick={handleSetupComplete} className="flex-1 text-white h-10 text-sm rounded-xl" style={gradientBtn}><Sparkles size={14} className="mr-1.5" /> Generate</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
