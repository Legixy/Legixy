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

const inputClass = 'w-full pl-10 pr-4 h-11 text-[15px] transition-all duration-150';
const inputStyle = (hasError: boolean) => ({
  background: 'var(--card)',
  border: `1.5px solid ${hasError ? 'var(--danger)' : 'var(--border)'}`,
  borderRadius: '6px',
  color: 'var(--foreground)',
  outline: 'none',
});

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', companyName: '', email: '', password: '' },
  });

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>, hasError: boolean) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = 'var(--primary)';
      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(61,53,211,0.10)';
    }
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, hasError: boolean) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.boxShadow = 'none';
    }
  };

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      await auth.register(data);
      toast.success('Account created!', { description: 'Welcome to Legixy.' });
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

  const fields = [
    { name: 'name'        as const, label: 'Full Name',     icon: User,      placeholder: 'Jane Smith',        type: 'text'     },
    { name: 'companyName' as const, label: 'Company Name',  icon: Building2, placeholder: 'Acme Corp',         type: 'text'     },
    { name: 'email'       as const, label: 'Email',         icon: Mail,      placeholder: 'name@company.com',  type: 'email'    },
    { name: 'password'    as const, label: 'Password',      icon: Lock,      placeholder: '••••••••',          type: 'password' },
  ];

  return (
    <div className="w-full">

      <div className="mb-8">
        <h2
          className="font-display mb-1.5"
          style={{ fontSize: '26px', letterSpacing: '-0.02em', color: 'var(--foreground)' }}
        >
          Create your account
        </h2>
        <p className="text-[14px]" style={{ color: 'var(--muted-foreground)' }}>
          Start protecting your contracts with AI
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map(({ name, label, icon: Icon, placeholder, type }) => {
          const error = form.formState.errors[name];
          return (
            <div key={name}>
              <label
                className="block text-[12px] font-semibold mb-1.5 uppercase tracking-[0.08em]"
                style={{ color: 'var(--foreground)' }}
              >
                {label}
              </label>
              <div className="relative">
                <Icon
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  size={15}
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <input
                  {...form.register(name)}
                  type={type}
                  placeholder={placeholder}
                  disabled={isLoading}
                  className={inputClass}
                  style={inputStyle(!!error)}
                  onFocus={(e) => handleFocus(e, !!error)}
                  onBlur={(e) => handleBlur(e, !!error)}
                />
              </div>
              {error && (
                <p className="text-[12px] mt-1 animate-fade-up" style={{ color: 'var(--danger)' }}>
                  {error.message}
                </p>
              )}
            </div>
          );
        })}

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
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-[14px] mt-8" style={{ color: 'var(--muted-foreground)' }}>
        Already have an account?{' '}
        <a
          href="/login"
          className="font-semibold transition-colors duration-150"
          style={{ color: 'var(--primary)' }}
        >
          Log in
        </a>
      </p>

    </div>
  );
}
