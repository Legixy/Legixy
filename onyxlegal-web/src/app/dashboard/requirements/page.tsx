'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  useCoverage,
  useRequirements,
  useSetRequirement,
} from '@/features/compliance/api/compliance';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { LicenseRowsSkeleton } from '@/features/compliance/components/Skeletons';
import { REQUIREMENTS_COPY } from '@/features/compliance/lib/requirements-copy';
import { TONE_STYLES } from '@/features/compliance/lib/format';
import type { RequirementRow } from '@/lib/api';
import { PageHeader } from '@/shared/components/PageHeader';

/**
 * What this business is expected to hold.
 *
 * WHY THIS PAGE EXISTS
 * --------------------
 * Coverage gaps was seeded read-only in Slice 4 and left that way for eight
 * slices. For any tenant that is not the demo seed, the gap count was
 * permanently zero and the page permanently said there were none — so the
 * product's strongest differentiator was inert outside the demo, and worse,
 * it read as reassurance.
 *
 * Nothing here is inferred. A gap exists because someone said "we are expected
 * to hold this" and no matching licence is on record. That declaration is the
 * only thing that makes the gaps page mean anything.
 */
export default function RequirementsPage() {
  const { data, isLoading, isError, error, refetch } = useRequirements();
  const coverage = useCoverage();
  const setRequirement = useSetRequirement();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<string | null>(null);

  const rows = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.authorityName.toLowerCase().includes(term) ||
        row.nameAr.includes(search.trim()),
    );
  }, [rows, search]);

  const entity = filtered.filter((row) => row.scope === 'ENTITY');
  const site = filtered.filter((row) => row.scope === 'SITE');
  const selected = rows.filter((row) => row.required).length;

  const toggle = (row: RequirementRow) => {
    setPending(row.licenseTypeId);
    setRequirement.mutate(
      { licenseTypeId: row.licenseTypeId, required: !row.required },
      { onSettled: () => setPending(null) },
    );
  };

  return (
    <div className="flex w-full flex-col">
      {/*
        Subtitle KEPT. It explains that ticking a box is a DECLARATION, which
        is the only reason the gaps page means anything. Nothing else on the
        screen says so.
      */}
      <PageHeader
        backHref="/dashboard/gaps"
        backLabel={REQUIREMENTS_COPY.back}
        title={REQUIREMENTS_COPY.title}
        subtitle={REQUIREMENTS_COPY.subtitle}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)' }}
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={REQUIREMENTS_COPY.searchPlaceholder}
            className="pl-9"
            aria-label={REQUIREMENTS_COPY.searchPlaceholder}
          />
        </div>
        <p className="text-sm tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {REQUIREMENTS_COPY.selectedCount(selected)}
        </p>
      </div>

      {isLoading ? (
        <LicenseRowsSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          resource="licence types"
          onRetry={() => void refetch()}
        />
      ) : (
        <div className="flex flex-col gap-8">
          <Group
            title={REQUIREMENTS_COPY.entityHeading}
            subtitle={REQUIREMENTS_COPY.entitySubtitle}
            icon={<Building2 size={13} aria-hidden="true" />}
            rows={entity}
            pending={pending}
            onToggle={toggle}
          />
          <Group
            title={REQUIREMENTS_COPY.siteHeading}
            /*
              TENANT-WIDE, because that is what the model says: a requirement
              is unique on (tenantId, licenseTypeId) with no siteId, so a
              site-scoped type is expected at EVERY active site. Saying so
              here is cheaper than letting someone discover it from the gaps
              list.
            */
            subtitle={REQUIREMENTS_COPY.siteSubtitle}
            icon={<MapPin size={13} aria-hidden="true" />}
            rows={site}
            pending={pending}
            onToggle={toggle}
          />
        </div>
      )}

      {coverage.data && coverage.data.state !== 'NOT_CONFIGURED' ? (
        <p
          className="mt-6 text-sm"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {REQUIREMENTS_COPY.thenWhat}{' '}
          <Link
            href="/dashboard/gaps"
            className="font-medium underline-offset-2 hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            {REQUIREMENTS_COPY.seeGaps}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function Group({
  title,
  subtitle,
  icon,
  rows,
  pending,
  onToggle,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: RequirementRow[];
  pending: string | null;
  onToggle: (row: RequirementRow) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <section>
      <h2
        className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {icon}
        {title}
      </h2>
      <p className="mb-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {subtitle}
      </p>

      <ul
        className="divide-y overflow-hidden rounded-xl border bg-[var(--surface)]"
        style={{ borderColor: 'var(--border)' }}
      >
        {rows.map((row) => (
          <li key={row.licenseTypeId}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--secondary)]">
              <input
                type="checkbox"
                checked={row.required}
                disabled={pending === row.licenseTypeId}
                onChange={() => onToggle(row)}
                className="size-4 shrink-0 rounded"
                style={{ accentColor: 'var(--primary)' }}
              />
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-sm"
                  style={{
                    color: 'var(--foreground)',
                    fontWeight: row.required ? 600 : 400,
                  }}
                >
                  {row.name}
                </span>
                <span
                  className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  <span>{row.authorityName}</span>
                  <span aria-hidden="true">·</span>
                  {/* Arabic already exists on the record; the type system
                      must be able to render it. */}
                  <span dir="rtl" lang="ar">
                    {row.nameAr}
                  </span>
                </span>
              </span>
              {row.required ? (
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    color: TONE_STYLES.info.fg,
                    background: TONE_STYLES.info.bg,
                  }}
                >
                  {REQUIREMENTS_COPY.expectedBadge}
                </span>
              ) : null}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
