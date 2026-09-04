/**
 * TanStack Query hooks for the compliance domain.
 *
 * Mirrors the conventions already used in shared/api/*: a query-key factory,
 * mutations that invalidate and toast, and no manual cache surgery.
 *
 * Every request goes to the authenticated NestJS API with credentials
 * included. The tenant is resolved server-side from the auth cookie — no
 * hook here accepts, sends, or knows a tenantId.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ApiError,
  catalogue,
  CatalogueLicenseType,
  complianceNotifications,
  ComplianceNotification,
  coverage,
  CoverageGap,
  CoverageOverview,
  RequirementRow,
  dashboard,
  DashboardOverview,
  documents,
  License,
  LicenseDocument,
  OwnerLoad,
  LicenseReminder,
  reminders,
  TenantUser,
  users,
  LicenseFilters,
  LicenseCreateInput,
  LicenseInput,
  licenses,
  LicenseRenewal,
  Paginated,
  renewal,
  renewalWorkflow,
  RenewalStatus,
  RenewalPreparation,
  Site,
  delivery,
  DeliverySettings,
  yearAhead,
  YearAhead,
  SiteCreateInput,
  sites,
} from '@/lib/api';

export const complianceKeys = {
  all: ['compliance'] as const,
  sites: () => [...complianceKeys.all, 'sites'] as const,
  siteList: (params?: Record<string, unknown>) =>
    [...complianceKeys.sites(), 'list', params ?? {}] as const,
  site: (id: string) => [...complianceKeys.sites(), 'detail', id] as const,
  licenses: () => [...complianceKeys.all, 'licenses'] as const,
  licenseList: (filters?: LicenseFilters) =>
    [...complianceKeys.licenses(), 'list', filters ?? {}] as const,
  license: (id: string) =>
    [...complianceKeys.licenses(), 'detail', id] as const,
  documents: (licenseId: string) =>
    [...complianceKeys.license(licenseId), 'documents'] as const,
  renewal: (licenseId: string) =>
    [...complianceKeys.license(licenseId), 'renewal'] as const,
};

export function useSites(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<Paginated<Site>, ApiError>({
    queryKey: complianceKeys.siteList(params),
    queryFn: () => sites.list(params),
  });
}

/**
 * Create one site.
 *
 * Sites had the same gap licences did: the dashboard's first-run step one
 * says "Add a site" and linked to a list with no add path. Import could
 * create a site as a side effect of a licence row, and that was all.
 */
export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation<Site, ApiError, SiteCreateInput>({
    mutationFn: (data) => sites.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: complianceKeys.sites() });
      void queryClient.invalidateQueries({
        queryKey: [...complianceKeys.all, 'dashboard'],
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Could not add the site');
    },
  });
}

/** Every expiry in the next twelve months. */
export function useYearAhead() {
  return useQuery<YearAhead, ApiError>({
    queryKey: [...complianceKeys.all, 'year-ahead'] as const,
    queryFn: () => yearAhead.get(),
  });
}

/** Where reminders go. */
export function useDeliverySettings() {
  return useQuery<DeliverySettings, ApiError>({
    queryKey: [...complianceKeys.all, 'delivery'] as const,
    queryFn: () => delivery.get(),
  });
}

export function useSetCopyEmail() {
  const queryClient = useQueryClient();

  return useMutation<DeliverySettings, ApiError, string | null>({
    mutationFn: (email) => delivery.setCopyEmail(email),
    onSuccess: (next) => {
      queryClient.setQueryData([...complianceKeys.all, 'delivery'], next);
      toast.success(
        next.copyEmail ? 'Copy address saved' : 'Copy address removed',
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Could not save that address');
    },
  });
}

export function useSite(siteId: string) {
  return useQuery<Site, ApiError>({
    queryKey: complianceKeys.site(siteId),
    queryFn: () => sites.get(siteId),
    enabled: !!siteId,
  });
}

export function useLicenses(filters?: LicenseFilters, enabled = true) {
  return useQuery<Paginated<License>, ApiError>({
    queryKey: complianceKeys.licenseList(filters),
    queryFn: () => licenses.list(filters),
    enabled,
  });
}

export function useLicense(licenseId: string) {
  return useQuery<License, ApiError>({
    queryKey: complianceKeys.license(licenseId),
    queryFn: () => licenses.get(licenseId),
    enabled: !!licenseId,
  });
}

export function useUpdateLicense() {
  const queryClient = useQueryClient();

  return useMutation<License, ApiError, { id: string; data: LicenseInput }>({
    mutationFn: ({ id, data }) => licenses.update(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(complianceKeys.license(updated.id), updated);
      // A licence change can alter its site's rollup, so refresh both trees.
      void queryClient.invalidateQueries({ queryKey: complianceKeys.licenses() });
      void queryClient.invalidateQueries({ queryKey: complianceKeys.sites() });
      toast.success('Licence updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Could not update the licence');
    },
  });
}

/**
 * Create one licence.
 *
 * Invalidates the same three trees a licence change touches: the list, the
 * sites rollup (a site's counts move), and the dashboard (every figure on it
 * is derived from licences). Missing any one leaves the client looking at a
 * number that is quietly wrong.
 */
export function useCreateLicense() {
  const queryClient = useQueryClient();

  return useMutation<License, ApiError, LicenseCreateInput>({
    mutationFn: (data) => licenses.create(data),
    onSuccess: (created) => {
      queryClient.setQueryData(complianceKeys.license(created.id), created);
      void queryClient.invalidateQueries({ queryKey: complianceKeys.licenses() });
      void queryClient.invalidateQueries({ queryKey: complianceKeys.sites() });
      void queryClient.invalidateQueries({
        queryKey: [...complianceKeys.all, 'dashboard'],
      });
      // A new licence can close a coverage gap, so the gaps and coverage
      // trees are stale the moment it lands.
      void queryClient.invalidateQueries({
        queryKey: [...complianceKeys.all, 'coverage'],
      });
      void queryClient.invalidateQueries({ queryKey: [...complianceKeys.all, 'gaps'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Could not add the licence');
    },
  });
}

export function useArchiveLicense() {
  const queryClient = useQueryClient();

  return useMutation<License, ApiError, string>({
    mutationFn: (id) => licenses.archive(id),
    onSuccess: (archived) => {
      queryClient.setQueryData(complianceKeys.license(archived.id), archived);
      void queryClient.invalidateQueries({ queryKey: complianceKeys.licenses() });
      void queryClient.invalidateQueries({ queryKey: complianceKeys.sites() });
      toast.success('Licence archived', {
        description: 'It stays on record and can still be viewed.',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Could not archive the licence');
    },
  });
}

export function useTenantUsers() {
  return useQuery<TenantUser[], ApiError>({
    queryKey: [...complianceKeys.all, 'tenant-users'] as const,
    queryFn: () => users.list(),
    // A tenant's directory changes rarely; avoid refetching it per dialog open.
    staleTime: 5 * 60 * 1000,
  });
}

export function useLicenseReminders(licenseId: string) {
  return useQuery<LicenseReminder[], ApiError>({
    queryKey: [...complianceKeys.license(licenseId), 'reminders'] as const,
    queryFn: () => reminders.forLicense(licenseId),
    enabled: !!licenseId,
  });
}

export function useCoverageGaps() {
  return useQuery<CoverageGap[], ApiError>({
    queryKey: [...complianceKeys.all, 'gaps'] as const,
    queryFn: () => coverage.gaps(),
  });
}

export function useOwnerLoad() {
  return useQuery<OwnerLoad[], ApiError>({
    queryKey: [...complianceKeys.all, 'owner-load'] as const,
    queryFn: () => coverage.ownerLoad(),
  });
}

export function useLicenseTypes() {
  return useQuery<CatalogueLicenseType[], ApiError>({
    queryKey: [...complianceKeys.all, 'license-types'] as const,
    queryFn: () => catalogue.licenseTypes(),
    // Global reference data — effectively static within a session.
    staleTime: 10 * 60 * 1000,
  });
}

// ── Documents ──────────────────────────────────────────────────────────────
//
// A document change alters the renewal checklist, so both mutations
// invalidate the renewal query as well as the document list. Nothing here
// caches file BYTES: downloads always go back to the API so that every read
// is tenant-checked and audited server-side.

export function useLicenseDocuments(licenseId: string) {
  return useQuery<LicenseDocument[], ApiError>({
    queryKey: complianceKeys.documents(licenseId),
    queryFn: () => documents.forLicense(licenseId),
    enabled: !!licenseId,
  });
}

export function useRenewalPreparation(licenseId: string, enabled = true) {
  return useQuery<RenewalPreparation, ApiError>({
    queryKey: complianceKeys.renewal(licenseId),
    queryFn: () => renewal.prepare(licenseId),
    enabled: enabled && !!licenseId,
  });
}

export function useUploadDocument(licenseId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    LicenseDocument,
    ApiError,
    { file: File; documentCode?: string | null; expiresOn?: string | null }
  >({
    mutationFn: ({ file, documentCode, expiresOn }) =>
      documents.upload(licenseId, file, { documentCode, expiresOn }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: complianceKeys.documents(licenseId),
      });
      void queryClient.invalidateQueries({
        queryKey: complianceKeys.renewal(licenseId),
      });
      toast.success('Document added');
    },
    onError: (error) => {
      // The server's message is deliberately generic and names no filename.
      toast.error(error.message || 'Could not add the document');
    },
  });
}

export function useRemoveDocument(licenseId: string) {
  const queryClient = useQueryClient();

  return useMutation<LicenseDocument, ApiError, string>({
    mutationFn: (documentId) => documents.remove(licenseId, documentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: complianceKeys.documents(licenseId),
      });
      void queryClient.invalidateQueries({
        queryKey: complianceKeys.renewal(licenseId),
      });
      toast.success('Document removed', {
        description: 'It stays on record and can be restored.',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Could not remove the document');
    },
  });
}

/**
 * Downloads a document to the user's machine.
 *
 * Not a TanStack mutation: there is no cache to update, and file bytes must
 * never enter the query cache. The object URL is revoked immediately so the
 * blob does not sit in memory.
 */
export async function downloadDocument(
  licenseId: string,
  documentId: string,
  /**
   * The filename already held in the document list. Preferred over the
   * Content-Disposition header, which a cross-origin response only exposes
   * when the API opts in — otherwise every file saves under a fallback name.
   */
  knownFilename?: string,
): Promise<void> {
  try {
    const { blob, filename } = await documents.download(licenseId, documentId);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = knownFilename || filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Could not download the document');
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export function useComplianceDashboard() {
  return useQuery<DashboardOverview, ApiError>({
    queryKey: [...complianceKeys.all, 'dashboard'] as const,
    queryFn: () => dashboard.overview(),
  });
}

// ── In-app notifications ───────────────────────────────────────────────────
//
// A view over due reminders, so the cache key is per-user-session and the
// list refetches on an interval: a reminder becomes due by the clock, not by
// anything the user did in this tab.

export const notificationKeys = {
  all: [...complianceKeys.all, 'notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
  count: () => [...notificationKeys.all, 'count'] as const,
};

export function useComplianceNotifications() {
  return useQuery<ComplianceNotification[], ApiError>({
    queryKey: notificationKeys.list(),
    queryFn: () => complianceNotifications.list(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUnreadReminderCount() {
  return useQuery<{ unreadCount: number }, ApiError>({
    queryKey: notificationKeys.count(),
    queryFn: () => complianceNotifications.unreadCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkReminderRead() {
  const queryClient = useQueryClient();
  return useMutation<{ read: boolean }, ApiError, string>({
    mutationFn: (reminderId) => complianceNotifications.markRead(reminderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    // Deliberately silent: reading a notification is not an event worth a
    // toast, and a failure to record it must not interrupt the user.
  });
}

export function useMarkAllRemindersRead() {
  const queryClient = useQueryClient();
  return useMutation<{ updated: number }, ApiError, void>({
    mutationFn: () => complianceNotifications.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      toast.error(error.message || 'Could not mark those as read');
    },
  });
}

// ── Renewal workflow ───────────────────────────────────────────────────────

export function useActiveRenewal(licenseId: string) {
  return useQuery<LicenseRenewal | null, ApiError>({
    queryKey: [...complianceKeys.license(licenseId), 'renewal-active'] as const,
    queryFn: () => renewalWorkflow.active(licenseId),
    enabled: !!licenseId,
  });
}

export function useRenewalHistory(licenseId: string) {
  return useQuery<LicenseRenewal[], ApiError>({
    queryKey: [...complianceKeys.license(licenseId), 'renewal-history'] as const,
    queryFn: () => renewalWorkflow.list(licenseId),
    enabled: !!licenseId,
  });
}

/**
 * Anything that changes a renewal also changes the licence: completion writes
 * a new expiry and rebuilds every reminder. So the whole licence tree is
 * invalidated, not just the renewal.
 */
function invalidateLicence(queryClient: ReturnType<typeof useQueryClient>, licenseId: string) {
  void queryClient.invalidateQueries({ queryKey: complianceKeys.license(licenseId) });
  void queryClient.invalidateQueries({ queryKey: complianceKeys.licenses() });
  void queryClient.invalidateQueries({ queryKey: [...complianceKeys.all, 'dashboard'] });
  void queryClient.invalidateQueries({ queryKey: [...complianceKeys.all, 'notifications'] });
}

export function useStartRenewal(licenseId: string) {
  const queryClient = useQueryClient();
  return useMutation<LicenseRenewal, ApiError, void>({
    mutationFn: () => renewalWorkflow.start(licenseId),
    onSuccess: () => {
      invalidateLicence(queryClient, licenseId);
      toast.success('Renewal started');
    },
    onError: (error) => toast.error(error.message || 'Could not start a renewal'),
  });
}

export function useTransitionRenewal(licenseId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    LicenseRenewal,
    ApiError,
    { renewalId: string; status: RenewalStatus; outcome?: string }
  >({
    mutationFn: ({ renewalId, status, outcome }) =>
      renewalWorkflow.transition(licenseId, renewalId, { status, outcome }),
    onSuccess: () => invalidateLicence(queryClient, licenseId),
    // The server explains refusals in full — naming the current stage and what
    // IS possible — so its message is shown rather than a generic one.
    onError: (error) => toast.error(error.message || 'Could not update the renewal'),
  });
}

export function useCompleteRenewal(licenseId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    LicenseRenewal,
    ApiError,
    { renewalId: string; newExpiry: string; newLicenseNumber?: string }
  >({
    mutationFn: ({ renewalId, newExpiry, newLicenseNumber }) =>
      renewalWorkflow.complete(licenseId, renewalId, {
        newExpiry,
        newLicenseNumber,
      }),
    onSuccess: () => {
      invalidateLicence(queryClient, licenseId);
      toast.success('New expiry recorded', {
        description: 'Reminders have been rebuilt from the new date.',
      });
    },
    onError: (error) => toast.error(error.message || 'Could not record the new expiry'),
  });
}

// ── Coverage & requirements ────────────────────────────────────────────────

export function useCoverage() {
  return useQuery<CoverageOverview, ApiError>({
    queryKey: [...complianceKeys.all, 'coverage'] as const,
    queryFn: () => coverage.overview(),
  });
}

export function useRequirements() {
  return useQuery<RequirementRow[], ApiError>({
    queryKey: [...complianceKeys.all, 'requirements'] as const,
    queryFn: () => coverage.requirements(),
  });
}

export function useSetRequirement() {
  const queryClient = useQueryClient();
  return useMutation<
    { licenseTypeId: string; required: boolean },
    ApiError,
    { licenseTypeId: string; required: boolean }
  >({
    mutationFn: ({ licenseTypeId, required }) =>
      coverage.setRequirement(licenseTypeId, required),
    onSuccess: () => {
      // A requirement change moves gaps, the dashboard count and the sites
      // rollup at once, so the whole compliance tree is refetched.
      void queryClient.invalidateQueries({ queryKey: complianceKeys.all });
    },
    onError: (error) =>
      toast.error(error.message || 'Could not save that change'),
  });
}

/** The renewal boundary for period-scoping the reminder timeline. */
export function useRenewalPeriodStart(licenseId: string) {
  return useQuery<string | null, ApiError>({
    queryKey: [...complianceKeys.license(licenseId), 'period-start'] as const,
    queryFn: () => renewalWorkflow.periodStart(licenseId),
    enabled: !!licenseId,
  });
}
