import { NextRequest, NextResponse } from 'next/server';

const NESTJS_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${NESTJS_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });

    const data = await res.json().catch(() => ({ message: 'Invalid response from auth server.' }));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const response = NextResponse.json({ user: data.user });

    // Set HttpOnly cookie — not accessible to JavaScript
    response.cookies.set('auth_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ message: 'Auth service unavailable.' }, { status: 503 });
  }
}
