'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, MapPin, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  useCoverage,
  useOwnerLoad,
  useSites,
} from '@/features/compliance/api/compliance';
import { CoverageSummary } from '@/features/compliance/components/CoverageSummary';
import { EmptyState } from '@/features/compliance/components/EmptyState';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { SiteCardSkeleton } from '@/features/compliance/components/Skeletons';
import {
  pluralLicences,
  sitesSummaryLine,
  summarisePhrase,
  summaryTone,
  TONE_STYLES,
} from '@/features/compliance/lib/format';
import { SITE_FORM_COPY } from '@/features/compliance/lib/site-form-copy';
import type { Site } from '@/lib/api';
import { ACTION_STYLE, PageHeader } from '@/shared/components/PageHeader';

/**
 * Sites — the entry point to the compliance product.
 *
 * Answers one question: "which of my locations needs me today?"
 * Sites needing attention are ordered first, so the answer is the first thing
 * on screen rather than something the user has to hunt for.
 */
export default function SitesPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useSites();
  const coverageQuery = useCoverage();
  const ownerQuery = useOwnerLoad();

  const sites = useMemo(() => {
    const rows = data?.data ?? [];
    const term = search.trim().toLowerCase();
    const filtered = term
      ? rows.filter(
        (site) =>
          site.name.toLowerCase().includes(term) ||
          (site.city ?? '').toLowerCase().includes(term) ||
          (site.code ?? '').toLowerCase().includes(term),
      )
      : rows;

    // Sites that need action first; the rest alphabetically.
    return [...filtered].sort((a, b) => {
      const diff = b.compliance.needsAttention - a.compliance.needsAttention;
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  }, [data, search]);

  const totals = useMemo(() => {
    const rows = data?.data ?? [];
    return {
      sites: rows.length,
      licences: rows.reduce((sum, site) => sum + site.compliance.total, 0),
      attention: rows.reduce(
        (sum, site) => sum + site.compliance.needsAttention,
        0,
      ),
    };
  }, [data]);

  return (
    <div className="flex w-full flex-col">
      {/*
        Subtitle KEPT and it is the reason this pattern has an escape hatch.
        It is not a restatement — it is the live answer to "which of my
        locations needs me today", computed from the data, and it is the
        first thing a compliance officer opening this screen wants.
      */}
      <PageHeader
        title="Your sites"
        subtitle={
          isLoading
            ? 'Loading your sites…'
            : sitesSummaryLine(totals.licences, totals.sites, totals.attention)
        }
        actions={
          /*
            Suppressed while the list is empty, because the empty state below
            carries the same link as its primary. Two identical primaries on
            one screen make neither of them the answer to "what do I do now".
            This is the empty tenant's screen, not the seeded one — the demo
            never shows it, which is exactly why it went unnoticed.
          */
          isLoading || (data?.data.length ?? 0) > 0 ? (
            <Link href="/dashboard/sites/new" style={ACTION_STYLE.primary}>
              <Plus size={14} aria-hidden="true" />
              {SITE_FORM_COPY.addCta}
            </Link>
          ) : null
        }
      />

      {/*
        Coverage and ownership sit ABOVE the site list: they answer "what don't
        we know about?" and "who is carrying this?", which are the two questions
        the site cards below cannot answer.
      */}
      {!isLoading && !isError ? (
        <div className="mb-8">
          {coverageQuery.isLoading || ownerQuery.isLoading ? (
            <div
              className="h-32 animate-pulse rounded-xl"
              style={{ background: 'var(--secondary)' }}
              aria-busy="true"
              aria-label="Loading compliance overview"
            />
          ) : coverageQuery.isError || ownerQuery.isError ? null : (
            <CoverageSummary
              gaps={coverageQuery.data?.gaps ?? []}
              ownerLoad={ownerQuery.data ?? []}
              state={coverageQuery.data?.state ?? 'NOT_CONFIGURED'}
              requirementCount={coverageQuery.data?.requirementCount ?? 0}
            />
          )}
        </div>
      ) : null}

      {!isLoading && !isError && (data?.data.length ?? 0) > 0 ? (
        <div className="relative mb-5 max-w-sm">
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
            placeholder="Search sites"
            aria-label="Search sites by name, city or code"
            className="h-10 pl-9"
          />
        </div>
      ) : null}

      {isLoading ? (
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading sites"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <SiteCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          resource="sites"
          onRetry={() => void refetch()}
        />
      ) : sites.length === 0 ? (
        search.trim() ? (
          <EmptyState
            title="No sites match that search"
            description={`Nothing matched “${search.trim()}”. Try a different name, city or code.`}
          />
        ) : (
          <EmptyState
            title="No sites yet"
            description="Sites are the locations you hold licences for — a branch, a showroom, a warehouse. Add your first one to start tracking expiry dates."
            aside="A company-wide licence does not need a site, so an empty list here does not mean anything is missing."
            action={
              <Link
                href="/dashboard/sites/new"
                className="inline-flex items-center justify-center"
                style={{
                  background: 'var(--primary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--primary-foreground)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  gap: 'var(--space-2)',
                  height: 'var(--space-10)',
                  paddingInline: 'var(--space-5)',
                }}
              >
                <Plus size={15} aria-hidden="true" />
                {SITE_FORM_COPY.addCta}
              </Link>
            }
          />
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <li key={site.id}>
              <SiteCard site={site} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  const tone = summaryTone(site.compliance);
  const phrase = summarisePhrase(site.compliance);
  const style = TONE_STYLES[tone];

  return (
    <Link
      href={`/dashboard/sites/${site.id}`}
      className="group block h-full rounded-xl border bg-[var(--surface)] p-5 transition-all hover:shadow-[var(--shadow-md)]"
      style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            className="truncate text-[15px] font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            {site.name}
          </h2>
          <p
            className="mt-1 flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <MapPin size={12} aria-hidden="true" />
            {site.city ?? 'No location set'}
          </p>
        </div>
        <ChevronRight
          size={16}
          className="mt-0.5 shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ color: 'var(--muted-foreground)' }}
          aria-hidden="true"
        />
      </div>

      <div
        className="mt-5 flex items-center justify-between border-t pt-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {pluralLicences(site.compliance.total)}
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            color: style.fg,
            background: style.bg,
            borderColor: style.border,
          }}
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: style.fg }}
          />
          {phrase}
        </span>
      </div>
    </Link>
  );
}
