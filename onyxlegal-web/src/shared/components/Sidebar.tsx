'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContractStats } from '@/shared/api';
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  BarChart2,
  Settings,
  Scale,
  Crown,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',  icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Templates',  icon: FileText,         href: '/dashboard/templates' },
  { name: 'Contracts',  icon: FileSignature,    href: '/dashboard/contracts' },
  { name: 'Analytics',  icon: BarChart2,        href: '/dashboard/analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: stats } = useContractStats();
  const activeCount = stats?.activeContracts ?? 0;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div
      className="w-[228px] h-screen flex flex-col pt-6 shrink-0 relative"
      style={{
        background: 'rgba(255,255,255,0.82)',
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
          <Scale size={16} className="text-white" />
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
                className="relative flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-all duration-200"
                style={{
                  borderRadius: '8px',
                  background: active ? 'rgba(61,53,211,0.07)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
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
                className="relative flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium transition-all duration-200"
                style={{
                  borderRadius: '8px',
                  background: active ? 'rgba(61,53,211,0.07)' : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--muted-foreground)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
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

      {/* AI Monitor Footer */}
      <div className="p-3 mt-auto">
        <div
          className="px-4 py-3.5"
          style={{
            background: 'rgba(61,53,211,0.05)',
            border: '1px solid rgba(61,53,211,0.10)',
            borderRadius: '10px',
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={12} style={{ color: 'var(--primary)' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'var(--primary)' }}>Onyx AI</span>
            <div className="relative ml-auto">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--success)' }} />
              <div
                className="absolute inset-0 w-1.5 h-1.5 rounded-full animate-ping"
                style={{ background: 'var(--success)', opacity: 0.4 }}
              />
            </div>
          </div>
          <p className="text-[11px] leading-snug" style={{ color: 'var(--muted-foreground)' }}>
            Monitoring {activeCount} active contract{activeCount !== 1 ? 's' : ''} for liabilities.
          </p>
        </div>

        {/* Plan indicator */}
        <div className="mt-2.5 px-1 flex items-center gap-1.5">
          <Crown size={10} style={{ color: '#F59E0B' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Free Plan
          </span>
          <button
            className="ml-auto text-[11px] font-semibold transition-colors duration-150"
            style={{ color: 'var(--primary)' }}
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
