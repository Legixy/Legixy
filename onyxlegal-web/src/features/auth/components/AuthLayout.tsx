import * as React from 'react';
import { Scale } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>

      {/* ── LEFT PANEL — Brand & value prop ── */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[40%] flex-col justify-between p-14 shrink-0 relative overflow-hidden"
        style={{ background: 'var(--primary)' }}
      >
        {/* Subtle geometric texture — not a blob, not a gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%),
                              radial-gradient(circle at 20% 80%, rgba(255,255,255,0.03) 0%, transparent 50%)`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Scale size={18} className="text-white" />
          </div>
          <span className="font-display text-[19px] text-white tracking-tight">Legixy</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <h1
            className="font-display text-white mb-6 leading-[1.1]"
            style={{ fontSize: '42px', letterSpacing: '-0.03em' }}
          >
            Contracts reviewed.<br />
            Risk eliminated.<br />
            <em>In seconds.</em>
          </h1>
          <p className="text-[17px] leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.70)' }}>
            AI-powered legal analysis built for Indian founders and SMEs — not for law firms.
          </p>

          {/* Trust signals — understated, not a feature list */}
          <div className="space-y-3">
            {[
              'Detects hidden liabilities before you sign',
              'Flags non-compliant clauses under Indian law',
              'Trusted by 500+ startups across India',
            ].map((point) => (
              <div key={point} className="flex items-start gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ background: 'rgba(255,255,255,0.45)' }}
                />
                <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.65)' }}>{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            © {new Date().getFullYear()} Legixy. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo — only shows when left panel is hidden */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: 'var(--primary)', borderRadius: '8px' }}
            >
              <Scale size={16} className="text-white" />
            </div>
            <span className="font-display text-[17px]" style={{ color: 'var(--foreground)' }}>Legixy</span>
          </div>
          {children}
        </div>
      </div>

    </div>
  );
}
