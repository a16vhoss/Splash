export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1"><Suspense>{children}</Suspense></main>
      <Footer />
    </div>
  );
}
