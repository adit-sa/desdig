'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, ChevronRight, Eye, Megaphone, Clock, Sparkles, MessageSquare, BookOpen } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { ThemeData, SectionOrderFn, getPengaduanUrl } from './shared';
import LapakWidget from './LapakWidget';
import { formatAnnouncementDateTime } from '@/lib/timezone';

export default function NewsSection({
  tenant,
  data,
  articleCount,
  hasAnnouncements,
  hasUmkm,
  isSectionVisible,
  getSectionOrder,
}: {
  tenant: ResolvedTenant;
  data: ThemeData;
  articleCount: number;
  hasAnnouncements: boolean;
  hasUmkm: boolean;
  isSectionVisible: (sectionId: string) => boolean;
  getSectionOrder: SectionOrderFn;
}) {
  const displayedArticles = data.articles.slice(0, articleCount);
  const featuredArticle = displayedArticles.length > 0 ? displayedArticles[0] : null;
  const regularArticles = displayedArticles.slice(1);
  const defaultCover = tenant.heroImageUrl || tenant.logoUrl || '/images/balai_desa_gedung.jpg';
  const pengaduanUrl = getPengaduanUrl(tenant, data.themeConfig);
  return (
    <section id="berita" style={{ order: getSectionOrder('berita') }} className="space-y-8 scroll-reveal">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-black text-emerald-700 tracking-wider uppercase">Publikasi Resmi</span>
          <h3 className="text-3xl font-black text-slate-900 mt-1">Warta & Berita Kegiatan Desa</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Informasi terkini kegiatan dan pembangunan di Desa {tenant.namaDesa}
          </p>
        </div>
        <Link
          href={`/artikel?tenant=${tenant.slug}`}
          className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lihat Semua Artikel ({data.articles.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Berita */}
        <div className={`${isSectionVisible('pengumuman') && hasAnnouncements ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          {/* 1. Berita Utama (Headline Article) */}
          {featuredArticle && (
            <article className="scroll-reveal bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col sm:flex-row">
              <div className="sm:w-1/2 h-56 sm:h-auto relative overflow-hidden bg-slate-900">
                <img
                  loading="lazy"
                  decoding="async"
                  src={featuredArticle.coverImageUrl || defaultCover}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultCover;
                  }}
                />
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  Berita Utama
                </span>
              </div>
              <div className="sm:w-1/2 p-6 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1 font-medium text-[11px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {new Date(featuredArticle.publishedAt || featuredArticle.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      {featuredArticle.viewCount} pembaca
                    </span>
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                    {featuredArticle.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {featuredArticle.summary}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">
                    Oleh {featuredArticle.author?.name || 'Redaksi SID'}
                  </span>
                  <Link
                    href={`/berita/${featuredArticle.slug}?tenant=${tenant.slug}`}
                    className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition"
                  >
                    Baca Selengkapnya <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          )}

          {/* 2. Grid Berita Lainnya */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {regularArticles.map((art) => (
              <article
                key={art.id}
                className="scroll-reveal bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                <div className="h-44 relative overflow-hidden bg-slate-900">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={art.coverImageUrl || defaultCover}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultCover;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    {art.category?.name || 'Warta'}
                  </span>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-medium text-[11px] text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {new Date(art.publishedAt || art.createdAt).toLocaleDateString('id-ID')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      <Eye className="w-3.5 h-3.5" />
                      {art.viewCount} pembaca
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                      {art.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Oleh {art.author?.name || 'Redaksi'}</span>
                    <Link
                      href={`/berita/${art.slug}?tenant=${tenant.slug}`}
                      className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition"
                    >
                      Baca Berita <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Banner Tautan ke Halaman Khusus Artikel */}
          {data.articles.length > 4 && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-emerald-700/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900">Arsip Publikasi & Warta Desa Lengkap</h5>
                  <p className="text-[11px] text-slate-500">
                    Tersedia ratusan artikel, liputan kegiatan warga, dan arsip dokumen informasi desa.
                  </p>
                </div>
              </div>
              <Link
                href={`/artikel?tenant=${tenant.slug}`}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition hover:shadow-lg whitespace-nowrap"
              >
                <span>Buka Halaman Artikel ({data.articles.length})</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          )}

          {data.articles.length === 0 && (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
              Belum ada berita terbit untuk desa ini.
            </div>
          )}
        </div>

        {/* Kolom Lapak UMKM, Pengumuman & Info Penting (4 Kolom) */}
        <div id="pengumuman" className="scroll-reveal lg:col-span-4 flex flex-col gap-6">
          {/* 1. Modul Pelapak / Lapak Desa & UMKM Warga (Ukuran Ringkas seperti Papan Pengumuman dengan Slide) */}
          {isSectionVisible('lapak') && hasUmkm && (
            <LapakWidget tenant={tenant} order={getSectionOrder('lapak')} />
          )}

          {/* 2. Papan Pengumuman */}
          {isSectionVisible('pengumuman') && hasAnnouncements && (
            <div
              style={{ order: getSectionOrder('pengumuman') }}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  Papan Pengumuman
                </div>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {data.announcements.length} Edaran
                </span>
              </div>

              <div className="space-y-3.5">
                {data.announcements
                  .filter((ann: any) => !ann.expiresAt || new Date(ann.expiresAt).getTime() >= Date.now())
                  .map((ann: any) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 text-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        {formatAnnouncementDateTime(ann.createdAt, tenant?.provinsi)}
                      </span>
                      {ann.isPinned && (
                        <span className="bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded text-[9px] font-black">
                          Prioritas
                        </span>
                      )}
                    </div>
                    <h5 className="font-extrabold text-sm text-slate-900 leading-snug">{ann.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{ann.content}</p>
                  </div>
                ))}

                {data.announcements.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">Tidak ada pengumuman baru.</p>
                )}
              </div>
            </div>
          )}

          {/* Banner Jam Pelayanan & Kontak Cepat */}
          {isSectionVisible('jam_layanan') && (
            <div
              style={{ order: getSectionOrder('jam_layanan') }}
              className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-xl border border-slate-800 space-y-4 shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-extrabold text-sm">Jam Layanan Kantor Desa</h5>
                  <span className="text-[11px] text-slate-400">Senin - Jumat (08.00 - 15.30)</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Petugas pamong desa siap melayani seluruh administrasi kependudukan dan surat menyurat warga di Balai Desa.
              </p>
              <div className="pt-2 border-t border-slate-800">
                <Link
                  href={pengaduanUrl}
                  target={pengaduanUrl.startsWith('http') ? '_blank' : '_self'}
                  rel={pengaduanUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim Aspirasi / Aduan Online</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
