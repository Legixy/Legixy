/**
 * QueueDashboard — Monitor AI Processing Queue
 *
 * Displays:
 * - Jobs waiting in queue
 * - Currently processing jobs
 * - Failed jobs
 * - Average processing time
 * - Token usage
 */

'use client';

import React, { useState, useEffect } from 'react';

interface QueueStats {
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  workers: {
    count: number;
    isPaused: boolean;
  };
  timestamp: string;
  error?: string;
}

interface QueueDashboardProps {
  refreshInterval?: number; // ms
  onStatsUpdate?: (stats: QueueStats) => void;
}

export function QueueDashboard({
  refreshInterval = 5000,
  onStatsUpdate,
}: QueueDashboardProps) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage (in real app, use auth hook)
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      const response = await fetch('/api/v1/ai/queue/stats', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: QueueStats = await response.json();
      setStats(data);
      onStatsUpdate?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Failed to fetch queue stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll for stats
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (!stats) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="text-gray-500">
            {loading ? '⏳ Loading queue stats...' : '📊 Queue Dashboard'}
          </div>
        </div>
      </div>
    );
  }

  const totalJobs =
    stats.queue.waiting +
    stats.queue.active +
    stats.queue.completed +
    stats.queue.failed;

  const getStatusColor = (status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed') => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'active':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'delayed':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const StatCard = ({ label, value, status }: { label: string; value: number; status: string }) => (
    <div className={`flex-1 p-4 rounded-lg border ${getStatusColor(status as any)}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-3xl font-bold mt-2">{value}</div>
      {status === 'active' && <div className="text-xs mt-2">🔄 Processing</div>}
      {status === 'failed' && <div className="text-xs mt-2">⚠️ Retry</div>}
    </div>
  );

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">📊 Queue Monitor</h2>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-lg text-sm">
          ❌ Error: {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Waiting" value={stats.queue.waiting} status="waiting" />
        <StatCard label="Active" value={stats.queue.active} status="active" />
        <StatCard label="Completed" value={stats.queue.completed} status="completed" />
        <StatCard label="Failed" value={stats.queue.failed} status="failed" />
        <StatCard label="Delayed" value={stats.queue.delayed} status="delayed" />
      </div>

      {/* Workers Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-700">Workers Active</div>
          <div className="text-2xl font-bold text-blue-900 mt-2">{stats.workers.count}</div>
        </div>
        <div className={`p-4 rounded-lg border ${
          stats.workers.isPaused
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className={`text-sm font-medium ${
            stats.workers.isPaused ? 'text-yellow-700' : 'text-green-700'
          }`}>
            Queue Status
          </div>
          <div className={`text-2xl font-bold mt-2 ${
            stats.workers.isPaused ? 'text-yellow-900' : 'text-green-900'
          }`}>
            {stats.workers.isPaused ? '⏸️ Paused' : '✅ Running'}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Jobs</div>
            <div className="font-semibold text-lg">{totalJobs}</div>
          </div>
          <div>
            <div className="text-gray-600">Success Rate</div>
            <div className="font-semibold text-lg">
              {stats.queue.completed + stats.queue.failed > 0
                ? Math.round(
                    (stats.queue.completed / (stats.queue.completed + stats.queue.failed)) * 100,
                  )
                : 0}%
            </div>
          </div>
          <div>
            <div className="text-gray-600">Last Updated</div>
            <div className="font-semibold text-lg text-gray-700">
              {new Date(stats.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Queue Health Indicator */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-blue-900 mb-2">Queue Health</div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              stats.queue.active === 0 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{
              width: `${Math.min((stats.queue.active / Math.max(1, stats.queue.waiting + stats.queue.active + 1)) * 100, 100)}%`,
            }}
          />
        </div>
        <div className="text-xs text-blue-700 mt-2">
          {stats.queue.active === 0 && stats.queue.waiting === 0
            ? '✅ All caught up!'
            : `⚙️ Processing ${stats.queue.active} / ${stats.queue.waiting + stats.queue.active} jobs`}
        </div>
      </div>
    </div>
  );
}

export default QueueDashboard;
