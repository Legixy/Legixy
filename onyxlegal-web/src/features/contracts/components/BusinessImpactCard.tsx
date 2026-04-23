'use client';

import { TrendingDown, AlertTriangle, Zap } from 'lucide-react';

interface Props {
  estimatedLoss: number;
  criticalIssues: number;
  riskReductionPercent: number;
  currency?: string;
}

function formatCurrency(amount: number, currency = '₹'): string {
  if (amount >= 10000000) return `${currency}${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${currency}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${currency}${(amount / 1000).toFixed(0)}K`;
  return `${currency}${amount.toLocaleString('en-IN')}`;
}

export function BusinessImpactCard({ estimatedLoss, criticalIssues, riskReductionPercent, currency = '₹' }: Props) {
  const items = [
    {
      icon: TrendingDown,
      iconBg: 'linear-gradient(135deg, #EF4444, #DC2626)',
      label: 'Potential financial exposure',
      value: `You may lose ${formatCurrency(estimatedLoss, currency)} if things go wrong`,
      highlight: true,
    },
    {
      icon: AlertTriangle,
      iconBg: 'linear-gradient(135deg, #F59E0B, #D97706)',
      label: 'Issues found',
      value: `This contract has ${criticalIssues} critical issue${criticalIssues === 1 ? '' : 's'}`,
      highlight: false,
    },
    {
      icon: Zap,
      iconBg: 'linear-gradient(135deg, #10B981, #059669)',
      label: 'If you fix now',
      value: `Estimated risk reduction if fixed: ${riskReductionPercent}%`,
      highlight: false,
    },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.03), rgba(124, 58, 237, 0.02))',
        border: '1px solid var(--border)',
        boxShadow: 'var(--onyx-shadow-sm)',
      }}
    >
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-display text-sm font-bold text-slate-900 uppercase tracking-wider">
          💰 Business Impact
        </h3>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="px-6 py-4 flex items-center gap-4 transition-colors duration-200 hover:bg-white/50"
              style={{
                animationDelay: `${idx * 100}ms`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: item.iconBg,
                  boxShadow: `0 4px 12px ${item.iconBg.includes('EF4444') ? 'rgba(239,68,68,0.2)' : item.iconBg.includes('F59E0B') ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`,
                }}
              >
                <Icon size={18} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-0.5">
                  {item.label}
                </p>
                <p
                  className={`text-sm font-semibold leading-snug break-words ${
                    item.highlight ? 'text-red-700' : 'text-slate-800'
                  }`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
