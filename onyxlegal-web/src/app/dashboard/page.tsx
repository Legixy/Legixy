'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  Check,
  CircleAlert,
  ShieldCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { Button } from '@/components/ui/button';
import {
  useComplianceDashboard,
  useCoverage,
} from '@/features/compliance/api/compliance';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { DASHBOARD_COPY } from '@/features/compliance/lib/dashboard-copy';
import {
  formatPlainDate,
  pluralLicences,
  reminderOffsetLabel,
  TONE_STYLES,
  type StatusTone,
} from '@/features/compliance/lib/format';
import type { CoverageState, DashboardOverview } from '@/lib/api';

/**
 * The compliance dashboard.
 *
 * This replaced a contract-analysis dashboard that claimed an AI had analysed
 * the portfolio, reported financial exposure in Indian rupees, and showed zero
 * items expiring within 30 days while two licences were.
 *
 * Every figure here is a count returned by /compliance/dashboard, which counts
 * rows. Nothing is inferred, nothing is scored, and there is no number on this
 * page that the database cannot account for.
 *
 * All copy lives in lib/dashboard-copy so honesty.spec.ts can read it.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data, isLoading, isError, error, refetch } = useComplianceDashboard();
  // The dashboard payload carries a count; the REASON comes from here.
  const coverage = useCoverage();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex w-full flex-col">
      <header className="mb-7">
        <h1
          className="font-display text-3xl tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          {DASHBOARD_COPY.greeting(firstName)}
        </h1>
        {/*
          "Here is where your licences stand today" above a workspace where
          nothing stands anywhere is furniture, and it argued for attention
          against the real heading below it — "Let's get your licences in",
          which is the true thing to say. One heading opens an empty
          workspace; the summary line returns as soon as there is a summary.
        */}
        {data && data.licences.total === 0 ? null : (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {DASHBOARD_COPY.subtitle}
          </p>
        )}
      </header>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <ErrorState
          error={error}
          resource="dashboard"
          onRetry={() => void refetch()}
        />
      ) : data.licences.total === 0 ? (
        <EmptyDashboard
          sitesTotal={data.sites.total}
          requirementCount={coverage.data?.requirementCount ?? 0}
        />
      ) : (
        <DashboardBody
          data={data}
          coverageState={coverage.data?.state ?? 'NOT_CONFIGURED'}
          requirementCount={coverage.data?.requirementCount ?? 0}
        />
      )}
    </div>
  );
}

function DashboardBody({
  data,
  coverageState,
  requirementCount,
}: {
  data: DashboardOverview;
  coverageState: CoverageState;
  requirementCount: number;
}) {
  const { licences, ownership, reminders, sites, coverageGaps } = data;

  return (
    <>
      <section aria-labelledby="portfolio-heading">
        <SectionHeading id="portfolio-heading">
          {DASHBOARD_COPY.portfolioHeading}
        </SectionHeading>

        {/* ONE instrument, four divisions — not four cards.
            Four separately bordered, separately tinted cards put a coloured
            box round every number and made the row the loudest thing on the
            page. The dividers here are the grid gap showing the container
            through, so four borders became one and the tint is gone: tone now
            lives on the icon and the figure, which is where the meaning is.
            Icon + colour + text still holds, so nothing is carried by colour
            alone. */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden"
          style={{
            gap: 'var(--hairline)',
            background: 'var(--border)',
            border: 'var(--hairline) solid var(--border)',
            borderRadius: 'var(--stat-radius)',
          }}
        >
          <Metric
            label={DASHBOARD_COPY.totalLabel}
            hint={DASHBOARD_COPY.totalHint}
            value={licences.total}
            tone="neutral"
            icon={ShieldCheck}
          />
          <Metric
            label={DASHBOARD_COPY.expiredLabel}
            hint={DASHBOARD_COPY.expiredHint}
            value={licences.expired}
            tone={licences.expired > 0 ? 'critical' : 'neutral'}
            icon={CircleAlert}
            href="/dashboard/licenses?expiryStatus=EXPIRED"
          />
          <Metric
            label={DASHBOARD_COPY.criticalLabel}
            hint={DASHBOARD_COPY.criticalHint}
            value={licences.critical}
            tone={licences.critical > 0 ? 'warning' : 'neutral'}
            icon={AlertCircle}
            href="/dashboard/licenses?expiryStatus=CRITICAL"
          />
          <Metric
            label={DASHBOARD_COPY.expiringSoonLabel}
            hint={DASHBOARD_COPY.expiringSoonHint}
            value={licences.expiringSoon}
            tone={licences.expiringSoon > 0 ? 'info' : 'neutral'}
            icon={CalendarClock}
            href="/dashboard/licenses?expiryStatus=EXPIRING_SOON"
          />
        </div>

        {/* Reconciles this page's total with the sites page's smaller one. */}
        <p className="mt-2.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {DASHBOARD_COPY.splitNote(licences.atSites, licences.entityWide)}
        </p>

        {licences.needsAttention === 0 ? (
          <p
            className="mt-2 text-sm font-medium"
            style={{ color: 'var(--status-current-fg)' }}
          >
            {DASHBOARD_COPY.allClear(licences.total)}
          </p>
        ) : null}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Coverage gaps ──────────────────────────────────────────── */}
        <section aria-labelledby="gaps-heading">
          <SectionHeading id="gaps-heading">
            {DASHBOARD_COPY.gapsHeading}
          </SectionHeading>
          {/*
            Three states, not two. Zero gaps because nothing was declared is a
            different fact from zero gaps because everything declared is
            covered, and rendering them the same told a brand-new tenant that
            every licence they are expected to hold was on record.
          */}
          <Panel
            tone={
              coverageState === 'HAS_GAPS'
                ? 'warning'
                : coverageState === 'ALL_SATISFIED'
                  ? 'positive'
                  : 'neutral'
            }
          >
            <p className="text-sm" style={{ color: 'var(--foreground)' }}>
              {coverageState === 'NOT_CONFIGURED'
                ? DASHBOARD_COPY.gapsNotConfigured
                : coverageState === 'ALL_SATISFIED'
                  ? DASHBOARD_COPY.gapsAllSatisfied(requirementCount)
                  : DASHBOARD_COPY.gapsCount(coverageGaps)}
            </p>
            <p
              className="mt-1.5 text-xs leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {coverageState === 'NOT_CONFIGURED'
                ? DASHBOARD_COPY.gapsNotConfiguredHint
                : DASHBOARD_COPY.gapsHint}
            </p>
            {coverageState !== 'ALL_SATISFIED' ? (
              <Link
                href={
                  coverageState === 'NOT_CONFIGURED'
                    ? '/dashboard/requirements'
                    : '/dashboard/gaps'
                }
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: 'var(--primary)' }}
              >
                {coverageState === 'NOT_CONFIGURED'
                  ? DASHBOARD_COPY.gapsConfigure
                  : DASHBOARD_COPY.gapsCta}
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            ) : null}
          </Panel>
        </section>

        {/* ── Ownership ──────────────────────────────────────────────── */}
        <section aria-labelledby="ownership-heading">
          <SectionHeading id="ownership-heading">
            {DASHBOARD_COPY.ownershipHeading}
          </SectionHeading>
          <Panel>
            {ownership.top.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {DASHBOARD_COPY.ownershipNone}
              </p>
            ) : (
              <>
                <ul className="space-y-2">
                  {ownership.top.map((owner) => (
                    <li
                      key={owner.ownerUserId ?? 'none'}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span style={{ color: 'var(--foreground)' }}>
                        {owner.ownerName}
                      </span>
                      <span
                        className="shrink-0 tabular-nums"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {pluralLicences(owner.licenseCount)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/*
                  Never let the list imply it is complete. Slice 5 found a
                  panel showing 3 of 4 owners beside a sentence that read as
                  though it showed all of them.
                */}
                {ownership.otherOwners > 0 ? (
                  <p
                    className="mt-2 text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {DASHBOARD_COPY.otherOwners(
                      ownership.otherOwners,
                      ownership.otherLicenceCount,
                    )}
                  </p>
                ) : null}

                {ownership.assigned > 0 && ownership.top[0] ? (
                  <p
                    className="mt-3 border-t pt-3 text-xs leading-relaxed"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {DASHBOARD_COPY.concentration(
                      ownership.top[0].ownerName ?? 'The top holder',
                      Math.round(
                        (ownership.top[0].licenseCount / ownership.assigned) *
                          100,
                      ),
                    )}
                  </p>
                ) : null}
              </>
            )}

            {ownership.unassigned > 0 ? (
              <p
                className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: TONE_STYLES.warning.bg,
                  color: TONE_STYLES.warning.fg,
                }}
              >
                <UserX size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {DASHBOARD_COPY.unassignedWarning(ownership.unassigned)}
              </p>
            ) : null}
          </Panel>
        </section>
      </div>

      {/* ── Upcoming reminders ───────────────────────────────────────── */}
      <section className="mt-8" aria-labelledby="reminders-heading">
        <SectionHeading id="reminders-heading">
          {DASHBOARD_COPY.remindersHeading}
        </SectionHeading>
        <Panel>
          {reminders.upcoming.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {DASHBOARD_COPY.remindersNone}
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {reminders.upcoming.map((reminder) => (
                <li
                  key={reminder.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <Bell
                    size={13}
                    className="shrink-0"
                    style={{ color: 'var(--muted-foreground)' }}
                    aria-hidden="true"
                  />
                  <Link
                    href={`/dashboard/licenses/${reminder.licenseId}`}
                    className="min-w-0 flex-1 truncate text-sm transition-opacity hover:opacity-70"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {reminder.licenseName}
                    {reminder.siteName ? (
                      <span style={{ color: 'var(--muted-foreground)' }}>
                        {' · '}
                        {reminder.siteName}
                      </span>
                    ) : null}
                  </Link>
                  <span
                    className="shrink-0 text-xs"
                    style={{
                      color: reminder.ownerName
                        ? 'var(--muted-foreground)'
                        : TONE_STYLES.warning.fg,
                    }}
                  >
                    {reminder.ownerName ?? DASHBOARD_COPY.reminderNoRecipient}
                  </span>
                  <span
                    className="shrink-0 text-xs tabular-nums"
                    style={{ color: 'var(--muted-foreground)' }}
                    title={reminderOffsetLabel(reminder.offsetDays)}
                  >
                    {formatPlainDate(reminder.dueOn)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      {/* ── Sites ────────────────────────────────────────────────────── */}
      <section className="mt-8" aria-labelledby="sites-heading">
        <SectionHeading id="sites-heading">
          {DASHBOARD_COPY.sitesHeading}
        </SectionHeading>
        <Panel>
          <p
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--foreground)' }}
          >
            <Building2 size={14} aria-hidden="true" />
            {sites.total === 0
              ? DASHBOARD_COPY.sitesNone
              : DASHBOARD_COPY.sitesSummary(sites.total, sites.withLicences)}
          </p>
          {sites.total > 0 ? (
            <Link
              href="/dashboard/sites"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--primary)' }}
            >
              {DASHBOARD_COPY.sitesCta}
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          ) : null}
        </Panel>
      </section>
    </>
  );
}

function SectionHeading({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="mb-3 font-semibold uppercase"
      style={{
        fontSize: 'var(--text-2xs)',
        letterSpacing: 'var(--tracking-wide)',
        color: 'var(--muted-foreground)',
      }}
    >
      {children}
    </h2>
  );
}

function Panel({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
}) {
  const style = tone ? TONE_STYLES[tone] : null;
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: style?.border ?? 'var(--border)',
        background: style?.bg ?? 'var(--surface)',
      }}
    >
      {children}
    </div>
  );
}

function Metric({
  label,
  hint,
  value,
  tone,
  icon: Icon,
  href,
}: {
  label: string;
  hint: string;
  value: number;
  tone: StatusTone;
  icon: typeof ShieldCheck;
  href?: string;
}) {
  const style = TONE_STYLES[tone];
  const body = (
    <div
      className="h-full transition-colors"
      style={{ background: 'var(--surface)', padding: 'var(--stat-pad)' }}
    >
      <div className="flex items-center" style={{ gap: 'var(--space-1)' }}>
        <Icon size={13} style={{ color: style.fg }} aria-hidden="true" />
        <p
          className="font-semibold uppercase"
          style={{
            fontSize: 'var(--text-2xs)',
            letterSpacing: 'var(--tracking-wide)',
            color: 'var(--muted-foreground)',
          }}
        >
          {label}
        </p>
      </div>
      <p
        className="font-semibold tabular-nums"
        style={{
          marginTop: 'var(--space-2)',
          fontSize: 'var(--text-3xl)',
          color: style.fg,
          letterSpacing: 'var(--tracking-tight)',
        }}
      >
        {value}
      </p>
      <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
        {hint}
      </p>
    </div>
  );

  // Only link when there is something to look at.
  return href && value > 0 ? (
    <Link href={href} className="block hover:opacity-80">
      {body}
    </Link>
  ) : (
    body
  );
}

/**
 * The first-run path.
 *
 * Numbered steps in dependency order, with import as the primary action —
 * a real customer has dozens of licences across many sites, and the previous
 * empty state offered only "Add a licence", one at a time.
 *
 * Deliberately NOT a wizard: nothing persists, nothing tracks completion,
 * nothing blocks. Someone who already has sites can go straight to step two.
 */
function EmptyDashboard({
  sitesTotal,
  requirementCount,
}: {
  sitesTotal: number;
  requirementCount: number;
}) {
  /*
    STILL NOT A WIZARD.

    Nothing here persists, nothing is stored, nothing blocks, and a reload
    recomputes it from scratch. `done` is read from data that already exists
    on this screen — the sites count from the dashboard payload, the
    requirement count from the coverage query — so this is a statement about
    the workspace, not a record of the customer's progress through a flow.

    It matters because the card rendered identically to somebody who had
    declared two licence types and added four sites as to somebody who had
    just signed up, which quietly told them their work had not registered.
  */
  const steps = [
    {
      title: DASHBOARD_COPY.step1Title,
      body: DASHBOARD_COPY.step1Body,
      cta: DASHBOARD_COPY.step1Cta,
      href: '/dashboard/sites/new',
      primary: false,
      done: sitesTotal > 0,
      doneLabel: DASHBOARD_COPY.step1Done(sitesTotal),
    },
    {
      title: DASHBOARD_COPY.step2Title,
      body: DASHBOARD_COPY.step2Body,
      cta: DASHBOARD_COPY.step2Cta,
      href: '/dashboard/licenses/import',
      primary: true,
      alt: { label: DASHBOARD_COPY.step2Alt, href: '/dashboard/licenses/new' },
      // This card only renders when there are no licences, so step two is
      // never done here. Stated rather than computed, so it cannot drift.
      done: false,
      doneLabel: null,
    },
    {
      title: DASHBOARD_COPY.step3Title,
      body: DASHBOARD_COPY.step3Body,
      cta: DASHBOARD_COPY.step3Cta,
      href: '/dashboard/requirements',
      primary: false,
      done: requirementCount > 0,
      doneLabel: DASHBOARD_COPY.step3Done(requirementCount),
    },
  ];

  return (
    <section aria-labelledby="first-run-heading">
      {/* Quiet sans, not the serif. This screen's display moment is the h1
          greeting above; setting this heading in the same serif put two
          display lines on one screen arguing for the same attention. */}
      <h2
        id="first-run-heading"
        className="font-semibold"
        style={{
          fontSize: 'var(--text-xl)',
          letterSpacing: 'var(--tracking-tight)',
          color: 'var(--foreground)',
        }}
      >
        {DASHBOARD_COPY.emptyTitle}
      </h2>
      <p
        className="mt-1.5 max-w-prose text-sm leading-relaxed"
        style={{ color: 'var(--muted-foreground)' }}
      >
        {DASHBOARD_COPY.emptyBody}
      </p>

      <ol className="mt-5 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="flex flex-wrap items-start gap-4 rounded-xl border bg-[var(--surface)] p-4"
            style={{ borderColor: 'var(--border)' }}
          >
            <span
              className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
              style={{
                background: 'var(--secondary)',
                color: 'var(--muted-foreground)',
              }}
              aria-hidden="true"
            >
              {step.done ? <Check size={13} /> : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className="text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                {step.title}
              </p>
              <p
                className="mt-1 max-w-prose text-sm leading-relaxed"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {step.body}
              </p>
              {step.done && step.doneLabel ? (
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--status-current-fg)' }}
                >
                  {step.doneLabel}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link href={step.href}>
                <Button
                  variant={step.primary && !step.done ? 'default' : 'outline'}
                  size="lg"
                >
                  {step.cta}
                </Button>
              </Link>
              {step.alt ? (
                <Link
                  href={step.alt.href}
                  className="text-sm underline-offset-2 hover:underline"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {step.alt.label}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label={DASHBOARD_COPY.loading}>
      {/* Mirrors the loaded shape: one container, four divisions. A
          skeleton that is four separate boxes and resolves into one panel
          tells the eye the content moved when it did not. */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden animate-pulse"
        style={{
          gap: 'var(--hairline)',
          background: 'var(--border)',
          border: 'var(--hairline) solid var(--border)',
          borderRadius: 'var(--stat-radius)',
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{ height: 'var(--stat-h)', background: 'var(--secondary)' }}
          />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border"
            style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}
          />
        ))}
      </div>
    </div>
  );
}
