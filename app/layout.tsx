import { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import AdminLayoutWrapper from '@/components/AdminLayoutWrapper';

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
    <html lang="id" className="h-full antialiased scroll-smooth" data-scroll-behavior="smooth">
      <body className="min-h-full font-sans antialiased">
        <Suspense fallback={<div className="min-h-screen w-full flex flex-col">{children}</div>}>
          <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
        </Suspense>
      </body>
    </html>
  );
}
