/**
 * /src/features/ai/components/AiCommandCenter.tsx
 *
 * Dynamic AI insight panel for dashboard
 * Shows risk insights, expiring contracts, financial exposure
 * Fetches from /api/ai/insights and auto-refreshes every 30s
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAIStore } from '@/shared/store/ai.store';
import { AlertTriangle, Clock, TrendingDown, Loader2, RefreshCw } from 'lucide-react';

interface AIInsight {
  risksDetected: number;
  expiringContracts: number;
  financialExposure: number;
  complianceScore: number;
}

/**
 * Fetch AI insights
 * In production, this would fetch from /api/ai/insights
 */
function useAIInsights() {
  return useQuery({
    queryKey: ['ai', 'insights'],
    queryFn: async () => {
      // Mock API response
      return {
        risksDetected: 2,
        expiringContracts: 1,
        financialExposure: 12000, // ₹
        complianceScore: 78,
      } as AIInsight;
    },
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });
}

export function AiCommandCenter() {
  const { data, isLoading, refetch } = useAIInsights();
  const { setIsLoadingInsights, setLastInsightsRefresh } = useAIStore();

  // Update global store
  useEffect(() => {
    setIsLoadingInsights(isLoading);
    if (!isLoading) {
      setLastInsightsRefresh(Date.now());
    }
  }, [isLoading, setIsLoadingInsights, setLastInsightsRefresh]);

  if (!data) return null;

  return (
    <div className="mb-8 bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-200/50 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">AI Command Center</h2>
            <p className="text-xs text-slate-600">Real-time legal intelligence</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Risks Detected */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white/90 transition-all">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Risks Detected</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 mb-1">{data.risksDetected}</p>
              <p className="text-xs text-slate-600">
                ⚠️ {data.risksDetected} contract{data.risksDetected !== 1 ? 's' : ''} expose you to high liability
              </p>
            </>
          )}
        </div>

        {/* Expiring Contracts */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white/90 transition-all">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Expiring Soon</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 mb-1">{data.expiringContracts}</p>
              <p className="text-xs text-slate-600">
                📅 {data.expiringContracts} contract{data.expiringContracts !== 1 ? 's' : ''} expiring within 30 days
              </p>
            </>
          )}
        </div>

        {/* Financial Exposure */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white/90 transition-all">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Financial Exposure</span>
            <TrendingDown className="w-4 h-4 text-red-600" />
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900 mb-1">₹{data.financialExposure.toLocaleString()}</p>
              <p className="text-xs text-slate-600">
                💰 Potential loss detected from risky clauses
              </p>
            </>
          )}
        </div>

        {/* Compliance Score */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 hover:bg-white/90 transition-all">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Compliance Score</span>
            <div className="text-xl font-bold text-emerald-600">{data.complianceScore}%</div>
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              <span className="text-sm text-slate-500">Loading...</span>
            </div>
          ) : (
            <>
              {/* Compliance Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${Math.max(20, Math.min(data.complianceScore, 100))}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">
                ✓ {data.complianceScore === 100 ? 'Fully compliant' : 'Needs attention'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Summary Text */}
      {!isLoading && (
        <div className="mt-4 pt-4 border-t border-indigo-200/30">
          <p className="text-xs text-slate-600 leading-relaxed">
            🤖 OnyxAI has analyzed your portfolio and identified <strong>{data.risksDetected}</strong> high-priority issues.
            {data.expiringContracts > 0 && ` ${data.expiringContracts} contract${data.expiringContracts !== 1 ? 's are' : ' is'} expiring soon.`}
            Review your <strong>Risk Dashboard</strong> for detailed fixes.
          </p>
        </div>
      )}
    </div>
  );
}
