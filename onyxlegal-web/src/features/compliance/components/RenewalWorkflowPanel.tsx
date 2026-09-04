'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/shared/components/Modal';
import {
  useActiveRenewal,
  useCompleteRenewal,
  useStartRenewal,
  useTransitionRenewal,
} from '@/features/compliance/api/compliance';
import {
  RENEWAL_WORKFLOW_COPY as COPY,
  stagePresentation,
} from '../lib/renewal-workflow-copy';
import {
  formatDate,
  formatPlainDateLong,
  TONE_STYLES,
} from '../lib/format';
import { ErrorState } from './ErrorState';
import type { LicenseRenewal, RenewalStatus } from '@/lib/api';

/**
 * The renewal workflow on a licence.
 *
 * Closes the loop that was otherwise left open: a reminder fires, someone
 * renews at the portal, and without this the register keeps the old date while
 * reminders fire against a date already past.
 *
 * NAMING. Nothing here says the system submitted anything, because it does
 * not. "I filed this at the portal" is a person reporting what they did, and
 * the stage that follows is "With the authority" — where the paperwork is, not
 * who sent it. honesty.spec.ts holds this file's copy to that rule.
 */
export function RenewalWorkflowPanel({
  licenseId,
  isArchived,
  proposedExpiry,
}: {
  licenseId: string;
  isArchived: boolean;
  /** From the licence type's renewal cycle. A suggestion, never applied. */
  proposedExpiry: string | null;
}) {
  const { data, isLoading, isError, error, refetch } =
    useActiveRenewal(licenseId);
  const start = useStartRenewal(licenseId);
  const transition = useTransitionRenewal(licenseId);

  const [closing, setClosing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  // Archiving means the licence is out of scope, so there is nothing to renew.
  if (isArchived) return null;

  return (
    <section className="mt-8" aria-labelledby="renewal-workflow-heading">
      <h2
        id="renewal-workflow-heading"
        className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {data ? COPY.heading : COPY.startHeading}
      </h2>

      {isLoading ? (
        <div
          className="rounded-xl border bg-[var(--surface)] px-4 py-6"
          style={{ borderColor: 'var(--border)' }}
          aria-busy="true"
          aria-label={COPY.loading}
        >
          <div
            className="h-4 w-44 animate-pulse rounded"
            style={{ background: 'var(--secondary)' }}
          />
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          resource="renewal"
          onRetry={() => void refetch()}
        />
      ) : !data ? (
        <div
          className="rounded-xl border bg-[var(--surface)] p-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <p
            className="max-w-prose text-sm leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {COPY.startBody}
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-3"
            onClick={() => start.mutate()}
            disabled={start.isPending}
          >
            {start.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {COPY.starting}
              </>
            ) : (
              <>
                <RotateCw size={14} />
                {COPY.start}
              </>
            )}
          </Button>
        </div>
      ) : (
        <ActiveRenewal
          renewal={data}
          busy={transition.isPending}
          onTransition={(status, outcome) =>
            transition.mutate({ renewalId: data.id, status, outcome })
          }
          onClose={() => setClosing(true)}
          onComplete={() => setCompleting(true)}
        />
      )}

      {/* ── Stop the renewal ─────────────────────────────────────────── */}
      <Modal
        open={closing}
        onClose={() => setClosing(false)}
        title={COPY.close}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {COPY.closeHint}
          </p>
          <label className="block">
            <span
              className="text-xs"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {COPY.closeReasonLabel}
            </span>
            <input
              value={closeReason}
              onChange={(event) => setCloseReason(event.target.value)}
              placeholder={COPY.closeReasonPlaceholder}
              className="mt-1 h-9 w-full rounded-lg border px-2.5 text-sm"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--background)',
                color: 'var(--foreground)',
              }}
            />
          </label>
          <div
            className="flex justify-end gap-2 border-t pt-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setClosing(false)}
            >
              {COPY.cancel}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              disabled={!closeReason.trim() || transition.isPending}
              onClick={() => {
                if (!data) return;
                transition.mutate(
                  {
                    renewalId: data.id,
                    status: 'CLOSED',
                    outcome: closeReason.trim(),
                  },
                  {
                    onSuccess: () => {
                      setClosing(false);
                      setCloseReason('');
                    },
                  },
                );
              }}
            >
              {COPY.closeConfirm}
            </Button>
          </div>
        </div>
      </Modal>

      {data ? (
        <CompleteDialog
          open={completing}
          onClose={() => setCompleting(false)}
          licenseId={licenseId}
          renewal={data}
          proposedExpiry={proposedExpiry}
        />
      ) : null}
    </section>
  );
}

function ActiveRenewal({
  renewal,
  busy,
  onTransition,
  onClose,
  onComplete,
}: {
  renewal: LicenseRenewal;
  busy: boolean;
  onTransition: (status: RenewalStatus, outcome?: string) => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  const stage = stagePresentation(renewal.status);
  const tone = TONE_STYLES[stage.tone];

  return (
    <div
      className="overflow-hidden rounded-xl border bg-[var(--surface)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="min-w-0">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ color: tone.fg, background: tone.bg }}
          >
            {stage.label}
          </span>
          <p
            className="mt-2 max-w-prose text-sm leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {stage.detail}
          </p>
        </div>
      </div>

      <dl
        className="grid grid-cols-1 gap-px sm:grid-cols-2"
        style={{ background: 'var(--border)' }}
      >
        <Fact
          label={COPY.labelStarted}
          value={
            renewal.startedBy
              ? COPY.startedBy(
                  renewal.startedBy.name ?? renewal.startedBy.email,
                  formatDate(renewal.startedAt),
                )
              : formatDate(renewal.startedAt)
          }
        />
        {renewal.submittedAt ? (
          <Fact
            label={COPY.labelReportedFiled}
            value={COPY.youFiledOn(
              renewal.submittedBy?.name ??
                renewal.submittedBy?.email ??
                'Someone',
              formatDate(renewal.submittedAt),
            )}
          />
        ) : null}
        <Fact
          label={COPY.labelExpiryAtStart}
          value={formatPlainDateLong(renewal.previousExpiry)}
        />
      </dl>

      <div
        className="flex flex-wrap gap-2 border-t px-4 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        {renewal.status === 'PREPARING' ? (
          <Button
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => onTransition('READY')}
            title={COPY.markReadyHint}
          >
            {COPY.markReady}
          </Button>
        ) : null}

        {renewal.status === 'READY' ? (
          <Button
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => onTransition('PREPARING')}
          >
            {COPY.backToPreparing}
          </Button>
        ) : null}

        {renewal.status === 'PREPARING' || renewal.status === 'READY' ? (
          <Button
            size="lg"
            disabled={busy}
            onClick={() => onTransition('AWAITING_AUTHORITY')}
            title={COPY.markFiledHint}
          >
            {COPY.markFiled}
          </Button>
        ) : null}

        {renewal.status === 'AWAITING_AUTHORITY' ? (
          <>
            <Button size="lg" disabled={busy} onClick={onComplete}>
              <CheckCircle2 size={14} />
              {COPY.completeHeading}
            </Button>
            <Button
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => onTransition('READY')}
            >
              {COPY.reopenForRefiling}
            </Button>
          </>
        ) : null}

        <Button variant="outline" size="lg" disabled={busy} onClick={onClose}>
          {COPY.close}
        </Button>
      </div>

      {/* Says plainly who does the filing, on the surface where it matters. */}
      <p
        className="border-t px-4 py-2.5 text-[11px] leading-relaxed"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        {COPY.markFiledHint}
      </p>
    </div>
  );
}

function CompleteDialog({
  open,
  onClose,
  licenseId,
  renewal,
  proposedExpiry,
}: {
  open: boolean;
  onClose: () => void;
  licenseId: string;
  renewal: LicenseRenewal;
  proposedExpiry: string | null;
}) {
  // Deliberately starts EMPTY, even when a proposal exists. Pre-filling the
  // field would mean a distracted person could accept a computed date without
  // ever looking at the certificate — an invented fact in the one field this
  // product exists to get right.
  const [newExpiry, setNewExpiry] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const complete = useCompleteRenewal(licenseId);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={COPY.completeHeading}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {COPY.completeBody}
        </p>

        <label className="block">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {COPY.newExpiryLabel}
          </span>
          <input
            type="date"
            value={newExpiry}
            onChange={(event) => setNewExpiry(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border px-2.5 text-sm"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
          {proposedExpiry ? (
            <span
              className="mt-1 block text-[11px] leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {COPY.proposedHint(formatPlainDateLong(proposedExpiry))}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {COPY.newNumberLabel}
          </span>
          <input
            value={newNumber}
            onChange={(event) => setNewNumber(event.target.value)}
            className="mt-1 h-9 w-full rounded-lg border px-2.5 text-sm"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
            }}
          />
        </label>

        <p
          className="rounded-lg px-3 py-2 text-[11px] leading-relaxed"
          style={{ background: TONE_STYLES.warning.bg, color: 'var(--foreground)' }}
        >
          {COPY.dateRule}
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {COPY.certificateHint}
        </p>

        <div
          className="flex justify-end gap-2 border-t pt-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="outline" size="lg" onClick={onClose}>
            {COPY.cancel}
          </Button>
          <Button
            size="lg"
            disabled={!newExpiry || complete.isPending}
            onClick={() =>
              complete.mutate(
                {
                  renewalId: renewal.id,
                  newExpiry,
                  newLicenseNumber: newNumber.trim() || undefined,
                },
                { onSuccess: onClose },
              )
            }
          >
            {complete.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {COPY.completing}
              </>
            ) : (
              COPY.complete
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-3">
      <dt className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </dt>
      <dd className="mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
        {value}
      </dd>
    </div>
  );
}
