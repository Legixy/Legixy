'use client';

import { Search, Bell, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const quickLinks = [
  { label: 'Globex MSA — High Risk clause', badge: 'Contract', color: 'bg-red-50 text-red-700' },
  { label: 'Net 90 payment term risk', badge: 'AI Insight', color: 'bg-indigo-50 text-indigo-700' },
  { label: 'WeWork auto-renewal clause', badge: 'Contract', color: 'bg-amber-50 text-amber-700' },
  { label: 'Standard NDA template', badge: 'Template', color: 'bg-emerald-50 text-emerald-700' },
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
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-20 w-full">

      {/* AI Search Bar */}
      <div className="flex-1 max-w-2xl relative">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
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
            className="w-full h-9 pl-9 pr-12 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 placeholder:text-slate-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1">
            {query ? (
              <button onClick={() => { setQuery(''); setSearchOpen(false); }}>
                <X size={14} className="text-slate-400 hover:text-slate-700 transition-colors" />
              </button>
            ) : (
              <kbd className="inline-flex items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-500 h-5 shadow-sm">⌘K</kbd>
            )}
          </div>
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-11 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quick Results</p>
            {quickLinks
              .filter(l => query === '' || l.label.toLowerCase().includes(query.toLowerCase()))
              .map((link) => (
              <button
                key={link.label}
                onMouseDown={() => handleSearch(link.label)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 text-left text-sm text-slate-800 transition-colors"
              >
                <span>{link.label}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${link.color}`}>{link.badge}</span>
              </button>
            ))}
            {query && (
              <div className="px-4 py-3 border-t border-slate-100">
                <button
                  onMouseDown={() => handleSearch(`AI answer for "${query}"`)}
                  className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1.5"
                >
                  <Search size={13} />
                  Ask Onyx AI about &ldquo;{query}&rdquo;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
        {/* Notification Bell */}
        <button
          onClick={handleNotification}
          className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors group"
          title="Notifications"
        >
          <Bell size={19} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* Help */}
        <button onClick={handleHelp} className="hover:text-slate-900 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-50">
          Help &amp; Resources
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* User Avatar */}
        <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            AK
          </div>
          <ChevronDown size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>
    </header>
  );
}
