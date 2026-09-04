import type { NextConfig } from "next";

// Strip any path from API_URL so connect-src allows all sub-paths on the host
const _API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = (() => { try { const u = new URL(_API_URL); return u.origin; } catch { return _API_URL; } })();

const nextConfig: NextConfig = {
  /**
   * The contract-analysis feature is not part of this product.
   *
   * Core registers its queues but declares zero @Processor handlers, and the
   * worker listens on `contract-analysis-adhoc` — a queue name core never
   * produces. Jobs enqueued by that feature are consumed by nobody, so every
   * screen it offers describes work that provably never happens.
   *
   * Removing it from navigation was not enough: typing the URL still rendered
   * "let OnyxAI analyze it for risks and compliance", which is untrue twice
   * over. Redirecting here makes the surface unreachable without deleting a
   * line of the feature's code — that call belongs to the team, and undoing
   * this is removing one array.
   */
  async redirects() {
    return [
      { source: '/dashboard/contracts', destination: '/dashboard', permanent: false },
      { source: '/dashboard/contracts/:path*', destination: '/dashboard', permanent: false },
      { source: '/dashboard/analytics', destination: '/dashboard', permanent: false },
      { source: '/dashboard/analytics/:path*', destination: '/dashboard', permanent: false },
      { source: '/dashboard/templates', destination: '/dashboard', permanent: false },
      { source: '/dashboard/templates/:path*', destination: '/dashboard', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js requires unsafe-inline; unsafe-eval needed in dev mode for React
              "style-src 'self' 'unsafe-inline'",  // Required for Tailwind/CSS-in-JS until nonce strategy is added
              "img-src 'self' data: blob:",
              "font-src 'self'",
              `connect-src 'self' ${API_URL}`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
