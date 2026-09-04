const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Kept for server-side proxy reads (proxy.ts reads this server-side where HttpOnly is accessible)
export function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// No-op — cookie is now set HttpOnly by /api/auth/login server route
export function setTokenCookie(_token: string) {}
export function clearTokenCookie() {}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // credentials: 'include' sends the HttpOnly auth_token cookie automatically
  const res = await fetch(url, { ...options, headers, credentials: 'include' });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.message || error.detail || 'Request failed', error);
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
interface LoginResponse {
  access_token: string;
  user: { id: string; email: string; name: string | null; role: string; tenantId: string };
}

export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    // Goes through Next.js server route so the cookie is set HttpOnly
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    const data = await res.json().catch(() => ({ message: 'Login failed' }));
    if (!res.ok) throw new ApiError(res.status, data.message || 'Login failed', data);
    return data as LoginResponse;
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    companyName: string;
  }): Promise<LoginResponse> => {
    const res = await request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  },

  signup: (data: { supabaseId: string; email: string; name: string; companyName: string }) =>
    request<{
      user: { id: string; email: string; name: string | null; role: string };
      tenant: { id: string; name: string; plan: string };
      isNew: boolean;
    }>('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  me: () =>
    request<{
      user: {
        id: string;
        supabaseId: string | null;
        tenantId: string;
        email: string;
        name: string | null;
        role: string;
        tenant: { id: string; name: string; plan: string; aiTokensUsed: number; aiTokenLimit: number };
      };
    }>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
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

  delete: async (contractId: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/contracts/${contractId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, error.message || 'Delete failed', error);
    }
  },

  download: async (contractId: string): Promise<{ blob: Blob; filename: string }> => {
    const url = `${API_BASE}/contracts/${contractId}/download`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, error.message || 'Download failed', error);
    }
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match?.[1] || 'contract.txt';
    const blob = await res.blob();
    return { blob, filename };
  },

  upload: async (file: File, title?: string): Promise<Contract> => {
    const form = new FormData();
    form.append('file', file);
    if (title) form.append('title', title);
    const url = `${API_BASE}/contracts/upload`;
    const res = await fetch(url, {
      method: 'POST',
      body: form,
      credentials: 'include',
      // Do NOT set Content-Type — browser sets multipart boundary automatically
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, error.message || 'Upload failed', error);
    }
    return res.json() as Promise<Contract>;
  },
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
  clauseId?: string;
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

// ── Renegotiate ─────────────────────────────────────────────
export interface RenegotiateResult {
  contractId: string;
  clauseTitle: string;
  status: string;
  suggestedTerms: string[];
  message: string;
}

export const renegotiate = {
  request: (contractId: string, clauseTitle: string, notes?: string) =>
    request<RenegotiateResult>(`/contracts/${contractId}/renegotiate`, {
      method: 'POST',
      body: JSON.stringify({ clauseTitle, notes }),
    }),
};

// ── Compliance: Sites & Licences ────────────────────────────
//
// Status and daysUntilExpiry are computed SERVER-SIDE from the tenant's
// timezone and returned by the API. The browser must never recalculate
// them — see features/compliance/lib/format.ts for why.

/**
 * Every derived expiry status, as a value.
 *
 * The type alone was not enough: the licences page has to validate a status
 * arriving in a URL, and a type cannot do that at runtime. Mirrors
 * LICENSE_EXPIRY_STATUSES in the core's domain layer.
 */
export const LICENSE_EXPIRY_STATUSES = [
  'NO_EXPIRY',
  'ACTIVE',
  'EXPIRING_SOON',
  'CRITICAL',
  'EXPIRED',
] as const;

export type LicenseExpiryStatus = (typeof LICENSE_EXPIRY_STATUSES)[number];

export type LicenseLifecycle = 'ACTIVE' | 'ARCHIVED';

export interface ComplianceSummary {
  total: number;
  active: number;
  expiringSoon: number;
  critical: number;
  expired: number;
  noExpiry: number;
  needsAttention: number;
}

export interface Site {
  id: string;
  tenantId: string;
  name: string;
  code: string | null;
  city: string | null;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  _count: { licenses: number };
  /** Licences held AT this site. */
  compliance: ComplianceSummary;
  /**
   * Company-wide licences that also apply here. Present on the detail endpoint
   * only. Reported separately so they are neither double-counted across sites
   * nor dropped from view.
   */
  entityCompliance?: ComplianceSummary;
}

export interface License {
  id: string;
  tenantId: string;
  siteId: string | null;
  ownerUserId: string | null;
  name: string;
  licenseType: string | null;
  authority: string | null;
  licenseNumber: string | null;
  /**
   * PlainDate, "YYYY-MM-DD".
   *
   * Was an ISO instant until Slice 15. Licences were the last module emitting
   * midnight-UTC instants for `@db.Date` columns; `withStatus` computed the
   * status through a conversion and then spread the raw Prisma row back over
   * the result. The service now returns `SerialisedDates<T>`, which makes
   * that a compile error rather than a comment.
   */
  issueDate: string | null;
  expiryDate: string | null;
  lifecycle: LicenseLifecycle;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  site?: { id: string; name: string; city: string | null } | null;
  owner?: { id: string; name: string | null; email: string } | null;
  /** Server-derived. Authoritative. */
  status: LicenseExpiryStatus;
  daysUntilExpiry: number | null;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface LicenseFilters {
  siteId?: string;
  ownerUserId?: string;
  lifecycle?: LicenseLifecycle;
  expiryStatus?: LicenseExpiryStatus;
  needsAttention?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/** Licence fields the user may edit. tenantId is deliberately absent. */
export interface LicenseInput {
  name?: string;
  siteId?: string | null;
  ownerUserId?: string | null;
  licenseType?: string | null;
  authority?: string | null;
  licenseNumber?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const sites = {
  list: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    request<Paginated<Site>>(`/sites${toQuery(params ?? {})}`),

  get: (id: string) => request<Site>(`/sites/${id}`),

  /** Goes to SitesService.create, which audits and enforces name uniqueness. */
  create: (data: SiteCreateInput) =>
    request<Site>('/sites', { method: 'POST', body: JSON.stringify(data) }),
};

export interface SiteCreateInput {
  name: string;
  code?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface DeliverySettings {
  channelConfigured: boolean;
  channels: { name: string; available: boolean; detail: string }[];
  copyEmail: string | null;
  people: { id: string; name: string | null; email: string; licences: number }[];
  unassignedCount: number;
  activeTotal: number;
}

export interface YearAheadEntry {
  licenseId: string;
  name: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: LicenseExpiryStatus;
  siteName: string | null;
  authority: string | null;
  ownerName: string | null;
}

export interface YearAhead {
  from: string;
  to: string;
  months: { month: string; entries: YearAheadEntry[] }[];
  total: number;
  withoutExpiry: number;
  activeTotal: number;
}

export const yearAhead = {
  get: () => request<YearAhead>('/compliance/dashboard/year-ahead'),
};

export const delivery = {
  get: () => request<DeliverySettings>('/compliance/delivery'),

  setCopyEmail: (copyEmail: string | null) =>
    request<DeliverySettings>('/compliance/delivery/copy-email', {
      method: 'PATCH',
      body: JSON.stringify({ copyEmail }),
    }),
};

export const licenses = {
  list: (filters?: LicenseFilters) =>
    request<Paginated<License>>(`/licenses${toQuery(filters ?? {})}`),

  get: (id: string) => request<License>(`/licenses/${id}`),

  update: (id: string, data: LicenseInput) =>
    request<License>(`/licenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  archive: (id: string) =>
    request<License>(`/licenses/${id}/archive`, { method: 'POST' }),

  /**
   * Create one licence.
   *
   * Goes to POST /licenses, which is LicensesService.create — the same path
   * import commits through. That matters: create() calls reconcile(), so a
   * licence acquires its reminder ladder the moment it exists. Slice 5 found
   * a seed that wrote rows directly and left every licence with zero
   * obligations, which is a silent total failure of the product's promise.
   */
  create: (data: LicenseCreateInput) =>
    request<License>('/licenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Validate free-text fields without writing anything.
   *
   * This is Slice 10's `validateRow` behind an endpoint. The browser does not
   * parse dates: it asks the same validator import uses and renders whatever
   * it says, so the two surfaces can never disagree about what 01/02/2027
   * means.
   */
  check: (values: Partial<Record<ImportField, string>>) =>
    request<ResolvedRowCheck>('/licenses/check', {
      method: 'POST',
      body: JSON.stringify({ values }),
    }),
};

/** Create accepts a catalogue type id; LicenseInput (update) does not. */
export interface LicenseCreateInput {
  name: string;
  siteId?: string | null;
  ownerUserId?: string | null;
  licenseTypeId?: string | null;
  licenseNumber?: string | null;
  authority?: string | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

/** Mirrors ResolvedRow from the core's import domain. */
export interface ResolvedRowCheck {
  rowNumber: number;
  outcome: 'CREATE' | 'FAIL';
  issues: { field: ImportField | null; message: string }[];
  name: string;
  licenseNumber: string | null;
  authority: string | null;
  notes: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  rawLicenseType: string | null;
  rawSite: string | null;
  rawOwnerEmail: string | null;
}

// ── Tenant directory & reminder obligations ─────────────────
//
// Reminder dates are computed and persisted SERVER-SIDE from the licence's
// expiry date. The browser only renders them.

export interface TenantUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

export type ReminderStatus =
  | 'PENDING'
  | 'SENT'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'UNDELIVERABLE'
  | 'FAILED';

export type ReminderChannel = 'EMAIL';

export interface LicenseReminder {
  id: string;
  /** Days before expiry: 90 | 60 | 30 | 14 | 7. */
  offsetDays: number;
  /** Calendar date, "YYYY-MM-DD". Already server-computed — never recalculate. */
  dueOn: string;
  status: ReminderStatus;
  /** When delivery actually happened. May be later than dueOn. */
  sentAt: string | null;
  channel: ReminderChannel | null;
  attemptCount: number;
  lastError: string | null;
}

export const users = {
  /** People in the caller's own tenant. The API takes no tenant parameter. */
  list: () => request<TenantUser[]>('/users'),
};

export const reminders = {
  forLicense: (licenseId: string) =>
    request<LicenseReminder[]>(`/licenses/${licenseId}/reminders`),
};

// ── Compliance taxonomy & coverage ──────────────────────────

export type LicenseScope = 'ENTITY' | 'SITE';

export interface CoverageGap {
  licenseTypeId: string;
  licenseTypeName: string;
  licenseTypeNameAr: string;
  scope: LicenseScope;
  authorityName: string;
  authorityNameAr: string;
  /** Null for an entity-level gap — it belongs to the company, not a site. */
  siteId: string | null;
  siteName: string | null;
}

export interface OwnerLoad {
  /** Null is the unassigned bucket. */
  ownerUserId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  licenseCount: number;
}

export interface CatalogueLicenseType {
  id: string;
  name: string;
  nameAr: string;
  scope: LicenseScope;
  defaultCycleMonths: number | null;
  typicalFee: string | null;
  requiredDocuments: { code: string; label: string; labelAr: string }[];
  authority: { id: string; name: string; nameAr: string };
}

/**
 * Why the gap count is what it is.
 *
 * A count alone cannot tell "nothing declared" from "everything declared is
 * covered", and rendering those identically told a new tenant they were fully
 * covered when nothing was known about their business.
 */
export type CoverageState = 'NOT_CONFIGURED' | 'ALL_SATISFIED' | 'HAS_GAPS';

export interface CoverageOverview {
  requirementCount: number;
  gaps: CoverageGap[];
  state: CoverageState;
}

export interface RequirementRow {
  licenseTypeId: string;
  name: string;
  nameAr: string;
  scope: LicenseScope;
  authorityName: string;
  authorityNameAr: string;
  required: boolean;
}

export const coverage = {
  overview: () => request<CoverageOverview>('/compliance/coverage'),
  requirements: () => request<RequirementRow[]>('/compliance/requirements'),
  setRequirement: (licenseTypeId: string, required: boolean) =>
    request<{ licenseTypeId: string; required: boolean }>(
      `/compliance/requirements/${licenseTypeId}`,
      { method: 'PUT', body: JSON.stringify({ required }) },
    ),
  gaps: () => request<CoverageGap[]>('/compliance/gaps'),
  ownerLoad: () => request<OwnerLoad[]>('/compliance/owner-load'),
};

export const catalogue = {
  licenseTypes: () => request<CatalogueLicenseType[]>('/catalogue/license-types'),
};

// ── Licence documents ───────────────────────────────────────
//
// Files are streamed through the authenticated API. There are no signed URLs:
// a signed URL is a bearer capability that leaks through history and logs and
// cannot be revoked before it expires. Every read is tenant-checked server-side
// and recorded in the compliance audit log.

export interface LicenseDocument {
  id: string;
  licenseId: string;
  /** Which checklist requirement this satisfies. Null for an ad-hoc upload. */
  documentCode: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  /** ISO instant at midnight UTC. Read as a CALENDAR DATE only. */
  issuedOn: string | null;
  /** The DOCUMENT's own expiry — independent of the licence's expiry. */
  expiresOn: string | null;
  uploadedAt: string;
  uploadedBy: { id: string; name: string | null; email: string } | null;
}

/** Mirrors the server allowlist. The server sniffs magic bytes and decides. */
export const DOCUMENT_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const documents = {
  forLicense: (licenseId: string) =>
    request<LicenseDocument[]>(`/licenses/${licenseId}/documents`),

  upload: async (
    licenseId: string,
    file: File,
    meta?: { documentCode?: string | null; expiresOn?: string | null },
  ): Promise<LicenseDocument> => {
    const form = new FormData();
    form.append('file', file);
    if (meta?.documentCode) form.append('documentCode', meta.documentCode);
    if (meta?.expiresOn) form.append('expiresOn', meta.expiresOn);

    const res = await fetch(`${API_BASE}/licenses/${licenseId}/documents`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      // Do NOT set Content-Type — the browser sets the multipart boundary.
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, error.message || 'Upload failed', error);
    }
    return res.json() as Promise<LicenseDocument>;
  },

  /** Fetches the bytes as a blob so the caller can trigger a save. */
  download: async (
    licenseId: string,
    documentId: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(
      `${API_BASE}/licenses/${licenseId}/documents/${documentId}/download`,
      { credentials: 'include' },
    );
    if (!res.ok) {
      throw new ApiError(res.status, 'Could not download the document');
    }
    const disposition = res.headers.get('content-disposition') ?? '';
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'document';
    return { blob: await res.blob(), filename };
  },

  remove: (licenseId: string, documentId: string) =>
    request<LicenseDocument>(
      `/licenses/${licenseId}/documents/${documentId}`,
      { method: 'DELETE' },
    ),
};

// ── Renewal preparation ─────────────────────────────────────
//
// Read-only and entirely derived. Nothing about a renewal is stored, and there
// is deliberately no endpoint that submits anything to any authority.

export type SubmissionRoute = 'PREPARE_ONLY' | 'API_ELIGIBLE' | 'UNKNOWN';
export type ChecklistState = 'PRESENT' | 'EXPIRED' | 'MISSING';

export interface ChecklistItem {
  code: string;
  label: string;
  labelAr: string;
  state: ChecklistState;
  documentId: string | null;
  filename: string | null;
  /** Plain "YYYY-MM-DD" calendar date, not an ISO instant. */
  expiresOn: string | null;
}

export interface RouteGuidance {
  headline: string;
  detail: string;
  /** True when a person must complete the submission. Currently always true. */
  humanSubmits: boolean;
}

export interface RenewalPreparation {
  licenseId: string;
  licenseName: string;
  siteName: string | null;
  /** Plain "YYYY-MM-DD" calendar date. */
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  inRenewalWindow: boolean;
  authority: {
    name: string;
    nameAr: string;
    portalUrl: string | null;
    submissionRoute: SubmissionRoute;
  } | null;
  guidance: RouteGuidance;
  typicalFee: string | null;
  proposedExpiry: string | null;
  checklist: ChecklistItem[];
}

export const renewal = {
  prepare: (licenseId: string) =>
    request<RenewalPreparation>(`/licenses/${licenseId}/renewal`),
};

// ── Compliance dashboard ────────────────────────────────────
//
// Every figure is a count of something in the database. There is deliberately
// no compliance score and no risk rating: a score would have to treat
// "everything we track is current" as "you are compliant", while the coverage
// gaps feature exists precisely to admit that what is tracked is not
// everything.

export interface UpcomingReminder {
  id: string;
  licenseId: string;
  licenseName: string;
  siteName: string | null;
  ownerName: string | null;
  offsetDays: number;
  /** Plain "YYYY-MM-DD" calendar date. */
  dueOn: string;
}

export interface OwnerConcentration {
  ownerUserId: string | null;
  ownerName: string | null;
  licenseCount: number;
}

export interface DashboardOverview {
  today: string;
  licences: ComplianceSummary & {
    /** Attached to a site. The sites page counts only these. */
    atSites: number;
    /** Company-wide, belonging to no location. */
    entityWide: number;
  };
  sites: { total: number; withLicences: number };
  coverageGaps: number;
  ownership: {
    top: OwnerConcentration[];
    /** Owners not listed above, and what they hold between them. */
    otherOwners: number;
    otherLicenceCount: number;
    unassigned: number;
    assigned: number;
  };
  reminders: {
    upcoming: UpcomingReminder[];
    upcomingCount: number;
  };
}

export const dashboard = {
  overview: () => request<DashboardOverview>('/compliance/dashboard'),
};

// ── In-app compliance notifications ─────────────────────────
//
// A VIEW over reminders that are already due, not a copy of them. The list is
// tenant-scoped so a licence with nobody assigned is still visible — those are
// the ones most likely to lapse, and pushing to an owner who does not exist
// would make the most dangerous reminders the only invisible ones.
//
// Appearing here is NOT delivery. `deliveryStatus` is the reminder's own
// status, passed through untouched.

export interface ComplianceNotification {
  /** The reminder's id. Read state is recorded against this. */
  id: string;
  licenseId: string;
  licenseName: string;
  siteName: string | null;
  ownerName: string | null;
  ownerUserId: string | null;
  offsetDays: number;
  /** Plain "YYYY-MM-DD" calendar dates. */
  dueOn: string;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  /** Whether THIS user has read it. Never a global flag. */
  read: boolean;
  readAt: string | null;
  deliveryStatus: ReminderStatus;
}

export const complianceNotifications = {
  list: () =>
    request<ComplianceNotification[]>('/compliance/notifications'),
  unreadCount: () =>
    request<{ unreadCount: number }>('/compliance/notifications/count'),
  markRead: (reminderId: string) =>
    request<{ read: boolean }>(
      `/compliance/notifications/${reminderId}/read`,
      { method: 'PATCH' },
    ),
  markAllRead: () =>
    request<{ updated: number }>('/compliance/notifications/read-all', {
      method: 'PATCH',
    }),
};

// ── Licence import ──────────────────────────────────────────
//
// Stateless between steps: parsed rows travel with each request rather than
// being held server-side, so an abandoned import leaves nothing behind.
//
// Nothing is written until /commit. Preview is not skippable.

export type ImportField =
  | 'name'
  | 'licenseType'
  | 'authority'
  | 'site'
  | 'licenseNumber'
  | 'issueDate'
  | 'expiryDate'
  | 'ownerEmail'
  | 'notes';

export interface ParsedImport {
  headers: string[];
  rows: string[][];
  /** Proposed, never applied without confirmation. */
  mapping: Record<number, ImportField | null>;
}

export interface ImportIssue {
  field: ImportField | null;
  message: string;
}

export interface ValueProposal {
  value: string;
  /** How many rows use it — why confirming once is enough. */
  rowCount: number;
  matchId: string | null;
  matchName: string | null;
  matchReason: string | null;
}

export interface DuplicateFlag {
  rowNumber: number;
  existingLicenseId: string;
  existingLicenseName: string;
  reason: string;
}

export interface PreviewRow {
  rowNumber: number;
  outcome: 'CREATE' | 'FAIL';
  issues: ImportIssue[];
  name: string;
  licenseNumber: string | null;
  authority: string | null;
  notes: string | null;
  /** Plain "YYYY-MM-DD", or null. Never a locale-formatted string. */
  issueDate: string | null;
  expiryDate: string | null;
  rawLicenseType: string | null;
  rawSite: string | null;
  rawOwnerEmail: string | null;
  licenseTypeId: string | null;
  siteId: string | null;
  ownerUserId: string | null;
  createsSite: string | null;
}

export interface ImportResolutions {
  licenseTypes?: Record<string, string | null>;
  /** Site id, or the literal 'CREATE' sentinel to make a new one. */
  sites?: Record<string, string | null>;
  owners?: Record<string, string | null>;
}

export interface ImportPreview {
  headers: string[];
  mapping: Record<number, ImportField | null>;
  rows: PreviewRow[];
  proposals: {
    licenseTypes: ValueProposal[];
    sites: ValueProposal[];
    owners: ValueProposal[];
  };
  duplicates: DuplicateFlag[];
  summary: { total: number; willCreate: number; willFail: number };
}

export interface ImportResult {
  created: number;
  sitesCreated: number;
  failed: { rowNumber: number; issues: ImportIssue[] }[];
}

export const licenseImport = {
  templateUrl: (format: 'csv' | 'xlsx') =>
    `${API_BASE}/compliance/import/template?format=${format}`,

  parse: async (file: File): Promise<ParsedImport> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_BASE}/compliance/import/parse`, {
      method: 'POST',
      body: form,
      credentials: 'include',
      // Do NOT set Content-Type — the browser sets the multipart boundary.
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new ApiError(res.status, error.message || 'Could not read that file', error);
    }
    return res.json() as Promise<ParsedImport>;
  },

  preview: (body: {
    headers: string[];
    rows: string[][];
    mapping: Record<number, ImportField | null>;
    resolutions?: ImportResolutions;
  }) =>
    request<ImportPreview>('/compliance/import/preview', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  commit: (body: {
    filename: string;
    headers: string[];
    rows: string[][];
    mapping: Record<number, ImportField | null>;
    resolutions?: ImportResolutions;
  }) =>
    request<ImportResult>('/compliance/import/commit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ── Renewal workflow ────────────────────────────────────────
//
// Closes the loop: reminder → prepare → a PERSON files at the portal → record
// the outcome → new expiry → new reminders.
//
// AWAITING_AUTHORITY is not called "SUBMITTED" on purpose. This system submits
// nothing to any authority; the stage records that a person filed it and said
// so. See features/compliance/lib/renewal-workflow-copy.ts.

export type RenewalStatus =
  | 'PREPARING'
  | 'READY'
  | 'AWAITING_AUTHORITY'
  | 'COMPLETED'
  | 'CLOSED';

interface RenewalPerson {
  id: string;
  name: string | null;
  email: string;
}

export interface LicenseRenewal {
  id: string;
  licenseId: string;
  status: RenewalStatus;
  startedAt: string;
  startedBy: RenewalPerson | null;
  /** Plain "YYYY-MM-DD" calendar dates. */
  previousExpiry: string | null;
  newExpiry: string | null;
  newLicenseNumber: string | null;
  /** When a person told us THEY filed it. */
  submittedAt: string | null;
  submittedBy: RenewalPerson | null;
  completedAt: string | null;
  completedBy: RenewalPerson | null;
  outcome: string | null;
  notes: string | null;
}

export const renewalWorkflow = {
  list: (licenseId: string) =>
    request<LicenseRenewal[]>(`/licenses/${licenseId}/renewals`),

  /**
   * Wrapped server-side: a bare `null` return serialises as an empty body,
   * which is not parseable JSON. See the controller.
   */
  active: async (licenseId: string): Promise<LicenseRenewal | null> => {
    const { renewal } = await request<{ renewal: LicenseRenewal | null }>(
      `/licenses/${licenseId}/renewals/active`,
    );
    return renewal;
  },

  /**
   * The renewal boundary as a calendar date in the TENANT's timezone.
   * Wrapped for the same reason `active` is — a bare null serialises empty.
   */
  periodStart: async (licenseId: string): Promise<string | null> => {
    const { periodStart } = await request<{ periodStart: string | null }>(
      `/licenses/${licenseId}/renewals/period-start`,
    );
    return periodStart;
  },

  start: (licenseId: string) =>
    request<LicenseRenewal>(`/licenses/${licenseId}/renewals`, {
      method: 'POST',
    }),

  transition: (
    licenseId: string,
    renewalId: string,
    body: { status: RenewalStatus; outcome?: string; notes?: string },
  ) =>
    request<LicenseRenewal>(`/licenses/${licenseId}/renewals/${renewalId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  complete: (
    licenseId: string,
    renewalId: string,
    body: { newExpiry: string; newLicenseNumber?: string; notes?: string },
  ) =>
    request<LicenseRenewal>(
      `/licenses/${licenseId}/renewals/${renewalId}/complete`,
      { method: 'POST', body: JSON.stringify(body) },
    ),
};
