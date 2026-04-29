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
 * Fetch AI insights — derived from analytics dashboard + contract stats.
 */
export function useAIInsights() {
  return useQuery({
    queryKey: aiKeys.insights(),
    queryFn: async () => {
      const metrics = await import('@/lib/api').then((m) => m.analytics.dashboard());
      return {
        risksDetected: metrics.highRiskClauses,
        expiringContracts: 0, // No expiry endpoint yet — placeholder
        financialExposure: metrics.costSaved * 1000,
        complianceScore: metrics.riskReduced,
      };
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

/**
 * Fetch AI activity feed from notifications.
 */
export function useAIActivity() {
  return useQuery({
    queryKey: aiKeys.activity(),
    queryFn: async () => {
      const notifs = await import('@/lib/api').then((m) => m.notifications.list());
      const typeMap: Record<string, 'analysis' | 'risk' | 'fix' | 'insight'> = {
        RISK_ALERT: 'risk',
        AI_FIX_READY: 'fix',
        ANALYSIS_COMPLETE: 'analysis',
        SYSTEM: 'insight',
        SIGNATURE_PENDING: 'insight',
        CONTRACT_EXPIRING: 'insight',
      };
      return {
        activities: notifs.slice(0, 10).map((n) => ({
          id: n.id,
          type: typeMap[n.type] ?? 'insight',
          message: n.body,
          timestamp: new Date(n.createdAt),
          status: 'completed' as const,
        })),
      };
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}
