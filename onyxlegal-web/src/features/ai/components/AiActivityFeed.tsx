/**
 * /src/features/ai/components/AiActivityFeed.tsx
 *
 * Real-time AI activity feed showing analysis progress
 * Polls /api/ai/activity every 5 seconds with animations
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAIStore, type AIActivityItem } from '@/shared/store/ai.store';
import { AlertTriangle, CheckCircle, Zap, Loader2, Clock } from 'lucide-react';

const activityIcons: Record<string, React.ReactNode> = {
  risk: <AlertTriangle className="w-4 h-4 text-red-600" />,
  fix: <CheckCircle className="w-4 h-4 text-emerald-600" />,
  analysis: <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />,
  insight: <Zap className="w-4 h-4 text-amber-600" />,
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffMins > 60) return `${Math.floor(diffMins / 60)}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return `${diffSecs}s ago`;
}

/**
 * Fetch mock activity data
 * In production, this would fetch from /api/ai/activity
 */
function useAIActivity() {
  return useQuery({
    queryKey: ['ai', 'activity'],
    queryFn: async () => {
      // Mock API response - in production, fetch from real endpoint
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
          {
            id: '4',
            type: 'insight' as const,
            message: 'High risk termination clause detected',
            timestamp: new Date(Date.now() - 180000),
            status: 'completed' as const,
          },
        ],
      };
    },
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });
}

export function AiActivityFeed() {
  const { data } = useAIActivity();
  const { activities, addActivity } = useAIStore();

  // Initialize activities from API
  useEffect(() => {
    if (data?.activities && activities.length === 0) {
      data.activities.forEach((activity) => {
        addActivity({
          ...activity,
          timestamp: new Date(activity.timestamp),
        } as AIActivityItem);
      });
    }
  }, [data, activities.length, addActivity]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          AI Activity Feed
        </h3>
        <span className="text-xs text-slate-500">Live</span>
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-75 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">No activities yet</p>
          </div>
        ) : (
          activities.slice(0, 10).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {activityIcons[activity.type] || <Clock className="w-4 h-4 text-slate-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 line-clamp-2">{activity.message}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>

              {/* Status Badge */}
              {activity.status === 'processing' && (
                <div className="shrink-0 px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded">
                  Processing
                </div>
              )}
              {activity.status === 'completed' && (
                <div className="shrink-0 px-2 py-1 text-xs font-medium text-emerald-600 bg-emerald-50 rounded">
                  Done
                </div>
              )}
              {activity.status === 'failed' && (
                <div className="shrink-0 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">
                  Failed
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {activities.length > 10 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  );
}
