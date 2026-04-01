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
      <div className="flex min-h-screen bg-white">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="w-full max-w-[1100px] mx-auto px-8 py-6">
              {children}
            </div>
          </main>
        </div>
        {/* Global toast notifications */}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: { fontFamily: 'inherit' },
            duration: 4000,
          }}
        />
      </div>
    </AuthProvider>
  );
}
