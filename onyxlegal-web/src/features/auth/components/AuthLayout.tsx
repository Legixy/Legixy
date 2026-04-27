import * as React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col md:flex-row">
      {/* ── LEFT SIDE (Brand & Value) ── */}
      <div className="w-full md:w-[45%] lg:w-[40%] bg-indigo-600 p-8 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden text-white flex-shrink-0">
        
        {/* Subtle background illustration/gradient */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-overlay">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[100px] opacity-30 translate-x-[-20%] translate-y-[-20%]" />
        </div>

        {/* Logo area */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Shield size={22} className="text-indigo-600" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">
            OnyxLegal
          </span>
        </div>

        {/* Value Proposition */}
        <div className="relative z-10 mt-16 md:mt-0 max-w-md">
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight mb-5">
            Understand and fix your contracts in seconds
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl font-medium mb-10 opacity-90">
            AI-powered legal analysis for founders and startups
          </p>

          <div className="space-y-4 text-indigo-50 font-medium text-base">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-indigo-300 flex-shrink-0" />
              <span>Detect hidden risks and liabilities</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-indigo-300 flex-shrink-0" />
              <span>Fix contracts instantly with AI</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} className="text-indigo-300 flex-shrink-0" />
              <span>Stay compliant automatically</span>
            </div>
          </div>
        </div>

        {/* Footer/Trust */}
        <div className="relative z-10 mt-16 md:mt-0 text-indigo-200 text-sm font-medium">
          <p>© {new Date().getFullYear()} OnyxLegal. Trusted by 500+ startups.</p>
        </div>
      </div>

      {/* ── RIGHT SIDE (Form Container) ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-[#FAFAFB]">
        {/* Decorative subtle background blobs on the right side */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/3" />
        </div>
        
        {/* Glass Card for the Form */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] p-8 md:p-10 z-50 relative animate-fade-up transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] pointer-events-auto isolate">
          {children}
        </div>
      </div>
    </div>
  );
}
