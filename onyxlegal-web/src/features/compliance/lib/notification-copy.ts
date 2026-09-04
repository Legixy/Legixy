/**
 * Every user-facing string in the in-app notification surface.
 *
 * Centralised so honesty.spec.ts can read all of it, following the pattern
 * renewal-copy.ts and dashboard-copy.ts established. The landing page shipped
 * a false AI claim for eight slices precisely because its strings lived inline
 * in JSX where nothing could scan them.
 */

import type { ReminderStatus } from '@/lib/api';
import type { StatusTone } from './format';

export const NOTIFICATION_COPY = {
  title: 'Needs attention',
  /** Sits under the title. Says what the list is, and what it is not. */
  subtitle: 'Licences that have reached a reminder date.',

  empty: 'Nothing needs attention right now.',
  emptyHint:
    'Reminders appear here as each licence reaches 90, 60, 30, 14 and 7 days '
    + 'before it expires.',

  markAllRead: 'Mark all as read',
  loading: 'Loading reminders…',
  errorTitle: 'Could not load your reminders',
  errorRetry: 'Try again',

  unreadLabel: (n: number) =>
    n === 1 ? '1 unread' : `${n} unread`,

  /** Screen-reader label on the bell, so the count is not colour-only. */
  bellLabel: (n: number) =>
    n === 0
      ? 'Notifications, none unread'
      : n === 1
        ? 'Notifications, 1 unread'
        : `Notifications, ${n} unread`,

  companyWide: 'Company-wide',
  unassigned: 'No one assigned',

  /**
   * The disclosure that keeps this surface honest.
   *
   * Appearing in this list means the reminder came due, NOT that anyone was
   * emailed. With no channel configured nothing is sent at all, and a user who
   * assumed otherwise would stop checking.
   */
  visibilityNote:
    'Shown here whether or not a message was sent.',
} as const;

export interface DeliveryPresentation {
  label: string;
  tone: StatusTone;
  /** Longer explanation, shown as a title attribute. */
  detail: string;
}

/**
 * How a reminder's DELIVERY status reads inside the notification list.
 *
 * These are separate from the licence timeline's labels on purpose: in the
 * timeline the reader is asking "what is the schedule?", here they are asking
 * "was I actually told?". The underlying statuses are the same and are never
 * modified by this surface.
 */
const DELIVERY_PRESENTATION: Record<ReminderStatus, DeliveryPresentation> = {
  SENT: {
    label: 'Emailed',
    tone: 'positive',
    detail: 'An email was sent to the responsible person.',
  },
  PENDING: {
    label: 'Not sent yet',
    tone: 'neutral',
    detail:
      'This is showing here because it is due. No message has gone out yet.',
  },
  UNDELIVERABLE: {
    label: 'No one assigned',
    tone: 'warning',
    detail:
      'Nobody is responsible for this licence, so no message could be sent. '
      + 'It is shown here so it is not missed.',
  },
  FAILED: {
    label: 'Sending failed',
    tone: 'critical',
    detail: 'Delivery was attempted several times without success.',
  },
  // Neither appears in this list — the service filters them out — but a
  // fallback that silently claimed delivery would be the wrong failure mode.
  SKIPPED: {
    label: 'Window passed',
    tone: 'neutral',
    detail: 'This date had already passed when the licence was added.',
  },
  CANCELLED: {
    label: 'Superseded',
    tone: 'neutral',
    detail: 'Replaced when the expiry date changed.',
  },
};

export function deliveryPresentation(
  status: ReminderStatus,
): DeliveryPresentation {
  // Falls back to the status that claims the least, never to "Emailed".
  return DELIVERY_PRESENTATION[status] ?? DELIVERY_PRESENTATION.PENDING;
}

/** "90 days before expiry" → the reason this reminder came up. */
export function reasonLabel(offsetDays: number): string {
  return offsetDays === 1
    ? 'Due 1 day before expiry'
    : `Due ${offsetDays} days before expiry`;
}

/**
 * Every fixed string here, plus the functions on representative inputs, so
 * the honesty scan reads all of it.
 */
export function allNotificationCopy(): string[] {
  const fixed = Object.values(NOTIFICATION_COPY).filter(
    (v): v is string => typeof v === 'string',
  );

  const statuses: ReminderStatus[] = [
    'PENDING',
    'SENT',
    'SKIPPED',
    'CANCELLED',
    'FAILED',
    'UNDELIVERABLE',
  ];

  return [
    ...fixed,
    NOTIFICATION_COPY.unreadLabel(1),
    NOTIFICATION_COPY.unreadLabel(4),
    NOTIFICATION_COPY.bellLabel(0),
    NOTIFICATION_COPY.bellLabel(1),
    NOTIFICATION_COPY.bellLabel(6),
    reasonLabel(1),
    reasonLabel(90),
    ...statuses.flatMap((s) => {
      const p = deliveryPresentation(s);
      return [p.label, p.detail];
    }),
  ];
}
