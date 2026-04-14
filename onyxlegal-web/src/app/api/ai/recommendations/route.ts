/**
 * /src/app/api/ai/recommendations/route.ts
 *
 * API endpoint for fetching AI-recommended actions
 * In production: Connects to AI engine backend for analysis
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock recommended actions - replace with real backend API call
    const mockData = {
      actions: [
        {
          id: 'action-1',
          title: 'Fix Payment Clause (High Risk)',
          description: 'Payment terms exceed safe liability limits. Update to MSME compliance.',
          impact: {
            type: 'financial',
            value: 8000,
            unit: '₹',
          },
          urgency: 'high',
          contractId: 'contract-1',
          contractTitle: 'Vendor Agreement - TechCorp Inc',
          actionType: 'fix',
          estimatedTime: '2 min',
        },
        {
          id: 'action-2',
          title: 'Renew Vendor Contract',
          description: 'Critical contract expiring in 3 days. Initiate renewal process.',
          impact: {
            type: 'risk',
            value: 45,
            unit: '%',
          },
          urgency: 'high',
          contractId: 'contract-2',
          contractTitle: 'Acme Corp Service Agreement',
          actionType: 'renew',
          estimatedTime: '5 min',
        },
        {
          id: 'action-3',
          title: 'Update Indemnification Clause',
          description: 'Increase mutual protection. Add liability caps.',
          impact: {
            type: 'risk',
            value: 30,
            unit: '%',
          },
          urgency: 'medium',
          contractId: 'contract-3',
          contractTitle: 'Partnership Agreement - XYZ Ltd',
          actionType: 'update',
          estimatedTime: '3 min',
        },
        {
          id: 'action-4',
          title: 'Review Termination Rights',
          description: 'Asymmetric termination clauses detected. Negotiate balance.',
          impact: {
            type: 'compliance',
            value: 12,
            unit: 'points',
          },
          urgency: 'medium',
          contractId: 'contract-4',
          contractTitle: 'B2B Service Contract',
          actionType: 'review',
          estimatedTime: '4 min',
        },
      ],
      totalImpact: {
        financial: 8000,
        riskReduction: 75,
      },
    };

    return NextResponse.json(mockData, {
      status: 200,
      headers: {
        'Cache-Control': 'max-age=30, s-maxage=30',
      },
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
