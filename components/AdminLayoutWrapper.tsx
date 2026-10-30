'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sembunyikan total layout admin (Navbar & Sidebar) jika di halaman login admin atau kiosk absen
  if (pathname === '/admin/login' || pathname?.startsWith('/admin/login') || pathname === '/absen') {
    return <div className="min-h-screen w-full flex flex-col">{children}</div>;
  }

  // Route publik (portal, artikel, galeri publik, dsb) tidak menampilkan sidebar admin internal
  const isAdminRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/saas') ||
    pathname?.startsWith('/kependudukan') ||
    pathname?.startsWith('/surat') ||
    pathname?.startsWith('/bansos') ||
    pathname?.startsWith('/statistik') ||
    pathname?.startsWith('/keuangan');

  if (!isAdminRoute) {
    return <div className="min-h-screen w-full flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/50 dark:bg-slate-950">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense fallback={<div className="min-h-screen w-full flex flex-col">{children}</div>}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </React.Suspense>
  );
}
