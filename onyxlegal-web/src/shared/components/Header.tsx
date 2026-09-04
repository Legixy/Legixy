'use client';

import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import { useUnreadReminderCount } from '@/features/compliance/api/compliance';
import { NOTIFICATION_COPY } from '@/features/compliance/lib/notification-copy';
import { ReminderNotificationsPanel } from '@/features/compliance/components/ReminderNotificationsPanel';


export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  // Compliance reminders, not contract-analysis notifications. The old
  // surface pushed a row per user, so a licence with no owner had nobody to
  // notify — exactly the case that must stay visible.
  const { data: countData } = useUnreadReminderCount();
  const unreadCount = countData?.unreadCount ?? 0;

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      (document.getElementById('global-search') as HTMLInputElement)?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <header
      className="h-[56px] flex items-center justify-between px-8 sticky top-0 z-20 w-full"
      style={{
        background: 'var(--glass-header)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
      }}
    >

      {/* Hamburger — mobile only */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="mr-3 p-2 md:hidden"
          style={{ borderRadius: '8px', color: 'var(--muted-foreground)' }}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      )}

      {/*
        The global search box was removed.

        It advertised "Ask AI or search contracts…" and offered to "Ask Onyx AI
        about …", but its results array was literally empty: it opened a
        dropdown headed "Quick Results" that could never contain a result, and
        no AI existed behind it. A control that does nothing while promising
        two capabilities the product does not have is worse than no control.

        A real licence search already exists on /dashboard/licenses.
      */}
      <div className="flex-1" />

      {/* Global Actions */}
      <div className="flex items-center gap-1 ml-4">

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 transition-[background-color,border-color,color,opacity] duration-150"
            style={{ borderRadius: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label={NOTIFICATION_COPY.bellLabel(unreadCount)}
            aria-expanded={notifOpen}
          >
            <Bell size={17} style={{ color: 'var(--muted-foreground)' }} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-black text-[var(--on-brand)] px-0.5"
                style={{ background: 'var(--danger)', outline: '1.5px solid var(--background)' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <ReminderNotificationsPanel onClose={() => setNotifOpen(false)} />
          )}
        </div>

        {/*
          The Help button was removed in Slice 19.

          It opened https://legixy.com/docs in a new tab. No domain has been
          registered — DEPLOYMENT.md lists that as a human task — and the name
          resolves to a parking page owned by someone else, so /docs is
          unreachable. In front of a client that is worse than nothing: a
          stranger's for-sale page, opened by the product.

          It comes back when there is documentation to point at.
        */}
        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* User Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 transition-[background-color,border-color,color,opacity] duration-150"
            style={{ borderRadius: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="w-7 h-7 flex items-center justify-center text-[var(--on-brand)] text-[11px] font-semibold"
              style={{ background: 'var(--primary)', borderRadius: '50%' }}
            >
              {initials}
            </div>
            <ChevronDown
              size={12}
              style={{
                color: 'var(--muted-foreground)',
                transition: 'transform 200ms',
                transform: menuOpen ? 'rotate(180deg)' : 'none',
              }}
            />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-52 overflow-hidden z-20"
                style={{
                  background: 'var(--card)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>{user?.name || 'Account'}</p>
                  <p className="text-[12px] truncate mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); logout(); router.push('/login'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors duration-150"
                  style={{ color: 'var(--status-expired-fg)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--status-expired-fg) 5%, transparent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
