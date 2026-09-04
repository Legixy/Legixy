'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateLicense,
  useLicenseTypes,
  useSites,
  useTenantUsers,
} from '@/features/compliance/api/compliance';
import { NEW_LICENSE_COPY } from '@/features/compliance/lib/new-license-copy';
import { formatDateLong } from '@/features/compliance/lib/format';
import { licenses, type ImportField, type ResolvedRowCheck } from '@/lib/api';

/**
 * Add one licence by hand.
 *
 * WHY THIS SCREEN EXISTS
 * ----------------------
 * For fourteen slices bulk import was the only way a licence could be
 * created. The dashboard's first-run panel has offered "or add one by hand"
 * since Slice 10 and linked to a list with no add path — an interface
 * advertising a capability the system did not have, which is the failure
 * class the honesty work has been correcting since Slice 8.
 *
 * It also made the product absurd in the small case: a customer opening one
 * new branch, or told they must now hold one new permit, had to build a
 * spreadsheet for a single row.
 *
 * ONE VALIDATOR, NOT TWO
 * ----------------------
 * The dates are checked by POST /licenses/check, which is Slice 10's
 * `validateRow` behind an endpoint. The browser does no date parsing at all.
 * That is deliberate: if this form had its own parser, "01/02/2027" could be
 * refused here and accepted by import, or the two could give different
 * reasons, and nobody would notice until a reminder landed on the wrong day.
 *
 * The commit goes to POST /licenses, which is LicensesService.create — the
 * same call import commits through, so reconcile() runs and the licence
 * acquires its reminder ladder before the response returns.
 */
export default function NewLicensePage() {
  const router = useRouter();
  const params = useSearchParams();

  const types = useLicenseTypes();
  const siteList = useSites({ limit: 100 });
  const users = useTenantUsers();
  const create = useCreateLicense();

  const [name, setName] = useState('');
  const [licenseTypeId, setLicenseTypeId] = useState('');
  // Pre-selected when arriving from a site's page, so the common path is one
  // field shorter and cannot pick the wrong site by accident.
  const [siteId, setSiteId] = useState(params.get('siteId') ?? '');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [checked, setChecked] = useState<ResolvedRowCheck | null>(null);
  const [checking, setChecking] = useState(false);

  const selectedType = useMemo(
    () => types.data?.find((t) => t.id === licenseTypeId) ?? null,
    [types.data, licenseTypeId],
  );

  /**
   * The scope invariant, enforced in the interface as well as the service.
   *
   * The server is still the authority — assertScopeMatchesSite runs on every
   * create — but a rule the person only discovers by being rejected is a bad
   * rule. So a SITE-scoped type disables "Company-wide", and an ENTITY-scoped
   * type disables every site.
   */
  const scope = selectedType?.scope ?? null;
  const siteRequired = scope === 'SITE';
  const siteForbidden = scope === 'ENTITY';
  const scopeError =
    siteRequired && !siteId
      ? NEW_LICENSE_COPY.siteRequiredHint
      : siteForbidden && siteId
        ? NEW_LICENSE_COPY.siteForbiddenHint
        : null;

  const values = (): Partial<Record<ImportField, string>> => ({
    name,
    licenseNumber,
    issueDate,
    expiryDate,
    notes,
  });

  /** Ask the server the same question import asks. */
  const runCheck = async (): Promise<ResolvedRowCheck | null> => {
    setChecking(true);
    try {
      const result = await licenses.check(values());
      setChecked(result);
      return result;
    } catch {
      setChecked(null);
      return null;
    } finally {
      setChecking(false);
    }
  };

  const issues = checked?.issues ?? [];
  const canSubmit = name.trim() !== '' && !scopeError && !create.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const result = await runCheck();
    if (!result || result.outcome === 'FAIL') return;

    const created = await create.mutateAsync({
      name: result.name,
      siteId: siteId || null,
      ownerUserId: ownerUserId || null,
      licenseTypeId: licenseTypeId || null,
      licenseNumber: result.licenseNumber,
      // Authority comes from the catalogue type, never typed free-hand, so a
      // licence can never claim an authority that is not on record.
      authority: selectedType?.authority.name ?? null,
      issueDate: result.issueDate,
      expiryDate: result.expiryDate,
      notes: result.notes,
    });

    toast.success(NEW_LICENSE_COPY.created, {
      description: created.expiryDate
        ? NEW_LICENSE_COPY.createdWithExpiry
        : NEW_LICENSE_COPY.createdNoExpiry,
    });
    router.push(`/dashboard/licenses/${created.id}`);
  };

  return (
    <div data-exemplar className="flex w-full flex-col">
      <Link
        href="/dashboard/licenses"
        className="inline-flex items-center self-start"
        style={{
          color: 'var(--muted-foreground)',
          fontSize: 'var(--text-sm)',
          gap: 'var(--space-1)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {NEW_LICENSE_COPY.back}
      </Link>

      <h1
        style={{
          color: 'var(--foreground)',
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {NEW_LICENSE_COPY.title}
      </h1>
      <p
        style={{
          color: 'var(--muted-foreground)',
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-normal)',
          marginTop: 'var(--space-1)',
          maxWidth: '58ch',
        }}
      >
        {NEW_LICENSE_COPY.intro}
      </p>

      <form
        onSubmit={submit}
        style={{ marginTop: 'var(--space-5)', maxWidth: '62ch' }}
      >
        <Card>
          <Field
            label={NEW_LICENSE_COPY.nameLabel}
            hint={NEW_LICENSE_COPY.nameHint}
            required
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={NEW_LICENSE_COPY.namePlaceholder}
              required
              maxLength={200}
              style={inputStyle}
            />
          </Field>

          <Field
            label={NEW_LICENSE_COPY.typeLabel}
            hint={NEW_LICENSE_COPY.typeHint}
          >
            <select
              value={licenseTypeId}
              onChange={(e) => {
                setLicenseTypeId(e.target.value);
                const next = types.data?.find((t) => t.id === e.target.value);
                if (next?.scope === 'ENTITY') setSiteId('');
              }}
              style={inputStyle}
            >
              <option value="">{NEW_LICENSE_COPY.typeNone}</option>
              {(types.data ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} — {type.authority.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Arabic name of the chosen type, in the paired face. Rendered
              only because the record genuinely carries it. */}
          {selectedType ? (
            <p
              dir="rtl"
              lang="ar"
              style={{
                color: 'var(--muted-foreground)',
                fontSize: 'var(--text-xs)',
                marginTop: 'calc(var(--space-2) * -1)',
                marginBottom: 'var(--space-4)',
              }}
            >
              {selectedType.nameAr}
            </p>
          ) : null}

          <Field
            label={NEW_LICENSE_COPY.siteLabel}
            hint={
              siteRequired
                ? NEW_LICENSE_COPY.siteRequiredHint
                : siteForbidden
                  ? NEW_LICENSE_COPY.siteForbiddenHint
                  : undefined
            }
          >
            <select
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
              disabled={siteForbidden}
              style={inputStyle}
            >
              <option value="">{NEW_LICENSE_COPY.siteNone}</option>
              {(siteList.data?.data ?? []).map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label={NEW_LICENSE_COPY.ownerLabel}
            hint={ownerUserId === '' ? NEW_LICENSE_COPY.ownerWarning : undefined}
            hintTone={ownerUserId === '' ? 'warn' : undefined}
          >
            <select
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              style={inputStyle}
            >
              <option value="">{NEW_LICENSE_COPY.ownerNone}</option>
              {(users.data ?? []).map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card>
          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-xs)',
              lineHeight: 'var(--leading-normal)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {NEW_LICENSE_COPY.dateRule}
          </p>

          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ gap: 'var(--space-4)' }}
          >
            <Field label={NEW_LICENSE_COPY.issueLabel}>
              <input
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                onBlur={() => void runCheck()}
                placeholder="2026-09-15"
                inputMode="numeric"
                className="tnum"
                style={inputStyle}
              />
            </Field>
            <Field
              label={NEW_LICENSE_COPY.expiryLabel}
              hint={NEW_LICENSE_COPY.expiryHint}
            >
              <input
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                onBlur={() => void runCheck()}
                placeholder="2027-09-15"
                inputMode="numeric"
                className="tnum"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field
            label={NEW_LICENSE_COPY.numberLabel}
            hint={NEW_LICENSE_COPY.numberHint}
          >
            <input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              maxLength={120}
              style={inputStyle}
            />
          </Field>

          <Field
            label={NEW_LICENSE_COPY.notesLabel}
            hint={NEW_LICENSE_COPY.notesHint}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
            />
          </Field>
        </Card>

        {/* ── The echo ────────────────────────────────────────────────────
            Dates read back in long form before commit. Someone who typed
            2027-09-15 and meant 2027-05-09 has exactly one chance to catch
            it, and this is it. */}
        {checked && checked.outcome === 'CREATE' && (checked.expiryDate || checked.issueDate) ? (
          <Card tone="echo">
            <h2 style={legendStyle}>{NEW_LICENSE_COPY.echoHeading}</h2>
            <ul
              style={{
                color: 'var(--foreground)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--leading-normal)',
              }}
            >
              {checked.issueDate ? (
                <li>{NEW_LICENSE_COPY.echoIssue(formatDateLong(checked.issueDate))}</li>
              ) : null}
              {checked.expiryDate ? (
                <li>{NEW_LICENSE_COPY.echoExpiry(formatDateLong(checked.expiryDate))}</li>
              ) : null}
            </ul>
            <p
              style={{
                color: 'var(--muted-foreground)',
                fontSize: 'var(--text-xs)',
                marginTop: 'var(--space-2)',
              }}
            >
              {checked.expiryDate
                ? NEW_LICENSE_COPY.echoReminders
                : NEW_LICENSE_COPY.echoNoExpiry}
            </p>
          </Card>
        ) : null}

        {/* ── Problems ───────────────────────────────────────────────────── */}
        {issues.length > 0 || scopeError ? (
          <div
            role="alert"
            style={{
              background: 'var(--status-expired-bg)',
              border: 'var(--hairline) solid var(--status-expired-fg)',
              borderRadius: 'var(--radius-md)',
              marginTop: 'var(--space-4)',
              padding: 'var(--space-4)',
            }}
          >
            <h2
              className="flex items-center"
              style={{
                color: 'var(--status-expired-fg)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                gap: 'var(--space-2)',
              }}
            >
              <TriangleAlert size={14} aria-hidden="true" />
              {NEW_LICENSE_COPY.fixBeforeSaving}
            </h2>
            <ul
              style={{
                color: 'var(--status-expired-fg)',
                fontSize: 'var(--text-sm)',
                lineHeight: 'var(--leading-normal)',
                marginTop: 'var(--space-2)',
              }}
            >
              {scopeError ? <li>{scopeError}</li> : null}
              {issues.map((issue, index) => (
                <li key={index}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div
          className="flex items-center"
          style={{ gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}
        >
          <button type="submit" disabled={!canSubmit} style={primaryButtonStyle}>
            {create.isPending || checking
              ? NEW_LICENSE_COPY.submitting
              : NEW_LICENSE_COPY.submit}
          </button>
          <Link href="/dashboard/licenses" style={secondaryButtonStyle}>
            {NEW_LICENSE_COPY.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

/* ── Local presentation ─────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: 'var(--hairline) solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--foreground)',
  fontSize: 'var(--text-sm)',
  height: 'var(--space-8)',
  paddingInline: 'var(--space-2)',
  width: '100%',
};

const legendStyle: React.CSSProperties = {
  color: 'var(--muted-foreground)',
  fontSize: 'var(--text-2xs)',
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  lineHeight: 'var(--leading-tight)',
  marginBottom: 'var(--space-2)',
  textTransform: 'uppercase',
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--primary)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--primary-foreground)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  height: 'var(--space-10)',
  paddingInline: 'var(--space-5)',
};

const secondaryButtonStyle: React.CSSProperties = {
  alignItems: 'center',
  background: 'var(--surface)',
  border: 'var(--hairline) solid var(--border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--foreground)',
  display: 'inline-flex',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  height: 'var(--space-10)',
  paddingInline: 'var(--space-4)',
};

function Card({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: 'echo';
}) {
  return (
    <div
      style={{
        background: tone === 'echo' ? 'var(--status-soon-bg)' : 'var(--surface)',
        border: `var(--hairline) solid ${
          tone === 'echo' ? 'var(--status-soon-fg)' : 'var(--border)'
        }`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        marginTop: 'var(--space-4)',
        padding: 'var(--space-5)',
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  hintTone,
  required,
  children,
}: {
  label: string;
  hint?: string;
  hintTone?: 'warn';
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block" style={{ marginBottom: 'var(--space-4)' }}>
      <span
        className="block"
        style={{
          color: 'var(--foreground)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          marginBottom: 'var(--space-1)',
        }}
      >
        {label}
        {required ? (
          <span style={{ color: 'var(--status-expired-fg)' }} aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span
          className="block"
          style={{
            color:
              hintTone === 'warn'
                ? 'var(--status-critical-fg)'
                : 'var(--muted-foreground)',
            fontSize: 'var(--text-xs)',
            lineHeight: 'var(--leading-normal)',
            marginTop: 'var(--space-1)',
          }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
