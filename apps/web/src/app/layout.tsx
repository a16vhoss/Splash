import { ToastProvider } from '@/components/toast';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Splash — Panel Admin',
  description: 'Gestiona tu autolavado con Splash',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>
          {children}
          <BottomTabBar />
        </ToastProvider>
      </body>
    </html>
  );
}
