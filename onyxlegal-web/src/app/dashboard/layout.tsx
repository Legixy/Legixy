import { DashboardShell } from '@/shared/components/DashboardShell';
import { AuthProvider } from '@/lib/auth-provider';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardShell>
        {children}
      </DashboardShell>
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: { fontFamily: 'inherit', borderRadius: '0.75rem' },
          duration: 4000,
        }}
      />
    </AuthProvider>
  );
}
