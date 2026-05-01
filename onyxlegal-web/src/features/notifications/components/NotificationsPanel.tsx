'use client';

import { useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, AlertTriangle, Clock, Sparkles, Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications, useMarkRead, useMarkAllRead } from '@/shared/api/notifications';
import type { Notification } from '@/lib/api';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4';
  switch (type) {
    case 'RISK_ALERT':       return <AlertTriangle className={cls} style={{ color: '#EF4444' }} />;
    case 'CONTRACT_EXPIRING':return <Clock         className={cls} style={{ color: '#F59E0B' }} />;
    case 'AI_FIX_READY':     return <Sparkles      className={cls} style={{ color: '#6366F1' }} />;
    case 'ANALYSIS_COMPLETE':return <Sparkles      className={cls} style={{ color: '#10B981' }} />;
    default:                 return <Info          className={cls} style={{ color: '#64748B' }} />;
  }
}

function iconBg(type: string): string {
  switch (type) {
    case 'RISK_ALERT':        return 'rgba(239,68,68,0.08)';
    case 'CONTRACT_EXPIRING': return 'rgba(245,158,11,0.08)';
    case 'AI_FIX_READY':
    case 'ANALYSIS_COMPLETE': return 'rgba(99,102,241,0.08)';
    default:                  return 'rgba(100,116,139,0.08)';
  }
}

interface Props {
  onClose: () => void;
}

export function NotificationsPanel({ onClose }: Props) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifs = [], isLoading } = useNotifications();
  const { mutate: markRead }              = useMarkRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllRead();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleNotifClick(n: Notification) {
    if (!n.read) markRead(n.id);
    if (n.actionUrl) {
      router.push(n.actionUrl);
      onClose();
    }
  }

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden z-50 animate-fade-up"
      style={{
        background: 'var(--card)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xl)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: 'var(--foreground)' }} />
          <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ background: 'var(--danger)' }}
            >
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors"
              style={{ color: 'var(--primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {markingAll ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />}
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={14} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>Loading…</span>
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-12 text-center">
            <Bell size={28} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>No notifications yet</p>
          </div>
        ) : (
          notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => handleNotifClick(n)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-100"
              style={{
                background: n.read ? 'transparent' : 'rgba(61,53,211,0.03)',
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(61,53,211,0.03)'; }}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: iconBg(n.type) }}
              >
                <NotifIcon type={n.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-[12px] font-semibold leading-tight truncate"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {n.title}
                  </p>
                  {!n.read && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1"
                      style={{ background: 'var(--primary)' }}
                    />
                  )}
                </div>
                <p
                  className="text-[11px] mt-0.5 leading-relaxed line-clamp-2"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {n.body}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                  {timeAgo(n.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
