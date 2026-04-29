import type { NextConfig } from "next";

// Strip any path from API_URL so connect-src allows all sub-paths on the host
const _API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = (() => { try { const u = new URL(_API_URL); return u.origin; } catch { return _API_URL; } })();

const nextConfig: NextConfig = {
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
