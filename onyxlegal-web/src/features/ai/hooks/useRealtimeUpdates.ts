/**
 * useRealtimeUpdates — React Hook for WebSocket Real-Time Updates
 *
 * Usage:
 * const { status, result, error } = useRealtimeUpdates(contractId);
 *
 * Events:
 * - analysis_started: {contractId, analysisId, status}
 * - analysis_completed: {contractId, analysisId, status, result, tokensUsed, processingMs}
 * - analysis_failed: {contractId, analysisId, status, error}
 * - fix_applied: {contractId, clauseId}
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

interface AnalysisEvent {
  contractId: string;
  analysisId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: any;
  error?: string;
  tokensUsed?: number;
  processingMs?: number;
  timestamp: string;
}

interface RealtimeState {
  status: 'idle' | 'connected' | 'queued' | 'processing' | 'completed' | 'failed';
  result: any | null;
  error: string | null;
  tokensUsed: number | null;
  processingMs: number | null;
  isLoading: boolean;
}

export function useRealtimeUpdates(contractId: string | null) {
  const socketRef = useRef<any>(null);
  const [user, setUser] = useState<any>(null);
  const [state, setState] = useState<RealtimeState>({
    status: 'idle',
    result: null,
    error: null,
    tokensUsed: null,
    processingMs: null,
    isLoading: false,
  });

  // Get user from localStorage (client-side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  useEffect(() => {
    if (!user || !contractId) return;

    // Dynamic import of socket.io-client (client-side only)
    const initSocket = async () => {
      try {
        const socketIO = await import('socket.io-client');
        const io = socketIO.default || socketIO.io;

        const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
          transports: ['websocket', 'polling'],
          headers: {
            'x-user-id': user.id,
            'x-tenant-id': user.tenantId,
          },
        });

        socket.on('connection_established', () => {
          console.log('✅ Connected to WebSocket server');
          setState((prev) => ({ ...prev, status: 'connected' }));
        });

        socket.on('analysis_started', (data: AnalysisEvent) => {
          console.log('📊 Analysis started:', data.analysisId);
          setState((prev) => ({
            ...prev,
            status: 'processing',
            isLoading: true,
          }));
        });

        socket.on('analysis_completed', (data: AnalysisEvent) => {
          console.log('✅ Analysis completed:', data.analysisId);
          setState((prev) => ({
            ...prev,
            status: 'completed',
            result: data.result,
            tokensUsed: data.tokensUsed || null,
            processingMs: data.processingMs || null,
            isLoading: false,
            error: null,
          }));
        });

        socket.on('analysis_failed', (data: AnalysisEvent) => {
          console.error('❌ Analysis failed:', data.error);
          setState((prev) => ({
            ...prev,
            status: 'failed',
            error: data.error || 'Analysis failed',
            isLoading: false,
          }));
        });

        socket.on('error', (error: any) => {
          console.error('WebSocket error:', error);
          setState((prev) => ({
            ...prev,
            error: 'WebSocket connection error',
            status: 'failed',
          }));
        });

        socket.on('disconnect', () => {
          console.log('❌ Disconnected from WebSocket server');
          setState((prev) => ({ ...prev, status: 'idle' }));
        });

        socketRef.current = socket;
      } catch (error) {
        console.warn('socket.io-client not available, using polling fallback');
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, contractId]);

  /**
   * Subscribe to contract updates
   */
  useEffect(() => {
    if (!socketRef.current || !contractId) return;

    socketRef.current.emit('subscribe_contract', { contractId });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe_contract', { contractId });
      }
    };
  }, [contractId]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      result: null,
      error: null,
      tokensUsed: null,
      processingMs: null,
      isLoading: false,
    });
  }, []);

  return {
    ...state,
    reset,
    isConnected: state.status === 'connected' || state.status !== 'idle',
  };
}

/**
 * Hook for queue monitoring
 */
export function useQueueStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/ai/queue/stats', {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch queue stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Poll every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, [user]);

  return { stats, loading };
}

/**
 * Hook for analysis status polling (fallback if WebSocket fails)
 */
export function useAnalysisStatus(analysisId: string | null) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!user || !analysisId) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/v1/ai/analysis/${analysisId}/status`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch analysis status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Only poll if not completed or failed
    const interval = setInterval(() => {
      if (status?.status !== 'COMPLETED' && status?.status !== 'FAILED') {
        fetchStatus();
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [user, analysisId, status?.status]);

  return { status, loading };
}
