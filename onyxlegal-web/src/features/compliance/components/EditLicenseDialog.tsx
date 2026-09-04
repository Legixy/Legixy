'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/shared/components/Modal';
import { useSites, useTenantUsers, useUpdateLicense } from '../api/compliance';
import { toCalendarDate } from '../lib/format';
import type { License, LicenseInput } from '@/lib/api';

/**
 * Edit a licence.
 *
 * FIELD SET
 * ---------
 * Exactly the fields `PATCH /licenses/:id` accepts — no more. `tenantId` is
 * absent by design: the server resolves it from the auth cookie, and sending
 * it would be rejected by the API's `forbidNonWhitelisted` validation.
 *
 * OWNER
 * -----
 * Selected from the tenant's own directory (`GET /users`), never typed. The
 * option values are ids, but the user only ever sees names and emails, and the
 * server re-validates that the chosen user belongs to the caller's tenant —
 * the browser cannot assign someone from another organisation.
 *
 * DATES
 * -----
 * `<input type="date">` produces "YYYY-MM-DD", which is exactly the calendar
 * date the API expects. No Date object is constructed, so no timezone can be
 * introduced on the way in.
 */
export function EditLicenseDialog({
  licence,
  open,
  onClose,
}: {
  licence: License;
  open: boolean;
  onClose: () => void;
}) {
  const update = useUpdateLicense();
  const { data: siteData } = useSites();
  const { data: tenantUsers, isLoading: usersLoading } = useTenantUsers();

  const [form, setForm] = useState({
    name: licence.name,
    licenseType: licence.licenseType ?? '',
    authority: licence.authority ?? '',
    licenseNumber: licence.licenseNumber ?? '',
    issueDate: toCalendarDate(licence.issueDate) ?? '',
    expiryDate: toCalendarDate(licence.expiryDate) ?? '',
    siteId: licence.siteId ?? '',
    ownerUserId: licence.ownerUserId ?? '',
    notes: licence.notes ?? '',
  });
  const [dateError, setDateError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (key === 'issueDate' || key === 'expiryDate') setDateError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Mirror of the server rule, purely so the user gets an answer without a
    // round trip. The server remains the authority and re-checks this.
    if (form.issueDate && form.expiryDate && form.expiryDate < form.issueDate) {
      setDateError('Expiry date cannot be earlier than the issue date.');
      return;
    }

    const payload: LicenseInput = {
      name: form.name.trim(),
      licenseType: form.licenseType.trim() || null,
      authority: form.authority.trim() || null,
      licenseNumber: form.licenseNumber.trim() || null,
      issueDate: form.issueDate || null,
      expiryDate: form.expiryDate || null,
      siteId: form.siteId || null,
      // Empty string means "unassigned", which the domain allows explicitly.
      ownerUserId: form.ownerUserId || null,
      notes: form.notes.trim() || null,
    };

    update.mutate(
      { id: licence.id, data: payload },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit licence">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Licence name" htmlFor="licence-name" required>
          <Input
            id="licence-name"
            value={form.name}
            onChange={(event) => set('name', event.target.value)}
            required
            maxLength={200}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" htmlFor="licence-type">
            <Input
              id="licence-type"
              value={form.licenseType}
              onChange={(event) => set('licenseType', event.target.value)}
              placeholder="e.g. Municipality"
              maxLength={120}
            />
          </Field>
          <Field label="Issuing authority" htmlFor="licence-authority">
            <Input
              id="licence-authority"
              value={form.authority}
              onChange={(event) => set('authority', event.target.value)}
              maxLength={200}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Licence number" htmlFor="licence-number">
            <Input
              id="licence-number"
              value={form.licenseNumber}
              onChange={(event) => set('licenseNumber', event.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="Site" htmlFor="licence-site">
            <select
              id="licence-site"
              value={form.siteId}
              onChange={(event) => set('siteId', event.target.value)}
              className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm outline-none focus-visible:ring-3"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="">Company-wide (no site)</option>
              {(siteData?.data ?? []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Issue date" htmlFor="licence-issued">
            <Input
              id="licence-issued"
              type="date"
              value={form.issueDate}
              onChange={(event) => set('issueDate', event.target.value)}
            />
          </Field>
          <Field label="Expiry date" htmlFor="licence-expiry">
            <Input
              id="licence-expiry"
              type="date"
              value={form.expiryDate}
              onChange={(event) => set('expiryDate', event.target.value)}
              aria-describedby={dateError ? 'licence-date-error' : undefined}
              aria-invalid={dateError ? true : undefined}
            />
          </Field>
        </div>

        {dateError ? (
          <p
            id="licence-date-error"
            role="alert"
            className="text-xs"
            style={{ color: 'var(--status-expired-fg)' }}
          >
            {dateError}
          </p>
        ) : null}

        <Field label="Responsible person" htmlFor="licence-owner">
          <select
            id="licence-owner"
            value={form.ownerUserId}
            onChange={(event) => set('ownerUserId', event.target.value)}
            disabled={usersLoading}
            className="h-9 w-full rounded-lg border bg-[var(--surface)] px-3 text-sm outline-none focus-visible:ring-3"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          >
            <option value="">Unassigned</option>
            {(tenantUsers ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.name ? `${person.name} (${person.email})` : person.email}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Reminders for this licence will be addressed to this person.
          </p>
        </Field>

        <Field label="Notes" htmlFor="licence-notes">
          <textarea
            id="licence-notes"
            value={form.notes}
            onChange={(event) => set('notes', event.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full rounded-lg border bg-[var(--surface)] px-3 py-2 text-sm outline-none focus-visible:ring-3"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </Field>

        <div
          className="flex justify-end gap-2 border-t pt-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={update.isPending}>
            {update.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-medium"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {label}
        {required ? (
          <span style={{ color: 'var(--status-expired-fg)' }} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children}
    </div>
  );
}
