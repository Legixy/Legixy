'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import {
  User,
  Building2,
  Sparkles,
  LogOut,
  Zap,
  Mail,
} from 'lucide-react';

// ── Toggle switch ──────────────────────────────────────────────────────────────
// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-[var(--surface)] rounded-xl"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--primary-wash)' }}
        >
          <Icon size={15} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--foreground)] tracking-tight">{title}</p>
          <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Read-only info row ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--shadow-xs)' }}>
      <span className="text-[12px] font-medium text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[13px] font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}

// ── Notification toggle row ────────────────────────────────────────────────────
// The AI token usage bar was removed. There is no AI in this product and no
// billing, so a meter reading "0 / 5,000" measured a service that does not
// exist. Slice 8 removed two preferences panels for the same reason; this
// one survived that sweep because it was fed by a real schema column.

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PreferencesPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Notification prefs — persisted in localStorage so they survive page refresh
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Zap className="w-6 h-6 animate-pulse" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  const tenant = user?.tenant;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="w-full flex flex-col pt-4 pb-16 animate-fade-up">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[var(--primary)] text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: 'var(--primary-wash)', border: '1px solid var(--primary-wash-hover)' }}
        >
          <Sparkles size={12} />
          Preferences
        </div>
        <h1 style={{ color: 'var(--foreground)', fontSize: 'var(--text-xl)', fontWeight: 600, letterSpacing: 'var(--tracking-tight)', lineHeight: 'var(--leading-tight)' }}>Account &amp; Preferences</h1>
        <p className="text-[var(--muted-foreground)] mt-1 text-[15px]">Your profile and workspace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) ──────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Profile */}
          <Section icon={User} title="Profile" subtitle="Your identity on Legixy">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-[var(--primary-foreground)] text-xl font-semibold shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                {initials}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--foreground)]">{user?.name || '—'}</p>
                <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">{user?.email}</p>
                <span
                  className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--primary-wash)', color: 'var(--primary)' }}
                >
                  {user?.role?.toLowerCase() ?? 'member'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)]">
              <InfoRow label="Full name" value={user?.name || 'Not set'} />
              <InfoRow label="Email" value={user?.email || '—'} />
              <InfoRow label="Role" value={user?.role || '—'} />
              {/*
                "Member since 2024" was a hardcoded literal on a tenant created
                this year. The creation date is not carried in the auth
                payload, and plumbing a field through for one cosmetic row is
                not worth it — an absent row beats a fabricated fact.
              */}
            </div>

            <p className="text-[11px] text-[var(--muted-foreground)] mt-4 flex items-center gap-1.5">
              <Mail size={11} />
              Name and email changes are not available yet.
            </p>
          </Section>

          {/*
            The Notifications section was removed.

            All four toggles configured the contract-analysis pipeline:
            high-risk clause alerts "when Onyx AI flags a HIGH severity
            clause", analysis-job completion, AI auto-fix confirmations, and a
            weekly contract-risk digest. None of it runs, and none of it
            describes anything this compliance product does.

            Licence reminders are not user-configurable: the ladder is fixed at
            90/60/30/14/7 days before expiry and goes to the licence's
            responsible person. There is no preference to expose yet, and a
            toggle that controlled nothing would be the same mistake again.
          */}

        </div>

        {/* ── Right column (1/3) ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Workspace */}
          <Section icon={Building2} title="Workspace" subtitle="Your organisation on Legixy">
            <div className="divide-y divide-[var(--border)]">
              <InfoRow label="Organisation" value={tenant?.name || '—'} />
            </div>

            {/*
              Token usage and the upgrade path were removed with it. There is
              no plan to upgrade from, and "Pro unlocks unlimited contracts,
              advanced AI" described a product this is not.
            */}
          </Section>

          {/* AI Settings */}
          {/*
            The "AI Engine" section was removed.

            It advertised a Gemini configuration, a temperature, an "in-region
            processing" guarantee, and a jurisdiction of "India (default)" — for
            a contract-analysis pipeline that has no consumers at all: core
            registers its queues but declares zero @Processor handlers, and the
            worker listens on a queue name core never produces.

            Describing the settings of something that never runs, in the wrong
            jurisdiction, on a Saudi compliance product, is three untrue things
            in one panel.
          */}

          {/* Danger zone */}
          <div
            className="rounded-xl px-6 py-5"
            style={{ border: '1px solid color-mix(in srgb, var(--status-expired-fg) 12%, transparent)', background: 'color-mix(in srgb, var(--status-expired-fg) 3%, transparent)' }}
          >
            
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-[var(--status-expired-fg)] transition-[background-color,border-color,color,opacity] duration-150"
              style={{ border: '1px solid color-mix(in srgb, var(--status-expired-fg) 20%, transparent)', background: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'color-mix(in srgb, var(--status-expired-fg) 6%, transparent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut size={13} />
              Sign out of Legixy
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
