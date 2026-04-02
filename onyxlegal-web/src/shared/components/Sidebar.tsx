'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  BarChart2,
  Settings,
  Hexagon,
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

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="w-[232px] h-screen onyx-glass flex flex-col pt-6 shrink-0 border-r border-[var(--border)]" style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)' }}>

      {/* Brand */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: 'var(--onyx-gradient)', boxShadow: '0 4px 16px rgba(79, 70, 229, 0.3)' }}
        >
          <Hexagon fill="white" stroke="none" size={18} />
        </div>
        <span className="font-display font-bold text-[17px] text-[#0F172A]">Legixy</span>
      </div>

      {/* Platform Nav */}
      <div className="flex-1 px-3">
        <p className="text-[10px] font-semibold text-slate-400 mb-3 px-3 uppercase tracking-[0.14em]">Platform</p>
        <nav className="space-y-1 mb-8">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                  transition-all duration-300
                  ${active
                    ? 'text-indigo-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/80'}
                `}
                style={active ? {
                  background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(124,58,237,0.06))',
                  boxShadow: '0 1px 3px rgba(79, 70, 229, 0.08)',
                } : undefined}
              >
                {/* Active left-bar indicator with glow */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: 'var(--onyx-gradient)', boxShadow: '0 0 8px rgba(79, 70, 229, 0.4)' }}
                  />
                )}
                <item.icon
                  size={17}
                  className={`transition-colors duration-200 ${active ? 'text-indigo-600' : 'text-slate-400'}`}
                  strokeWidth={active ? 2.2 : 1.7}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings Nav */}
        <p className="text-[10px] font-semibold text-slate-400 mb-3 px-3 uppercase tracking-[0.14em]">Settings</p>
        <nav>
          <Link
            href="/dashboard/preferences"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50/80 transition-all duration-200"
          >
            <Settings size={17} strokeWidth={1.7} className="text-slate-400" />
            Preferences
          </Link>
        </nav>
      </div>

      {/* Onyx AI Monitor Footer */}
      <div className="p-3 mt-auto">
        <div
          className="relative rounded-xl p-4 overflow-hidden"
          style={{
            background: 'var(--onyx-gradient-subtle)',
            border: '1px solid rgba(79, 70, 229, 0.1)',
          }}
        >
          {/* Subtle glow */}
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-violet-400/8 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-2 relative z-10">
            <Sparkles size={13} className="text-indigo-600" />
            <span className="text-xs font-bold text-indigo-700">Onyx AI</span>
            {/* Enhanced pulsing dot with glow */}
            <div className="relative ml-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-30" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug relative z-10">
            Continuously scanning 24 active contracts for liabilities.
          </p>
        </div>

        {/* Plan indicator */}
        <div className="mt-3 px-1 flex items-center gap-1.5">
          <Crown size={11} className="text-amber-500" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Free Plan</span>
          <button
            className="ml-auto text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
          >
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
