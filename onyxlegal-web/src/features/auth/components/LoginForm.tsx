'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import { auth, ApiError } from '@/lib/api';
import { SocialLoginButton } from './SocialLoginButton';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Forgot Password Modal ─────────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail]     = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent]       = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Failed to send reset email', { description: 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative animate-fade-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--secondary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <X size={16} style={{ color: 'var(--muted-foreground)' }} />
        </button>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle size={40} className="mx-auto mb-3" style={{ color: '#10B981' }} />
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Check your inbox</h3>
            <p className="text-[13px]" style={{ color: 'var(--muted-foreground)' }}>
              If {email} is registered, a reset link has been sent. Check your spam folder too.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full h-10 text-[14px] font-medium text-white rounded-lg"
              style={{ background: 'var(--primary)' }}
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--foreground)' }}>Reset your password</h3>
            <p className="text-[13px] mb-5" style={{ color: 'var(--muted-foreground)' }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-4 h-10 text-[14px]"
                  style={{
                    background: 'var(--card)',
                    border: '1.5px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full h-10 text-[14px] font-medium text-white rounded-lg flex items-center justify-center gap-2 transition-opacity"
                style={{ background: 'var(--primary)', opacity: loading || !email ? 0.7 : 1 }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Login Form ───────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading]         = React.useState(false);
  const [showForgotPw, setShowForgotPw]   = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      await auth.login(data.email, data.password);
      toast.success('Login successful', { description: 'Welcome back to Legixy' });
      const params = new URLSearchParams(window.location.search);
      router.push(params.get('next') || '/dashboard');
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 401
          ? 'Invalid email or password.'
          : error instanceof ApiError
            ? error.message
            : 'Something went wrong. Please try again.';
      toast.error(message, { description: 'Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">

      {showForgotPw && <ForgotPasswordModal onClose={() => setShowForgotPw(false)} />}

      {/* Heading */}
      <div className="mb-8">
        <h2
          className="font-display mb-1.5"
          style={{ fontSize: '26px', letterSpacing: '-0.02em', color: 'var(--foreground)' }}
        >
          Log in to your account
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
          Enter your details to access the dashboard
        </p>
      </div>

      {/* Social */}
      <SocialLoginButton
        provider="Google"
        disabled={false}
        onClick={() => {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
          window.location.href = `${apiBase}/auth/google`;
        }}
      />

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full" style={{ borderTop: '1px solid var(--border)' }} />
        </div>
        <div className="relative flex justify-center">
          <span
            className="px-4 text-[11px] font-medium tracking-[0.1em] uppercase"
            style={{ background: 'var(--background)', color: 'var(--muted-foreground)' }}
          >
            Or continue with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Email */}
        <div>
          <label
            className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.08em]"
            style={{ color: 'var(--foreground)' }}
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-150"
              size={15}
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              {...form.register('email')}
              type="email"
              placeholder="name@company.com"
              disabled={isLoading}
              className="w-full pl-10 pr-4 h-11 text-[15px] transition-all duration-150"
              style={{
                background: 'var(--card)',
                border: `1.5px solid ${form.formState.errors.email ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: 'var(--foreground)',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!form.formState.errors.email) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,53,211,0.10)';
                }
              }}
              onBlur={(e) => {
                if (!form.formState.errors.email) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-[12px] mt-1 animate-fade-up" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="block text-[12px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: 'var(--foreground)' }}
            >
              Password
            </label>
            <button
              type="button"
              className="text-[12px] font-medium transition-colors duration-150 py-3 px-1 -my-3"
              style={{ color: 'var(--primary)' }}
              onClick={() => setShowForgotPw(true)}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              size={15}
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              {...form.register('password')}
              type="password"
              placeholder="••••••••"
              disabled={isLoading}
              className="w-full pl-10 pr-4 h-11 text-[15px] transition-all duration-150"
              style={{
                background: 'var(--card)',
                border: `1.5px solid ${form.formState.errors.password ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: 'var(--foreground)',
                outline: 'none',
              }}
              onFocus={(e) => {
                if (!form.formState.errors.password) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,53,211,0.10)';
                }
              }}
              onBlur={(e) => {
                if (!form.formState.errors.password) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-[12px] mt-1 animate-fade-up" style={{ color: 'var(--danger)' }}>
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 mt-2 text-[15px] font-medium text-white flex items-center justify-center transition-all duration-150"
          style={{
            background: isLoading ? 'rgba(61,53,211,0.7)' : 'var(--primary)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-sm)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Log in to Legixy'
          )}
        </button>
      </form>

      <p className="text-center text-[14px] mt-8" style={{ color: 'var(--muted-foreground)' }}>
        Don&apos;t have an account?{' '}
        <a
          href="/register"
          className="font-semibold transition-colors duration-150 py-3 px-1 -my-3 inline-block"
          style={{ color: 'var(--primary)' }}
        >
          Sign up free
        </a>
      </p>

    </div>
  );
}
