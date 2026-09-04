'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSite } from '@/features/compliance/api/compliance';
import { SITE_FORM_COPY } from '@/features/compliance/lib/site-form-copy';

/**
 * Add one site.
 *
 * WHY THIS EXISTS
 * ---------------
 * The same gap the licence form closes, one step earlier and worse. The
 * dashboard's first-run panel opens with "Add your sites" and a button
 * reading "Add a site", which linked to a list containing no way to add one.
 * That is step ONE of a brand-new customer's first minute in the product.
 *
 * Sites could only be created as a side effect of importing a licence that
 * named a site that did not exist yet — so the documented order (sites
 * first, because a licence usually belongs to one) was impossible to follow.
 *
 * Deliberately four fields. A site is a place with a name; everything else
 * about it is optional and can be filled in later from its own page.
 */
export default function NewSitePage() {
  const router = useRouter();
  const create = useCreateSite();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');

  const canSubmit = name.trim() !== '' && !create.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const site = await create.mutateAsync({
      name: name.trim(),
      city: city.trim() || null,
      code: code.trim() || null,
      address: address.trim() || null,
    });

    toast.success(SITE_FORM_COPY.created, {
      description: SITE_FORM_COPY.createdBody,
    });
    router.push(`/dashboard/sites/${site.id}`);
  };

  return (
    <div data-exemplar className="flex w-full flex-col">
      <Link
        href="/dashboard/sites"
        className="inline-flex items-center self-start"
        style={{
          color: 'var(--muted-foreground)',
          fontSize: 'var(--text-sm)',
          gap: 'var(--space-1)',
          marginBottom: 'var(--space-3)',
        }}
      >
        <ArrowLeft size={14} aria-hidden="true" />
        {SITE_FORM_COPY.back}
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
        {SITE_FORM_COPY.title}
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
        {SITE_FORM_COPY.intro}
      </p>

      <form onSubmit={submit} style={{ marginTop: 'var(--space-5)', maxWidth: '52ch' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: 'var(--hairline) solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xs)',
            padding: 'var(--space-5)',
          }}
        >
          <Field label={SITE_FORM_COPY.nameLabel} hint={SITE_FORM_COPY.nameHint} required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={SITE_FORM_COPY.namePlaceholder}
              required
              maxLength={200}
              style={inputStyle}
            />
          </Field>

          <Field label={SITE_FORM_COPY.cityLabel}>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={120}
              style={inputStyle}
            />
          </Field>

          <Field label={SITE_FORM_COPY.codeLabel} hint={SITE_FORM_COPY.codeHint}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={50}
              style={inputStyle}
            />
          </Field>

          <Field label={SITE_FORM_COPY.addressLabel}>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              maxLength={500}
              style={{ ...inputStyle, height: 'auto', resize: 'vertical' }}
            />
          </Field>
        </div>

        <div
          className="flex items-center"
          style={{ gap: 'var(--space-2)', marginTop: 'var(--space-5)' }}
        >
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              background: 'var(--primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary-foreground)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              height: 'var(--space-10)',
              paddingInline: 'var(--space-5)',
            }}
          >
            {create.isPending ? SITE_FORM_COPY.submitting : SITE_FORM_COPY.submit}
          </button>
          <Link
            href="/dashboard/sites"
            className="inline-flex items-center"
            style={{
              background: 'var(--surface)',
              border: 'var(--hairline) solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              height: 'var(--space-10)',
              paddingInline: 'var(--space-4)',
            }}
          >
            {SITE_FORM_COPY.cancel}
          </Link>
        </div>
      </form>
    </div>
  );
}

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

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
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
            color: 'var(--muted-foreground)',
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
