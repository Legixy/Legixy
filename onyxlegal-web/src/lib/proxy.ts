import { NextRequest, NextResponse } from 'next/server';

const NESTJS_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Forward a Next.js API request to the NestJS backend.
 * Reads auth_token cookie and forwards it as Authorization: Bearer <token>.
 */
export async function proxyToNestJS(
  request: NextRequest,
  nestPath: string,
  options: { method?: string; body?: unknown } = {},
): Promise<NextResponse> {
  const token = request.cookies.get('auth_token')?.value;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const method = options.method ?? request.method;
  const bodyPayload =
    options.body !== undefined
      ? JSON.stringify(options.body)
      : ['POST', 'PUT', 'PATCH'].includes(method)
        ? await request.text()
        : undefined;

  try {
    const res = await fetch(`${NESTJS_BASE}${nestPath}`, {
      method,
      headers,
      body: bodyPayload,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
  }
}
