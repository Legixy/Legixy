'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Settings,
  AlertCircle,
  CalendarRange,
  ListChecks,
  Send,
} from 'lucide-react';
import { LegixyMark } from '@/shared/components/LegixyMark';

/**
 * The compliance product's navigation.
 *
 * NOTE ON TRANSITIONS
 * -------------------
 * These links used `transition-all`, which animates every animatable
 * property — including `outline-color`. The effect was a focus ring that
 * FADED IN over 200ms when tabbed to, which is precisely wrong for the
 * keyboard user it exists to serve: the indicator has to be there the
 * instant focus lands. Named properties only.
 *
 * Contracts, Templates and Analytics belong to the contract-analysis feature.
 * Core registers its queues but nothing consumes them — there are zero
 * @Processor decorators, and the worker listens on a queue name core never
 * produces — so those screens present work that provably never happens.
 *
 * The code is left in place; that removal is a larger call for the team. What
 * changes here is that the compliance product no longer offers them, because
 * shipping a visible feature that does nothing is worse than not shipping it.
 */
const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Sites', icon: Building2, href: '/dashboard/sites' },
  { name: 'Licences', icon: ShieldCheck, href: '/dashboard/licenses' },
  { name: 'The year ahead', icon: CalendarRange, href: '/dashboard/year-ahead' },
  { name: 'Not on record', icon: AlertCircle, href: '/dashboard/gaps' },
  { name: 'What to expect', icon: ListChecks, href: '/dashboard/requirements' },
  { name: 'Where reminders go', icon: Send, href: '/dashboard/delivery' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div
      className="w-[228px] h-screen flex flex-col pt-6 shrink-0 relative"
      style={{
        background: 'var(--glass-surface)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRight: '1px solid var(--border)',
      }}
    >

      {/* Brand */}
      <div className="px-5 mb-8 flex items-center gap-2.5">
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0"
          style={{ background: 'var(--primary)', borderRadius: '8px' }}
        >
          <LegixyMark size={17} className="text-[var(--on-brand)]" />
        </div>
        <span className="font-display text-[17px] tracking-tight" style={{ color: 'var(--foreground)' }}>
          Legixy
        </span>
      </div>

      {/* Platform Nav */}
      <div className="flex-1 px-3 overflow-y-auto">
        <p
          className="text-[10px] font-semibold mb-2.5 px-2 uppercase tracking-[0.14em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Platform
        </p>
        <nav className="space-y-0.5 mb-8">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-[background-color,border-color,color,opacity] duration-200"
                style={{
                  borderRadius: '8px',
                  background: active ? 'var(--primary-wash)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--shadow-xs)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }
                }}
              >
                {/* Active indicator */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5"
                    style={{ background: 'var(--primary)', borderRadius: '0 2px 2px 0' }}
                  />
                )}
                <item.icon
                  size={16}
                  strokeWidth={active ? 2 : 1.75}
                  style={{ color: active ? 'var(--primary)' : 'inherit', transition: 'color 150ms' }}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings Nav */}
        <p
          className="text-[10px] font-semibold mb-2.5 px-2 uppercase tracking-[0.14em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Settings
        </p>
        <nav>
          {(() => {
            const active = isActive('/dashboard/preferences');
            return (
              <Link
                href="/dashboard/preferences"
                className="relative flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-[background-color,border-color,color,opacity] duration-200"
                style={{
                  borderRadius: '8px',
                  background: active ? 'var(--primary-wash)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--shadow-xs)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5"
                    style={{ background: 'var(--primary)', borderRadius: '0 2px 2px 0' }}
                  />
                )}
                <Settings size={16} strokeWidth={active ? 2 : 1.75} style={{ color: active ? 'var(--primary)' : 'inherit' }} />
                Preferences
              </Link>
            );
          })()}
        </nav>
      </div>

      {/*
        The "Onyx AI" status card was removed.

        It showed a live green pulse beside the words "Onyx AI", implying a
        service actively watching the account. No such service runs. A pulsing
        indicator is a strong claim, and this one was decoration.
      */}
      {/*
        The plan indicator and upgrade link were removed with it. There is no
        billing in this product, so "Free Plan / Upgrade" advertised a tier
        system that does not exist and a purchase that cannot be made.
      */}
    </div>
  );
}
