/**
 * /src/shared/api/contracts.ts
 *
 * TanStack Query hooks for contract operations
 * Provides hooks: useContracts, useContractById, useCreateContract
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contracts, Contract, ContractListResponse, ApiError } from '@/lib/api';
import { toast } from 'sonner';

// Query keys
export const contractsKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...contractsKeys.lists(), filters] as const,
  details: () => [...contractsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractsKeys.details(), id] as const,
};

/**
 * Fetch all contracts with pagination and filtering
 */
export function useContracts(
  params?: { status?: string; search?: string; page?: number; limit?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: contractsKeys.list(params),
    queryFn: () => contracts.list(params),
    enabled: options?.enabled !== false,
  });
}

/**
 * Fetch a single contract by ID
 */
export function useContractById(contractId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contractsKeys.detail(contractId),
    queryFn: () => contracts.get(contractId),
    enabled: options?.enabled !== false && !!contractId,
  });
}

/**
 * Get contract stats
 */
export function useContractStats() {
  return useQuery({
    queryKey: [...contractsKeys.all, 'stats'] as const,
    queryFn: () => contracts.stats(),
  });
}

/**
 * Create a new contract
 */
export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation<Contract, ApiError, Parameters<typeof contracts.create>[0]>({
    mutationFn: (data) => contracts.create(data),
    onSuccess: (newContract) => {
      // Invalidate the contracts list to refetch
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contractsKeys.all });

      // Add to cache
      queryClient.setQueryData(contractsKeys.detail(newContract.id), newContract);

      toast.success('Contract created successfully');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create contract');
    },
  });
}

/**
 * Update an existing contract
 */
export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation<Contract, ApiError, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => contracts.update(id, data),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      queryClient.setQueryData(contractsKeys.detail(updatedContract.id), updatedContract);
      toast.success('Contract updated successfully');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update contract');
    },
  });
}

/**
 * Update contract status
 */
export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation<Contract, ApiError, { id: string; status: string }>({
    mutationFn: ({ id, status }) => contracts.updateStatus(id, status),
    onSuccess: (updatedContract) => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
      queryClient.setQueryData(contractsKeys.detail(updatedContract.id), updatedContract);
      toast.success('Contract status updated');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}

/**
 * Accept a clause fix
 */
export function useAcceptClauseFix() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, { contractId: string; clauseId: string }>({
    mutationFn: ({ contractId, clauseId }) =>
      contracts.acceptFix(contractId, clauseId),
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(contractId) });
      toast.success('Clause fix accepted');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to accept fix');
    },
  });
}

// ── Action Panel Hooks ──────────────────────────────────────

export const actionPanelKeys = {
  all: ['action-panel'] as const,
  panel: (contractId: string) => [...actionPanelKeys.all, 'panel', contractId] as const,
  progress: (contractId: string) => [...actionPanelKeys.all, 'progress', contractId] as const,
};

/**
 * Fetch the full action panel data for a contract
 */
export function useContractActionPanel(contractId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: actionPanelKeys.panel(contractId),
    queryFn: () => contracts.getActionPanel(contractId),
    enabled: options?.enabled !== false && !!contractId,
    staleTime: 10000,
  });
}

/**
 * Apply a single AI fix to a clause (optimistic UI)
 */
export function useApplyFix() {
  const queryClient = useQueryClient();

  return useMutation<
    import('@/lib/api').FixResult & { newRiskScore: number },
    ApiError,
    { contractId: string; clauseId: string },
    { previousPanelData: unknown; previousDetailData: unknown }
  >({
    mutationFn: ({ contractId, clauseId }) =>
      contracts.fixClause(contractId, clauseId),
    onMutate: async ({ contractId }) => {
      await queryClient.cancelQueries({ queryKey: actionPanelKeys.panel(contractId) });
      await queryClient.cancelQueries({ queryKey: contractsKeys.detail(contractId) });

      const previousPanelData = queryClient.getQueryData(actionPanelKeys.panel(contractId));
      const previousDetailData = queryClient.getQueryData(contractsKeys.detail(contractId));

      return { previousPanelData, previousDetailData };
    },
    onError: (error: ApiError, { contractId }, context) => {
      if (context?.previousPanelData) {
        queryClient.setQueryData(actionPanelKeys.panel(contractId), context.previousPanelData);
      }
      if (context?.previousDetailData) {
        queryClient.setQueryData(contractsKeys.detail(contractId), context.previousDetailData);
      }
      toast.error(error.message || 'Failed to apply fix. Reverting changes.');
    },
    onSettled: (data, error, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: actionPanelKeys.panel(contractId) });
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(contractId) });
    },
    onSuccess: (result) => {
      toast.success('Fix applied successfully', {
        description: `Risk reduced by ${result.estimatedImpactReduction}%`,
      });
    },
  });
}

/**
 * Apply all fixes at once (bulk operation)
 */
export function useApplyBulkFixes() {
  const queryClient = useQueryClient();

  return useMutation<
    import('@/lib/api').BulkFixResult, 
    ApiError, 
    { contractId: string; riskLevels?: string[] },
    { previousPanelData: unknown; previousDetailData: unknown }
  >({
    mutationFn: ({ contractId, riskLevels }) =>
      contracts.fixAll(contractId, riskLevels),
    onMutate: async ({ contractId }) => {
      await queryClient.cancelQueries({ queryKey: actionPanelKeys.panel(contractId) });
      await queryClient.cancelQueries({ queryKey: contractsKeys.detail(contractId) });

      const previousPanelData = queryClient.getQueryData(actionPanelKeys.panel(contractId));
      const previousDetailData = queryClient.getQueryData(contractsKeys.detail(contractId));

      return { previousPanelData, previousDetailData };
    },
    onError: (error: ApiError, { contractId }, context) => {
      if (context?.previousPanelData) {
        queryClient.setQueryData(actionPanelKeys.panel(contractId), context.previousPanelData);
      }
      if (context?.previousDetailData) {
        queryClient.setQueryData(contractsKeys.detail(contractId), context.previousDetailData);
      }
      toast.error(error.message || 'Failed to apply bulk fixes. Reverting changes.');
    },
    onSettled: (data, error, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: actionPanelKeys.panel(contractId) });
      queryClient.invalidateQueries({ queryKey: contractsKeys.detail(contractId) });
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
    },
    onSuccess: () => {
      toast.success('All issues fixed! 🎉');
    },
  });
}

/**
 * Fetch fix progress for a contract
 */
export function useContractProgress(contractId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: actionPanelKeys.progress(contractId),
    queryFn: () => contracts.getProgress(contractId),
    enabled: options?.enabled !== false && !!contractId,
    refetchInterval: 5000,
  });
}

