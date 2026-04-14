/**
 * /src/features/ai/components/AiAlerts.tsx
 *
 * Real-time AI alerts system
 * Proactively notifies user of critical issues detected
 */

'use client';

import { useEffect, useState } from 'react';
import { useAiAlerts } from '../hooks/useAiAlerts';
import { AlertTriangle, Bell, Clock, Zap, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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

function getAlertIcon(type: string) {
  switch (type) {
    case 'critical':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'warning':
      return <Clock className="w-5 h-5 text-amber-600" />;
    case 'info':
      return <Zap className="w-5 h-5 text-blue-600" />;
    default:
      return <Bell className="w-5 h-5 text-slate-600" />;
  }
}

function getAlertColor(type: string): string {
  switch (type) {
    case 'critical':
      return 'border-red-200 bg-red-50';
    case 'warning':
      return 'border-amber-200 bg-amber-50';
    case 'info':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-slate-200 bg-white';
  }
}

function formatTime(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function AiAlerts() {
  const { data, isLoading } = useAiAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  // Auto-toast new critical alerts
  useEffect(() => {
    if (data?.alerts) {
      const criticalUnread = data.alerts.find(
        (a) => a.type === 'critical' && !a.read && !dismissedAlerts.has(a.id),
      );
      if (criticalUnread) {
        toast.error(criticalUnread.title, {
          description: criticalUnread.message,
          action: {
            label: criticalUnread.actionLabel || 'View',
            onClick: () => {
              if (criticalUnread.actionUrl) {
                window.location.href = criticalUnread.actionUrl;
              }
            },
          },
        });
      }
    }
  }, [data?.alerts, dismissedAlerts]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="animate-pulse h-12 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!data || data.alerts.length === 0) {
    return null;
  }

  const visibleAlerts = data.alerts
    .filter((a) => !dismissedAlerts.has(a.id))
    .slice(0, showAll ? undefined : 3);

  const criticalAlerts = visibleAlerts.filter((a) => a.type === 'critical');
  const warningAlerts = visibleAlerts.filter((a) => a.type === 'warning');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          AI Alerts
        </h3>
        {data.unreadCount > 0 && (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full animate-pulse">
            {data.unreadCount} unread
          </span>
        )}
      </div>

      {/* Critical Alerts - Always Show */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 border-red-600 rounded-lg p-3 space-y-2 ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatTime(alert.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setDismissedAlerts((prev) => new Set(prev).add(alert.id))
                  }
                  className="p-1 hover:bg-red-200 rounded transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>

              {/* Action Button */}
              {alert.actionUrl && (
                <a
                  href={alert.actionUrl}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
                >
                  ⚡ {alert.actionLabel || 'Take Action'}
                  <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <div className="space-y-2">
          {warningAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 border-amber-600 rounded-lg p-3 opacity-90 hover:opacity-100 transition-opacity ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatTime(alert.createdAt)}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setDismissedAlerts((prev) => new Set(prev).add(alert.id))
                  }
                  className="p-1 hover:bg-amber-200 rounded transition-colors shrink-0"
                >
                  <X className="w-4 h-4 text-amber-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View All Button */}
      {!showAll && data.alerts.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg transition-colors"
        >
          View all {data.alerts.length} alerts
        </button>
      )}

      {/* AI Note */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
        <p className="text-xs text-indigo-900">
          🤖 AI monitors contracts 24/7 and alerts you to critical issues.
        </p>
      </div>
    </div>
  );
}
