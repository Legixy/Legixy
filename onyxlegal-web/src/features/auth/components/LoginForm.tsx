'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { auth, ApiError } from '@/lib/api';
import { SocialLoginButton } from './SocialLoginButton';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

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
        disabled={true}
        onClick={() => {
          toast.info('Google Sign-In coming soon', { description: 'Use email and password to log in for now.' });
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
              onClick={() => toast.info('Password reset', { description: 'Email support@legixy.com to reset your password.' })}
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
