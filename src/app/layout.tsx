import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingHomeButton from '@/components/FloatingHomeButton';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], preload: false, variable: '--font-noto-sans-jp' });

export const metadata: Metadata = {
  title: 'Service App',
  description: 'ユーザー向けサービスアプリケーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSansJP.variable}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <Header />
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
          <FloatingHomeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
