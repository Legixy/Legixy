'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { auth, ApiError } from '@/lib/api';

export function ResetPasswordForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const token        = params.get('token') ?? '';

  const [password,  setPassword]  = React.useState('');
  const [confirm,   setConfirm]   = React.useState('');
  const [loading,   setLoading]   = React.useState(false);
  const [done,      setDone]      = React.useState(false);
  const [error,     setError]     = React.useState('');

  if (!token) {
    return (
      <div className="text-center py-8">
        <AlertCircle size={40} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
        <h2 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Invalid link</h2>
        <p className="text-[14px] mb-6" style={{ color: 'var(--muted-foreground)' }}>
          This password reset link is missing or invalid. Request a new one from the login page.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-5 py-2.5 text-[14px] font-medium text-white rounded-lg"
          style={{ background: 'var(--primary)' }}
        >
          Back to login
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle size={40} className="mx-auto mb-4" style={{ color: '#10B981' }} />
        <h2 className="text-[20px] font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Password updated</h2>
        <p className="text-[14px] mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Your password has been reset. You can now log in.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-5 py-2.5 text-[14px] font-medium text-white rounded-lg"
          style={{ background: 'var(--primary)' }}
        >
          Go to login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Invalid or expired reset link.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2
          className="font-display mb-1.5"
          style={{ fontSize: '26px', letterSpacing: '-0.02em', color: 'var(--foreground)' }}
        >
          Set a new password
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
          Must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.08em]" style={{ color: 'var(--foreground)' }}>
            New password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full pl-10 pr-4 h-11 text-[15px]"
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
        </div>

        <div>
          <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.08em]" style={{ color: 'var(--foreground)' }}>
            Confirm password
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-4 h-11 text-[15px]"
              style={{
                background: 'var(--card)',
                border: `1.5px solid ${error && error.includes('match') ? 'var(--danger)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: 'var(--foreground)',
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = error && error.includes('match') ? 'var(--danger)' : 'var(--border)'; }}
            />
          </div>
        </div>

        {error && (
          <p className="text-[12px] animate-fade-up" style={{ color: 'var(--danger)' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 text-[15px] font-medium text-white flex items-center justify-center gap-2 rounded-lg transition-opacity"
          style={{ background: 'var(--primary)', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
