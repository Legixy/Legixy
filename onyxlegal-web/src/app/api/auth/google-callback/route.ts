import { NextRequest, NextResponse } from 'next/server';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * GET /api/auth/google-callback?token=<jwt>
 * Called by the NestJS Google OAuth callback after a successful login.
 * Sets the HttpOnly auth cookie and redirects to /dashboard.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}
