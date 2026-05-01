import { NextRequest, NextResponse } from 'next/server';
import { proxyToNestJS } from '@/lib/proxy';

type NotifType =
  | 'RISK_ALERT'
  | 'CONTRACT_EXPIRING'
  | 'SIGNATURE_PENDING'
  | 'AI_FIX_READY'
  | 'ANALYSIS_COMPLETE'
  | 'SYSTEM';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
}

function toAlertType(notifType: string): 'critical' | 'warning' | 'info' {
  switch (notifType as NotifType) {
    case 'RISK_ALERT':
      return 'critical';
    case 'CONTRACT_EXPIRING':
    case 'SIGNATURE_PENDING':
      return 'warning';
    default:
      return 'info';
  }
}

export async function GET(request: NextRequest) {
  const proxied = await proxyToNestJS(request, '/notifications?unread=true');

  if (!proxied.ok) return proxied;

  try {
    const notifications: Notification[] = await proxied.json();

    const alerts = notifications.map((n) => ({
      id: n.id,
      type: toAlertType(n.type),
      title: n.title,
      message: n.body,
      actionUrl: n.actionUrl ?? undefined,
      actionLabel: n.actionUrl ? 'View' : undefined,
      createdAt: n.createdAt,
      read: n.read,
    }));

    return NextResponse.json({
      alerts,
      unreadCount: alerts.filter((a) => !a.read).length,
    });
  } catch {
    return NextResponse.json({ alerts: [], unreadCount: 0 });
  }
}
