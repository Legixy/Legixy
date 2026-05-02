'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import {
  User,
  Building2,
  Sparkles,
  Bell,
  LogOut,
  Zap,
  Crown,
  Shield,
  Mail,
  ChevronRight,
} from 'lucide-react';

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
      style={{
        background: checked ? 'var(--primary)' : 'var(--border)',
        outline: 'none',
      }}
    >
      <span
        className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(3px)' }}
      />
    </button>
  );
}

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
      className="bg-white rounded-xl"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Card header */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(61,53,211,0.07)' }}
        >
          <Icon size={15} style={{ color: 'var(--primary)' }} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-800 tracking-tight">{title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Read-only info row ─────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <span className="text-[12px] font-medium text-slate-500">{label}</span>
      <span className="text-[13px] font-medium text-slate-800">{value}</span>
    </div>
  );
}

// ── Notification toggle row ────────────────────────────────────────────────────
function NotifRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
      <div className="flex-1 min-w-0 pr-6">
        <p className="text-[13px] font-medium text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{description}</p>
      </div>
      <Toggle checked={value} onChange={onChange} />
    </div>
  );
}

// ── AI token usage bar ─────────────────────────────────────────────────────────
function TokenBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const color = pct > 85 ? '#EF4444' : pct > 60 ? '#F59E0B' : 'var(--primary)';
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-slate-500">AI Token Usage</span>
        <span className="text-[12px] font-semibold text-slate-700">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5">{pct.toFixed(1)}% of monthly limit used</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PreferencesPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  // Notification prefs — persisted in localStorage so they survive page refresh
  const [notifs, setNotifs] = useState({
    riskAlerts:     true,
    analysisComplete: true,
    weeklyDigest:   false,
    autoFixApplied: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('onyxlegal:notif-prefs');
    if (saved) {
      try { setNotifs(JSON.parse(saved)); } catch {}
    }
  }, []);

  const setNotif = (key: keyof typeof notifs) => (val: boolean) => {
    const next = { ...notifs, [key]: val };
    setNotifs(next);
    localStorage.setItem('onyxlegal:notif-prefs', JSON.stringify(next));
  };

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

  const tenant  = user?.tenant;
  const planLabel = tenant?.plan === 'PRO' ? 'Pro' : tenant?.plan === 'ENTERPRISE' ? 'Enterprise' : 'Free';
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="w-full flex flex-col pt-4 pb-16 animate-fade-up">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-indigo-700 text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: 'rgba(61,53,211,0.06)', border: '1px solid rgba(61,53,211,0.10)' }}
        >
          <Sparkles size={12} />
          Preferences
        </div>
        <h1 className="font-display text-3xl text-slate-900 tracking-tight">Account &amp; Preferences</h1>
        <p className="text-slate-500 mt-1 text-[15px]">Manage your profile, workspace, and notification settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column (2/3) ──────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Profile */}
          <Section icon={User} title="Profile" subtitle="Your identity on Legixy">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold shrink-0"
                style={{ background: 'var(--primary)' }}
              >
                {initials}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-slate-900">{user?.name || '—'}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{user?.email}</p>
                <span
                  className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(61,53,211,0.07)', color: 'var(--primary)' }}
                >
                  {user?.role?.toLowerCase() ?? 'member'}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              <InfoRow label="Full name"    value={user?.name  || 'Not set'} />
              <InfoRow label="Email"        value={user?.email || '—'} />
              <InfoRow label="Role"         value={user?.role  || '—'} />
              <InfoRow label="Member since" value="2024" />
            </div>

            <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1.5">
              <Mail size={11} />
              To update your name or email, contact your workspace admin.
            </p>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Notifications" subtitle="Choose what you want to hear about">
            <div className="divide-y divide-slate-50">
              <NotifRow
                label="High-risk clause alerts"
                description="Get notified immediately when Onyx AI flags a HIGH severity clause."
                value={notifs.riskAlerts}
                onChange={setNotif('riskAlerts')}
              />
              <NotifRow
                label="Analysis complete"
                description="Notify when a contract analysis job finishes processing."
                value={notifs.analysisComplete}
                onChange={setNotif('analysisComplete')}
              />
              <NotifRow
                label="Auto-fix applied"
                description="Confirm when AI automatically rewrites a flagged clause."
                value={notifs.autoFixApplied}
                onChange={setNotif('autoFixApplied')}
              />
              <NotifRow
                label="Weekly digest"
                description="A summary email every Monday of your contract risk activity."
                value={notifs.weeklyDigest}
                onChange={setNotif('weeklyDigest')}
              />
            </div>
          </Section>

        </div>

        {/* ── Right column (1/3) ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Workspace */}
          <Section icon={Building2} title="Workspace" subtitle="Your organisation on Legixy">
            <div className="divide-y divide-slate-50">
              <InfoRow label="Organisation" value={tenant?.name || '—'} />
              <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span className="text-[12px] font-medium text-slate-500">Plan</span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#F59E0B' }}>
                  <Crown size={11} />
                  {planLabel}
                </span>
              </div>
            </div>

            {/* Token usage bar */}
            <div className="mt-4">
              <TokenBar
                used={tenant?.aiTokensUsed ?? 0}
                limit={tenant?.aiTokenLimit ?? 100000}
              />
            </div>

            {planLabel === 'Free' && (
              <button
                className="mt-5 w-full flex items-center justify-between px-4 py-3 rounded-lg text-[13px] font-semibold transition-all duration-150"
                style={{
                  background: 'rgba(61,53,211,0.06)',
                  border: '1px solid rgba(61,53,211,0.12)',
                  color: 'var(--primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(61,53,211,0.10)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(61,53,211,0.06)';
                }}
              >
                <span className="flex items-center gap-2">
                  <Crown size={13} style={{ color: '#F59E0B' }} />
                  Upgrade to Pro
                </span>
                <ChevronRight size={14} />
              </button>
            )}
          </Section>

          {/* AI Settings */}
          <Section icon={Sparkles} title="AI Engine" subtitle="Onyx AI configuration">
            <div className="divide-y divide-slate-50">
              <InfoRow label="Engine"      value="Gemini 1.5 Flash" />
              <InfoRow label="Temperature" value="0.2 — deterministic" />
              <InfoRow label="Jurisdiction" value="India (default)" />
            </div>
            <div
              className="mt-4 flex items-start gap-2.5 px-3 py-3 rounded-lg"
              style={{ background: 'rgba(61,53,211,0.04)', border: '1px solid rgba(61,53,211,0.08)' }}
            >
              <Shield size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--primary)' }} />
              <p className="text-[11px] leading-relaxed text-slate-500">
                All contract text is processed in-region and never used to train AI models.
              </p>
            </div>
          </Section>

          {/* Danger zone */}
          <div
            className="rounded-xl px-6 py-5"
            style={{ border: '1px solid rgba(220,38,38,0.12)', background: 'rgba(220,38,38,0.02)' }}
          >
            <p className="text-[12px] font-semibold text-red-600 uppercase tracking-wider mb-3">Danger Zone</p>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-red-600 transition-all duration-150"
              style={{ border: '1px solid rgba(220,38,38,0.20)', background: 'transparent' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.06)';
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
