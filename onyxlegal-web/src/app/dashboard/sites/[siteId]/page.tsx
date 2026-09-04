'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, FileCheck, MapPin } from 'lucide-react';
import {
  useLicenses,
  useSite,
} from '@/features/compliance/api/compliance';
import { ComplianceSummaryBar } from '@/features/compliance/components/ComplianceSummaryBar';
import { EmptyState } from '@/features/compliance/components/EmptyState';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { LicenseTable } from '@/features/compliance/components/LicenseTable';
import {
  DetailSkeleton,
  LicenseRowsSkeleton,
} from '@/features/compliance/components/Skeletons';
import { summarisePhrase } from '@/features/compliance/lib/format';

/**
 * Site detail — a location and everything it is licensed for.
 *
 * The rollup sits above the list so the answer to "is this site OK?" is
 * available before any scrolling. The list is ordered by expiry, so the
 * user never has to open a licence to find out which one is urgent.
 */
export default function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);

  const site = useSite(siteId);
  // Scoped to this site by the server. `siteId` is a filter, not a tenant
  // hint — the API still resolves the tenant from the auth cookie.
  const licences = useLicenses({ siteId, limit: 100 }, !!siteId);

  if (site.isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading site">
        <DetailSkeleton />
      </div>
    );
  }

  if (site.isError || !site.data) {
    return (
      <div className="flex w-full flex-col">
        <BackLink />
        <ErrorState
          error={site.error}
          resource="site"
          onRetry={() => void site.refetch()}
        />
      </div>
    );
  }

  const { data } = site;
  const rows = licences.data?.data ?? [];

  return (
    <div className="flex w-full flex-col">
      <BackLink />

      <header className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} aria-hidden="true" />
                {data.city ?? 'No location set'}
              </span>
              {data.code ? <span aria-hidden="true">·</span> : null}
              {data.code ? <span>{data.code}</span> : null}
              {data.status === 'INACTIVE' ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    background: 'var(--secondary)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  Inactive
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </header>

      <section className="mb-8" aria-labelledby="compliance-heading">
        <h2
          id="compliance-heading"
          className="mb-3 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Compliance · {summarisePhrase(data.compliance)}
        </h2>
        <ComplianceSummaryBar summary={data.compliance} />

        {/*
          Entity-level licences apply here but are NOT held by this site, so they
          are stated separately rather than added into the rollup above. Summing
          them would double-count them across every site; omitting them entirely
          was the original bug.
        */}
        {data.entityCompliance && data.entityCompliance.total > 0 ? (
          <p
            className="mt-3 flex items-center gap-2 text-xs leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Building2 size={13} className="shrink-0" aria-hidden="true" />
            <span>
              Plus {data.entityCompliance.total} company-wide{' '}
              {data.entityCompliance.total === 1 ? 'licence' : 'licences'} that
              also apply here
              {data.entityCompliance.needsAttention > 0
                ? `, ${data.entityCompliance.needsAttention} needing attention`
                : ''}
              .{' '}
              <Link
                href="/dashboard/licenses?siteId=none"
                className="underline underline-offset-2"
                style={{ color: 'var(--primary)' }}
              >
                View company-wide
              </Link>
            </span>
          </p>
        ) : null}
      </section>

      <section aria-labelledby="licences-heading">
        <div className="mb-3 flex items-baseline justify-between">
          <h2
            id="licences-heading"
            className="text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Licences
          </h2>
          {rows.length > 0 ? (
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Soonest expiry first
            </span>
          ) : null}
        </div>

        {licences.isLoading ? (
          <div
            className="overflow-hidden rounded-xl border bg-[var(--surface)]"
            style={{ borderColor: 'var(--border)' }}
            aria-busy="true"
            aria-label="Loading licences"
          >
            <LicenseRowsSkeleton />
          </div>
        ) : licences.isError ? (
          <ErrorState
            error={licences.error}
            resource="licences"
            onRetry={() => void licences.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No licences for this site yet"
            description="Once licences are added here, their expiry dates and status will appear in this list."
          />
        ) : (
          <LicenseTable licenses={rows} showSite={false} />
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/sites"
      className="mb-5 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--foreground)]"
      style={{ color: 'var(--muted-foreground)' }}
    >
      <ArrowLeft size={15} aria-hidden="true" />
      All sites
    </Link>
  );
}
