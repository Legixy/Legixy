/**
 * /src/shared/api/ai.ts
 *
 * TanStack Query hooks for AI analysis operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ai, ApiError } from '@/lib/api';
import { toast } from 'sonner';

export const aiKeys = {
  all: ['ai'] as const,
  analyses: () => [...aiKeys.all, 'analyses'] as const,
  analysis: (contractId: string) => [...aiKeys.analyses(), contractId] as const,
  suggestions: (contractId: string) => [...aiKeys.all, 'suggestions', contractId] as const,
};

/**
 * Trigger analysis for a contract
 */
export function useTriggerAnalysis() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string; analysisId: string; status: string }, ApiError, string>({
    mutationFn: (contractId) => ai.triggerAnalysis(contractId),
    onSuccess: (result, contractId) => {
      toast.success('Analysis started. Processing your contract...');
      // Invalidate to refetch latest analysis
      queryClient.invalidateQueries({ queryKey: aiKeys.analysis(contractId) });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to start analysis');
    },
  });
}

/**
 * Fetch analysis results for a contract
 */
export function useAnalysisResults(contractId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiKeys.analysis(contractId),
    queryFn: () => ai.getResults(contractId),
    enabled: options?.enabled !== false && !!contractId,
    refetchInterval: 2000, // Poll every 2 seconds during analysis
  });
}

/**
 * Fetch AI suggestions for a contract
 */
export function useSuggestions(contractId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiKeys.suggestions(contractId),
    queryFn: () => ai.getSuggestions(contractId),
    enabled: options?.enabled !== false && !!contractId,
  });
}
