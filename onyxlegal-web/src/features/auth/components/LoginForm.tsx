'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X, CheckCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { auth, ApiError } from '@/lib/api';

/**
 * LoginForm — matches the Legixy brand design mockup exactly.
 *
 * Design decisions:
 * - "WELCOME BACK" eyebrow in spaced uppercase
 * - "Log in to your account" in large serif (Instrument Serif)
 * - Descriptive subtitle
 * - Email field with mail icon prefix
 * - Password field with lock icon prefix + eye toggle
 * - "Forgot password?" link in gold accent
 * - Dark rounded "Log in →" CTA button
 * - "or continue with" divider
 * - Google + Microsoft social buttons (side by side)
 * - "Don't have an account? Create your workspace →"
 */

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Forgot Password Modal ─────────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

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
    <div className="login-modal-backdrop">
      <div className="login-modal">
        <button onClick={onClose} className="login-modal__close" aria-label="Close">
          <X size={16} />
        </button>

        {sent ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>
            <CheckCircle
              size={36}
              style={{ color: 'var(--status-current-fg)', margin: '0 auto var(--space-3)' }}
            />
            <h3 className="login-modal__title">Check your inbox</h3>
            <p className="login-modal__desc">
              If {email} is registered, a reset link has been sent. Check your spam folder too.
            </p>
            <button onClick={onClose} className="login-btn login-btn--primary" style={{ marginTop: 20 }}>
              Back to login
            </button>
          </div>
        ) : (
          <>
            <h3 className="login-modal__title">Reset your password</h3>
            <p className="login-modal__desc" style={{ marginBottom: 20 }}>
              Enter your email and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="login-field">
                <div className="login-field__icon">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  aria-label="Email"
                  required
                  className="login-field__input"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="login-btn login-btn--primary"
                style={{ opacity: loading || !email ? 0.7 : 1 }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Google SVG Icon ───────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      {/*
        BRAND-EXEMPT. Google's four logo colours and Microsoft's four are
        trademarks, and both marks must render in their own colours,
        unaltered, in either theme. Tokenising them would let a palette
        change deface a third party's mark. Same exemption Slice 14
        granted Google in SocialLoginButton.tsx — a token is for a value
        WE choose, and these are not ours.
      */}
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}


// ── Main Login Form ───────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showForgotPw, setShowForgotPw] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  /**
   * Which sign-in methods actually work, from the server.
   *
   * Defaults to FALSE and only becomes true on a positive answer: if the
   * probe fails we render no provider button rather than one that might not
   * work, which is the exact bug being fixed.
   */
  const [googleEnabled, setGoogleEnabled] = React.useState(false);

  React.useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    fetch(`${apiBase}/auth/providers`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setGoogleEnabled(Boolean(d?.google)))
      .catch(() => setGoogleEnabled(false));
  }, []);

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
    <div className="login-form">

      {showForgotPw && <ForgotPasswordModal onClose={() => setShowForgotPw(false)} />}

      {/* Eyebrow */}
      <p className="login-form__eyebrow">WELCOME BACK</p>

      {/* Heading — Large serif */}
      <h2 className="login-form__heading">
        Log in to your<br />account
      </h2>

      {/* Subtitle */}
      <p className="login-form__subtitle">
        Sign in to continue managing your licences and compliance.
      </p>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="login-form__fields">

        {/* Email */}
        <div className="login-form__group">
          <label htmlFor="login-email" className="login-form__label">
            Email address
          </label>
          <div className={`login-field ${form.formState.errors.email ? 'login-field--error' : ''}`}>
            <div className="login-field__icon">
              <Mail size={16} />
            </div>
            <input
              id="login-email"
              {...form.register('email')}
              type="email"
              placeholder="name@company.com"
              disabled={isLoading}
              className="login-field__input"
              autoComplete="email"
            />
          </div>
          {form.formState.errors.email && (
            <p className="login-form__error">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="login-form__group">
          <div className="login-form__label-row">
            <label htmlFor="login-password" className="login-form__label">
              Password
            </label>
            <button
              type="button"
              className="login-form__forgot"
              onClick={() => setShowForgotPw(true)}
            >
              Forgot password?
            </button>
          </div>
          <div className={`login-field ${form.formState.errors.password ? 'login-field--error' : ''}`}>
            <div className="login-field__icon">
              <Lock size={16} />
            </div>
            <input
              id="login-password"
              {...form.register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              disabled={isLoading}
              className="login-field__input"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-field__toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="login-form__error">{form.formState.errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="login-btn login-btn--primary"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Log in
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/*
        PROVIDERS RENDER ONLY WHEN THEY WORK.

        Google was fully wired and broken from Slice 1 until Slice 15 found
        it: GoogleStrategy falls back to the literal 'GOOGLE_CLIENT_ID_NOT_SET'
        and sends people to an OAuth error page. Slice 16 made the button
        conditional on /auth/providers; the login redesign reinstated it
        unconditionally. It reports `google: false` on this deployment.

        Microsoft never existed at all. There is no strategy, no route and no
        entry in /auth/providers — the button had no onClick, so it did
        nothing when pressed. It is removed rather than made conditional,
        because there is nothing to condition on.

        The divider goes with them: "or continue with" makes no sense when
        email is the only way in.
      */}
      {googleEnabled ? (
        <>
          <div className="login-divider">
            <div className="login-divider__line" />
            <span className="login-divider__text">or continue with</span>
            <div className="login-divider__line" />
          </div>
          <div className="login-social">
            <button
              type="button"
              className="login-btn login-btn--social"
              onClick={() => {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
                window.location.href = `${apiBase}/auth/google`;
              }}
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </>
      ) : null}

      {/* Sign Up Link */}
      <p className="login-form__signup">
        Don&apos;t have an account?{' '}
        <a href="/register" className="login-form__signup-link">
          Create your workspace <ArrowRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </a>
      </p>
    </div>
  );
}
