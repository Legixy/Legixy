/**
 * /src/features/contracts/hooks/useContractVersioning.ts
 *
 * Hooks for contract versioning, history, and restore
 * Trust layer: version management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ContractVersion {
  id: string;
  contractId: string;
  version: number;
  content: string;
  changeNote: string | null;
  changedBy: string;
  createdAt: string;
}

/**
 * Fetch all versions of a contract
 */
export function useContractVersions(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'versions'],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      return response.json() as Promise<ContractVersion[]>;
    },
    enabled: !!contractId,
  });
}

/**
 * Restore contract to a specific version
 */
export function useRestoreContractVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      versionId,
    }: {
      contractId: string;
      versionId: string;
    }) => {
      const response = await fetch(`/api/contracts/${contractId}/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      if (!response.ok) throw new Error('Failed to restore version');
      return response.json();
    },
    onSuccess: (_, { contractId }) => {
      // Invalidate contract and versions queries
      queryClient.invalidateQueries({ queryKey: ['contracts', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts', contractId, 'versions'] });
    },
  });
}

/**
 * Get specific version details
 */
export function useGetContractVersion(contractId: string, versionId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'versions', versionId],
    queryFn: async () => {
      const response = await fetch(`/api/contracts/${contractId}/versions/${versionId}`);
      if (!response.ok) throw new Error('Failed to fetch version');
      return response.json() as Promise<ContractVersion>;
    },
    enabled: !!contractId && !!versionId,
  });
}

/**
 * Create a new version (called after AI fix or user edit)
 */
export function useCreateContractVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      content,
      changeNote,
    }: {
      contractId: string;
      content: string;
      changeNote: string;
    }) => {
      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, changeNote }),
      });

      if (!response.ok) throw new Error('Failed to create version');
      return response.json();
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', contractId, 'versions'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', contractId] });
    },
  });
}
