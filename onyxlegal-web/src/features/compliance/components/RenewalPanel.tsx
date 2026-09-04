'use client';

import {
  AlertCircle,
  CalendarClock,
  Check,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import { ErrorState } from './ErrorState';
import {
  checklistPresentation,
  checklistSummary,
  PORTAL_LINK_HINT,
  portalLinkLabel,
  RENEWAL_COPY,
  routeBadge,
  safeGuidanceDetail,
} from '../lib/renewal-copy';
import { formatPlainDate, TONE_STYLES } from '../lib/format';
import type { ChecklistItem, ChecklistState, RenewalPreparation } from '@/lib/api';
import type { ApiError } from '@/lib/api';

/**
 * Renewal preparation.
 *
 * Everything on this panel is derived server-side and read-only. There is no
 * "submit" button, no "start renewal" action, and no state machine — because
 * nothing in this system files anything with any authority. What it does is
 * put everything a person needs in one place so the filing takes minutes
 * rather than an afternoon.
 *
 * All wording comes from lib/renewal-copy, which is under test to prove that
 * none of it claims otherwise. Server-supplied guidance is passed through
 * `safeGuidanceDetail` as an independent second check.
 */
export function RenewalPanel({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  isArchived,
}: {
  data: RenewalPreparation | undefined;
  isLoading: boolean;
  isError: boolean;
  error: ApiError | null;
  onRetry: () => void;
  isArchived: boolean;
}) {
  return (
    <section className="mt-8" aria-labelledby="renewal-heading">
      <h2
        id="renewal-heading"
        className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {RENEWAL_COPY.heading}
      </h2>

      {isLoading ? (
        <div
          className="rounded-xl border bg-[var(--surface)] px-4 py-6"
          style={{ borderColor: 'var(--border)' }}
          aria-busy="true"
          aria-label="Loading renewal preparation"
        >
          <div
            className="h-4 w-56 animate-pulse rounded"
            style={{ background: 'var(--secondary)' }}
          />
        </div>
      ) : isError || !data ? (
        <ErrorState
          error={error}
          resource="renewal preparation"
          onRetry={onRetry}
        />
      ) : (
        <RenewalBody data={data} isArchived={isArchived} />
      )}
    </section>
  );
}

function RenewalBody({
  data,
  isArchived,
}: {
  data: RenewalPreparation;
  isArchived: boolean;
}) {
  const badge = routeBadge(data.authority?.submissionRoute ?? 'PREPARE_ONLY');
  const badgeStyle = TONE_STYLES[badge.tone];

  return (
    <div
      className="overflow-hidden rounded-xl border bg-[var(--surface)]"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Who files it, and the fact that a person does. Stated first. */}
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <p
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            <RotateCw size={14} aria-hidden="true" />
            {data.guidance.headline}
          </p>
          <p
            className="mt-1.5 max-w-prose text-sm leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {safeGuidanceDetail(data.guidance.detail)}
          </p>
        </div>
        <span
          className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            color: badgeStyle.fg,
            background: badgeStyle.bg,
            borderColor: badgeStyle.border,
          }}
          title={badge.title}
        >
          {badge.label}
        </span>
      </div>

      {isArchived ? (
        <p className="px-4 py-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {RENEWAL_COPY.archived}
        </p>
      ) : !data.inRenewalWindow ? (
        <div className="px-4 py-4">
          <p
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--foreground)' }}
          >
            <CalendarClock size={14} aria-hidden="true" />
            {RENEWAL_COPY.notYetHeading}
          </p>
          <p
            className="mt-1 max-w-prose text-sm leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {RENEWAL_COPY.notYet}
          </p>
        </div>
      ) : null}

      {/* Facts. Shown whatever the window state — they are simply true. */}
      <dl
        className="grid grid-cols-1 gap-px border-t sm:grid-cols-3"
        style={{ borderColor: 'var(--border)', background: 'var(--border)' }}
      >
        <Fact
          label={RENEWAL_COPY.authorityLabel}
          value={data.authority?.name ?? null}
        />
        <Fact
          label={RENEWAL_COPY.feeLabel}
          value={data.typicalFee ? `SAR ${data.typicalFee}` : null}
          fallback={RENEWAL_COPY.feeUnknown}
        />
        <Fact
          label={RENEWAL_COPY.proposedLabel}
          value={formatPlainDate(data.proposedExpiry)}
          hint={data.proposedExpiry ? RENEWAL_COPY.proposedHint : undefined}
        />
      </dl>

      {data.authority?.portalUrl ? (
        <div
          className="border-t px-4 py-3.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <a
            href={data.authority.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            {portalLinkLabel(data.authority.name)}
            <ExternalLink size={13} aria-hidden="true" />
          </a>
          <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {PORTAL_LINK_HINT}
          </p>
        </div>
      ) : null}

      <Checklist items={data.checklist} />
    </div>
  );
}

function Checklist({ items }: { items: ChecklistItem[] }) {
  const summary = checklistSummary(items.map((item) => item.state));

  return (
    <div className="border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 pt-4 pb-2">
        <h3 className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {RENEWAL_COPY.checklistHeading}
        </h3>
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {summary}
        </p>
      </div>

      {items.length === 0 ? null : (
        <ul className="pb-2">
          {items.map((item) => (
            <ChecklistRow key={item.code} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One requirement.
 *
 * The three states differ by icon, by text label and by colour — never by
 * colour alone, which would be invisible to a colour-blind user and is the
 * exact distinction this row exists to make.
 */
function ChecklistRow({ item }: { item: ChecklistItem }) {
  const presentation = checklistPresentation(item.state);
  const style = TONE_STYLES[presentation.tone];
  const Icon = ICONS[item.state] ?? AlertCircle;

  return (
    <li
      className="flex flex-wrap items-start gap-3 px-4 py-2.5"
      data-checklist-state={item.state}
    >
      <span
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
        style={{ background: style.bg, color: style.fg }}
        aria-hidden="true"
      >
        <Icon size={12} strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm" style={{ color: 'var(--foreground)' }}>
          {item.label}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {item.state === 'PRESENT' && item.filename
            ? item.expiresOn
              ? `${item.filename} · valid to ${formatPlainDate(item.expiresOn)}`
              : item.filename
            : item.state === 'EXPIRED' && item.expiresOn
              ? `${item.filename ?? 'On file'} · expired ${formatPlainDate(item.expiresOn)}`
              : presentation.hint}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
        style={{ color: style.fg, background: style.bg }}
      >
        {presentation.label}
      </span>
    </li>
  );
}

const ICONS: Record<ChecklistState, typeof Check> = {
  PRESENT: Check,
  EXPIRED: RotateCw,
  MISSING: AlertCircle,
};

function Fact({
  label,
  value,
  fallback,
  hint,
}: {
  label: string;
  value: string | null;
  fallback?: string;
  hint?: string;
}) {
  const isEmpty = !value || value === '—';
  return (
    <div className="bg-[var(--surface)] px-4 py-3.5">
      <dt className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </dt>
      <dd
        className="mt-1 text-sm"
        style={{
          color: isEmpty ? 'var(--muted-foreground)' : 'var(--foreground)',
        }}
      >
        {isEmpty ? (fallback ?? 'Not recorded') : value}
      </dd>
      {hint ? (
        <p
          className="mt-1 text-[11px] leading-snug"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
