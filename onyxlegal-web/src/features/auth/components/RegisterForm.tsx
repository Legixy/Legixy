'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { auth, ApiError } from '@/lib/api';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  companyName: z.string().min(2, { message: 'Company name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', companyName: '', email: '', password: '' },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      await auth.register(data);
      toast.success('Account created!', { description: 'Welcome to OnyxLegal.' });
      router.push('/dashboard');
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 409
          ? 'An account with this email already exists.'
          : error instanceof ApiError
            ? error.message
            : 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
          Create your account
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Start protecting your contracts with AI
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5 relative">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Full Name
          </label>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={16} />
            <input
              {...form.register('name')}
              placeholder="Jane Smith"
              className={`w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all ${form.formState.errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.name && (
            <p className="text-xs font-medium text-red-500 mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Company Name
          </label>
          <div className="relative group">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={16} />
            <input
              {...form.register('companyName')}
              placeholder="Acme Corp"
              className={`w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all ${form.formState.errors.companyName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.companyName && (
            <p className="text-xs font-medium text-red-500 mt-1">{form.formState.errors.companyName.message}</p>
          )}
        </div>

        <div className="space-y-1.5 relative">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={16} />
            <input
              {...form.register('email')}
              placeholder="name@company.com"
              className={`w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all ${form.formState.errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs font-medium text-red-500 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5 relative pt-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={16} />
            <input
              {...form.register('password')}
              type="password"
              placeholder="••••••••"
              className={`w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all ${form.formState.errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-xs font-medium text-red-500 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full h-11 mt-6 rounded-xl text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(79,70,229,0.30)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.40)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: 'var(--onyx-gradient)' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin pointer-events-none" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8">
        Already have an account?{' '}
        <a
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors hover:underline"
        >
          Log in
        </a>
      </p>
    </div>
  );
}
