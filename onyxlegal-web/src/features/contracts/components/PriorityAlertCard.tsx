'use client';

import { AlertTriangle, Clock, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Severity = 'resolved' | 'warning' | 'notice';

interface Props {
  severity: Severity;
  title: string;
  subtitle: string;
  riskMessage: string;
  primaryAction?: string;
  secondaryAction?: string;
}

const themeMap = {
  resolved: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    border: 'border-slate-200',
  },
  warning: {
    icon: Clock,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  notice: {
    icon: RefreshCw,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
};

export function PriorityAlertCard({ severity, title, subtitle, riskMessage, primaryAction, secondaryAction }: Props) {
  const theme = themeMap[severity];
  const Icon = theme.icon;

  const handlePrimary = () => {
    if (severity === 'warning') {
      toast.success('Reminder sent!', {
        description: `Priya Singh has been notified. We'll alert you when she opens the document.`,
      });
    } else if (severity === 'notice') {
      toast.loading('Opening negotiation panel...', {
        description: 'Preparing renegotiation terms for AWS Hosting Agreement.',
        duration: 2500,
      });
    }
  };

  const handleSecondary = () => {
    if (severity === 'warning') {
      toast.info('Opening contract details...', {
        description: 'Priya Singh Offer — Signature status & history.',
      });
    } else if (severity === 'notice') {
      toast.info('Opening contract details...', {
        description: 'AWS Hosting Agreement — Auto-renewal terms & pricing.',
      });
    }
  };

  // ── Resolved / success state ─────────────────────
  if (severity === 'resolved') {
    return (
      <div className="rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center bg-white flex-1 min-h-[160px] text-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="text-emerald-500" size={22} />
        </div>
        <div>
          <p className="font-semibold text-slate-800 text-base">{title}</p>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${theme.border} p-5 flex flex-col justify-between bg-white flex-1 min-h-[160px]`}>
      <div>
        {/* Icon + Title Row */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${theme.iconBg}`}>
            <Icon className={theme.iconColor} size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 leading-tight">{title}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Risk Message Box */}
        <div className={`rounded-lg p-3 flex items-start gap-2 mb-5 ${severity === 'warning' ? 'bg-amber-50' : 'bg-indigo-50'}`}>
          <AlertTriangle className={`mt-0.5 shrink-0 ${theme.iconColor}`} size={13} />
          <p className={`text-xs font-medium leading-relaxed ${severity === 'warning' ? 'text-amber-800' : 'text-indigo-800'}`}>
            {riskMessage}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {primaryAction && (
          <Button
            onClick={handlePrimary}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm"
          >
            {primaryAction}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={handleSecondary}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 h-9 text-sm"
          >
            {secondaryAction}
          </Button>
        )}
      </div>
    </div>
  );
}
