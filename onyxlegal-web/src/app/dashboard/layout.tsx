import { Sidebar } from '@/shared/components/Sidebar';
import { Header } from '@/shared/components/Header';
import { AuthProvider } from '@/lib/auth-provider';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto" style={{ background: 'var(--background)' }}>
            <div className="w-full max-w-[1120px] mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </div>
        {/* Global toast notifications */}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'inherit', borderRadius: '0.75rem' },
            duration: 4000,
          }}
        />
      </div>
    </AuthProvider>
  );
}
