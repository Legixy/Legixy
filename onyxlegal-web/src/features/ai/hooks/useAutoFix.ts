/**
 * /src/features/ai/hooks/useAutoFix.ts
 *
 * React Query mutation hook for applying AI-suggested fixes
 * Handles auto-fix POST requests with loading/error states
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface AutoFixRequest {
  actionId: string;
  contractId: string;
  clauseId?: string;
  changes?: Record<string, unknown>;
}

export interface AutoFixResponse {
  success: boolean;
  contractId: string;
  actionId: string;
  changes: {
    before: string;
    after: string;
    fieldName: string;
  };
  timestamp: string;
  message: string;
}

/**
 * Hook to apply an AI-suggested fix
 * Posts to /api/contracts/:id/auto-fix
 */
export function useAutoFix() {
  const queryClient = useQueryClient();

  return useMutation<AutoFixResponse, Error, AutoFixRequest>({
    mutationFn: async ({ contractId, actionId, changes }: AutoFixRequest) => {
      const response = await fetch(`/api/contracts/${contractId}/auto-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionId,
          changes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to apply fix');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['contracts', data.contractId] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['ai', 'activity'] });

      // Show success toast
      toast.success('Fix Applied Successfully', {
        description: data.message,
      });
    },
    onError: (error) => {
      toast.error('Failed to Apply Fix', {
        description: error.message || 'Something went wrong',
      });
    },
  });
}

/**
 * Hook to fetch fix preview data before applying
 */
export function useGetFixPreview(contractId: string, actionId: string) {
  return {
    fetchPreview: async () => {
      const response = await fetch(
        `/api/contracts/${contractId}/actions/${actionId}/preview`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch fix preview');
      }
      return response.json();
    },
  };
}
