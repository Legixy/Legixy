/**
 * /src/shared/api/analytics.ts
 *
 * TanStack Query hooks for analytics operations
 */

import { useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  riskOverview: () => [...analyticsKeys.all, 'risk-overview'] as const,
};

/**
 * Fetch dashboard metrics
 */
export function useDashboardMetrics() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: () => analytics.dashboard(),
  });
}

/**
 * Fetch risk overview data
 */
export function useRiskOverview() {
  return useQuery({
    queryKey: analyticsKeys.riskOverview(),
    queryFn: () => analytics.riskOverview(),
  });
}
