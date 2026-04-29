import { NextRequest, NextResponse } from 'next/server';

const NESTJS_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Contract {
  id: string;
  title: string;
  status: string;
  riskScore: number | null;
  contractValue: string | null;
  monthlyImpact: string | null;
  clauses?: { riskLevel: string; id: string }[];
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${NESTJS_BASE}/contracts?limit=20`, { headers });
    if (!res.ok) {
      return NextResponse.json({ actions: [], totalImpact: { financial: 0, riskReduction: 0 } }, { status: res.status });
    }

    const { data: contracts }: { data: Contract[] } = await res.json();
    if (!Array.isArray(contracts)) {
      return NextResponse.json({ actions: [], totalImpact: { financial: 0, riskReduction: 0 } });
    }

    const actions = [];
    let totalFinancial = 0;
    let totalRiskReduction = 0;

    for (const contract of contracts) {
      const risk = contract.riskScore ?? 0;
      const value = parseFloat(contract.contractValue ?? '0') || 0;
      const monthly = parseFloat(contract.monthlyImpact ?? '0') || 0;

      if (risk >= 70) {
        const savings = Math.round(value * 0.15) || Math.round(monthly * 3);
        totalFinancial += savings;
        totalRiskReduction += Math.round(risk * 0.4);
        actions.push({
          id: `fix-${contract.id}`,
          title: `Fix critical risks in "${contract.title}"`,
          description: `This contract has a risk score of ${risk}/100. AI has identified clauses that need immediate attention.`,
          impact: { type: 'financial', value: savings, unit: '₹' },
          urgency: 'high',
          contractId: contract.id,
          contractTitle: contract.title,
          actionType: 'fix',
          estimatedTime: '5 min',
        });
      } else if (risk >= 40) {
        const savings = Math.round(value * 0.08) || Math.round(monthly * 1.5);
        totalFinancial += savings;
        totalRiskReduction += Math.round(risk * 0.25);
        actions.push({
          id: `review-${contract.id}`,
          title: `Review medium-risk clauses in "${contract.title}"`,
          description: `Risk score ${risk}/100. Some clauses may need negotiation before signing.`,
          impact: { type: 'risk', value: Math.round(risk * 0.25), unit: '%' },
          urgency: 'medium',
          contractId: contract.id,
          contractTitle: contract.title,
          actionType: 'review',
          estimatedTime: '10 min',
        });
      } else if (contract.status === 'DRAFT') {
        actions.push({
          id: `update-${contract.id}`,
          title: `Finalize draft: "${contract.title}"`,
          description: 'This contract is still in draft. Complete it to activate legal protection.',
          impact: { type: 'compliance', value: 1, unit: ' contract' },
          urgency: 'low',
          contractId: contract.id,
          contractTitle: contract.title,
          actionType: 'update',
          estimatedTime: '15 min',
        });
      }
    }

    return NextResponse.json({
      actions,
      totalImpact: {
        financial: totalFinancial,
        riskReduction: Math.min(totalRiskReduction, 99),
      },
    });
  } catch {
    return NextResponse.json({ actions: [], totalImpact: { financial: 0, riskReduction: 0 } }, { status: 503 });
  }
}
