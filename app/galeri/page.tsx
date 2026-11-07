import React from 'react';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant/resolver';
import { prisma } from '@/lib/prisma';
import { getTenantNavMenus } from '@/lib/tenant/data';
import GalleryClientView, { GalleryPhoto } from './GalleryClientView';
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
      title: 'Galeri Foto Desa',
      description: 'Dokumentasi arsip kegiatan dan potensi desa.',
    };
  }

  return {
    title: `Galeri Foto & Dokumentasi - Pemerintah Desa ${tenant.namaDesa}`,
    description: `Koleksi foto kegiatan resmi, pembangunan, kemasyarakatan, dan potensi unggulan Pemerintah Desa ${tenant.namaDesa}.`,
    openGraph: {
      title: `Galeri Foto Desa ${tenant.namaDesa}`,
      description: `Dokumentasi kegiatan resmi Desa ${tenant.namaDesa}, Kec. ${tenant.kecamatan}, Kab. ${tenant.kabupaten}`,
    },
  };
}

export default async function GalleryPage({ searchParams }: PageProps) {
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

  // Foto galeri + menu navigasi diambil paralel
  const [photos, menus] = await Promise.all([
    prisma.$queryRaw<GalleryPhoto[]>`
      SELECT id, "tenantId", title, "imageUrl", category, caption, "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt"
      FROM "GalleryItem"
      WHERE "tenantId" = ${tenant.id}
      ORDER BY "createdAt" DESC
      LIMIT 48
    `.catch(() => [] as GalleryPhoto[]),
    getTenantNavMenus(tenant.id),
  ]);

  // Kategori unik diturunkan dari foto (tanpa query tambahan)
  const categories = [...new Set(photos.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <GalleryClientView
      tenant={tenant}
      initialPhotos={photos}
      categories={categories}
      menus={menus}
    />
  );
}
