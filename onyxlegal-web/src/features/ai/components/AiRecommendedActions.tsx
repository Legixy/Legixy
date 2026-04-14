/**
 * /src/features/ai/components/AiRecommendedActions.tsx
 *
 * AI-powered action recommendations engine
 * Shows prioritized actions that AI recommends to user
 * Drives immediate user action
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRecommendedActions } from '../hooks/useRecommendedActions';
import { AiAutoFixFlow } from './AiAutoFixFlow';
import { AlertTriangle, TrendingDown, Clock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  impact: {
    type: 'financial' | 'risk' | 'compliance';
    value: number;
    unit: string; // '₹', '%', 'points'
  };
  urgency: 'high' | 'medium' | 'low';
  contractId?: string;
  contractTitle?: string;
  actionType: 'fix' | 'review' | 'renew' | 'update';
  estimatedTime?: string;
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'high':
      return 'border-red-200 bg-red-50';
    case 'medium':
      return 'border-amber-200 bg-amber-50';
    case 'low':
      return 'border-blue-200 bg-blue-50';
    default:
      return 'border-slate-200 bg-white';
  }
}

function getUrgencyIcon(urgency: string) {
  switch (urgency) {
    case 'high':
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case 'medium':
      return <Clock className="w-5 h-5 text-amber-600" />;
    case 'low':
      return <TrendingDown className="w-5 h-5 text-blue-600" />;
    default:
      return null;
  }
}

function getImpactColor(type: string): string {
  switch (type) {
    case 'financial':
      return 'text-emerald-600 bg-emerald-50';
    case 'risk':
      return 'text-red-600 bg-red-50';
    case 'compliance':
      return 'text-indigo-600 bg-indigo-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
}

export function AiRecommendedActions() {
  const router = useRouter();
  const { data, isLoading, error } = useRecommendedActions();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showAutoFixFlow, setShowAutoFixFlow] = useState(false);
  const [fixFlowData, setFixFlowData] = useState<{
    contractId: string;
    actionId: string;
    title: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin mr-2" />
          <p className="text-slate-600">Loading AI recommendations...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5" />
          <p>Failed to load AI recommendations</p>
        </div>
      </div>
    );
  }

  const actions = data.actions.slice(0, 4); // Show top 4 actions

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-indigo-600" />
          AI-Recommended Actions
        </h3>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          {actions.length} actions
        </span>
      </div>

      {/* Impact Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-xs text-emerald-600 font-medium mb-1">💰 Financial Impact</p>
          <p className="text-lg font-bold text-emerald-900">₹{data.totalImpact.financial.toLocaleString()}</p>
          <p className="text-xs text-emerald-700">Potential savings</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs text-red-600 font-medium mb-1">⚠️ Risk Reduction</p>
          <p className="text-lg font-bold text-red-900">{data.totalImpact.riskReduction}%</p>
          <p className="text-xs text-red-700">Risk mitigation</p>
        </div>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={`border-l-4 rounded-lg p-4 transition-all duration-200 ${getUrgencyColor(action.urgency)}`}
            style={{
              borderLeftColor:
                action.urgency === 'high'
                  ? '#dc2626'
                  : action.urgency === 'medium'
                    ? '#f59e0b'
                    : '#3b82f6',
            }}
          >
            {/* Action Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">{getUrgencyIcon(action.urgency)}</div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900">{action.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{action.description}</p>
                </div>
              </div>
            </div>

            {/* Contract Info */}
            {action.contractTitle && (
              <p className="text-xs text-slate-500 mb-2 pl-8">
                📄 {action.contractTitle}
              </p>
            )}

            {/* Impact & Action Row */}
            <div className="flex items-center justify-between gap-3 pl-8">
              {/* Impact Badge */}
              <div className={`px-2.5 py-1 rounded text-xs font-medium ${getImpactColor(action.impact.type)}`}>
                {action.impact.type === 'financial' && '💰'}
                {action.impact.type === 'risk' && '⚠️'}
                {action.impact.type === 'compliance' && '✓'}
                {action.impact.value}
                {action.impact.unit}
              </div>

              {/* Time Estimate */}
              {action.estimatedTime && (
                <span className="text-xs text-slate-500">⏱️ {action.estimatedTime}</span>
              )}

              {/* Action Button */}
              <button
                onClick={() => {
                  if (action.contractId) {
                    setFixFlowData({
                      contractId: action.contractId,
                      actionId: action.id,
                      title: action.title,
                    });
                    setShowAutoFixFlow(true);
                  }
                }}
                className="ml-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
              >
                {action.actionType === 'fix' && '⚡ Fix Now'}
                {action.actionType === 'renew' && '🔄 Review & Renew'}
                {action.actionType === 'update' && '✏️ Update'}
                {action.actionType === 'review' && '👀 Review'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View All Actions CTA */}
      {actions.length < (data.actions.length || 0) && (
        <button className="w-full py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg transition-colors">
          View all {data.actions.length} recommendations
        </button>
      )}

      {/* Call to Action */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-6">
        <p className="text-xs text-indigo-900 mb-2">
          🤖 <strong>AI is ready to help:</strong> Approve any action above and AI will execute it instantly.
        </p>
        <p className="text-xs text-indigo-700">
          Each fix is reviewed for compliance before applying.
        </p>
      </div>

      {/* Auto-Fix Flow Modal */}
      {fixFlowData && (
        <AiAutoFixFlow
          isOpen={showAutoFixFlow}
          contractId={fixFlowData.contractId}
          actionId={fixFlowData.actionId}
          actionTitle={fixFlowData.title}
          onClose={() => {
            setShowAutoFixFlow(false);
            setFixFlowData(null);
          }}
          onSuccess={() => {
            // Optional: handle success callback
          }}
        />
      )}
    </div>
  );
}
