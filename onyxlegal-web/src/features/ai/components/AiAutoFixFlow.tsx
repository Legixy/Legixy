/**
 * /src/features/ai/components/AiAutoFixFlow.tsx
 *
 * Component demonstrating the auto-fix flow
 * Shows recommended action → preview modal → apply fix flow
 */

'use client';

import { useState } from 'react';
import { useAutoFix } from '../hooks/useAutoFix';
import { AiFixPreviewModal, FixPreviewData } from './AiFixPreviewModal';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface AiAutoFixFlowProps {
  isOpen: boolean;
  contractId: string;
  actionId: string;
  actionTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Mock fix preview data - in production, fetch from backend
 */
function getMockFixPreview(actionId: string): FixPreviewData {
  const previewMap: Record<string, FixPreviewData> = {
    'action-1': {
      id: 'action-1',
      title: 'Fix Payment Clause (High Risk)',
      explanation:
        'The current payment terms exceed MSME Act limits of ₹1 crore for certain penalties. Updating to compliance-friendly terms will reduce legal exposure by 45% and improve enforceability.',
      original: {
        title: 'Current Payment Clause',
        content: `Payment Terms:
- Invoices due within 7 days of receipt
- Late payment penalty: 24% per annum compounded
- Liability cap: ₹5 crores
- No offset rights
- Payment disputes resolved by arbitration`,
      },
      suggested: {
        title: 'Suggested Payment Clause',
        content: `Payment Terms:
- Invoices due within 30 days of receipt
- Late payment penalty: 12% per annum simple interest (compliant with MSME Act)
- Liability cap: ₹2 crores (MSME compliant)
- Right to offset against advances
- Payment disputes resolved through mediation first`,
      },
      impact: {
        riskReduction: 45,
        implications: [
          'Compliance with Micro, Small & Medium Enterprises Development (MSME) Act, 2006',
          'Reduced enforceability risk in case of dispute',
          'Better relationship with vendor (fairer terms)',
          'May slightly extend payment cycle',
        ],
      },
      confirmationText:
        'This fix aligns your contract with Indian MSME regulations. All changes are reversible through audit trail.',
    },
    'action-2': {
      id: 'action-2',
      title: 'Renew Vendor Contract',
      explanation:
        'The Acme Corp Service Agreement is expiring in 3 days. Renewal is critical to maintain service continuity and avoid liability gaps.',
      original: {
        title: 'Current Agreement Expiration',
        content: `Contract Term:
- Start Date: March 15, 2023
- End Date: March 15, 2025
- Auto-renewal: No
- Notice required: 30 days before expiration`,
      },
      suggested: {
        title: 'Renewal Terms',
        content: `Contract Term:
- Start Date: March 15, 2025
- End Date: March 15, 2027
- Auto-renewal: Yes (unless 90-day notice given)
- Notice required: 90 days before expiration
- 3% rate adjustment for inflation`,
      },
      impact: {
        riskReduction: 60,
        implications: [
          'Service continuity maintained',
          '2-year extended term ensures stability',
          'Auto-renewal reduces admin burden',
          'Rate adjustment reflects market conditions',
        ],
      },
      confirmationText: 'Renewal letter will be sent to Acme Corp immediately upon approval.',
    },
  };

  return (
    previewMap[actionId] || {
      id: actionId,
      title: 'Apply AI Fix',
      explanation: 'AI has recommended this fix based on contract analysis.',
      original: {
        title: 'Original',
        content: 'Original clause content',
      },
      suggested: {
        title: 'Suggested',
        content: 'Suggested clause content',
      },
      impact: {
        riskReduction: 30,
        implications: ['Fix improves compliance', 'Reduces legal risk'],
      },
    }
  );
}

export function AiAutoFixFlow({
  isOpen,
  contractId,
  actionId,
  actionTitle,
  onClose,
  onSuccess,
}: AiAutoFixFlowProps) {
  const [step, setStep] = useState<'preview' | 'confirming'>('preview');
  const { mutate: applyFix, isPending } = useAutoFix();

  const fixPreview = getMockFixPreview(actionId);

  const handleApprove = () => {
    setStep('confirming');

    // Apply the fix
    applyFix(
      {
        actionId,
        contractId,
        changes: {
          // Mock changes - in production, these would be real data
          field: 'paymentTerms',
          value: fixPreview.suggested.content,
        },
      },
      {
        onSuccess: () => {
          setStep('preview'); // Reset for next time
          onClose();
          onSuccess?.();
        },
      }
    );
  };

  return (
    <AiFixPreviewModal
      isOpen={isOpen}
      data={fixPreview}
      isLoading={isPending}
      onApprove={handleApprove}
      onCancel={() => {
        setStep('preview');
        onClose();
      }}
    />
  );
}
