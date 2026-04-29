import { NextRequest } from 'next/server';
import { proxyToNestJS } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  return proxyToNestJS(request, '/notifications?unread=true');
}
