import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { resolveTenant } from '@/lib/tenant/resolver';
import { getTenantNavMenus } from '@/lib/tenant/data';
import { headers } from 'next/headers';
import TopBar from '@/components/themes/modern-government/TopBar';
import SiteHeader from '@/components/themes/modern-government/SiteHeader';
import SiteFooter from '@/components/themes/modern-government/SiteFooter';
import { buildTenantHref } from '@/components/themes/modern-government/shared';
import { getTimezoneByProvince } from '@/lib/timezone';
import { formatArticleContent } from '@/lib/utils/formatContent';
import ArticleGalleryView, { AlbumPhoto } from '@/components/themes/modern-government/ArticleGalleryView';
import SafeImage from '@/components/SafeImage';
import {
  ChevronRight,
  Calendar,
  Eye,
  Share2,
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  FileText,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Newspaper,
  BookOpen,
} from 'lucide-react';
import type { Metadata } from 'next';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);
  if (!tenant) return { title: 'Halaman Tidak Ditemukan' };

  const page = await prisma.customPage.findFirst({
    where: {
      tenantId: tenant.id,
      slug,
      status: 'PUBLISHED',
    },
  });

  if (!page) {
    return { title: `Halaman Tidak Ditemukan - Desa ${tenant.namaDesa}` };
  }

  const proto = headerList.get('x-forwarded-proto') || 'https';
  const siteUrl = `${proto}://${host}`;
  const fullCoverUrl = page.coverImageUrl
    ? (page.coverImageUrl.startsWith('http') ? page.coverImageUrl : `${siteUrl}${page.coverImageUrl}`)
    : `${siteUrl}/images/balai_desa_gedung.jpg`;

  return {
    title: `${page.title} - Pemerintah Desa ${tenant.namaDesa}`,
    description: page.summary || `Halaman informasi resmi ${page.title} Desa ${tenant.namaDesa}.`,
    openGraph: {
      title: `${page.title} - Desa ${tenant.namaDesa}`,
      description: page.summary || `Halaman informasi resmi ${page.title} Desa ${tenant.namaDesa}.`,
      url: `${siteUrl}/halaman/${page.slug}?tenant=${tenant.slug}`,
      siteName: `Portal Resmi Desa ${tenant.namaDesa}`,
      type: 'article',
      images: [
        {
          url: fullCoverUrl,
          width: 1200,
          height: 630,
          alt: page.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${page.title} - Desa ${tenant.namaDesa}`,
      description: page.summary || `Halaman informasi resmi ${page.title} Desa ${tenant.namaDesa}.`,
      images: [fullCoverUrl],
    },
  };
}

export default async function PublicCustomPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);
  if (!tenant) notFound();

  // Ambil halaman custom
  const page = await prisma.customPage.findFirst({
    where: {
      tenantId: tenant.id,
      slug,
      status: 'PUBLISHED',
    },
  });

  if (!page) notFound();

  // Increment viewCount secara asynchronous tanpa memblokir SSR
  prisma.customPage.update({
    where: { id: page.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Ambil data pendukung sidebar & menu navigasi secara paralel
  const [otherPages, recentArticles, menus] = await Promise.all([
    prisma.customPage.findMany({
      where: {
        tenantId: tenant.id,
        status: 'PUBLISHED',
        NOT: { id: page.id },
      },
      take: 5,
      orderBy: { viewCount: 'desc' },
    }),
    prisma.article.findMany({
      where: {
        tenantId: tenant.id,
        status: 'PUBLISHED',
      },
      take: 4,
      orderBy: { publishedAt: 'desc' },
    }),
    getTenantNavMenus(tenant.id),
  ]);

  // Parse galleryUrls jika ada
  let albumPhotos: AlbumPhoto[] = [];
  if ((page as any).galleryUrls) {
    const raw = (page as any).galleryUrls;
    if (Array.isArray(raw)) {
      albumPhotos = raw
        .map((item: any) => {
          if (typeof item === 'string') return { url: item };
          return { url: item.url || '', caption: item.caption || '' };
        })
        .filter((item) => Boolean(item.url));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div>
        {/* 1. Official Government Top Bar Konsisten dengan Beranda */}
        <TopBar tenant={tenant} />

        {/* 2. Main Navigation Header Konsisten dengan Beranda */}
        <SiteHeader tenant={tenant} menus={menus} />

        {/* Breadcrumb Bar */}
        <div className="bg-white border-b border-slate-200 py-3 px-4 sm:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
            <Link href={`/?tenant=${tenant.slug}`} className="hover:text-emerald-700 font-medium">
              Beranda
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-medium text-slate-400">Informasi Desa</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="font-bold text-slate-800 truncate max-w-xs sm:max-w-md">{page.title}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Article / Page Body (8 Cols) */}
            <article className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
              {/* Header Info */}
              <div className="space-y-3 border-b border-slate-100 pb-6">
                <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                  Halaman Resmi
                </span>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  {page.title}
                </h1>

                {page.summary && (
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
                    {page.summary}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 border-t border-slate-50">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    {new Date(page.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    {page.viewCount} kali dibaca
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi Pemdes
                  </span>
                </div>
              </div>

              {/* Cover Image Banner */}
              {page.coverImageUrl && (
                <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                  <SafeImage
                    src={page.coverImageUrl}
                    alt={page.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 900px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Content Body */}
              <div
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed prose-headings:font-black prose-headings:text-slate-900 prose-h3:text-xl prose-h4:text-lg prose-p:text-sm sm:prose-p:text-base prose-li:text-sm sm:prose-li:text-base prose-img:rounded-xl prose-a:text-emerald-700 prose-a:font-bold hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: formatArticleContent(page.content) }}
              />

              {/* Album Foto Dokumentasi (Jika Ada Foto Album) */}
              {albumPhotos.length > 0 && (
                <div className="pt-6 border-t border-slate-100">
                  <ArticleGalleryView photos={albumPhotos} articleTitle={page.title} />
                </div>
              )}

              {/* Share & Feedback Box */}
              <div className="pt-8 mt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  Dokumen publik resmi diterbitkan oleh Pemerintah Desa {tenant.namaDesa}.
                </span>
                <Link
                  href={`/?tenant=${tenant.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Jelajahi Portal Desa</span>
                </Link>
              </div>
            </article>

            {/* Sidebar (4 Cols) */}
            <aside className="lg:col-span-4 space-y-6">
              {/* Other Pages Widget */}
              {otherPages.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-3">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Halaman Terkait Lainnya</span>
                  </div>

                  <div className="space-y-2.5">
                    {otherPages.map((op) => (
                      <Link
                        key={op.id}
                        href={`/halaman/${op.slug}?tenant=${tenant.slug}`}
                        className="block p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition group"
                      >
                        <h4 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition leading-snug">
                          {op.title}
                        </h4>
                        {op.summary && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{op.summary}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Warta Desa Terbaru Widget */}
              {recentArticles.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                      <Newspaper className="w-4 h-4 text-emerald-600" />
                      <span>Warta Desa Terbaru</span>
                    </div>
                    <Link
                      href={`/artikel?tenant=${tenant.slug}`}
                      className="text-[11px] font-bold text-emerald-700 hover:underline"
                    >
                      Semua
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {recentArticles.map((art) => (
                      <Link
                        key={art.id}
                        href={`/berita/${art.slug}?tenant=${tenant.slug}`}
                        className="flex items-start gap-3 group"
                      >
                        {art.coverImageUrl ? (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                            <SafeImage
                              src={art.coverImageUrl}
                              alt={art.title}
                              fill
                              sizes="56px"
                              className="object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-400">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                            {art.title}
                          </h5>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            {new Date(art.publishedAt || art.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Balai Desa Info Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm">Pemerintah Desa {tenant.namaDesa}</h5>
                    <span className="text-[11px] text-slate-400">{tenant.kabupaten}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tenant.alamatKantor || `Kantor Desa ${tenant.namaDesa}, Kec. ${tenant.kecamatan}, Kab. ${tenant.kabupaten}`}
                </p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Senin - Jumat: 08.00 - 15.30 {getTimezoneByProvince(tenant.provinsi)}</span>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* 4. Footer Konsisten dengan Beranda */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
