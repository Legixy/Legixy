/**
 * /src/features/ai/hooks/useAiAlerts.ts
 *
 * React Query hook for fetching AI alerts
 * Handles critical notifications and unread count
 */

import { useQuery } from '@tanstack/react-query';

export interface AiAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  read: boolean;
}

export interface AlertsResponse {
  alerts: AiAlert[];
  unreadCount: number;
}

/**
 * Hook to fetch AI alerts
 * In production, connects to GET /api/ai/alerts
 */
export function useAiAlerts() {
  return useQuery<AlertsResponse>({
    queryKey: ['ai', 'alerts'],
    queryFn: async () => {
      const response = await fetch('/api/ai/alerts');
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }
      return response.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds for alerts
    staleTime: 15000,
  });
}

/**
 * Hook to mark an alert as read
 */
export function useMarkAlertAsRead() {
  return {
    mutate: async (alertId: string) => {
      const response = await fetch(`/api/ai/alerts/${alertId}/read`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark alert as read');
      }

      return response.json();
    },
  };
}

/**
 * Hook to dismiss an alert
 */
export function useDismissAlert() {
  return {
    mutate: async (alertId: string) => {
      const response = await fetch(`/api/ai/alerts/${alertId}/dismiss`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss alert');
      }

      return response.json();
    },
  };
}
