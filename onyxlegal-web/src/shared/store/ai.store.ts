/**
 * /src/shared/store/ai.store.ts
 *
 * Zustand store for centralized AI state management
 * Ensures consistent AI behavior across the entire app
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  icon: string;
  action?: string;
}

export interface AIActivityItem {
  id: string;
  type: 'risk' | 'fix' | 'analysis' | 'insight';
  message: string;
  timestamp: Date;
  contractId?: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface AIState {
  // Insights
  insights: AIInsight[];
  setInsights: (insights: AIInsight[]) => void;
  addInsight: (insight: AIInsight) => void;
  removeInsight: (id: string) => void;

  // Activity Feed
  activities: AIActivityItem[];
  addActivity: (activity: AIActivityItem) => void;
  clearActivities: () => void;

  // Analysis Status
  analysisInProgress: Record<string, boolean>;
  setAnalysisInProgress: (contractId: string, inProgress: boolean) => void;

  // Loading States
  isLoadingInsights: boolean;
  setIsLoadingInsights: (loading: boolean) => void;

  // Timestamps
  lastInsightsRefresh: number | null;
  setLastInsightsRefresh: (timestamp: number) => void;
}

export const useAIStore = create<AIState>()(
  devtools(
    (set: any) => ({
      // Insights
      insights: [],
      setInsights: (insights: AIInsight[]) => set({ insights }),
      addInsight: (insight: AIInsight) =>
        set((state: AIState) => ({
          insights: [insight, ...state.insights].slice(0, 10), // Keep last 10
        })),
      removeInsight: (id: string) =>
        set((state: AIState) => ({
          insights: state.insights.filter((i: AIInsight) => i.id !== id),
        })),

      // Activity Feed
      activities: [],
      addActivity: (activity: AIActivityItem) =>
        set((state: AIState) => ({
          activities: [activity, ...state.activities].slice(0, 20), // Keep last 20
        })),
      clearActivities: () => set({ activities: [] }),

      // Analysis Status
      analysisInProgress: {},
      setAnalysisInProgress: (contractId: string, inProgress: boolean) =>
        set((state: AIState) => ({
          analysisInProgress: {
            ...state.analysisInProgress,
            [contractId]: inProgress,
          },
        })),

      // Loading States
      isLoadingInsights: false,
      setIsLoadingInsights: (loading: boolean) => set({ isLoadingInsights: loading }),

      // Timestamps
      lastInsightsRefresh: null,
      setLastInsightsRefresh: (timestamp: number) => set({ lastInsightsRefresh: timestamp }),
    }),
    { name: 'AIStore' }
  )
);
