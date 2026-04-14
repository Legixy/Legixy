/**
 * /src/features/ai/hooks/useRecommendedActions.ts
 *
 * React Query hook for fetching AI-recommended actions
 * Handles polling, caching, and error states
 */

import { useQuery } from '@tanstack/react-query';

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  impact: {
    type: 'financial' | 'risk' | 'compliance';
    value: number;
    unit: string;
  };
  urgency: 'high' | 'medium' | 'low';
  contractId?: string;
  contractTitle?: string;
  actionType: 'fix' | 'review' | 'renew' | 'update';
  estimatedTime?: string;
}

export interface RecommendedActionsResponse {
  actions: RecommendedAction[];
  totalImpact: {
    financial: number;
    riskReduction: number;
  };
}

/**
 * Hook to fetch AI-recommended actions
 * In production, connects to GET /api/ai/recommendations
 */
export function useRecommendedActions() {
  return useQuery<RecommendedActionsResponse>({
    queryKey: ['ai', 'recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/ai/recommendations');
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      return response.json();
    },
    refetchInterval: 60000, // Poll every minute
    staleTime: 30000,
  });
}

/**
 * Hook to fetch a single recommended action's preview/details
 */
export function useRecommendedActionDetails(actionId: string) {
  return useQuery({
    queryKey: ['ai', 'recommendations', actionId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/recommendations/${actionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch action details');
      }
      return response.json();
    },
    enabled: !!actionId,
  });
}

/**
 * Hook to apply a recommended action (auto-fix)
 */
export function useApplyAction() {
  return {
    mutate: async (actionId: string, contractId: string) => {
      const response = await fetch(`/api/contracts/${contractId}/actions/${actionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to apply action');
      }

      return response.json();
    },
  };
}

/**
 * Hook to dismiss a recommended action
 */
export function useDismissAction() {
  return {
    mutate: async (actionId: string) => {
      const response = await fetch(`/api/ai/recommendations/${actionId}/dismiss`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss action');
      }

      return response.json();
    },
  };
}
