'use client';

import { useState } from 'react';
import { Sidebar } from '@/shared/components/Sidebar';
import { Header } from '@/shared/components/Header';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>

      {/* Mobile backdrop — closes sidebar when tapped */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'var(--backdrop)', backdropFilter: 'blur(2px)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar drawer — CSS class handles fixed→static at md breakpoint */}
      <div className="sidebar-drawer" data-open={mobileOpen ? 'true' : 'false'}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header onMenuClick={() => setMobileOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
          <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
