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
  insights: () => [...aiKeys.all, 'insights'] as const,
  activity: () => [...aiKeys.all, 'activity'] as const,
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

/**
 * Fetch AI insights dashboard
 * Returns: risks detected, expiring contracts, financial exposure, compliance score
 */
export function useAIInsights() {
  return useQuery({
    queryKey: aiKeys.insights(),
    queryFn: async () => {
      // Mock data - in production, this would fetch from /api/ai/insights
      return {
        risksDetected: 2,
        expiringContracts: 1,
        financialExposure: 12000,
        complianceScore: 78,
      };
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });
}

/**
 * Fetch AI activity feed
 * Returns: recent AI actions (risks detected, clauses fixed, analysis completed)
 */
export function useAIActivity() {
  return useQuery({
    queryKey: aiKeys.activity(),
    queryFn: async () => {
      // Mock data - in production, this would fetch from /api/ai/activity
      return {
        activities: [
          {
            id: '1',
            type: 'analysis' as const,
            message: 'Analyzing contract for risks...',
            timestamp: new Date(Date.now() - 30000),
            status: 'processing' as const,
          },
          {
            id: '2',
            type: 'risk' as const,
            message: 'Payment clause deviates from MSME norms',
            timestamp: new Date(Date.now() - 60000),
            status: 'completed' as const,
          },
          {
            id: '3',
            type: 'fix' as const,
            message: 'Liability clause has been suggested for fix',
            timestamp: new Date(Date.now() - 120000),
            status: 'completed' as const,
          },
        ],
      };
    },
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });
}
