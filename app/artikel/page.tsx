import React from 'react';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant/resolver';
import { getTenantArticleListing } from '@/lib/tenant/data';
import ArticlesClientView from './ArticlesClientView';
import type { Metadata } from 'next';

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);
  if (!tenant) {
    return {
      title: 'Warta & Artikel Desa',
      description: 'Pusat publikasi dan arsip berita kegiatan desa.',
    };
  }

  return {
    title: `Warta & Berita Kegiatan - Pemerintah Desa ${tenant.namaDesa}`,
    description: `Kumpulan warta kegiatan, pengumuman, dan publikasi resmi Pemerintah Desa ${tenant.namaDesa}, Kec. ${tenant.kecamatan}, Kab. ${tenant.kabupaten}.`,
    openGraph: {
      title: `Warta & Berita Desa ${tenant.namaDesa}`,
      description: `Koleksi berita resmi dan publikasi kegiatan Pemerintah Desa ${tenant.namaDesa}.`,
    },
  };
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Tenant Desa Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-2">
            Domain atau slug desa &ldquo;{host}&rdquo; belum terdaftar pada platform.
          </p>
          <a
            href="/"
            className="inline-block mt-4 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-xs"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  // Ambil data artikel, kategori, dan menu navigasi secara paralel dan efisien
  const { articles, categories, menus } = await getTenantArticleListing(tenant.id);
  const initialCategory = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : undefined;

  return (
    <ArticlesClientView
      tenant={tenant}
      initialArticles={articles}
      categories={categories}
      initialCategory={initialCategory}
      menus={menus}
    />
  );
}
