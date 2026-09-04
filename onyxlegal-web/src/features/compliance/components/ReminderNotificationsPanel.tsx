'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, CheckCheck, Loader2, X } from 'lucide-react';
import {
  useComplianceNotifications,
  useMarkAllRemindersRead,
  useMarkReminderRead,
} from '@/features/compliance/api/compliance';
import {
  deliveryPresentation,
  NOTIFICATION_COPY,
  reasonLabel,
} from '../lib/notification-copy';
import {
  formatPlainDate,
  formatRemaining,
  TONE_STYLES,
} from '../lib/format';
import type { ComplianceNotification } from '@/lib/api';

/**
 * The in-app reminder list, shown from the bell in the header.
 *
 * This is a VIEW over reminders that are already due. It is tenant-scoped, so
 * a licence with nobody assigned still appears — those are the ones most
 * likely to lapse, and a per-owner inbox would make them the only invisible
 * ones.
 *
 * Appearing here is not delivery. Each row states its own delivery status, and
 * the footer says plainly that entries show whether or not a message was sent.
 */
export function ReminderNotificationsPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useComplianceNotifications();
  const markRead = useMarkReminderRead();
  const markAllRead = useMarkAllRemindersRead();

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const items = data ?? [];
  const unread = items.filter((item) => !item.read).length;

  const open = (item: ComplianceNotification) => {
    if (!item.read) markRead.mutate(item.id);
    onClose();
    router.push(`/dashboard/licenses/${item.licenseId}`);
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={NOTIFICATION_COPY.title}
      /*
        On a narrow screen the bell sits ~210px from the left, so anchoring a
        23rem panel to it pushed the left edge to -141px and off the display.
        Below sm it is pinned to the viewport instead; from sm up it hangs off
        the bell as before.
      */
      className="fixed inset-x-3 top-14 z-50 overflow-hidden rounded-xl border sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[23rem]"
      style={{
        background: 'var(--card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      <div
        className="flex items-start justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            {NOTIFICATION_COPY.title}
            {unread > 0 ? (
              <span
                className="ml-2 text-xs font-medium"
                style={{ color: 'var(--primary)' }}
              >
                {NOTIFICATION_COPY.unreadLabel(unread)}
              </span>
            ) : null}
          </p>
          <p
            className="mt-0.5 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {NOTIFICATION_COPY.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1 transition-colors hover:bg-[var(--secondary)]"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label="Close notifications"
        >
          <X size={15} />
        </button>
      </div>

      <div className="max-h-[26rem] overflow-y-auto">
        {isLoading ? (
          <div
            className="flex items-center gap-2 px-4 py-6 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
            aria-busy="true"
          >
            <Loader2 size={14} className="animate-spin" />
            {NOTIFICATION_COPY.loading}
          </div>
        ) : isError ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              {NOTIFICATION_COPY.errorTitle}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-sm font-medium"
              style={{ color: 'var(--primary)' }}
            >
              {NOTIFICATION_COPY.errorRetry}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              {NOTIFICATION_COPY.empty}
            </p>
            <p
              className="mx-auto mt-1 max-w-[17rem] text-xs leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {NOTIFICATION_COPY.emptyHint}
            </p>
          </div>
        ) : (
          <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {items.map((item) => (
              <Row key={item.id} item={item} onOpen={() => open(item)} />
            ))}
          </ul>
        )}
      </div>

      <div
        className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
        style={{ borderColor: 'var(--border)' }}
      >
        <p className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
          {NOTIFICATION_COPY.visibilityNote}
        </p>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 disabled:opacity-50"
            style={{ color: 'var(--primary)' }}
          >
            <CheckCheck size={12} aria-hidden="true" />
            {NOTIFICATION_COPY.markAllRead}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  item,
  onOpen,
}: {
  item: ComplianceNotification;
  onOpen: () => void;
}) {
  const delivery = deliveryPresentation(item.deliveryStatus);
  const tone = TONE_STYLES[delivery.tone];

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--secondary)]"
      >
        {/* Unread marker. Paired with bold text so it is not colour-only. */}
        <span
          className="mt-1.5 size-1.5 shrink-0 rounded-full"
          style={{ background: item.read ? 'transparent' : 'var(--primary)' }}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span
            className="block truncate text-sm"
            style={{
              color: 'var(--foreground)',
              fontWeight: item.read ? 400 : 600,
            }}
          >
            {item.licenseName}
          </span>
          <span
            className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {item.siteName ? (
              <span className="truncate">{item.siteName}</span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Building2 size={10} aria-hidden="true" />
                {NOTIFICATION_COPY.companyWide}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{formatRemaining(item.daysUntilExpiry)}</span>
          </span>
          <span
            className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span
              className="rounded-full px-1.5 py-0.5 font-medium"
              style={{ color: tone.fg, background: tone.bg }}
              title={delivery.detail}
            >
              {delivery.label}
            </span>
            <span title={reasonLabel(item.offsetDays)}>
              {formatPlainDate(item.dueOn)}
            </span>
            {!item.ownerName ? (
              <span
                className="inline-flex items-center gap-1"
                style={{ color: TONE_STYLES.warning.fg }}
              >
                <AlertCircle size={10} aria-hidden="true" />
                {NOTIFICATION_COPY.unassigned}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}
