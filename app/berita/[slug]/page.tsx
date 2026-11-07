import React from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant/resolver';
import { prisma } from '@/lib/prisma';
import { getTenantNavMenus } from '@/lib/tenant/data';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import TopBar from '@/components/themes/modern-government/TopBar';
import SiteHeader from '@/components/themes/modern-government/SiteHeader';
import SiteFooter from '@/components/themes/modern-government/SiteFooter';
import ArticleShareBar from '@/components/themes/modern-government/ArticleShareBar';
import ArticleGalleryView, { AlbumPhoto } from '@/components/themes/modern-government/ArticleGalleryView';
import { buildTenantHref } from '@/components/themes/modern-government/shared';
import { formatArticleContent } from '@/lib/utils/formatContent';
import SafeImage from '@/components/SafeImage';
import {
  Calendar,
  Eye,
  User,
  Clock,
  ChevronRight,
  ShieldCheck,
  Newspaper,
  BookOpen,
  ArrowRight,
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
  if (!tenant) return { title: 'Berita Tidak Ditemukan' };

  const article = await prisma.article.findFirst({
    where: {
      tenantId: tenant.id,
      status: 'PUBLISHED',
      OR: [
        { slug },
        { id: slug },
        { id: { contains: slug } },
        { slug: { contains: slug } },
      ],
    },
  });

  if (!article) return { title: 'Berita Tidak Ditemukan' };

  const proto = headerList.get('x-forwarded-proto') || 'https';
  const siteUrl = `${proto}://${host}`;
  const fullCoverUrl = article.coverImageUrl
    ? (article.coverImageUrl.startsWith('http') ? article.coverImageUrl : `${siteUrl}${article.coverImageUrl}`)
    : `${siteUrl}/images/balai_desa_gedung.jpg`;

  return {
    title: `${article.title} - Pemerintah Desa ${tenant.namaDesa}`,
    description: article.summary || `Kabar warta resmi kegiatan Pemerintah Desa ${tenant.namaDesa}.`,
    openGraph: {
      title: article.title,
      description: article.summary || `Kabar warta resmi kegiatan Pemerintah Desa ${tenant.namaDesa}.`,
      url: `${siteUrl}/berita/${article.slug}?tenant=${tenant.slug}`,
      siteName: `Portal Resmi Desa ${tenant.namaDesa}`,
      type: 'article',
      publishedTime: article.publishedAt ? article.publishedAt.toISOString() : undefined,
      images: [
        {
          url: fullCoverUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary || `Kabar warta resmi kegiatan Pemerintah Desa ${tenant.namaDesa}.`,
      images: [fullCoverUrl],
    },
  };
}

export default async function ArticleDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);
  if (!tenant) notFound();

  // Ambil artikel terisolasi untuk tenant ini
  const article = await prisma.article.findFirst({
    where: {
      tenantId: tenant.id,
      status: 'PUBLISHED',
      OR: [
        { slug },
        { id: slug },
        { id: { contains: slug } },
        { slug: { contains: slug } },
      ],
    },
    include: {
      category: true,
      author: {
        select: { name: true },
      },
    },
  });

  if (!article) notFound();

  // Increment view count secara asynchronous di background tanpa memblokir respon SSR
  prisma.article.update({
    where: { id: article.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Ambil daftar menu navigasi dan berita terkait secara paralel
  const [menus, relatedArticles] = await Promise.all([
    getTenantNavMenus(tenant.id),
    prisma.article.findMany({
      where: {
        tenantId: tenant.id,
        status: 'PUBLISHED',
        id: { not: article.id },
      },
      include: {
        category: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
  ]);

  // Hitung estimasi waktu baca
  const wordCount = (article.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  // Parse galleryUrls jika ada
  let albumPhotos: AlbumPhoto[] = [];
  if ((article as any).galleryUrls) {
    const raw = (article as any).galleryUrls;
    if (Array.isArray(raw)) {
      albumPhotos = raw.map((item: any) => {
        if (typeof item === 'string') return { url: item };
        return { url: item.url || '', caption: item.caption || '' };
      }).filter((item) => Boolean(item.url));
    }
  }

  const publishedDate = new Date(article.publishedAt || article.createdAt);
  const formattedDate = publishedDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div>
        {/* 1. Official Government Top Bar */}
        <TopBar tenant={tenant} />

        {/* 2. Main Navigation Header */}
        <SiteHeader tenant={tenant} menus={menus} />

        {/* Breadcrumb Navigation */}
        <div className="bg-white border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
              <Link
                href={buildTenantHref('/', tenant.slug)}
                className="hover:text-emerald-700 font-medium transition"
              >
                Beranda
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <Link
                href={buildTenantHref('/artikel', tenant.slug)}
                className="hover:text-emerald-700 font-medium transition"
              >
                Kabar Desa
              </Link>
              {article.category && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 font-medium">{article.category.name}</span>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-xs">
                {article.title}
              </span>
            </nav>
          </div>
        </div>

        {/* Main Reading Canvas */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6">
            {/* Header: Kategori, Tanggal, & Estimasi Waktu Baca */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full border border-emerald-200/80">
                  {article.category?.name || 'Kabar Desa'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Rilis Resmi
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {readingTimeMinutes} Menit Baca
                </span>
              </div>

              {/* Judul Berita Utama */}
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                {article.title}
              </h1>

              {/* Author & Timestamp Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-3.5 text-xs text-slate-500">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 flex-shrink-0">
                    {(article.authorName || article.author?.name) ? (article.authorName || article.author?.name)!.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Penulis / Redaksi:</span>
                    <strong className="text-slate-800 font-bold">
                      {article.authorName || article.author?.name || `Pemerintah Desa ${tenant.namaDesa}`}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>{article.viewCount + 1} kali</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Foto Utama Artikel (Hero Image) */}
            {article.coverImageUrl && (
              <div className="relative aspect-video sm:aspect-21/9 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                <SafeImage
                  src={article.coverImageUrl}
                  alt={article.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 900px"
                  className="object-cover"
                />
              </div>
            )}

            {/* Ringkasan Singkat / Lead Deck (Gaya Jurnalistik Resmi, Bukan Quote Aneh) */}
            {article.summary && (
              <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border-l-4 border-emerald-600 text-slate-700 font-medium text-sm sm:text-base leading-relaxed">
                {article.summary}
              </div>
            )}

            {/* Isi Konten Artikel (Full Content) */}
            <div
              className="prose max-w-none text-slate-800 leading-relaxed text-sm sm:text-base space-y-4 pt-2 prose-headings:font-black prose-headings:text-slate-900 prose-h2:text-xl prose-h2:sm:text-2xl prose-h3:text-lg prose-p:leading-relaxed prose-img:rounded-2xl prose-img:shadow-md prose-blockquote:border-l-4 prose-blockquote:border-emerald-600 prose-blockquote:bg-slate-50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl"
              dangerouslySetInnerHTML={{ __html: formatArticleContent(article.content) }}
            />

            {/* Album Foto Dokumentasi (Tampil jika ada 2 atau lebih foto) */}
            {albumPhotos.length > 1 && (
              <ArticleGalleryView photos={albumPhotos} articleTitle={article.title} />
            )}

            {/* Social Share Bar */}
            <div className="pt-4 border-t border-slate-100">
              <ArticleShareBar title={article.title} desaName={tenant.namaDesa} />
            </div>

            {/* Footer Artikel */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
              <span>
                Dipublikasikan oleh Pemerintah Desa {tenant.namaDesa}, Kec. {tenant.kecamatan}, Kab. {tenant.kabupaten}
              </span>
              <BackButton
                fallbackUrl={buildTenantHref('/', tenant.slug)}
                label="Kembali ke Beranda"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
                iconClassName="w-4 h-4"
              />
            </div>
          </article>

          {/* Rekomendasi Berita Terkini Lainnya */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-emerald-600" />
                  <span>Kabar Desa Terkini Lainnya</span>
                </h3>
                <Link
                  href={buildTenantHref('/artikel', tenant.slug)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Lihat Semua Berita</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={buildTenantHref(`/berita/${rel.slug}`, tenant.slug)}
                    className="group bg-white rounded-2xl border border-slate-200 p-3.5 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {rel.coverImageUrl ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-3">
                          <SafeImage
                            src={rel.coverImageUrl}
                            alt={rel.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 300px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                          <Newspaper className="w-6 h-6 text-emerald-600" />
                        </div>
                      )}

                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                        {rel.category?.name || 'Kabar Desa'}
                      </span>
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                        {rel.title}
                      </h4>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>{new Date(rel.publishedAt || rel.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 4. Footer */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
