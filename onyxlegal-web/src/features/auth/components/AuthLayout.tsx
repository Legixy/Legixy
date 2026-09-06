'use client';

import { LegixyMark } from '@/shared/components/LegixyMark';

import * as React from 'react';
import Image from 'next/image';

/**
 * AuthLayout — IMMERSIVE split-screen login frame.
 *
 * KEY DESIGN PRINCIPLE
 * --------------------
 * The Riyadh skyline image spans the FULL viewport width as a background.
 * The left content sits on a dark overlay. The right form sits on a warm
 * semi-transparent frosted-glass panel — the skyline subtly shows through.
 * There is NO hard border between left and right. The image creates a
 * natural, immersive transition through the arch framing.
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
                  ? 'var(--on-brand)'
                  : 'var(--scrim-faint)',
            }}
          />
          <span
            style={{
              fontSize: 10,
              color:
                i === ACTIVE_MONTH
                  ? 'var(--on-brand)'
                  : 'var(--scrim-soft)',
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
          border: 'var(--hairline) solid var(--scrim-hairline)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--scrim-whisper)',
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 11, color: 'var(--scrim-medium)', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

/* Inline SVG icons for features */
function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--scrim-strong)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--scrim-strong)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--scrim-strong)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--scrim-strong)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

/* ── The Legixy mark, in gold ───────────────────────────────────────────────

   This used to be a DIFFERENT LOGO from the one the application uses: three
   gradient-filled polygons that meant nothing in particular, left over from
   before the pivot. The client would have seen one mark on this screen and a
   completely different one in the sidebar three seconds later.

   That is a worse discontinuity than the palette, and it was invisible while
   the two halves were reviewed separately. Same mark both sides now — the
   register with a due entry — drawn in the colour each ground can carry.
   Gold on ink measures 8.10:1; the same gold on the application's light
   surface measures 2.20:1, which is why the sidebar keeps its own colour and
   not its own mark. See LegixyMark for what the shape says.
*/

function LegixyGoldLogo({ size = 28 }: { size?: number }) {
  return (
    <span style={{ color: 'var(--brand-gold)', display: 'inline-flex' }}>
      <LegixyMark size={size} />
    </span>
  );
}

/* Gold Star Watermark — the decorative element in the bottom-right */
function GoldStarWatermark() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className="login-watermark"
    >
      <defs>
        <linearGradient id="watermark-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-gold)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--brand-gold-deep)" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      {/* 8-pointed star */}
      <polygon
        points="50,5 58,38 95,38 65,58 75,92 50,72 25,92 35,58 5,38 42,38"
        fill="url(#watermark-gold)"
      />
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

      {/* ── FULL-BLEED BACKGROUND IMAGE ──────────────────────────────── */}
      <div className="login-bg">
        <Image
          src="/brand/riyadh-skyline.jpeg"
          alt=""
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: '0% 50%' }}
        />
        {/* Dark overlay — strongest on left, fading to the right */}
        <div className="login-bg__overlay" />
      </div>

      {/* ── CONTENT LAYER (above the background) ─────────────────────── */}
      <div className="login-content">

        {/* ── LEFT SIDE — Hero content ──────────────────────────────── */}
        <div className="login-hero">
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
                <FeatureIcon icon={<ShieldCheckIcon />} label="Renewals tracked" />
              </div>

              {/*
                WHAT THIS CARD USED TO SAY, AND WHY IT COULD NOT STAY
                ----------------------------------------------------
                "24 Active licences · 3 Renewing soon · 0 Expired ·
                100% Compliance rate", above a six-month trend chart.

                Every number was invented, and the last was a compliance
                score. Slice 8 refused to build one in the product and wrote
                down why: a score treats "everything we track is current" as
                "you are compliant", which is exactly what the coverage-gaps
                feature exists to contradict. Honesty rule 6 has caught that
                shape twice since.

                It also broke the demo. Step 3 of DEMO.md is "here is what you
                are NOT tracking" — a client who has just read 100% will ask
                how the system knew, and the honest answer is that no system
                can.

                So the composition is kept and the content inverted: four
                facts about what the software IS, none of which is a claim
                about anybody's business. The last is deliberately zero — the
                boundary this product is proud of, stated on the first screen
                rather than explained away on the fifth.

                The trend chart is gone. A chart of months is a claim about a
                history, and there is no history to show.
              */}
              <div className="login-hero__stats-card">
                <div className="login-hero__stats-header">
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--on-brand)' }}>
                    What Legixy tracks
                  </span>
                </div>

                <div className="login-hero__stats-grid">
                  <div className="login-hero__stat">
                    <span className="login-hero__stat-value">10</span>
                    <span className="login-hero__stat-label">Saudi authorities</span>
                  </div>
                  <div className="login-hero__stat">
                    <span className="login-hero__stat-value">10</span>
                    <span className="login-hero__stat-label">Licence types</span>
                  </div>
                  <div className="login-hero__stat">
                    <span className="login-hero__stat-value">5</span>
                    <span className="login-hero__stat-label">Reminders before each expiry</span>
                  </div>
                  <div className="login-hero__stat">
                    <span className="login-hero__stat-value">0</span>
                    <span className="login-hero__stat-label">Government portals connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER OVERLAP — Quote floats over the skyline ─────────── */}
        <div className="login-center-quote">
          {/*
            WAS: "Compliance today, Greater opportunities tomorrow."

            The product's own FAQ answers "Will it tell me if I'm compliant?"
            with "No, and it deliberately never says so." A slogan promising
            compliance as the thing delivered contradicts that answer on the
            first screen the client sees.

            It is the same claim as "A MORE COMPLIANT TOMORROW", which Slice 21
            removed from the eyebrow. It survived because it lives in a
            different element, and because the honesty scan had no pattern for
            a compliance claim phrased as a PROMISE rather than a sentence or a
            score. Both gaps are closed now — see COMPLIANCE_CLAIM_PATTERNS.

            What replaces it is a statement of mechanism, not outcome: both
            halves are things the system demonstrably does.
          */}
          <p className="login-center-quote__text">
            Every expiry date on record,<br />
            and a reminder<br />
            before each one.
          </p>
        </div>

        {/* ── RIGHT SIDE — Frosted Glass Form Panel ──────────────────── */}
        <div className="login-form-panel">          {/*
            "Trusted by businesses across Saudi Arabia" was removed in
            Slice 21. There are no customers yet. This is the same class as
            "Trusted by 500+ startups across India", which Slice 8 removed
            from this same product.
          */}

          <div className="login-form-panel__inner">
            {/* Mobile-only logo */}
            <div className="login-form-panel__mobile-brand">
              <LegixyGoldLogo size={28} />
              <span
                style={{
                  fontFamily: 'var(--font-instrument-serif), Georgia, serif',
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: 'var(--tracking-tight)',
                  color: 'var(--brand-ink)',
                }}
              >
                Legixy
              </span>
            </div>
            {children}
          </div>

          {/* Decorative gold star watermark */}
          <GoldStarWatermark />
        </div>
      </div>

      {/* ── FULL-WIDTH FOOTER (spans both panels) ────────────────────── */}
      <div className="login-footer">
        <div className="login-footer__left">
          <span className="login-footer__breadcrumb">
            SAUDI ARABIA &nbsp;•&nbsp; LICENCES &nbsp;•&nbsp; PERMITS &nbsp;•&nbsp; REGISTRATIONS
          </span>
          <span className="login-footer__copyright">
            © {new Date().getFullYear()} Legixy. All rights reserved.
          </span>
        </div>
        {/*
          The locale selector and the Privacy / Terms / Support links were
          removed in Slice 21.

          · The flag and "English ⌄" implied a language switch. The product is
            English-only — Arabic is a paired typeface for the names on record,
            not a translation — so the control offered a capability that does
            not exist. The flag was also an emoji, which the design rules
            forbid.

          · /privacy, /terms and /support all returned 404. Three dead links
            on the first screen of a client demo, and the same ruling that
            removed the Help button applies: it works or it goes.

          They come back when there is a policy to link to and a language to
          switch into.
        */}
      </div>

    </div>
  );
}
