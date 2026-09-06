import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/signup',
  '/api/auth',
  // Accepting an invitation happens before the person has an account.
  '/invite',
];

/**
 * The contract-analysis feature is not part of this product.
 *
 * next.config.ts redirects its PAGES — /dashboard/contracts, /analytics and
 * /templates — and those were verified returning 307. Redirects do not cover
 * API routes, and `/api/ai/recommendations` and `/api/ai/alerts` still answer,
 * returning `riskScore`, `risksDetected` and `confidenceScore`: AI judgments
 * this product states plainly that it never makes.
 *
 * Blocked here rather than deleted, per the same reasoning as the page
 * redirects: the feature still compiles against the quarantined fixtures, and
 * undoing this is removing one array.
 */
const BLOCKED_API_PREFIXES = ['/api/ai'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BLOCKED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
