/**
 * OnyxLegal API Client
 *
 * Centralized HTTP client for communicating with onyxlegal-core.
 * In development, uses a dev JWT token. In production, integrates with Supabase Auth.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Dev JWT — auto-generated for test-user-001 (Abdul Kadir / OnyxLegal HQ)
// Replace with Supabase Auth token in production
let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, error.detail || 'Request failed', error);
  }

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth ────────────────────────────────────────────────────
export const auth = {
  signup: (data: { supabaseId: string; email: string; name: string; companyName: string }) =>
    request<{
      user: { id: string; email: string; name: string; role: string };
      tenant: { id: string; name: string; plan: string };
      isNew: boolean;
    }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  me: () =>
    request<{
      user: {
        id: string;
        supabaseId: string;
        tenantId: string;
        email: string;
        name: string | null;
        role: string;
        tenant: { id: string; name: string; plan: string; aiTokensUsed: number; aiTokenLimit: number };
      };
    }>('/auth/me'),
};

// ── Contracts ───────────────────────────────────────────────
export interface Contract {
  id: string;
  tenantId: string;
  templateId: string | null;
  title: string;
  status: string;
  riskScore: number | null;
  parties: { name: string; email?: string; role: string }[];
  content: string | null;
  contractValue: string | null;
  currency: string;
  monthlyImpact: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  signedAt: string | null;
  createdAt: string;
  updatedAt: string;
  template?: { id: string; name: string; category: string } | null;
  createdBy?: { id: string; name: string; email: string };
  clauses?: Clause[];
  _count?: { analyses: number };
}

export interface Clause {
  id: string;
  contractId: string;
  type: string;
  section: string | null;
  originalText: string;
  suggestedText: string | null;
  riskLevel: string;
  riskReason: string | null;
  estimatedImpact: string | null;
  isAccepted: boolean;
}

export interface ContractListResponse {
  data: Contract[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const contracts = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return request<ContractListResponse>(`/contracts${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) =>
    request<Contract>(`/contracts/${id}`),

  create: (data: {
    title: string;
    templateId?: string;
    content?: string;
    parties?: { name: string; email?: string; role: string }[];
    contractValue?: number;
    currency?: string;
    effectiveDate?: string;
    expirationDate?: string;
  }) => request<Contract>('/contracts', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    request<Contract>(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: string) =>
    request<Contract>(`/contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  stats: () =>
    request<{
      totalContracts: number;
      activeContracts: number;
      draftContracts: number;
      highRiskClauses: number;
      analysesThisMonth: number;
    }>('/contracts/stats'),

  acceptFix: (contractId: string, clauseId: string) =>
    request(`/contracts/${contractId}/clauses/${clauseId}/accept-fix`, { method: 'POST' }),

  // ── Action Panel APIs ──────────────────────────────────────
  getActionPanel: (contractId: string) =>
    request<ContractActionResponse>(`/contracts/${contractId}/action-panel`),

  fixClause: (contractId: string, clauseId: string) =>
    request<FixResult & { newRiskScore: number }>(`/contracts/${contractId}/fix-clause/${clauseId}`, { method: 'POST' }),

  fixAll: (contractId: string, riskLevels?: string[]) =>
    request<BulkFixResult>(`/contracts/${contractId}/fix-all`, {
      method: 'POST',
      body: JSON.stringify(riskLevels ? { riskLevels } : {}),
    }),

  getProgress: (contractId: string) =>
    request<ContractProgress>(`/contracts/${contractId}/progress`),
};

// ── Action Panel Types ──────────────────────────────────────
export interface SimpleRisk {
  level: string;
  emoji: string;
  headline: string;
  explanation: string;
  businessImpact: string;
  recommendedAction: string;
  severity: 'ignore' | 'fix' | 'fixAsap' | 'dealbreaker';
}

export interface RiskSummary {
  totalRisks: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  safe: number;
  overallSeverity: 'clean' | 'minor' | 'significant' | 'severe' | 'critical';
  topThreats: SimpleRisk[];
  fixableSoonCount: number;
  needsLawyerReviewCount: number;
}

export interface FixResult {
  success: boolean;
  clauseId: string;
  originalText: string;
  fixedText: string;
  changeType: 'improvement' | 'mitigation' | 'removal';
  estimatedImpactReduction: number;
}

export interface BulkFixResult {
  contractId: string;
  totalClauses: number;
  appliedFixes: number;
  skippedClauses: number;
  riskReductionPercent: number;
  estimatedSavings: number;
  results: FixResult[];
  versionNumber: number;
}

export interface ContractActionResponse {
  contractId: string;
  title: string;
  status: string;
  riskScore: number;
  riskSummary: RiskSummary;
  progress: {
    pendingFixes: number;
    fixedCount: number;
    progressPercent: number;
  };
  actionItems: Array<{
    id: string;
    severity: string;
    action: string;
    estimatedTime: string;
  }>;
}

export interface ContractProgress {
  contractId: string;
  totalClauses: number;
  fixedClauses: number;
  pendingFixes: number;
  criticalPending: number;
  progressPercent: number;
  fixingComplete: boolean;
  readyForReview: boolean;
}

// ── Templates ───────────────────────────────────────────────
export interface Template {
  id: string;
  tenantId: string | null;
  category: string;
  name: string;
  description: string | null;
  riskScore: number;
  clauseBlocks: string; // JSON string
  isSystem: boolean;
  usageCount: number;
  socialProof: string | null;
  createdAt: string;
}

export const templates = {
  list: (category?: string) => {
    const qs = category ? `?category=${category}` : '';
    return request<Template[]>(`/templates${qs}`);
  },

  get: (id: string) =>
    request<Template>(`/templates/${id}`),

  seed: () =>
    request<{ seeded: boolean; count: number }>('/templates/seed', { method: 'POST' }),
};

// ── AI ──────────────────────────────────────────────────────
export const ai = {
  triggerAnalysis: (contractId: string) =>
    request<{ message: string; analysisId: string; status: string }>(
      `/ai/analyze/${contractId}`,
      { method: 'POST' },
    ),

  getResults: (contractId: string) =>
    request<{ contractId: string; analyses: unknown[] }>(`/ai/analysis/${contractId}`),

  getSuggestions: (contractId: string) =>
    request<{ contractId: string; suggestions: Clause[] }>(`/ai/suggestions/${contractId}`),
};

// ── Analytics ───────────────────────────────────────────────
export interface DashboardMetrics {
  costSaved: number;
  costSavedFormatted: string;
  riskReduced: number;
  timeSavedHours: number;
  totalContracts: number;
  activeContracts: number;
  highRiskClauses: number;
  resolvedClauses: number;
  analysesThisMonth: number;
  aiUsage: { tokensUsed: number; tokenLimit: number; plan: string } | null;
}

export const analytics = {
  dashboard: () =>
    request<DashboardMetrics>('/analytics/dashboard'),

  riskOverview: () =>
    request<{ distribution: unknown[]; riskByClauseType: unknown[] }>('/analytics/risk-overview'),
};

// ── Notifications ───────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

export const notifications = {
  list: (unreadOnly = false) =>
    request<Notification[]>(`/notifications${unreadOnly ? '?unread=true' : ''}`),

  unreadCount: () =>
    request<{ unreadCount: number }>('/notifications/count'),

  markRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllRead: () =>
    request<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }),
};
