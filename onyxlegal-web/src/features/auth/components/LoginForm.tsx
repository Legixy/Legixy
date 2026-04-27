'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Artificial error for demo if password is 'wrongpassword'
      if (data.password === 'wrongpassword') {
        throw new Error('Email or password is incorrect');
      }

      toast.success('Login successful', {
        description: 'Welcome back to OnyxLegal',
      });
      
      router.push('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Email or password is incorrect', {
        description: 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
          Log in to your account
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Enter your details below to access your dashboard
        </p>
      </div>

      <SocialLoginButton 
        provider="Google" 
        disabled={isLoading} 
        onClick={() => {
          toast.success('Redirecting to Google...', { description: 'Opening secure login window' });
          setTimeout(() => router.push('/dashboard'), 1500);
        }} 
      />

      <div className="relative my-6 pointer-events-none">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-slate-400 font-medium tracking-wide text-xs uppercase pointer-events-auto">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5 relative">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={16} />
            <input
              {...form.register('email')}
              placeholder="name@company.com"
              className={`w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all ${
                form.formState.errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1 animate-fade-up">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5 relative pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Password
            </label>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); toast('Password reset link sent'); }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 hover:underline transition-all"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={16} />
            <input
              {...form.register('password')}
              type="password"
              placeholder="••••••••"
              className={`w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all ${
                form.formState.errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''
              }`}
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1 animate-fade-up">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full h-11 mt-6 rounded-xl text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(79,70,229,0.30)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.40)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: 'var(--onyx-gradient)' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin pointer-events-none" />
          ) : (
            'Log in to OnyxLegal'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Don't have an account?{' '}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); router.push('/dashboard'); }}
          className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline"
        >
          Sign up
        </a>
      </p>
    </div>
  );
}
