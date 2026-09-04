'use client';

import { BellOff, Clock } from 'lucide-react';
import type { LicenseReminder } from '@/lib/api';
import {
  formatDueOn,
  formatPlainDate,
  formatSentAt,
  reminderChannelLabel,
  reminderOffsetLabel,
  reminderPresentation,
  PRIOR_PERIOD_COPY,
  splitTimelineByPeriod,
  TONE_STYLES,
} from '../lib/format';

/**
 * The persisted reminder schedule for a licence.
 *
 * HONESTY
 * -------
 * Delivery is real now, so "Sent" is shown — but ONLY for rows the database
 * actually marked sent, and always with the real timestamp and channel beside
 * it. A row that has not gone out says what it is: scheduled, undeliverable,
 * or failed. Nothing here infers delivery from a due date having passed.
 *
 * Dates are computed and stored server-side from the licence's expiry date.
 * This component only formats them, in UTC, via `formatDueOn`.
 */
export function ReminderTimeline({
  reminders,
  hasOwner,
  periodStart,
}: {
  reminders: LicenseReminder[];
  hasOwner: boolean;
  /**
   * When the most recent renewal completed, as a calendar date in the tenant's
   * timezone. Null when the licence has never been renewed.
   */
  periodStart?: string | null;
}) {
  // One entry per offset, scoped to the current licence period. With no
  // completed renewal this is exactly Slice 8's behaviour.
  const { current: visible, prior } = splitTimelineByPeriod(
    reminders,
    periodStart ?? null,
  );

  if (visible.length === 0 && prior.length === 0) {
    return (
      <div
        className="flex items-start gap-3 rounded-xl border border-dashed px-4 py-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <BellOff
          size={16}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--muted-foreground)' }}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm" style={{ color: 'var(--foreground)' }}>
            No reminders for this licence
          </p>
          <p
            className="mt-0.5 text-xs leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Reminders are scheduled from an expiry date. Add one and the
            schedule appears here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="overflow-hidden rounded-xl border bg-[var(--surface)]"
        style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
      >
        <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {visible.map((reminder) => {
            const presentation = reminderPresentation(reminder.status);
            const style = TONE_STYLES[presentation.tone];
            const muted =
              reminder.status === 'CANCELLED' || reminder.status === 'SKIPPED';

            return (
              <li
                key={reminder.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
                style={{ opacity: muted ? 0.6 : 1 }}
              >
                <span
                  className="w-32 shrink-0 text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  {reminderOffsetLabel(reminder.offsetDays)}
                </span>

                <span
                  className="w-28 shrink-0 text-sm tabular-nums"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {formatDueOn(reminder.dueOn)}
                </span>

                <span className="flex flex-1 items-center justify-end gap-2">
                  {/*
                    Delivery evidence, straight from the database. Rendered only
                    when a sentAt actually exists — never inferred.
                  */}
                  {reminder.status === 'SENT' && reminder.sentAt ? (
                    <span
                      className="hidden text-xs sm:inline"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {formatSentAt(reminder.sentAt)}
                      {reminderChannelLabel(reminder.channel)
                        ? ` ${reminderChannelLabel(reminder.channel)}`
                        : ''}
                    </span>
                  ) : reminder.status === 'FAILED' && reminder.lastError ? (
                    <span
                      className="hidden max-w-xs truncate text-xs sm:inline"
                      style={{ color: 'var(--status-expired-fg)' }}
                      title={reminder.lastError}
                    >
                      {reminder.lastError}
                    </span>
                  ) : presentation.hint ? (
                    <span
                      className="hidden text-xs sm:inline"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {presentation.hint}
                    </span>
                  ) : null}
                  <span
                    className="rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap"
                    style={{
                      color: style.fg,
                      background: style.bg,
                      borderColor: style.border,
                    }}
                  >
                    {presentation.label}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/*
        The caption now describes what actually happens, because it actually
        happens. The unassigned case still gets an explicit warning: a reminder
        with no recipient is not delivered, and the user must know that.
      */}
      <p
        className="mt-3 flex items-start gap-2 text-xs leading-relaxed"
        style={{ color: hasOwner ? 'var(--muted-foreground)' : 'var(--warning)' }}
      >
        <Clock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {hasOwner
            ? 'Reminders are emailed to the responsible person on these dates, during business hours.'
            : 'Nobody is assigned to this licence, so these reminders cannot be delivered. Assign an owner.'}
        </span>
      </p>

      {/*
        Prior periods: collapsed, closed by default, but COUNTED in the summary.
        A delivery is evidence, so it must stay reachable — and the count means
        nothing is concealed even while it is closed.
      */}
      {prior.length > 0 ? (
        <details className="mt-3 group">
          <summary
            className="cursor-pointer list-none text-xs underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {PRIOR_PERIOD_COPY.summary(prior.length)}
          </summary>
          <p
            className="mt-2 text-xs leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {periodStart ? PRIOR_PERIOD_COPY.hint(formatPlainDate(periodStart)) : null}
          </p>
          {/*
            The content FADES in; the disclosure does not expand.

            Native <details> cannot be height-animated without abandoning the
            element — its content is display:none when closed, so there is no
            height to transition from. The alternative is a button plus a div
            and hand-rolled state, which would cost the built-in keyboard
            toggle and the expanded/collapsed announcement assistive tech gets
            for free. Those are worth more than an expand.

            A fade on appearance works with the native element and explains
            the same thing: this content is new.
          */}
          <ul
            className="motion-fade mt-2 divide-y overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--border)' }}
          >
            {prior.map((reminder) => {
              const presentation = reminderPresentation(reminder.status);
              const style = TONE_STYLES[presentation.tone];
              return (
                <li
                  key={reminder.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-xs"
                  style={{ background: 'var(--card)' }}
                >
                  <span
                    className="tabular-nums"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {reminderOffsetLabel(reminder.offsetDays)}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {formatDueOn(reminder.dueOn)}
                  </span>
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 font-medium"
                    style={{ color: style.fg, background: style.bg }}
                  >
                    {presentation.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
