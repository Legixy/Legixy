'use client';

import { FileText, ChevronRight, AlertTriangle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function DocumentFeedPanel() {
  const router = useRouter();

  const feed = [
    {
      id: 1,
      name: 'Globex Master Service Agreement',
      type: 'MSA',
      status: 'Draft',
      badgeText: 'FIX AVAILABLE',
      badgeClass: 'bg-amber-50 text-amber-700',
      insightIcon: AlertTriangle,
      insightIconColor: 'text-amber-500',
      insightBg: 'bg-amber-50/50',
      insightText: 'Payment terms may delay revenue by 15 days (₹ impact: ₹80K/month)',
      insightTextColor: 'text-amber-800',
      button: 'Fix with AI',
      onButton: () => {
        toast.loading('Onyx AI is analyzing the payment clause...', { duration: 2500 });
        setTimeout(() => {
          toast.success('AI Fix ready!', {
            description: 'Payment terms updated from Net 90 → Net 45. Review in the Contracts tab.',
            duration: 5000,
          });
        }, 2500);
      },
    },
    {
      id: 2,
      name: 'Acme Corp Software License',
      type: 'Vendor Agreement',
      status: 'Signed',
      badgeText: 'SAFE',
      badgeClass: 'bg-emerald-50 text-emerald-600',
      insightIcon: Sparkles,
      insightIconColor: 'text-emerald-500',
      insightBg: 'bg-emerald-50/50',
      insightText: 'Standard terms confirmed. No action needed.',
      insightTextColor: 'text-emerald-800',
      button: null,
      onButton: undefined,
    },
    {
      id: 3,
      name: 'Rahul Sharma Offboarding',
      type: 'NDA',
      status: 'Sent',
      badgeText: 'REVIEW SUGGESTED',
      badgeClass: 'bg-indigo-50 text-indigo-600',
      insightIcon: Sparkles,
      insightIconColor: 'text-indigo-500',
      insightBg: 'bg-indigo-50/50',
      insightText: 'IP protection is strictly one-way. Recommend mutual NDA.',
      insightTextColor: 'text-indigo-800',
      button: null,
      onButton: undefined,
    },
  ];

  return (
    <div className="flex-[2] onyx-card overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-display text-[11px] font-bold tracking-[0.14em] text-slate-600 uppercase">
          Intelligent Document Feed
        </h2>
        <button
          onClick={() => router.push('/dashboard/contracts')}
          className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center gap-0.5 group transition-colors duration-200"
        >
          View all
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform duration-200" />
        </button>
      </div>

      {/* Feed Items */}
      <div className="flex flex-col">
        {feed.map((doc, idx) => (
          <div key={doc.id} style={idx !== feed.length - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}>
            {/* Item Header */}
            <div className="flex items-start gap-4 px-6 pt-4 pb-3">
              <div
                className="w-9 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5"
                style={{ border: '1px solid var(--border)' }}
              >
                <FileText size={17} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-semibold text-slate-900 text-[13px] leading-tight">{doc.name}</h3>
                  <Badge
                    variant="outline"
                    className={`${doc.badgeClass} text-[9px] tracking-wider uppercase px-2 py-0.5 whitespace-nowrap font-bold shrink-0 rounded-md border-transparent`}
                  >
                    {doc.badgeText}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500">{doc.type}</span>
                  <span className="text-slate-300">•</span>
                  <span>{doc.status}</span>
                </div>
              </div>
            </div>

            {/* Full-width colored insight strip */}
            <div className={`${doc.insightBg} px-6 py-2.5 flex items-center justify-between gap-4`}>
              <div className="flex items-center gap-2">
                <doc.insightIcon className={`${doc.insightIconColor} shrink-0`} size={14} />
                <p className={`text-[12px] font-medium ${doc.insightTextColor}`}>{doc.insightText}</p>
              </div>
              {doc.button && doc.onButton && (
                <Button
                  variant="outline"
                  onClick={doc.onButton}
                  className="bg-white text-slate-700 h-7 text-xs px-3 shrink-0 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg"
                  style={{ border: '1px solid var(--border)', transition: 'all 0.2s var(--onyx-ease)' }}
                >
                  {doc.button}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
