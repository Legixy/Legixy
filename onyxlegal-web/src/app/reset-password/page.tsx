import { Metadata } from 'next';
import { Toaster } from 'sonner';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | Legixy',
  description: 'Set a new password for your Legixy account.',
};

export default function ResetPasswordPage() {
  return (
    <>
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
      <Toaster position="top-center" />
    </>
  );
}
