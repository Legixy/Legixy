/**
 * /src/shared/components/ToastProvider.tsx
 *
 * Enhanced toast notification system
 * Provides success, error, loading, and info toasts
 */

'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      expand
      duration={3000}
      closeButton
      theme="light"
    />
  );
}

/**
 * Enhanced toast utilities for common patterns
 */
export const toastUtils = {
  /**
   * Show success toast with icon
   */
  success: (message: string, description?: string) => {
    const sonner = require('sonner');
    sonner.toast.success(message, {
      description,
    });
  },

  /**
   * Show error toast with icon
   */
  error: (message: string, description?: string) => {
    const sonner = require('sonner');
    sonner.toast.error(message, {
      description,
    });
  },

  /**
   * Show info toast with icon
   */
  info: (message: string, description?: string) => {
    const sonner = require('sonner');
    sonner.toast.info(message, {
      description,
    });
  },

  /**
   * Show loading toast
   */
  loading: (message: string) => {
    const sonner = require('sonner');
    return sonner.toast.loading(message);
  },

  /**
   * Show promise-based toast
   */
  promise: (
    promise: Promise<any>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    const sonner = require('sonner');
    return sonner.toast.promise(promise, messages);
  },
};
