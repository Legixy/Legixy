import { NextRequest } from 'next/server';
import { proxyToNestJS } from '@/lib/proxy';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToNestJS(request, `/contracts/${id}/restore-version`, { method: 'POST' });
}
