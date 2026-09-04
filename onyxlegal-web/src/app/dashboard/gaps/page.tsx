'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  ListChecks,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useCoverage } from '@/features/compliance/api/compliance';
import { Button } from '@/components/ui/button';
import { DASHBOARD_COPY } from '@/features/compliance/lib/dashboard-copy';
import { EmptyState } from '@/features/compliance/components/EmptyState';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { LicenseRowsSkeleton } from '@/features/compliance/components/Skeletons';
import { TONE_STYLES } from '@/features/compliance/lib/format';
import { ACTION_STYLE, PageHeader } from '@/shared/components/PageHeader';

/**
 * Coverage gaps — what the organisation is expected to hold but has no record of.
 *
 * Deliberately worded as absence throughout: "no record", "not recorded yet".
 * Never "expired", never a risk score. A gap is an operational fact about our
 * data, not a claim about the licence's legal status — we genuinely do not know
 * whether one exists in a drawer somewhere.
 */
export default function CoverageGapsPage() {
  const { data, isLoading, isError, error, refetch } = useCoverage();
  const gaps = data?.gaps ?? [];
  const state = data?.state ?? 'NOT_CONFIGURED';
  const requirementCount = data?.requirementCount ?? 0;

  const entityGaps = gaps.filter((gap) => gap.scope === 'ENTITY');
  const siteGaps = gaps.filter((gap) => gap.scope === 'SITE');

  return (
    <div className="flex w-full flex-col">
      {/*
        Subtitle KEPT. "This is about missing records, not expiry" is the one
        thing this screen cannot say any other way, and without it a gap reads
        as an expiry problem. Slice 12 established the distinction; deleting
        the line to save 24px would undo it.
      */}
      <PageHeader
        backHref="/dashboard/sites"
        backLabel="Locations"
        title="Coverage gaps"
        subtitle="Licences your organisation is expected to hold, with no record in the system. This is about missing records, not expiry."
        actions={
          <Link href="/dashboard/requirements" style={ACTION_STYLE.secondary}>
            <ListChecks size={14} aria-hidden="true" />
            {DASHBOARD_COPY.gapsConfigure}
          </Link>
        }
      />

      {isLoading ? (
        <div
          className="overflow-hidden rounded-xl border bg-[var(--surface)]"
          style={{ borderColor: 'var(--border)' }}
          aria-busy="true"
          aria-label="Loading coverage gaps"
        >
          <LicenseRowsSkeleton rows={4} />
        </div>
      ) : isError ? (
        <ErrorState
          error={error}
          resource="coverage gaps"
          onRetry={() => void refetch()}
        />
      ) : state === 'NOT_CONFIGURED' ? (
        /*
          The dead end this slice exists to remove. Previously this said every
          expected licence had a record — an all-clear about a business the
          system had been told nothing about. Now it says what is true, and
          offers the step that makes the page meaningful.
        */
        <EmptyState
          title={DASHBOARD_COPY.gapsNotConfigured}
          description={DASHBOARD_COPY.gapsNotConfiguredHint}
          action={
            <Link href="/dashboard/requirements">
              <Button size="lg">{DASHBOARD_COPY.gapsConfigure}</Button>
            </Link>
          }
        />
      ) : gaps.length === 0 ? (
        <EmptyState
          title={DASHBOARD_COPY.gapsSatisfiedTitle(requirementCount)}
          description={DASHBOARD_COPY.gapsAllSatisfied(requirementCount)}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {entityGaps.length > 0 ? (
            <GapGroup
              title="Company-wide"
              subtitle="Held by the entity, not by any single location"
              gaps={entityGaps}
            />
          ) : null}
          {siteGaps.length > 0 ? (
            <GapGroup
              title="By location"
              subtitle="Required at each site that operates"
              gaps={siteGaps}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

function GapGroup({
  title,
  subtitle,
  gaps,
}: {
  title: string;
  subtitle: string;
  gaps: {
    licenseTypeId: string;
    licenseTypeName: string;
    licenseTypeNameAr: string;
    authorityName: string;
    siteId: string | null;
    siteName: string | null;
  }[];
}) {
  return (
    <section>
      <h2
        className="text-[11px] font-semibold tracking-[0.14em] uppercase"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {title}
      </h2>
      <p className="mt-1 mb-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
        {subtitle}
      </p>

      <ul
        className="overflow-hidden rounded-xl border bg-[var(--surface)]"
        style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
      >
        {gaps.map((gap) => (
          <li
            key={`${gap.licenseTypeId}:${gap.siteId ?? 'entity'}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3.5 last:border-b-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <ShieldAlert
              size={15}
              className="shrink-0"
              style={{ color: TONE_STYLES.warning.fg }}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {gap.licenseTypeName}
                <span
                  className="ml-2 text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                  lang="ar"
                  dir="rtl"
                >
                  {gap.licenseTypeNameAr}
                </span>
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {gap.authorityName}
              </p>
            </div>

            <span
              className="flex shrink-0 items-center gap-1.5 text-sm"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {gap.siteName ? (
                gap.siteName
              ) : (
                <>
                  <Building2 size={13} aria-hidden="true" />
                  Company-wide
                </>
              )}
            </span>

            <span
              className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{
                color: TONE_STYLES.warning.fg,
                background: TONE_STYLES.warning.bg,
                borderColor: TONE_STYLES.warning.border,
              }}
            >
              Not recorded
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
