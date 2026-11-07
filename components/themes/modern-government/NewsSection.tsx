'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight, ChevronRight, ChevronLeft, Eye, Megaphone, Clock, Sparkles, MessageSquare, BookOpen, X } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { ThemeData, SectionOrderFn, getPengaduanUrl } from './shared';
import LapakWidget from './LapakWidget';
import { formatAnnouncementDateTime } from '@/lib/timezone';
import SafeImage from '@/components/SafeImage';

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
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [announcementPage, setAnnouncementPage] = useState(0);
  const [isAnnouncementHovered, setIsAnnouncementHovered] = useState(false);

  // Filter pengumuman aktif (belum kedaluwarsa)
  const activeAnnouncements = (data.announcements || []).filter(
    (ann: any) => !ann.expiresAt || new Date(ann.expiresAt).getTime() >= Date.now()
  );
  // Maksimal 2 pengumuman tampil per slide
  const totalAnnouncementPages = Math.ceil(activeAnnouncements.length / 2);

  // Auto-scroll pengumuman setiap 6 detik jika lebih dari 2 (1 halaman)
  useEffect(() => {
    if (totalAnnouncementPages <= 1 || isAnnouncementHovered) return;
    const timer = setInterval(() => {
      setAnnouncementPage((prev) => (prev < totalAnnouncementPages - 1 ? prev + 1 : 0));
    }, 6000);
    return () => clearInterval(timer);
  }, [totalAnnouncementPages, isAnnouncementHovered]);

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
          {/* 1. Berita Utama (Headline Article - Terproteksi dari foto portrait vertikal tinggi) */}
          {featuredArticle && (
            <article className="scroll-reveal bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col sm:flex-row sm:max-h-[380px]">
              <div className="relative aspect-[16/10] sm:aspect-auto sm:w-1/2 sm:self-stretch min-h-[220px] max-h-[280px] sm:max-h-none overflow-hidden bg-slate-900 flex-shrink-0">
                <SafeImage
                  src={featuredArticle.coverImageUrl}
                  fallbackSrc={defaultCover}
                  alt={featuredArticle.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                  Berita Utama
                </span>
              </div>
              <div className="sm:w-1/2 p-6 flex flex-col justify-between space-y-4 overflow-hidden">
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
                  <span className="text-slate-400 font-medium truncate max-w-[140px]">
                    Oleh {featuredArticle.authorName || featuredArticle.author?.name || 'Redaksi SID'}
                  </span>
                  <Link
                    href={`/berita/${featuredArticle.slug}?tenant=${tenant.slug}`}
                    className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition flex-shrink-0"
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
                  <SafeImage
                    src={art.coverImageUrl}
                    fallbackSrc={defaultCover}
                    alt={art.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <span className="text-slate-400 font-medium truncate max-w-[140px]">
                      Oleh {art.authorName || art.author?.name || 'Redaksi'}
                    </span>
                    <Link
                      href={`/berita/${art.slug}?tenant=${tenant.slug}`}
                      className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition flex-shrink-0"
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

          {/* 2. Papan Pengumuman (Maksimal 2 item per slide) */}
          {isSectionVisible('pengumuman') && hasAnnouncements && (
            <div
              style={{ order: getSectionOrder('pengumuman') }}
              onMouseEnter={() => setIsAnnouncementHovered(true)}
              onMouseLeave={() => setIsAnnouncementHovered(false)}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>Papan Pengumuman</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {activeAnnouncements.length} Edaran
                  </span>

                  {/* Tombol Slide Navigasi jika pengumuman lebih dari 2 */}
                  {totalAnnouncementPages > 1 && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setAnnouncementPage((prev) => (prev > 0 ? prev - 1 : totalAnnouncementPages - 1))
                        }
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Pengumuman Sebelumnya"
                        aria-label="Pengumuman Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-bold text-slate-500 font-mono px-1">
                        {announcementPage + 1}/{totalAnnouncementPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setAnnouncementPage((prev) => (prev < totalAnnouncementPages - 1 ? prev + 1 : 0))
                        }
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Pengumuman Selanjutnya"
                        aria-label="Pengumuman Selanjutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3.5">
                {activeAnnouncements
                  .slice(announcementPage * 2, announcementPage * 2 + 2)
                  .map((ann: any) => {
                    const isLong = (ann.content || '').length > 100 || (ann.content || '').includes('\n');
                    return (
                      <div
                        key={ann.id}
                        className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 text-slate-800 space-y-1.5 transition-all duration-200"
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
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 whitespace-pre-line">{ann.content}</p>

                        {isLong && (
                          <button
                            type="button"
                            onClick={() => setSelectedAnnouncement(ann)}
                            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 hover:text-amber-950 underline underline-offset-2 pt-1 transition cursor-pointer"
                          >
                            <span>Pengumuman Lengkap</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                {activeAnnouncements.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-6">Tidak ada pengumuman baru.</p>
                )}
              </div>

              {/* Indikator titik slide jika lebih dari 1 halaman */}
              {totalAnnouncementPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {Array.from({ length: totalAnnouncementPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnnouncementPage(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        announcementPage === idx ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`Ke slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
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

      {/* Modal Pengumuman Lengkap */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Megaphone className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    {formatAnnouncementDateTime(selectedAnnouncement.createdAt, tenant?.provinsi)}
                  </span>
                  {selectedAnnouncement.authorName && (
                    <span className="text-[11px] text-slate-500">
                      Diterbitkan oleh: <strong>{selectedAnnouncement.authorName}</strong>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-900 leading-snug">
              {selectedAnnouncement.title}
            </h3>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-amber-50/40 p-4 rounded-xl border border-amber-100/80">
              {selectedAnnouncement.content}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>Pemerintah Desa {tenant.namaDesa}</span>
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
