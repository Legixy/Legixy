/**
 * /src/shared/hooks/useActions.ts
 *
 * Common action hooks for button handlers
 * Ensures consistent behavior across the app
 */

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

export function useActions() {
  const router = useRouter();

  // Navigation actions
  const navigateTo = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  const navigateToCreateContract = useCallback(() => {
    router.push('/dashboard/contracts/create');
  }, [router]);

  const navigateToAnalytics = useCallback(() => {
    router.push('/dashboard/analytics');
  }, [router]);

  const navigateToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const navigateToContracts = useCallback(() => {
    router.push('/dashboard/contracts');
  }, [router]);

  // Action with notification
  const performAction = useCallback(
    async (
      action: () => Promise<void> | void,
      options?: {
        onSuccess?: string;
        onError?: string;
      }
    ) => {
      try {
        await action();
        if (options?.onSuccess) {
          toast.success(options.onSuccess);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        toast.error(options?.onError || message);
      }
    },
    []
  );

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string, label = 'Copied to clipboard') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  }, []);

  // Download file
  const downloadFile = useCallback((content: string, filename: string, type = 'text/plain') => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Downloaded ${filename}`);
  }, []);

  return {
    navigateTo,
    navigateToCreateContract,
    navigateToAnalytics,
    navigateToDashboard,
    navigateToContracts,
    performAction,
    copyToClipboard,
    downloadFile,
  };
}
