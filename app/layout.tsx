import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'desDig (desa Digital) - Multi-Tenant Platform Website Desa',
  description: 'Platform SaaS pembuatan, kustomisasi, dan pengelolaan website desa modern berlisensi resmi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full antialiased scroll-smooth ${jakarta.variable}`} data-scroll-behavior="smooth">
      <body className={`min-h-full font-sans antialiased ${jakarta.className}`}>
        <Suspense fallback={<div className="min-h-screen w-full flex flex-col">{children}</div>}>
          <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
        </Suspense>
      </body>
    </html>
  );
}
