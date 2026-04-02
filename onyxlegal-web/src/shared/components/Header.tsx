'use client';

import { Search, Bell, X, ChevronDown, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const quickLinks = [
  { label: 'Globex MSA — High Risk clause', badge: 'Contract', color: 'bg-red-50 text-red-600' },
  { label: 'Net 90 payment term risk', badge: 'AI Insight', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'WeWork auto-renewal clause', badge: 'Contract', color: 'bg-amber-50 text-amber-600' },
  { label: 'Standard NDA template', badge: 'Template', color: 'bg-emerald-50 text-emerald-600' },
];

export function Header() {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: ⌘K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('global-search') as HTMLInputElement;
      input?.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleNotification = () => {
    toast.info('You have 3 unread notifications', {
      description: 'Priya Singh signature pending · AWS renewal in 2 days · AI fix ready',
    });
  };

  const handleHelp = () => {
    toast.info('Help & Resources', {
      description: 'Documentation, tutorials and support are coming soon.',
    });
  };

  const handleSearch = (label: string) => {
    setSearchOpen(false);
    setQuery('');
    toast.success(`Navigating to: ${label}`);
  };

  return (
    <header
      className="h-[56px] bg-white/80 flex items-center justify-between px-8 sticky top-0 z-20 w-full"
      style={{
        backdropFilter: 'blur(12px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
      }}
    >

      {/* AI Search Bar */}
      <div className="flex-1 max-w-2xl relative">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-200" size={15} />
          <input
            id="global-search"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(e.target.value.length > 0);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Ask AI to find a clause, or search contracts..."
            className="w-full h-9 pl-10 pr-14 bg-[#F4F5F7] rounded-xl text-sm outline-none transition-all duration-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(79,70,229,0.1)] placeholder:text-slate-400"
            style={{ border: '1px solid transparent' }}
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
            {query ? (
              <button onClick={() => { setQuery(''); setSearchOpen(false); }}>
                <X size={14} className="text-slate-400 hover:text-slate-700 transition-colors duration-200" />
              </button>
            ) : (
              <kbd className="inline-flex items-center justify-center rounded-md bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 h-5"
                style={{ boxShadow: 'var(--onyx-shadow-sm)', border: '1px solid var(--border)' }}
              >
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div
            className="absolute top-12 left-0 right-0 bg-white rounded-2xl overflow-hidden z-50 animate-fade-up"
            style={{ boxShadow: 'var(--onyx-shadow-xl)', border: '1px solid var(--border)' }}
          >
            <p className="px-4 pt-3.5 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Results</p>
            {quickLinks
              .filter(l => query === '' || l.label.toLowerCase().includes(query.toLowerCase()))
              .map((link) => (
              <button
                key={link.label}
                onMouseDown={() => handleSearch(link.label)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50/80 text-left text-sm text-slate-700 transition-colors duration-150"
              >
                <span className="font-medium">{link.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${link.color}`}>{link.badge}</span>
              </button>
            ))}
            {query && (
              <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onMouseDown={() => handleSearch(`AI answer for "${query}"`)}
                  className="text-sm text-indigo-600 font-semibold hover:text-indigo-700 flex items-center gap-2 transition-colors"
                >
                  <Sparkles size={13} />
                  Ask Onyx AI about &ldquo;{query}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {/* Notification Bell */}
        <button
          onClick={handleNotification}
          className="relative p-2 hover:bg-slate-50 rounded-xl transition-all duration-200 group"
          title="Notifications"
        >
          <Bell size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Help */}
        <button onClick={handleHelp} className="hover:text-slate-700 transition-colors duration-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 text-[13px]">
          Help
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200/60 mx-1" />

        {/* User Avatar */}
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 transition-all duration-200 group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'var(--onyx-gradient)', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}
          >
            AK
          </div>
          <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
        </button>
      </div>
    </header>
  );
}
