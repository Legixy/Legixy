/**
 * /src/app/api/ai/alerts/route.ts
 *
 * API endpoint for fetching AI alerts
 * In production: Connects to alert management backend
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock alerts - replace with real backend API call
    const mockData = {
      alerts: [
        {
          id: 'alert-1',
          type: 'critical',
          title: 'Payment Clause Violation Risk',
          message:
            'Payment terms in Vendor Agreement exceed MSME Act limits. Immediate action required.',
          actionUrl: '/dashboard/contracts/contract-1',
          actionLabel: 'Fix Now',
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false,
        },
        {
          id: 'alert-2',
          type: 'critical',
          title: 'Contract Expiring Soon',
          message: 'Acme Corp Service Agreement expires in 3 days. Renewal process recommended.',
          actionUrl: '/dashboard/contracts/contract-2',
          actionLabel: 'Renew Contract',
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          read: false,
        },
        {
          id: 'alert-3',
          type: 'warning',
          title: 'Indemnification Imbalance',
          message: 'Partnership Agreement has asymmetric indemnification. Consider negotiating balance.',
          actionUrl: '/dashboard/contracts/contract-3',
          actionLabel: 'Review',
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          read: true,
        },
      ],
      unreadCount: 2,
    };

    return NextResponse.json(mockData, {
      status: 200,
      headers: {
        'Cache-Control': 'max-age=15, s-maxage=15',
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
