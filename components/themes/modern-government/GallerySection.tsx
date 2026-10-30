'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight, ChevronLeft, Camera, ZoomIn, Calendar, Clock, Layers, Play } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { Setter, SectionOrderFn } from './shared';
import { formatAnnouncementDateTime } from '@/lib/timezone';

export default function GallerySection({
  tenant,
  galleryItems,
  getSectionOrder,
  setActivePhoto,
  galleryLimit = 4,
}: {
  tenant: ResolvedTenant;
  galleryItems: any[];
  getSectionOrder: SectionOrderFn;
  setActivePhoto: Setter<any | null>;
  galleryLimit?: number;
}) {
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [activeSubIndex, setActiveSubIndex] = useState(0);
  const [isGalleryHovered, setIsGalleryHovered] = useState(false);

  // Ambil data item yang sedang aktif
  const currentItem = galleryItems[activeGalleryIndex];

  // Ekstrak media sub-list jika berupa album multi-foto
  const currentMediaList = useMemo(() => {
    if (!currentItem) return [];
    if (Array.isArray(currentItem.mediaUrls)) {
      return currentItem.mediaUrls;
    }
    if (typeof currentItem.mediaUrls === 'string') {
      try {
        return JSON.parse(currentItem.mediaUrls);
      } catch {
        return [];
      }
    }
    return [];
  }, [currentItem]);

  const hasSubMedia = currentMediaList.length > 1;

  // Auto-slide cerdas:
  // Jika suatu album memiliki banyak foto, tampilkan seluruh foto di album tersebut terlebih dahulu
  // baru kemudian berpindah ke album / dokumentasi selanjutnya!
  useEffect(() => {
    if (galleryItems.length === 0 || isGalleryHovered) return;

    const timer = setInterval(() => {
      if (hasSubMedia && activeSubIndex < currentMediaList.length - 1) {
        // Tampilkan foto selanjutnya di album yang sama
        setActiveSubIndex((prev) => prev + 1);
      } else {
        // Pindah ke album / item dokumentasi selanjutnya
        setActiveGalleryIndex((prev) => (prev + 1) % galleryItems.length);
        setActiveSubIndex(0);
      }
    }, 4500);

    return () => clearInterval(timer);
  }, [galleryItems.length, hasSubMedia, activeSubIndex, currentMediaList.length, isGalleryHovered]);

  // Handler Navigasi Manual Berikutnya
  const handleNext = () => {
    if (hasSubMedia && activeSubIndex < currentMediaList.length - 1) {
      setActiveSubIndex((prev) => prev + 1);
    } else {
      setActiveGalleryIndex((prev) => (prev + 1) % galleryItems.length);
      setActiveSubIndex(0);
    }
  };

  // Handler Navigasi Manual Sebelumnya
  const handlePrev = () => {
    if (hasSubMedia && activeSubIndex > 0) {
      setActiveSubIndex((prev) => prev - 1);
    } else {
      const prevIdx = (activeGalleryIndex - 1 + galleryItems.length) % galleryItems.length;
      setActiveGalleryIndex(prevIdx);
      const prevItem = galleryItems[prevIdx];
      let prevList: any[] = [];
      if (Array.isArray(prevItem?.mediaUrls)) prevList = prevItem.mediaUrls;
      else if (typeof prevItem?.mediaUrls === 'string') {
        try {
          prevList = JSON.parse(prevItem.mediaUrls);
        } catch {}
      }
      setActiveSubIndex(prevList.length > 1 ? prevList.length - 1 : 0);
    }
  };

  const defaultGalleryPhoto = tenant.heroImageUrl || tenant.logoUrl || '/images/balai_desa_gedung.jpg';

  // Batasi daftar samping sesuai limit yang diatur di admin (default 4)
  const displayItems = galleryItems.slice(0, galleryLimit);

  // URL gambar yang sedang tampil di spotlight (baik dari sub-foto album maupun cover utama)
  const activeSpotlightImageUrl =
    hasSubMedia && currentMediaList[activeSubIndex]?.url
      ? currentMediaList[activeSubIndex].url
      : currentItem?.imageUrl || defaultGalleryPhoto;

  return (
    <section id="galeri" style={{ order: getSectionOrder('galeri') }} className="space-y-6 scroll-reveal">
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-black text-emerald-700 tracking-widest uppercase flex items-center gap-1.5">
            <Camera className="w-4 h-4" />
            Dokumentasi & Arsip Visual
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Galeri Dokumentasi Desa</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Potret kegiatan pembangunan, potensi lokal, dan dinamika kemasyarakatan Desa {tenant.namaDesa}.
          </p>
        </div>
        <Link
          href={`/galeri?tenant=${tenant.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-2 rounded-xl transition self-start sm:self-auto"
        >
          <span>Lihat Semua ({galleryItems.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {!galleryItems || galleryItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-slate-300 shadow-sm">
          <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
          <h4 className="font-bold text-slate-700 text-sm">Belum Ada Dokumentasi Foto</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Aparatur desa dapat mengunggah dokumentasi foto kegiatan desa melalui panel admin.
          </p>
          <Link
            href="/admin/galeri"
            className="mt-3.5 inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            Tambah Foto di Admin
          </Link>
        </div>
      ) : (
        <>
          {/* Showcase Galeri Interaktif: Klik foto samping langsung tampil di gambar besar & auto-slide album penuh */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Foto Utama / Spotlight dengan Transisi Halus & Navigasi Slide Multi-Foto */}
            {galleryItems.length > 0 && currentItem && (
              <div
                onMouseEnter={() => setIsGalleryHovered(true)}
                onMouseLeave={() => setIsGalleryHovered(false)}
                className="scroll-reveal group lg:col-span-7 relative min-h-[360px] sm:min-h-[420px] lg:min-h-[470px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-5 sm:p-7 bg-slate-950"
              >
                {/* Background Photo with Smooth Fade */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    loading="lazy"
                    decoding="async"
                    key={activeSpotlightImageUrl}
                    src={activeSpotlightImageUrl}
                    alt={currentItem.title}
                    className="w-full h-full object-cover brightness-[0.88] group-hover:brightness-95 transition-all duration-700 animate-in fade-in"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultGalleryPhoto;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent" />
                </div>

                {/* Slide Navigation Controls & Album Counter */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg text-white">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Dots / Sub-photo Indicators */}
                  {hasSubMedia ? (
                    <div className="flex items-center gap-1 px-1">
                      {currentMediaList.map((_: any, sIdx: number) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubIndex(sIdx);
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            sIdx === activeSubIndex
                              ? 'w-4 bg-emerald-400'
                              : 'w-1.5 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1">
                      {galleryItems.slice(0, 5).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveGalleryIndex(idx);
                            setActiveSubIndex(0);
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === activeGalleryIndex
                              ? 'w-4 bg-emerald-400'
                              : 'w-1.5 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Indicator Counter Text */}
                  <span className="text-[10px] font-mono font-bold text-white/90 pl-1">
                    {hasSubMedia
                      ? `${activeSubIndex + 1}/${currentMediaList.length}`
                      : `${activeGalleryIndex + 1}/${galleryItems.length}`}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
                    title="Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Info Overlay for the active photo */}
                <div className="relative z-10 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                      Foto Sorotan
                    </span>
                    <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {currentItem.category || 'Dokumentasi'}
                    </span>
                    {hasSubMedia && (
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Foto {activeSubIndex + 1} dari {currentMediaList.length} (Album)
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg sm:text-xl font-black text-white group-hover:text-emerald-300 transition-colors line-clamp-2 drop-shadow-sm">
                    {currentItem.title}
                  </h4>

                  {(currentItem.caption || currentItem.description) && (
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed max-w-xl opacity-90">
                      {currentItem.caption || currentItem.description}
                    </p>
                  )}

                  {/* Tanggal Posting Lengkap & Tombol Perbesar */}
                  <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Diposting: {formatAnnouncementDateTime(currentItem.createdAt, tenant.provinsi)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePhoto(currentItem)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/25 hover:bg-emerald-600 hover:border-emerald-500 transition cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      Perbesar Layar Penuh
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Daftar Foto di Sampingnya (Klik untuk Tampil di Gambar Besar) */}
            <div className="scroll-reveal lg:col-span-5 flex flex-col gap-3">
              {displayItems.map((photo, idx) => {
                const isSelected = idx === activeGalleryIndex;
                const mediaList = Array.isArray(photo.mediaUrls)
                  ? photo.mediaUrls
                  : typeof photo.mediaUrls === 'string'
                  ? JSON.parse(photo.mediaUrls || '[]')
                  : [];
                const pCount = mediaList.filter((m: any) => m.type === 'IMAGE' || !m.type).length;
                const hasVid = photo.mediaType === 'VIDEO' || photo.mediaType === 'YOUTUBE' || !!photo.videoUrl;

                return (
                  <div
                    key={photo.id || idx}
                    onClick={() => {
                      setActiveGalleryIndex(idx);
                      setActiveSubIndex(0);
                    }}
                    className={`group flex items-center gap-3.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md dark:bg-emerald-950/40'
                        : 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800'
                    }`}
                  >
                    <div className="relative w-24 sm:w-28 aspect-[4/3] rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-200">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={photo.imageUrl || defaultGalleryPhoto}
                        alt={photo.title}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          isSelected ? 'scale-105' : 'group-hover:scale-110'
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultGalleryPhoto;
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-600/20 border-2 border-emerald-500 rounded-xl pointer-events-none" />
                      )}

                      {/* Small badge in thumbnail */}
                      {pCount > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm flex items-center gap-0.5">
                          <Layers className="w-2.5 h-2.5" /> {pCount}
                        </span>
                      )}
                      {hasVid && (
                        <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                          <Play className="w-2 h-2 fill-white" />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}
                        >
                          {photo.category || 'Dokumentasi'}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                            • Sedang Tampil
                          </span>
                        )}
                      </div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 transition truncate mt-1">
                        {photo.title}
                      </h5>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatAnnouncementDateTime(photo.createdAt, tenant.provinsi)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Quick Link ke Seluruh Galeri */}
              <div className="mt-auto p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 dark:bg-slate-900/60 dark:border-slate-800">
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-white block">
                    Menampilkan {displayItems.length} dari {galleryItems.length} Foto
                  </span>
                  <p className="text-[11px] text-slate-400">Jelajahi seluruh album dokumentasi desa.</p>
                </div>
                <Link
                  href={`/galeri?tenant=${tenant.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-100 hover:bg-emerald-200 px-3.5 py-2 rounded-xl transition flex-shrink-0 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  <span>Buka Galeri</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
