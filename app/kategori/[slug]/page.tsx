import React from 'react';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant/resolver';
import { getTenantArticleListing } from '@/lib/tenant/data';
import ArticlesClientView from '../../artikel/ArticlesClientView';
import type { Metadata } from 'next';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);
  const formattedTitle = decodedSlug
    .replace(/-/g, ' ')
    .toUpperCase();

  if (!tenant) {
    return {
      title: `Kategori: ${formattedTitle}`,
      description: `Arsip kategori ${formattedTitle}`,
    };
  }

  return {
    title: `Kategori: ${formattedTitle} - Pemerintah Desa ${tenant.namaDesa}`,
    description: `Koleksi berita dan dokumen kategori ${formattedTitle} Pemerintah Desa ${tenant.namaDesa}, Kec. ${tenant.kecamatan}, Kab. ${tenant.kabupaten}.`,
    openGraph: {
      title: `Kategori: ${formattedTitle} - Pemerintah Desa ${tenant.namaDesa}`,
      description: `Koleksi berita kategori ${formattedTitle} Desa ${tenant.namaDesa}.`,
    },
  };
}

export default async function CategoryArticlesPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  const searchKeyword = decodedSlug.replace(/-/g, ' ');

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

  // Cari nama kategori yang cocok dari data yang sudah diambil
  const matchedCategory = categories.find(
    (c) =>
      c.slug === decodedSlug ||
      c.slug.includes(decodedSlug) ||
      c.name.toLowerCase().includes(searchKeyword)
  );

  const initialCatName = matchedCategory ? matchedCategory.name : searchKeyword;

  return (
    <ArticlesClientView
      tenant={tenant}
      initialArticles={articles}
      categories={categories}
      initialCategory={initialCatName}
      menus={menus}
    />
  );
}
