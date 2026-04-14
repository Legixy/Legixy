/**
 * /src/shared/components/SmartEmptyState.tsx
 *
 * Reusable component for intelligent empty states
 * Provides guided experiences with illustrations and CTAs
 */

'use client';

import { Button } from '@/components/ui/button';
import { FileSignature, BarChart3, Sparkles } from 'lucide-react';

export interface SmartEmptyStateProps {
  type: 'contracts' | 'analytics' | 'dashboard';
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  isLoading?: boolean;
}

const emptyStateConfig = {
  contracts: {
    title: 'No contracts yet',
    description: 'Upload your first contract and let OnyxAI analyze it for risks and compliance.',
    icon: FileSignature,
    primaryLabel: 'Upload Contract',
    secondaryLabel: 'Start with Template',
    illustration: (
      <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-200">
        <FileSignature className="w-12 h-12 text-indigo-600" />
      </div>
    ),
  },
  analytics: {
    title: 'No analytics yet',
    description: 'Create and analyze contracts to see detailed legal insights and compliance metrics.',
    icon: BarChart3,
    primaryLabel: 'Go to Contracts',
    secondaryLabel: 'View Demo',
    illustration: (
      <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-linear-to-br from-blue-50 to-cyan-50 flex items-center justify-center border border-blue-200">
        <BarChart3 className="w-12 h-12 text-blue-600" />
      </div>
    ),
  },
  dashboard: {
    title: "Let's get started",
    description: 'Create your first contract or upload an existing one to start the AI analysis.',
    icon: Sparkles,
    primaryLabel: 'Create Contract',
    secondaryLabel: 'Upload File',
    illustration: (
      <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-linear-to-br from-emerald-50 to-teal-50 flex items-center justify-center border border-emerald-200">
        <Sparkles className="w-12 h-12 text-emerald-600" />
      </div>
    ),
  },
};

export function SmartEmptyState({
  type,
  onPrimaryAction,
  onSecondaryAction,
  isLoading = false,
}: SmartEmptyStateProps) {
  const config = emptyStateConfig[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl border border-slate-200">
      {/* Illustration */}
      {config.illustration}

      {/* Content */}
      <div className="text-center max-w-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{config.title}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{config.description}</p>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onPrimaryAction}
            disabled={isLoading}
            className="w-full h-10 rounded-lg font-semibold text-sm"
            style={{
              background: 'var(--onyx-gradient)',
              color: 'white',
              border: 'none',
            }}
          >
            {isLoading ? 'Loading...' : config.primaryLabel}
          </Button>
          <Button
            onClick={onSecondaryAction}
            variant="outline"
            className="w-full h-10 rounded-lg font-semibold text-sm border-slate-200 text-slate-700"
          >
            {config.secondaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
