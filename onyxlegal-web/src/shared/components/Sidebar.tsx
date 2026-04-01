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
    <div className="w-[216px] h-screen bg-white border-r border-slate-200 flex flex-col pt-5 shrink-0">

      {/* Brand */}
      <div className="px-5 mb-7 flex items-center gap-2.5 text-slate-900">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/30">
          <Hexagon fill="white" stroke="none" size={18} />
        </div>
        <span className="font-bold text-[17px] tracking-tight">OnyxLegal</span>
      </div>

      {/* Platform Nav */}
      <div className="flex-1 px-3">
        <p className="text-[10px] font-bold text-slate-400 mb-3 px-2 uppercase tracking-[0.12em]">Platform</p>
        <nav className="space-y-0.5 mb-7">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                `}
              >
                {/* Active left-border indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-r-full" />
                )}
                <item.icon
                  size={17}
                  className={`transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Settings Nav */}
        <p className="text-[10px] font-bold text-slate-400 mb-3 px-2 uppercase tracking-[0.12em]">Settings</p>
        <nav>
          <Link
            href="/dashboard/preferences"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Settings size={17} strokeWidth={1.8} className="text-slate-400" />
            Preferences
          </Link>
        </nav>
      </div>

      {/* Onyx AI Monitor Footer — Enhanced with gradient border */}
      <div className="p-3 mt-auto">
        <div className="relative bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-xl p-3.5 border border-indigo-100/50 overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-indigo-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-2 mb-1.5 relative z-10">
            <span className="text-xs font-bold text-indigo-700">✨ Onyx AI</span>
            {/* Enhanced pulsing dot with glow */}
            <div className="relative ml-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug relative z-10">
            Continuously scanning 24 active contracts for liabilities.
          </p>
        </div>

        {/* Plan indicator */}
        <div className="mt-2 px-1 flex items-center gap-1.5">
          <Crown size={11} className="text-amber-500" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Free Plan</span>
          <button className="ml-auto text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
