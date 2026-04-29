'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getTokenFromCookie } from '@/lib/api';

interface AnalysisEvent {
  contractId: string;
  analysisId: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: unknown;
  error?: string;
  tokensUsed?: number;
  processingMs?: number;
  timestamp: string;
}

interface RealtimeState {
  status: 'idle' | 'connected' | 'queued' | 'processing' | 'completed' | 'failed';
  result: unknown | null;
  error: string | null;
  tokensUsed: number | null;
  processingMs: number | null;
  isLoading: boolean;
}

const NEST_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';

export function useRealtimeUpdates(contractId: string | null) {
  const socketRef = useRef<{ disconnect: () => void; emit: (ev: string, data: unknown) => void; on: (ev: string, cb: (...a: unknown[]) => void) => void } | null>(null);
  const [state, setState] = useState<RealtimeState>({
    status: 'idle',
    result: null,
    error: null,
    tokensUsed: null,
    processingMs: null,
    isLoading: false,
  });

  useEffect(() => {
    if (!contractId) return;

    const token = getTokenFromCookie();
    if (!token) return;

    let cancelled = false;

    const initSocket = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const socketIO = await import('socket.io-client' as any);
        if (cancelled) return;

        const io = (socketIO as { default?: typeof socketIO.io }).default ?? socketIO.io;
        const socket = io(NEST_BASE, {
          transports: ['websocket', 'polling'],
          auth: { token },
        });

        socket.on('connection_established', () => {
          if (!cancelled) setState((prev) => ({ ...prev, status: 'connected' }));
        });
        socket.on('analysis_started', () => {
          if (!cancelled) setState((prev) => ({ ...prev, status: 'processing', isLoading: true }));
        });
        socket.on('analysis_completed', (data: AnalysisEvent) => {
          if (!cancelled)
            setState((prev) => ({
              ...prev,
              status: 'completed',
              result: data.result ?? null,
              tokensUsed: data.tokensUsed ?? null,
              processingMs: data.processingMs ?? null,
              isLoading: false,
              error: null,
            }));
        });
        socket.on('analysis_failed', (data: AnalysisEvent) => {
          if (!cancelled)
            setState((prev) => ({
              ...prev,
              status: 'failed',
              error: data.error ?? 'Analysis failed',
              isLoading: false,
            }));
        });
        socket.on('disconnect', () => {
          if (!cancelled) setState((prev) => ({ ...prev, status: 'idle' }));
        });

        socket.emit('subscribe_contract', { contractId });
        socketRef.current = socket as typeof socketRef.current;
      } catch {
        // socket.io-client not installed — silent fallback to polling via TanStack Query
      }
    };

    initSocket();

    return () => {
      cancelled = true;
      socketRef.current?.emit('unsubscribe_contract', { contractId });
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [contractId]);

  const reset = useCallback(() => {
    setState({ status: 'idle', result: null, error: null, tokensUsed: null, processingMs: null, isLoading: false });
  }, []);

  return { ...state, reset, isConnected: state.status !== 'idle' };
}

/**
 * Queue stats — reads token from cookie instead of localStorage.
 */
export function useQueueStats() {
  const [stats, setStats] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) return;

    let cancelled = false;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${NEST_BASE}/api/v1/ai/queue/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) setStats(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch_();
    const interval = setInterval(fetch_, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return { stats, loading };
}

/**
 * Analysis status polling — reads token from cookie.
 */
export function useAnalysisStatus(analysisId: string | null) {
  const [status, setStatus] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token || !analysisId) return;

    let cancelled = false;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${NEST_BASE}/api/v1/ai/analysis/${analysisId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch_();
    const interval = setInterval(() => {
      const s = status as { status?: string } | null;
      if (s?.status !== 'COMPLETED' && s?.status !== 'FAILED') fetch_();
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  return { status, loading };
}
