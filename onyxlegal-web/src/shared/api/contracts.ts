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
