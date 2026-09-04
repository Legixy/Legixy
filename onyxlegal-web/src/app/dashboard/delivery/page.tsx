'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Mail, MessageCircle, TriangleAlert } from 'lucide-react';
import {
  useDeliverySettings,
  useSetCopyEmail,
} from '@/features/compliance/api/compliance';
import { ErrorState } from '@/features/compliance/components/ErrorState';
import { DELIVERY_COPY } from '@/features/compliance/lib/delivery-copy';
import { TONE_STYLES } from '@/features/compliance/lib/format';
import { ACTION_STYLE, PageHeader } from '@/shared/components/PageHeader';

/**
 * Where reminders go.
 *
 * WHY THIS SCREEN EXISTS
 * ----------------------
 * For thirteen slices there was nowhere in the product to see or set this.
 * The client's requirement is that nothing expires without him knowing, and
 * *knowing* means it reaches him — but he could not see the address it went
 * to, could not add anyone, and a licence with nobody responsible produced a
 * reminder that reached no one at all.
 *
 * WHAT IT REFUSES TO DO
 * ---------------------
 * It does not let a copy address stand in for ownership. Setting one changes
 * where reminders go; it does not make anyone accountable, and the unassigned
 * count is shown right above it saying so. If those two blocks were separated
 * — or if setting an address quietly zeroed the count — a tenant could make
 * every ownership gap disappear by filling in one field.
 */
export default function DeliveryPage() {
  const { data, isLoading, isError, error, refetch } = useDeliverySettings();
  const setCopyEmail = useSetCopyEmail();
  const [draft, setDraft] = useState('');

  // The saved value is the source of truth; the draft follows it whenever it
  // changes underneath (a save, a refetch), never the other way round.
  useEffect(() => {
    setDraft(data?.copyEmail ?? '');
  }, [data?.copyEmail]);

  if (isError) {
    return (
      <div data-exemplar className="flex w-full flex-col">
        <PageHeader title={DELIVERY_COPY.title} />
        <ErrorState
          error={error}
          resource={DELIVERY_COPY.errorResource}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const settings = data;
  const dirty = (settings?.copyEmail ?? '') !== draft.trim();

  return (
    <div data-exemplar className="flex w-full flex-col">
      <PageHeader
        title={DELIVERY_COPY.title}
        subtitle={DELIVERY_COPY.subtitle}
      />

      {isLoading || !settings ? (
        <div aria-busy="true" aria-label={DELIVERY_COPY.loading}>
          <Skeleton />
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
          {/* ── Channels ────────────────────────────────────────────────── */}
          <Card>
            <Legend>{DELIVERY_COPY.channelsHeading}</Legend>

            {settings.channels.map((channel) => (
              <div
                key={channel.name}
                className="flex items-start"
                style={{ gap: 'var(--space-3)' }}
              >
                <Mail
                  size={15}
                  aria-hidden="true"
                  style={{
                    color: channel.available
                      ? TONE_STYLES.positive.fg
                      : TONE_STYLES.warning.fg,
                    marginTop: 'var(--space-1)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="flex flex-wrap items-center"
                    style={{
                      color: 'var(--foreground)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                      gap: 'var(--space-2)',
                    }}
                  >
                    {channel.name}
                    <Pill tone={channel.available ? 'positive' : 'warning'}>
                      {channel.available
                        ? DELIVERY_COPY.channelAvailable
                        : DELIVERY_COPY.channelUnavailable}
                    </Pill>
                  </p>
                  <p style={bodyStyle}>{channel.detail}</p>
                </div>
              </div>
            ))}

            {/*
              WhatsApp, answered rather than omitted.

              The client asked for it and has not been told it is unavailable.
              A screen called "Where reminders go" that simply leaves it out
              reads as an oversight, and leaves the person demoing to
              improvise — which usually becomes "that's coming", a promise the
              product cannot keep.

              Rendered visibly apart from the channel list above, because it
              is NOT a channel. It is the answer to a question.
            */}
            <div
              style={{
                borderTop: 'var(--hairline) solid var(--border)',
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
              }}
            >
              <div className="flex items-start" style={{ gap: 'var(--space-3)' }}>
                <MessageCircle
                  size={15}
                  aria-hidden="true"
                  style={{
                    color: 'var(--muted-foreground)',
                    marginTop: 'var(--space-1)',
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 500,
                    }}
                  >
                    {DELIVERY_COPY.whatsappHeading}
                  </p>
                  <p style={bodyStyle}>{DELIVERY_COPY.whatsappBody}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* ── No channel at all ───────────────────────────────────────── */}
          {!settings.channelConfigured ? (
            <div
              role="status"
              style={{
                background: TONE_STYLES.warning.bg,
                border: `var(--hairline) solid ${TONE_STYLES.warning.border}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}
            >
              <p
                className="flex items-center"
                style={{
                  color: TONE_STYLES.warning.fg,
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  gap: 'var(--space-2)',
                }}
              >
                <TriangleAlert size={14} aria-hidden="true" />
                {DELIVERY_COPY.noChannelTitle}
              </p>
              <p
                style={{
                  color: TONE_STYLES.warning.fg,
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--leading-normal)',
                  marginTop: 'var(--space-1)',
                  maxWidth: '64ch',
                }}
              >
                {DELIVERY_COPY.noChannelBody}
              </p>
            </div>
          ) : null}

          {/* ── People ──────────────────────────────────────────────────── */}
          <Card>
            <Legend>{DELIVERY_COPY.peopleHeading}</Legend>
            <p style={{ ...bodyStyle, marginBottom: 'var(--space-3)' }}>
              {DELIVERY_COPY.peopleBody}
            </p>

            <ul className="flex flex-col">
              {settings.people.map((person, index) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between"
                  style={{
                    borderTop:
                      index === 0
                        ? undefined
                        : 'var(--hairline) solid var(--border)',
                    gap: 'var(--space-2)',
                    paddingBlock: 'var(--space-3)',
                  }}
                >
                  <div className="min-w-0">
                    <p
                      style={{
                        color: 'var(--foreground)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                      }}
                    >
                      {person.name ?? person.email}
                    </p>
                    <p
                      style={{
                        color: 'var(--muted-foreground)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      {person.email}
                    </p>
                  </div>
                  <span
                    className="tnum shrink-0"
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    {person.licences === 0
                      ? DELIVERY_COPY.holdsNothing
                      : DELIVERY_COPY.licencesHeld(person.licences)}
                  </span>
                </li>
              ))}
            </ul>

            <p
              style={{
                borderTop: 'var(--hairline) solid var(--border)',
                color: 'var(--muted-foreground)',
                fontSize: 'var(--text-xs)',
                lineHeight: 'var(--leading-normal)',
                marginTop: 'var(--space-2)',
                paddingTop: 'var(--space-3)',
              }}
            >
              {DELIVERY_COPY.addressFixed}
            </p>
          </Card>

          {/* ── Unassigned ──────────────────────────────────────────────── */}
          <Card>
            <Legend>{DELIVERY_COPY.unassignedHeading}</Legend>
            {settings.unassignedCount === 0 ? (
              /*
                The population is passed, not checked here. unassignedNone is
                a population-guarded function (see population.ts): with zero
                licences it returns "no licences on record yet" instead of the
                vacuous "every licence has someone responsible".

                The tick is conditional on there being something to be clear
                ABOUT — an all-clear mark over an empty register is the same
                lie in a different medium.
              */
              <p
                className="flex items-center"
                style={{ ...bodyStyle, gap: 'var(--space-2)' }}
              >
                {settings.activeTotal > 0 ? (
                  <Check
                    size={14}
                    aria-hidden="true"
                    style={{ color: TONE_STYLES.positive.fg }}
                  />
                ) : null}
                {DELIVERY_COPY.unassignedNone(settings.activeTotal)}
              </p>
            ) : (
              <>
                <p style={{ ...bodyStyle, color: 'var(--foreground)' }}>
                  {settings.copyEmail
                    ? DELIVERY_COPY.unassignedWithCopy(settings.unassignedCount)
                    : DELIVERY_COPY.unassignedWithoutCopy(
                        settings.unassignedCount,
                      )}
                </p>
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <Link
                    href="/dashboard/licenses?ownerUserId=none"
                    style={ACTION_STYLE.secondary}
                  >
                    {DELIVERY_COPY.unassignedCta}
                  </Link>
                </div>
              </>
            )}
          </Card>

          {/* ── Copy address ────────────────────────────────────────────── */}
          <Card>
            <Legend>{DELIVERY_COPY.copyHeading}</Legend>
            <p style={bodyStyle}>{DELIVERY_COPY.copyBody}</p>

            <label
              className="block"
              style={{ marginTop: 'var(--space-4)', maxWidth: '46ch' }}
            >
              <span
                className="block"
                style={{
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  marginBottom: 'var(--space-1)',
                }}
              >
                {DELIVERY_COPY.copyLabel}
              </span>
              <input
                type="email"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={DELIVERY_COPY.copyPlaceholder}
                style={{
                  background: 'var(--surface)',
                  border: 'var(--hairline) solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--foreground)',
                  fontSize: 'var(--text-sm)',
                  height: 'var(--space-8)',
                  paddingInline: 'var(--space-2)',
                  width: '100%',
                }}
              />
            </label>

            <div
              className="flex flex-wrap items-center"
              style={{ gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}
            >
              <button
                type="button"
                disabled={!dirty || setCopyEmail.isPending}
                onClick={() => setCopyEmail.mutate(draft.trim() || null)}
                style={ACTION_STYLE.primary}
              >
                {setCopyEmail.isPending
                  ? DELIVERY_COPY.copySaving
                  : DELIVERY_COPY.copySave}
              </button>
              {settings.copyEmail ? (
                <button
                  type="button"
                  disabled={setCopyEmail.isPending}
                  onClick={() => setCopyEmail.mutate(null)}
                  style={ACTION_STYLE.secondary}
                >
                  {DELIVERY_COPY.copyRemove}
                </button>
              ) : null}
              <span
                aria-live="polite"
                style={{
                  color: 'var(--muted-foreground)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                {settings.copyEmail
                  ? DELIVERY_COPY.copySetTo(settings.copyEmail)
                  : DELIVERY_COPY.copyNoneSet}
              </span>
            </div>

            {/*
              The limit, stated with the control rather than in a footnote.
              A copy address is not a substitute for assigning someone.
            */}
            <p
              style={{
                borderTop: 'var(--hairline) solid var(--border)',
                color: 'var(--muted-foreground)',
                fontSize: 'var(--text-xs)',
                lineHeight: 'var(--leading-normal)',
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-3)',
                maxWidth: '64ch',
              }}
            >
              {DELIVERY_COPY.copyLimit}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ── Local presentation ─────────────────────────────────────────────────── */

const bodyStyle: React.CSSProperties = {
  color: 'var(--muted-foreground)',
  fontSize: 'var(--text-sm)',
  lineHeight: 'var(--leading-normal)',
  maxWidth: '64ch',
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--surface)',
        border: 'var(--hairline) solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xs)',
        padding: 'var(--space-5)',
      }}
    >
      {children}
    </section>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        color: 'var(--muted-foreground)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        lineHeight: 'var(--leading-tight)',
        marginBottom: 'var(--space-3)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </h2>
  );
}

function Pill({
  tone,
  children,
}: {
  tone: 'positive' | 'warning';
  children: React.ReactNode;
}) {
  const style = TONE_STYLES[tone];
  return (
    <span
      style={{
        background: style.bg,
        border: `var(--hairline) solid ${style.border}`,
        borderRadius: 'var(--radius-xs)',
        color: style.fg,
        fontSize: 'var(--text-2xs)',
        fontWeight: 500,
        paddingBlock: 'var(--space-1)',
        paddingInline: 'var(--space-2)',
      }}
    >
      {children}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-col" style={{ gap: 'var(--space-4)' }}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="animate-pulse"
          style={{
            background: 'var(--surface)',
            border: 'var(--hairline) solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            height: 'var(--space-16)',
          }}
        />
      ))}
    </div>
  );
}
