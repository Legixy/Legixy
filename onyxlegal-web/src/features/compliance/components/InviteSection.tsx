'use client';

import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import {
  useInvite,
  usePendingInvitations,
  useRevokeInvitation,
} from '@/features/compliance/api/compliance';
import { INVITE_COPY } from '@/features/compliance/lib/invite-copy';

/**
 * Inviting somebody into this workspace.
 *
 * WHY IT LIVES ON THE DELIVERY SCREEN
 * -----------------------------------
 * This screen already lists every person in the workspace and what each one
 * holds. A separate "People" page would render the same humans a second time,
 * which is the duplication this project has corrected twice. Inviting somebody
 * is also, concretely, how you make reminders reach a new person — which is
 * the question this screen exists to answer.
 *
 * WHY THE LINK IS ALWAYS SHOWN
 * ----------------------------
 * SMTP is not configured in this deployment. An invitation that silently goes
 * nowhere is the failure class removed everywhere else in this product, so the
 * link is rendered whether or not an email went out, and the wording says
 * which happened rather than assuming.
 */
export function InviteSection() {
  const { data: pending, isLoading } = usePendingInvitations();
  const invite = useInvite();
  const revoke = useRevokeInvitation();

  const [email, setEmail] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [delivered, setDelivered] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const created = await invite.mutateAsync(email.trim()).catch(() => null);
    if (created) {
      setLink(created.link);
      setDelivered(created.delivered);
      setCopied(false);
      setEmail('');
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      // Clipboard can be denied. The link is selectable either way, so this
      // stays silent rather than claiming a copy that did not happen.
      setCopied(false);
    }
  }

  return (
    <>
      <form
        onSubmit={submit}
        className="flex flex-wrap items-end"
        style={{ gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="invite-email"
            style={{
              color: 'var(--foreground)',
              display: 'block',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              marginBottom: 'var(--space-1)',
            }}
          >
            {INVITE_COPY.fieldLabel}
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={INVITE_COPY.placeholder}
            style={{
              background: 'var(--background)',
              border: 'var(--hairline) solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-sm)',
              height: 'var(--space-10)',
              paddingInline: 'var(--space-3)',
              width: '100%',
            }}
          />
        </div>
        <button
          type="submit"
          /*
            Disabled ONLY while a request is in flight, never for an empty
            field. It was the highest-value action on this screen and it sat
            greyed out with no title, no aria-describedby and no explanation —
            the reader is left to guess what it wants. Pressing it now runs
            the form's own validation, which says what is missing in the
            browser's words and in the reader's language.
          */
          disabled={invite.isPending}
          style={{
            background: 'var(--primary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-foreground)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            height: 'var(--space-10)',
            opacity: invite.isPending ? 0.6 : 1,
            paddingInline: 'var(--space-4)',
          }}
        >
          {invite.isPending ? INVITE_COPY.working : INVITE_COPY.cta}
        </button>
      </form>

      {link ? (
        <div
          style={{
            background: 'var(--muted)',
            border: 'var(--hairline) solid var(--border)',
            borderRadius: 'var(--radius-md)',
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3)',
          }}
        >
          <p
            style={{
              color: 'var(--foreground)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}
          >
            {delivered ? INVITE_COPY.emailed : INVITE_COPY.notEmailed}
          </p>
          <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
            <input
              readOnly
              value={link}
              onFocus={(event) => event.currentTarget.select()}
              aria-label={INVITE_COPY.linkLabel}
              className="font-mono"
              style={{
                background: 'var(--background)',
                border: 'var(--hairline) solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--muted-foreground)',
                flex: 1,
                fontSize: 'var(--text-xs)',
                height: 'var(--space-8)',
                minWidth: 0,
                paddingInline: 'var(--space-2)',
              }}
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center"
              style={{
                background: 'var(--surface)',
                border: 'var(--hairline) solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--foreground)',
                fontSize: 'var(--text-xs)',
                gap: 'var(--space-1)',
                height: 'var(--space-8)',
                paddingInline: 'var(--space-3)',
              }}
            >
              {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
              {copied ? INVITE_COPY.copied : INVITE_COPY.copy}
            </button>
          </div>
          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-xs)',
              marginTop: 'var(--space-2)',
            }}
          >
            {INVITE_COPY.linkExpiry}
          </p>
        </div>
      ) : null}

      {!isLoading && pending && pending.length > 0 ? (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}
          >
            {INVITE_COPY.pendingHeading(pending.length)}
          </p>
          <ul className="flex flex-col">
            {pending.map((invitation, index) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between"
                style={{
                  borderTop:
                    index === 0 ? undefined : 'var(--hairline) solid var(--border)',
                  gap: 'var(--space-2)',
                  paddingBlock: 'var(--space-2)',
                }}
              >
                <span
                  className="min-w-0"
                  style={{
                    color: 'var(--foreground)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {invitation.email}
                </span>
                <button
                  type="button"
                  onClick={() => revoke.mutate(invitation.id)}
                  disabled={revoke.isPending}
                  className="inline-flex shrink-0 items-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted-foreground)',
                    fontSize: 'var(--text-xs)',
                    gap: 'var(--space-1)',
                  }}
                >
                  <X size={12} aria-hidden="true" />
                  {INVITE_COPY.withdraw}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p
        style={{
          borderTop: 'var(--hairline) solid var(--border)',
          color: 'var(--muted-foreground)',
          fontSize: 'var(--text-xs)',
          lineHeight: 'var(--leading-normal)',
          marginTop: 'var(--space-3)',
          paddingTop: 'var(--space-3)',
        }}
      >
        {INVITE_COPY.everyoneSeesEverything}
      </p>
    </>
  );
}
