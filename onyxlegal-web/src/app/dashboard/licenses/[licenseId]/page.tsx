'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  Building2,
  Loader2,
  Pencil,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/shared/components/Modal';
import {
  useArchiveLicense,
  useLicense,
  useLicenseReminders,
  useRenewalPreparation,
  useRenewalPeriodStart,
} from '@/features/compliance/api/compliance';
import { DocumentSection } from '@/features/compliance/components/DocumentSection';
import { RenewalPanel } from '@/features/compliance/components/RenewalPanel';
import { RenewalWorkflowPanel } from '@/features/compliance/components/RenewalWorkflowPanel';
import { ReminderTimeline } from '@/features/compliance/components/ReminderTimeline';
import { EditLicenseDialog } from '@/features/compliance/components/EditLicenseDialog';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { DetailSkeleton } from '@/features/compliance/components/Skeletons';
import { StatusBadge } from '@/features/compliance/components/StatusBadge';
import {
  formatDate,
  formatDateLong,
  formatRemaining,
  statusPresentation,
  TONE_STYLES,
} from '@/features/compliance/lib/format';
import type { License } from '@/lib/api';

/**
 * Licence detail.
 *
 * The expiry is the hero: it is the one fact the user came for, and the one
 * this product exists to stop them forgetting. Everything else is supporting
 * detail, laid out calmly beneath it.
 */
export default function LicenseDetailPage({
  params,
}: {
  params: Promise<{ licenseId: string }>;
}) {
  const { licenseId } = use(params);
  const { data, isLoading, isError, error, refetch } = useLicense(licenseId);
  const remindersQuery = useLicenseReminders(licenseId);
  // The renewal payload also carries the document checklist, so the documents
  // section reuses it rather than the browser recomputing requirement states.
  const renewalQuery = useRenewalPreparation(licenseId);
  // Scopes the timeline to the current licence period. Null until renewed.
  const periodStart = useRenewalPeriodStart(licenseId);

  const [editing, setEditing] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const archive = useArchiveLicense();

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading licence">
        <DetailSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex w-full flex-col">
        <BackLink href="/dashboard/licenses" label="All licences" />
        <ErrorState
          error={error}
          resource="licence"
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const isArchived = data.lifecycle === 'ARCHIVED';

  return (
    <div className="flex w-full flex-col">
      <BackLink
        href={data.site ? `/dashboard/sites/${data.site.id}` : '/dashboard/licenses'}
        label={data.site ? data.site.name : 'All licences'}
      />

      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1
            style={{
              color: 'var(--foreground)',
              fontSize: 'var(--text-xl)',
              fontWeight: 600,
              letterSpacing: 'var(--tracking-tight)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {data.name}
          </h1>
          <p
            className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {data.site ? (
              <span>
                {data.site.name}
                {data.site.city ? ` · ${data.site.city}` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={13} aria-hidden="true" />
                Company-wide
              </span>
            )}
            {isArchived ? (
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  background: 'var(--secondary)',
                  color: 'var(--muted-foreground)',
                }}
              >
                Archived
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
            <Pencil size={14} />
            Edit
          </Button>
          {!isArchived ? (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setConfirmingArchive(true)}
            >
              <Archive size={14} />
              Archive
            </Button>
          ) : null}
        </div>
      </header>

      <ExpiryHero licence={data} />

      <section className="mt-8" aria-labelledby="details-heading">
        <h2
          id="details-heading"
          className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Details
        </h2>
        <dl
          className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border sm:grid-cols-2"
          style={{ borderColor: 'var(--border)', background: 'var(--border)' }}
        >
          <Fact label="Issuing authority" value={data.authority} />
          <Fact label="Licence number" value={data.licenseNumber} mono />
          <Fact label="Type" value={data.licenseType} />
          <Fact
            label="Responsible person"
            value={data.owner?.name ?? data.owner?.email ?? null}
            warnIfEmpty="Unassigned"
          />
          <Fact label="Issued" value={formatDate(data.issueDate)} />
          <Fact
            label="Site"
            value={data.site?.name ?? 'Company-wide'}
          />
        </dl>
      </section>

      {data.notes ? (
        <section className="mt-8" aria-labelledby="notes-heading">
          <h2
            id="notes-heading"
            className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Notes
          </h2>
          <p
            className="rounded-xl border bg-[var(--surface)] p-4 text-sm leading-relaxed whitespace-pre-wrap"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            {data.notes}
          </p>
        </section>
      ) : null}

      {/*
        An unassigned owner is not a compliance failure — the licence may be
        perfectly valid. It is an operational gap: there is nobody for a
        reminder to reach. So it is surfaced as an actionable prompt rather
        than folded into the expiry status, which would misreport the licence.
      */}
      {!data.owner && !isArchived ? (
        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3.5"
          style={{
            borderColor: 'color-mix(in srgb, var(--status-critical-fg) 22%, transparent)',
            background: 'color-mix(in srgb, var(--status-critical-fg) 6%, transparent)',
          }}
        >
          <p className="flex items-center gap-2.5 text-sm">
            <UserPlus
              size={15}
              style={{ color: 'var(--status-critical-fg)' }}
              aria-hidden="true"
            />
            <span style={{ color: 'var(--foreground)' }}>
              No one is responsible for this licence yet.{' '}
              <span style={{ color: 'var(--muted-foreground)' }}>
                Assign an owner so reminders reach the right person.
              </span>
            </span>
          </p>
          <Button variant="outline" size="lg" onClick={() => setEditing(true)}>
            Assign owner
          </Button>
        </div>
      ) : null}

      <section className="mt-8" aria-labelledby="reminders-heading">
        <h2
          id="reminders-heading"
          className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Reminder schedule
        </h2>
        {remindersQuery.isLoading ? (
          <div
            className="rounded-xl border bg-[var(--surface)] px-4 py-6"
            style={{ borderColor: 'var(--border)' }}
            aria-busy="true"
            aria-label="Loading reminder schedule"
          >
            <div
              className="h-4 w-48 animate-pulse rounded"
              style={{ background: 'var(--secondary)' }}
            />
          </div>
        ) : remindersQuery.isError ? (
          <ErrorState
            error={remindersQuery.error}
            resource="reminder schedule"
            onRetry={() => void remindersQuery.refetch()}
          />
        ) : (
          <ReminderTimeline
            reminders={remindersQuery.data ?? []}
            hasOwner={!!data.owner}
            periodStart={periodStart.data ?? null}
          />
        )}
      </section>

      <RenewalWorkflowPanel
        licenseId={licenseId}
        isArchived={isArchived}
        proposedExpiry={renewalQuery.data?.proposedExpiry ?? null}
      />

      <RenewalPanel
        data={renewalQuery.data}
        isLoading={renewalQuery.isLoading}
        isError={renewalQuery.isError}
        error={renewalQuery.error}
        onRetry={() => void renewalQuery.refetch()}
        isArchived={isArchived}
      />

      <DocumentSection
        licenseId={licenseId}
        checklist={renewalQuery.data?.checklist ?? []}
        readOnly={isArchived}
      />

      {editing ? (
        <EditLicenseDialog
          licence={data}
          open={editing}
          onClose={() => setEditing(false)}
        />
      ) : null}

      <Modal
        open={confirmingArchive}
        onClose={() => setConfirmingArchive(false)}
        title="Archive this licence?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
            <strong>{data.name}</strong> will be removed from your active
            licence lists and from its site’s compliance totals.
          </p>
          <p
            className="rounded-lg p-3 text-sm leading-relaxed"
            style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
          >
            Nothing is deleted. The licence and its full history stay on record
            and can still be opened directly.
          </p>
          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setConfirmingArchive(false)}
              disabled={archive.isPending}
            >
              Keep it active
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={archive.isPending}
              onClick={() =>
                archive.mutate(data.id, {
                  onSuccess: () => setConfirmingArchive(false),
                })
              }
            >
              {archive.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Archiving…
                </>
              ) : (
                'Archive licence'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * The hero. Expiry date and remaining time, scaled in weight by urgency but
 * never shouting: an expired licence is red, a licence with two months left
 * is quiet indigo.
 */
function ExpiryHero({ licence }: { licence: License }) {
  const { tone, description } = statusPresentation(licence.status);
  const style = TONE_STYLES[tone];

  return (
    <section
      className="rounded-2xl border p-6 sm:p-7"
      style={{
        borderColor: style.border,
        background: style.bg,
      }}
      aria-labelledby="expiry-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="expiry-heading"
            className="text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Expiry
          </h2>
          <p
            className="font-display mt-2 text-3xl tracking-tight sm:text-4xl"
            style={{ color: 'var(--foreground)' }}
          >
            {formatDateLong(licence.expiryDate)}
          </p>
          <p
            className="mt-1.5 text-lg font-medium tabular-nums"
            style={{ color: style.fg }}
          >
            {formatRemaining(licence.daysUntilExpiry)}
          </p>
        </div>
        <StatusBadge status={licence.status} />
      </div>
      <p
        className="mt-4 max-w-prose text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {description}
      </p>
    </section>
  );
}

function Fact({
  label,
  value,
  mono,
  warnIfEmpty,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  warnIfEmpty?: string;
}) {
  const isEmpty = !value || value === '—';
  return (
    <div className="bg-[var(--surface)] px-4 py-3.5">
      <dt className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm ${mono ? 'font-mono' : ''}`}
        style={{
          color: isEmpty
            ? warnIfEmpty
              ? 'var(--warning)'
              : 'var(--muted-foreground)'
            : 'var(--foreground)',
        }}
      >
        {isEmpty ? (warnIfEmpty ?? 'Not recorded') : value}
      </dd>
    </div>
  );
}

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-5 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--foreground)]"
      style={{ color: 'var(--muted-foreground)' }}
    >
      <ArrowLeft size={15} aria-hidden="true" />
      {label}
    </Link>
  );
}
