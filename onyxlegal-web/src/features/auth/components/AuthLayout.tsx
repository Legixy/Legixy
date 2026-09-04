'use client';

import * as React from 'react';
import Image from 'next/image';

/**
 * AuthLayout — the split-screen login frame.
 *
 * DESIGN REFERENCE
 * ----------------
 * Based on the Legixy brand design mockup (ChatGPT-generated reference):
 * - Left ~55%: dark panel with Riyadh skyline, brand copy, compliance
 *   overview card, feature icons
 * - Right ~45%: warm cream (#FAF6F0) form panel
 * - Gold brand accent (#C4A265)
 * - Instrument Serif for display headings, sans for body
 */

/* ── Compliance Overview Mini-Chart ─────────────────────────────────────── */

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const BAR_DATA = [0.35, 0.42, 0.38, 0.45, 1, 0.52];
const ACTIVE_MONTH = 4; // Aug

function ComplianceChart() {
  return (
    <div className="flex items-end" style={{ gap: 10, height: 80 }}>
      {BAR_DATA.map((ratio, i) => (
        <div key={i} className="flex flex-col items-center" style={{ gap: 6 }}>
          <div
            style={{
              width: 8,
              height: `${ratio * 70}px`,
              borderRadius: 2,
              background:
                i === ACTIVE_MONTH
                  ? '#FFFFFF'
                  : 'rgba(255, 255, 255, 0.25)',
              transition: 'height 600ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
          <span
            style={{
              fontSize: 10,
              color:
                i === ACTIVE_MONTH
                  ? '#FFFFFF'
                  : 'rgba(255, 255, 255, 0.45)',
              fontWeight: i === ACTIVE_MONTH ? 600 : 400,
            }}
          >
            {MONTHS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Feature Icons ──────────────────────────────────────────────────────── */

function FeatureIcon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center" style={{ gap: 10 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

/* Inline SVG icons for features */
function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/* ── Legixy Gold Logo SVG ───────────────────────────────────────────────── */

function LegixyGoldLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      {/* Geometric gold "L" mark from brand */}
      <defs>
        <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A855" />
          <stop offset="50%" stopColor="#C49A4A" />
          <stop offset="100%" stopColor="#B08840" />
        </linearGradient>
      </defs>
      {/* Upper-left triangle */}
      <polygon points="20,10 50,10 50,45" fill="url(#gold-gradient)" />
      {/* Lower-right triangle */}
      <polygon points="50,35 80,70 50,70" fill="url(#gold-gradient)" />
      {/* Bottom horizontal */}
      <polygon points="20,70 50,70 50,90 20,90" fill="url(#gold-gradient)" />
    </svg>
  );
}

/* ── Main Layout ────────────────────────────────────────────────────────── */

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="login-layout">

      {/* ── LEFT PANEL — Dark Hero ─────────────────────────────────────── */}
      <div className="login-hero">
        {/* Background skyline image */}
        <div className="login-hero__bg">
          <Image
            src="/brand/riyadh-skyline.jpeg"
            alt=""
            fill
            priority
            style={{ objectFit: 'cover', objectPosition: 'center 40%' }}
          />
          {/* Dark overlay gradients */}
          <div className="login-hero__overlay" />
        </div>

        {/* Content */}
        <div className="login-hero__content">
          {/* Top: Logo + Tagline */}
          <div className="login-hero__top">
            <div className="login-hero__brand">
              <LegixyGoldLogo size={30} />
              <span className="login-hero__wordmark">Legixy</span>
              <div className="login-hero__divider" />
              <span className="login-hero__tagline">
                COMPLIANCE<br />BUILDS CONFIDENCE
              </span>
            </div>
          </div>

          {/* Middle: Headline + Description + Features */}
          <div className="login-hero__middle">
            <h1 className="login-hero__headline">
              Nothing important<br />
              expires because<br />
              <em>someone forgot.</em>
            </h1>

            <p className="login-hero__desc">
              Licence and compliance tracking for businesses operating in Saudi Arabia.
            </p>

            {/* Feature Icons Row */}
            <div className="login-hero__features">
              <FeatureIcon icon={<ClipboardIcon />} label="Every licence" />
              <FeatureIcon icon={<BellIcon />} label="Timely reminders" />
              <FeatureIcon icon={<BarChartIcon />} label="Complete visibility" />
              <FeatureIcon icon={<ShieldCheckIcon />} label="Stay compliant" />
            </div>

            {/* Compliance Overview Card */}
            <div className="login-hero__stats-card">
              <div className="login-hero__stats-header">
                <span style={{ fontWeight: 600, fontSize: 13, color: '#FFFFFF' }}>
                  Compliance overview
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  This month ⌄
                </span>
              </div>

              <div className="login-hero__stats-grid">
                <div className="login-hero__stat">
                  <span className="login-hero__stat-value">24</span>
                  <span className="login-hero__stat-label">
                    <span style={{ color: '#34D399' }}>●</span> Active licences
                  </span>
                </div>
                <div className="login-hero__stat">
                  <span className="login-hero__stat-value">3</span>
                  <span className="login-hero__stat-label">
                    <span style={{ color: '#FBBF24' }}>●</span> Renewing soon
                  </span>
                </div>
                <div className="login-hero__stat">
                  <span className="login-hero__stat-value">0</span>
                  <span className="login-hero__stat-label">
                    <span style={{ color: '#F87171' }}>●</span> Expired
                  </span>
                </div>
                <div className="login-hero__stat">
                  <span className="login-hero__stat-value">100%</span>
                  <span className="login-hero__stat-label">
                    <span style={{ color: '#34D399' }}>●</span> Compliance rate
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 4 }}>
                <ComplianceChart />
              </div>
            </div>

            {/* Motivational quote overlay — positioned near the skyline */}
            <p className="login-hero__quote">
              Compliance today.<br />
              Greater opportunities<br />
              tomorrow.
            </p>
          </div>

          {/* Bottom: Footer */}
          <div className="login-hero__footer">
            <p className="login-hero__breadcrumb">
              SAUDI ARABIA &nbsp;•&nbsp; BUSINESSES &nbsp;•&nbsp; A MORE COMPLIANT TOMORROW
            </p>
            <p className="login-hero__copyright">
              © {new Date().getFullYear()} Legixy. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ───────────────────────────────────── */}
      <div className="login-form-panel">
        {/* Trust badge */}
        <p className="login-form-panel__trust">
          Trusted by businesses across Saudi Arabia
        </p>

        <div className="login-form-panel__inner">
          {/* Mobile-only logo */}
          <div className="login-form-panel__mobile-brand">
            <LegixyGoldLogo size={28} />
            <span
              style={{
                fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: 'var(--foreground)',
              }}
            >
              Legixy
            </span>
          </div>
          {children}
        </div>

        {/* Bottom footer */}
        <div className="login-form-panel__footer">
          <div className="login-form-panel__locale">
            <span style={{ fontSize: 16 }}>🇸🇦</span>
            <span>Saudi Arabia</span>
            <span style={{ color: 'var(--muted-foreground)' }}>|</span>
            <span>English ⌄</span>
          </div>
          <div className="login-form-panel__links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/support">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
