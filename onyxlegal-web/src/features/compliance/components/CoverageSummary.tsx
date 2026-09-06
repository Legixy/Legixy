'use client';

import Link from 'next/link';
import { ShieldAlert, UserRound, Users } from 'lucide-react';
import type { CoverageGap, OwnerLoad, CoverageState } from '@/lib/api';
import { pluralLicences, TONE_STYLES } from '../lib/format';
import { DASHBOARD_COPY } from '../lib/dashboard-copy';

/**
 * Coverage gaps and ownership concentration, side by side.
 *
 * A GAP IS AN ABSENCE, NOT AN EXPIRY STATE. It is presented in its own panel,
 * with its own language, precisely so it is never mistaken for a licence that
 * has lapsed. "Expired" means we hold one and it ran out; a gap means we have
 * no record of one at all — a different and more serious operational fact.
 *
 * Both panels are always rendered, including at zero, because their absence
 * would read as "nothing to see" rather than "we checked and it is clear".
 */
export function CoverageSummary({
  gaps,
  ownerLoad,
  state,
  requirementCount,
}: {
  gaps: CoverageGap[];
  ownerLoad: OwnerLoad[];
  /** Why the count is what it is. See CoverageState. */
  state: CoverageState;
  requirementCount: number;
}) {
  const unassigned =
    ownerLoad.find((row) => row.ownerUserId === null)?.licenseCount ?? 0;
  const assigned = ownerLoad.filter((row) => row.ownerUserId !== null);
  const totalAssigned = assigned.reduce(
    (total, row) => total + row.licenseCount,
    0,
  );
  const top = assigned[0];
  const topShare =
    top && totalAssigned > 0
      ? Math.round((top.licenseCount / totalAssigned) * 100)
      : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ── Coverage gaps ──────────────────────────────────── */}
      <section
        className="rounded-xl border bg-[var(--surface)] p-5"
        style={{
          borderColor:
            state === 'HAS_GAPS' ? TONE_STYLES.warning.border : 'var(--border)',
          background:
            state === 'HAS_GAPS' ? TONE_STYLES.warning.bg : 'var(--card)',
          boxShadow: 'var(--shadow-xs)',
        }}
        aria-labelledby="gaps-heading"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="gaps-heading"
              className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <ShieldAlert size={13} aria-hidden="true" />
              Not on record
            </h2>
            <p
              className="mt-2 text-3xl font-semibold tabular-nums"
              style={{
                color:
                  state === 'HAS_GAPS'
                    ? TONE_STYLES.warning.fg
                    : 'var(--muted-foreground)',
                letterSpacing: '-0.02em',
              }}
            >
              {/*
                A gap count is only meaningful once there is a register to
                compare a declaration against. NOTHING_ENTERED joins
                NOT_CONFIGURED here: showing "2" to somebody who has entered
                nothing accuses them of missing what they have not yet had the
                chance to add.
              */}
              {state === 'NOT_CONFIGURED' || state === 'NOTHING_ENTERED'
                ? '—'
                : gaps.length}
            </p>
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {/*
                Zero gaps because nothing was declared is not zero gaps
                because everything is covered. See dashboard-copy.
              */}
              {state === 'NOT_CONFIGURED'
                ? DASHBOARD_COPY.gapsNotConfigured
                : state === 'NOTHING_ENTERED'
                  ? DASHBOARD_COPY.gapsNothingEntered(requirementCount)
                  : state === 'ALL_SATISFIED'
                    ? DASHBOARD_COPY.gapsAllSatisfied(requirementCount)
                    : DASHBOARD_COPY.gapsCount(gaps.length)}
            </p>
          </div>
        </div>

        {state !== 'ALL_SATISFIED' ? (
          <Link
            href={
              state === 'NOT_CONFIGURED'
                ? '/dashboard/requirements'
                : state === 'NOTHING_ENTERED'
                  ? // The gaps page has nothing to show them yet; the useful
                    // next step is entering something.
                    '/dashboard/licenses/new'
                  : '/dashboard/gaps'
            }
            className="mt-4 inline-flex text-sm font-medium underline-offset-2 hover:underline"
            style={{ color: 'var(--primary)' }}
          >
            {state === 'NOT_CONFIGURED'
              ? DASHBOARD_COPY.gapsConfigure
              : state === 'NOTHING_ENTERED'
                ? DASHBOARD_COPY.gapsNothingEnteredCta
                : DASHBOARD_COPY.gapsCta}
          </Link>
        ) : null}
      </section>

      {/* ── Ownership concentration ────────────────────────── */}
      <section
        className="rounded-xl border bg-[var(--surface)] p-5"
        style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-xs)' }}
        aria-labelledby="owners-heading"
      >
        <h2
          id="owners-heading"
          className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Users size={13} aria-hidden="true" />
          Who holds the licences
        </h2>

        {assigned.length === 0 && unassigned === 0 ? (
          <p
            className="mt-3 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            No active licences yet.
          </p>
        ) : (
          <>
            <ul className="mt-3 space-y-2">
              {assigned.slice(0, 3).map((row) => (
                <li
                  key={row.ownerUserId}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span
                    className="flex min-w-0 items-center gap-2"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <UserRound
                      size={13}
                      style={{ color: 'var(--muted-foreground)' }}
                      aria-hidden="true"
                    />
                    <span className="truncate">
                      {row.ownerName ?? row.ownerEmail}
                    </span>
                  </span>
                  <span
                    className="shrink-0 tabular-nums"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {pluralLicences(row.licenseCount)}
                  </span>
                </li>
              ))}

              {unassigned > 0 ? (
                <li className="flex items-center justify-between gap-3 text-sm">
                  <span
                    className="flex items-center gap-2"
                    style={{ color: TONE_STYLES.warning.fg }}
                  >
                    <UserRound size={13} aria-hidden="true" />
                    Unassigned
                  </span>
                  <span
                    className="shrink-0 font-medium tabular-nums"
                    style={{ color: TONE_STYLES.warning.fg }}
                  >
                    {pluralLicences(unassigned)}
                  </span>
                </li>
              ) : null}
            </ul>

            {/*
              Key-person risk, stated as a number rather than implied. This is
              the client's unspoken fear: one person leaves and the compliance
              calendar leaves with them.
            */}
            {top && topShare >= 50 && assigned.length > 1 ? (
              <p
                className="mt-3 border-t pt-3 text-xs leading-relaxed"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {top.ownerName ?? top.ownerEmail} holds {topShare}% of assigned
                licences.
              </p>
            ) : null}

            {/*
              The share below is computed over ALL assigned owners, but only the
              top three are listed. Without this line the arithmetic looks wrong
              — a reader adds up what they can see and gets a different
              denominator. Disclose the remainder rather than hide it.
            */}
            {assigned.length > 3 ? (
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Plus {assigned.length - 3} other{' '}
                {assigned.length - 3 === 1 ? 'person' : 'people'} holding{' '}
                {pluralLicences(
                  assigned
                    .slice(3)
                    .reduce((total, row) => total + row.licenseCount, 0),
                )}
                .
              </p>
            ) : null}

            {unassigned > 0 ? (
              <p
                className="mt-2 text-xs leading-relaxed"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Unassigned licences have nobody to remind.
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
