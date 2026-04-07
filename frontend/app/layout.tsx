import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Twitter Design',
  description: 'A Twitter/X clone with Redis fanout feeds, two-tier caching, and cursor pagination.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white">
        <AuthProvider>
          <div className="flex min-h-screen max-w-7xl mx-auto">
            {/* Left sidebar */}
            <aside className="w-16 xl:w-72 flex-shrink-0 sticky top-0 h-screen border-r border-zinc-100 hidden sm:block">
              <Sidebar />
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 border-r border-zinc-100 max-w-2xl">
              {children}
            </main>

            {/* Right panel (placeholder for future widgets) */}
            <div className="hidden lg:block w-80 flex-shrink-0 px-6 py-4">
              <div className="bg-zinc-50 rounded-2xl p-4">
                <p className="font-bold text-xl mb-3">What&apos;s happening</p>
                <p className="text-zinc-500 text-sm">Architecture showcase — click ⚙ Architecture in the sidebar to see the system design live.</p>
              </div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
