'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LegixyMark } from '@/shared/components/LegixyMark';

/**
 * Accepting an invitation.
 *
 * WHY THIS IS A SEPARATE, PUBLIC SCREEN
 * -------------------------------------
 * The person arriving here has no account yet — that is the whole point. Every
 * registration path in the product creates a NEW tenant, so sending them to
 * /register would put them in a workspace of their own, which is precisely the
 * bug this feature exists to fix.
 *
 * The workspace they join is read from the invitation row on the server. There
 * is no tenant field on this form, and nothing typed here can influence which
 * organisation they land in.
 *
 * WHAT IT DOES NOT SAY
 * --------------------
 * It does not name the organisation before the token has been checked. Echoing
 * a workspace name back from an unvalidated token would turn this screen into
 * a way to confirm which company an address belongs to.
 */
export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`${apiBase}/invitations/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, name, password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body?.message ?? 'That invitation could not be accepted.');
        return;
      }

      // Sign them straight in: the Next route is what sets the HttpOnly cookie.
      const signIn = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: body.email, password }),
      });
      router.push(signIn.ok ? '/dashboard' : '/login');
    } catch {
      setError('Could not reach the server. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        alignItems: 'center',
        background: 'var(--brand-ink)',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--space-6)',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          maxWidth: '25rem',
          padding: 'var(--space-8)',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <span
            style={{
              alignItems: 'center',
              background: 'var(--brand-ink)',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              height: 'var(--space-8)',
              justifyContent: 'center',
              width: 'var(--space-8)',
            }}
          >
            <LegixyMark size={17} className="text-[var(--brand-gold)]" />
          </span>
          <span
            className="font-display"
            style={{ color: 'var(--foreground)', fontSize: 'var(--text-lg)' }}
          >
            Legixy
          </span>
        </div>

        <h1
          className="font-display"
          style={{
            color: 'var(--foreground)',
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-2)',
          }}
        >
          Join your team
        </h1>
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}
        >
          You have been invited to a workspace where licences and their renewal
          dates are kept. Choose a password to join it.
        </p>

        <form onSubmit={submit}>
          <label
            htmlFor="invite-name"
            style={{
              color: 'var(--foreground)',
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}
          >
            Your name
          </label>
          <input
            id="invite-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-sm)',
              height: 'var(--space-10)',
              marginBottom: 'var(--space-4)',
              paddingInline: 'var(--space-3)',
              width: '100%',
            }}
          />

          <label
            htmlFor="invite-password"
            style={{
              color: 'var(--foreground)',
              display: 'block',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              marginBottom: 'var(--space-2)',
            }}
          >
            Password
          </label>
          <input
            id="invite-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-sm)',
              height: 'var(--space-10)',
              paddingInline: 'var(--space-3)',
              width: '100%',
            }}
          />
          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'var(--text-xs)',
              marginBlock: 'var(--space-2) var(--space-6)',
            }}
          >
            At least 8 characters.
          </p>

          {error ? (
            <p
              role="alert"
              style={{
                color: 'var(--status-expired-fg)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-4)',
              }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            style={{
              background: 'var(--primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary-foreground)',
              cursor: busy ? 'progress' : 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              height: 'var(--space-10)',
              width: '100%',
            }}
          >
            {busy ? 'Joining…' : 'Join the workspace'}
          </button>
        </form>
      </div>
    </main>
  );
}
