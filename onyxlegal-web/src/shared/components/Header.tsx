'use client';

import { Search, Bell, X, ChevronDown, Sparkles, LogOut, Menu } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-provider';

const quickLinks = [
  { label: 'Globex MSA — High Risk clause',   badge: 'Contract',   bgColor: 'rgba(220,38,38,0.08)',  fgColor: 'var(--danger)'   },
  { label: 'Net 90 payment term risk',         badge: 'AI Insight', bgColor: 'rgba(61,53,211,0.08)',  fgColor: 'var(--primary)'  },
  { label: 'WeWork auto-renewal clause',       badge: 'Contract',   bgColor: 'rgba(217,119,6,0.08)',  fgColor: 'var(--warning)'  },
  { label: 'Standard NDA template',            badge: 'Template',   bgColor: 'rgba(5,150,105,0.08)',  fgColor: 'var(--success)'  },
];

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [query, setQuery]       = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

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
        background: 'rgba(248,249,252,0.88)',
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

      {/* AI Search Bar */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            size={14}
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            id="global-search"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchOpen(e.target.value.length > 0); }}
            onFocus={(e) => {
              setSearchOpen(true);
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,53,211,0.08)';
            }}
            onBlur={(e) => {
              setTimeout(() => setSearchOpen(false), 150);
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            placeholder="Ask AI or search contracts…"
            className="w-full h-9 pl-10 pr-14 text-[13px] transition-all duration-150"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center">
            {query ? (
              <button onClick={() => { setQuery(''); setSearchOpen(false); }}>
                <X size={13} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            ) : (
              <kbd
                className="inline-flex items-center justify-center font-mono text-[10px] h-5 px-1.5"
                style={{
                  background: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--muted-foreground)',
                }}
              >
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div
            className="absolute top-11 left-0 right-0 overflow-hidden z-50 animate-fade-up"
            style={{
              background: 'var(--card)',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <p
              className="px-4 pt-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Quick Results
            </p>
            {quickLinks
              .filter((l) => !query || l.label.toLowerCase().includes(query.toLowerCase()))
              .map((link) => (
                <button
                  key={link.label}
                  onMouseDown={() => { setSearchOpen(false); setQuery(''); toast.success(`Navigating to: ${link.label}`); }}
                  className="w-full flex items-center justify-between gap-4 px-4 py-2.5 text-left transition-colors duration-100"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>{link.label}</span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 shrink-0"
                    style={{ background: link.bgColor, color: link.fgColor, borderRadius: '4px' }}
                  >
                    {link.badge}
                  </span>
                </button>
              ))}
            {query && (
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onMouseDown={() => { setSearchOpen(false); setQuery(''); toast.success(`AI answer for "${query}"`); }}
                  className="text-[13px] font-semibold flex items-center gap-2 transition-colors duration-150"
                  style={{ color: 'var(--primary)' }}
                >
                  <Sparkles size={12} />
                  Ask Onyx AI about &ldquo;{query}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-1 ml-4">

        {/* Notification Bell */}
        <button
          onClick={() => toast.info('3 unread notifications', { description: 'Priya signature pending · AWS renewal · AI fix ready' })}
          className="relative p-2 transition-all duration-150"
          style={{ borderRadius: '8px' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Bell size={17} style={{ color: 'var(--muted-foreground)' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--danger)', outline: '1.5px solid var(--background)' }}
          />
        </button>

        {/* Help */}
        <button
          onClick={() => toast.info('Help & Resources', { description: 'Documentation coming soon.' })}
          className="px-3 py-1.5 text-[13px] font-medium transition-all duration-150"
          style={{ borderRadius: '8px', color: 'var(--muted-foreground)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; e.currentTarget.style.color = 'var(--foreground)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted-foreground)'; }}
        >
          Help
        </button>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* User Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 transition-all duration-150"
            style={{ borderRadius: '8px' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className="w-7 h-7 flex items-center justify-center text-white text-[11px] font-semibold"
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
                  style={{ color: 'var(--danger)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.05)'; }}
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
