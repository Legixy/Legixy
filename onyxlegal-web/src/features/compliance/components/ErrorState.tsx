'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ApiError } from '@/lib/api';

/**
 * Error state.
 *
 * Shows what went wrong in plain language and offers a way forward. Never
 * renders a stack trace or a raw server payload — the message is chosen from
 * the HTTP status, and the API's RFC 7807 `detail` is used only as a fallback.
 */
export function ErrorState({
  error,
  onRetry,
  resource = 'data',
}: {
  error: ApiError | Error | null;
  onRetry?: () => void;
  resource?: string;
}) {
  const status = (error as ApiError | null)?.status;

  let title = `Could not load ${resource}`;
  let description =
    'Something went wrong on our side. Try again in a moment.';

  if (status === 401) {
    title = 'Your session has expired';
    description = 'Sign in again to continue.';
  } else if (status === 403) {
    title = 'You do not have access to this';
    description = 'Ask an administrator in your organisation for access.';
  } else if (status === 404) {
    title = `That ${resource} could not be found`;
    description = 'It may have been removed, or the link may be out of date.';
  } else if (status === undefined) {
    title = 'Cannot reach the server';
    description = 'Check your connection and try again.';
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border px-6 py-14 text-center"
      style={{
        borderColor: 'color-mix(in srgb, var(--status-expired-fg) 20%, transparent)',
        background: 'color-mix(in srgb, var(--status-expired-fg) 4%, transparent)',
      }}
      role="alert"
    >
      <AlertTriangle
        size={22}
        style={{ color: 'var(--status-expired-fg)' }}
        aria-hidden="true"
      />
      <p
        className="mt-3 text-[15px] font-semibold"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </p>
      <p
        className="mt-1.5 max-w-sm text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" size="lg" className="mt-5" onClick={onRetry}>
          <RefreshCw size={14} />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
