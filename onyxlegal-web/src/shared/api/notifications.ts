import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications as notifApi } from '@/lib/api';

export const notifKeys = {
  all: ['notifications'] as const,
  list: () => [...notifKeys.all, 'list'] as const,
  count: () => [...notifKeys.all, 'count'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notifKeys.list(),
    queryFn: () => notifApi.list(),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notifKeys.count(),
    queryFn: () => notifApi.unreadCount(),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.list() });
      qc.invalidateQueries({ queryKey: notifKeys.count() });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notifKeys.list() });
      qc.invalidateQueries({ queryKey: notifKeys.count() });
    },
  });
}
