'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import TopBar from '@/components/themes/modern-government/TopBar';
import SiteHeader from '@/components/themes/modern-government/SiteHeader';
import SiteFooter from '@/components/themes/modern-government/SiteFooter';
import { buildTenantHref } from '@/components/themes/modern-government/shared';
import { getTimezoneByProvince, formatDateWithTimezone } from '@/lib/timezone';
import SafeImage from '@/components/SafeImage';
import {
  Camera,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Layers,
  Play,
  Video,
} from 'lucide-react';

function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

export interface GalleryPhoto {
  id: string;
  tenantId: string;
  title: string;
  imageUrl: string;
  category: string;
  caption: string | null;
  mediaType?: string;
  videoUrl?: string | null;
  mediaUrls?: any;
  takenAt: string | null;
  createdAt: string;
}

interface GalleryClientViewProps {
  tenant: ResolvedTenant;
  initialPhotos: GalleryPhoto[];
  categories: string[];
  menus?: any[];
}

export default function GalleryClientView({
  tenant,
  initialPhotos,
  categories,
  menus,
}: GalleryClientViewProps) {
  const currentYear = new Date().getFullYear().toString();
  const tz = getTimezoneByProvince(tenant.provinsi);

  // Kumpulan tahun unik dari foto galeri
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(currentYear);
    initialPhotos.forEach((p) => {
      const dateVal = p.takenAt || p.createdAt;
      if (dateVal) {
        const y = new Date(dateVal).getFullYear().toString();
        if (y && y !== 'NaN') yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [initialPhotos, currentYear]);

  // Default filter adalah tahun ini sesuai permintaan
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [activeMediaSubIndex, setActiveMediaSubIndex] = useState<number>(0);

  // Filter foto berdasarkan tahun (default tahun ini), kategori, dan teks pencarian
  const filteredPhotos = useMemo(() => {
    return initialPhotos.filter((p) => {
      // 1. Filter Tahun
      const photoYear = new Date(p.takenAt || p.createdAt).getFullYear().toString();
      const matchYear = selectedYear === 'ALL' || photoYear === selectedYear;

      // 2. Filter Kategori
      const matchCategory =
        selectedCategory === 'ALL' ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();

      // 3. Filter Pencarian
      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.caption && p.caption.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchYear && matchCategory && matchSearch;
    });
  }, [initialPhotos, selectedYear, selectedCategory, searchQuery]);

  // Keyboard navigation untuk lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activePhotoIndex === null) return;
      if (e.key === 'Escape') setActivePhotoIndex(null);
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) =>
          prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
        );
        setActiveMediaSubIndex(0);
      }
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
        );
        setActiveMediaSubIndex(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePhotoIndex, filteredPhotos.length]);

  const activePhoto =
    activePhotoIndex !== null ? filteredPhotos[activePhotoIndex] : null;
  const layoutMode = (tenant.themeConfig?.settings?.layout_mode as 'fixed' | 'fluid') || 'fixed';

  return (
    <div
      data-theme="modern-government"
      data-layout={layoutMode}
      className={`min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased flex flex-col justify-between selection:bg-emerald-600 selection:text-white ${
        layoutMode === 'fluid' ? 'layout-fluid' : 'layout-fixed'
      }`}
    >
      <div>
        {/* 1. Official Government Top Bar Konsisten dengan Beranda */}
        <TopBar tenant={tenant} />

        {/* 2. Main Navigation Header Konsisten dengan Beranda */}
        <SiteHeader tenant={tenant} menus={menus} />

        {/* 3. Hero Header Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white py-10 sm:py-14 px-4 sm:px-8 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="max-w-7xl mx-auto relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                <Link href={buildTenantHref('/', tenant.slug)} className="hover:underline">
                  Beranda
                </Link>
                <span>/</span>
                <span className="text-slate-300">Galeri Foto & Dokumentasi</span>
              </div>

              <BackButton
                fallbackUrl={buildTenantHref('/', tenant.slug)}
                label="Kembali ke Beranda"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
                iconClassName="w-3.5 h-3.5 text-emerald-400"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold mb-2.5">
                  <Camera className="w-3.5 h-3.5" />
                  Arsip Visual & Publikasi Resmi
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  Galeri Dokumentasi Desa {tenant.namaDesa}
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
                  Koleksi potret kegiatan pembangunan infrastruktur, pelayanan masyarakat, kebudayaan, serta potensi unggulan desa.
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-5 backdrop-blur-sm self-start md:self-auto">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Arsip Foto</span>
                  <span className="text-2xl font-black text-emerald-400">{initialPhotos.length}</span>
                </div>
                <div className="border-l border-slate-700 pl-5">
                  <span className="text-[11px] text-slate-400 block">Kategori</span>
                  <span className="text-2xl font-black text-white">{categories.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Controls & Filter Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Baris 1: Filter Periode Tahun (Default: Tahun Ini) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Filter Tahun:</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedYear(currentYear)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    selectedYear === currentYear
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span>Tahun Ini ({currentYear})</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-semibold">
                    Default
                  </span>
                </button>

                <button
                  onClick={() => setSelectedYear('ALL')}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedYear === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Semua Tahun
                </button>

                {availableYears
                  .filter((y) => y !== currentYear)
                  .map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setSelectedYear(yr)}
                      className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedYear === yr
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
              </div>
            </div>

            {/* Baris 2: Filter Kategori & Kolom Pencarian */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Kategori Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Semua ({initialPhotos.length})
                </button>
                {categories.map((cat) => {
                  const count = initialPhotos.filter(
                    (p) => p.category.toLowerCase() === cat.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                        selectedCategory.toLowerCase() === cat.toLowerCase()
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Kolom Pencarian */}
              <div className="relative min-w-[240px] w-full md:w-auto">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari dokumentasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Keterangan Jumlah Hasil */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>
              Menampilkan <strong>{filteredPhotos.length}</strong> foto
              {selectedYear !== 'ALL' && (
                <span className="text-emerald-700 font-semibold"> • Periode {selectedYear}</span>
              )}
              {selectedCategory !== 'ALL' && ` • Kategori "${selectedCategory}"`}
              {searchQuery && ` • Kata kunci "${searchQuery}"`}
            </span>
            <Link
              href={buildTenantHref('/#galeri', tenant.slug)}
              className="text-emerald-700 hover:underline font-semibold"
            >
              Lihat Ringkasan di Beranda
            </Link>
          </div>

          {/* 5. Photos Grid */}
          {filteredPhotos.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border border-dashed border-slate-300 shadow-sm space-y-3">
              <Camera className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">
                Tidak ada foto yang sesuai
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {selectedYear === currentYear
                  ? `Belum ada dokumentasi untuk tahun ${currentYear}. Anda dapat melihat arsip foto tahun-tahun sebelumnya.`
                  : 'Coba sesuaikan kata kunci pencarian, filter tahun, atau pilih kategori lain.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {selectedYear !== 'ALL' && (
                  <button
                    onClick={() => setSelectedYear('ALL')}
                    className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition cursor-pointer"
                  >
                    Tampilkan Semua Tahun ({initialPhotos.length} foto)
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedYear('ALL');
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPhotos.map((photo, index) => {
                const mediaList = Array.isArray(photo.mediaUrls)
                  ? photo.mediaUrls
                  : typeof photo.mediaUrls === 'string'
                  ? JSON.parse(photo.mediaUrls || '[]')
                  : [];
                const photoCount = mediaList.filter((m: any) => m.type === 'IMAGE' || !m.type).length;
                const hasVideo = photo.mediaType === 'VIDEO' || photo.mediaType === 'YOUTUBE' || !!photo.videoUrl;

                return (
                  <div
                    key={photo.id}
                    onClick={() => {
                      setActivePhotoIndex(index);
                      setActiveMediaSubIndex(0);
                    }}
                    className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <SafeImage
                        src={photo.imageUrl}
                        fallbackSrc={tenant.heroImageUrl || '/images/desa_irigasi_pertanian.jpg'}
                        alt={photo.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                          <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                          {photoCount > 1 ? `Buka Album (${photoCount} Foto)` : 'Perbesar Foto'}
                        </span>
                      </div>
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg">
                        {photo.category}
                      </span>

                      {/* Multi-asset & Video Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {photoCount > 1 && (
                          <span className="bg-emerald-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Layers className="w-3 h-3" /> {photoCount} Foto
                          </span>
                        )}
                        {hasVideo && (
                          <span className="bg-rose-950/85 backdrop-blur-md text-rose-300 border border-rose-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-rose-300" /> Video
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
                          {photo.title}
                        </h4>
                        {photo.caption && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {photo.caption}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          {formatDateWithTimezone(photo.takenAt || photo.createdAt, tenant.provinsi)}
                        </span>
                        <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {photo.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 6. Lightbox Modal */}
      {activePhoto && activePhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl relative text-white flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewport for Active Media (Image, Video, or YouTube) */}
            {(() => {
              const mediaList = Array.isArray(activePhoto.mediaUrls)
                ? activePhoto.mediaUrls
                : typeof activePhoto.mediaUrls === 'string'
                ? JSON.parse(activePhoto.mediaUrls || '[]')
                : [];

              const currentMedia =
                mediaList.length > 0
                  ? mediaList[activeMediaSubIndex] || mediaList[0]
                  : { url: activePhoto.imageUrl, type: activePhoto.mediaType };

              const hasMultiple = mediaList.length > 1;
              const ytid = getYouTubeId(currentMedia?.url || activePhoto.videoUrl);
              const isYt = currentMedia?.type === 'YOUTUBE' || !!ytid;
              const isVid = currentMedia?.type === 'VIDEO';

              return (
                <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[500px] overflow-hidden">
                  {isYt && ytid ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytid}?autoplay=1`}
                      title={activePhoto.title}
                      className="w-full h-full min-h-[360px] sm:min-h-[480px]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isVid ? (
                    <video
                      src={currentMedia.url}
                      controls
                      autoPlay
                      className="max-h-[60vh] w-auto max-w-full object-contain"
                    />
                  ) : (
                    <div className="relative w-full h-[60vh] max-w-4xl flex items-center justify-center">
                      <SafeImage
                        src={currentMedia.url}
                        fallbackSrc={tenant.heroImageUrl || '/images/desa_irigasi_pertanian.jpg'}
                        alt={activePhoto.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 900px"
                        className="object-contain"
                      />
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => setActivePhotoIndex(null)}
                    className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-full border border-slate-700 transition cursor-pointer z-10"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Multi-Photo Sub Navigation if Album */}
                  {hasMultiple && (
                    <>
                      <button
                        onClick={() =>
                          setActiveMediaSubIndex(
                            (prev) => (prev - 1 + mediaList.length) % mediaList.length
                          )
                        }
                        className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 sm:p-3 rounded-full border border-slate-700/80 transition cursor-pointer shadow-lg"
                        title="Foto Sebelumnya"
                      >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>

                      <button
                        onClick={() =>
                          setActiveMediaSubIndex((prev) => (prev + 1) % mediaList.length)
                        }
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 sm:p-3 rounded-full border border-slate-700/80 transition cursor-pointer shadow-lg"
                        title="Foto Selanjutnya"
                      >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>

                      {/* Sub-Media Counter */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-mono font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                        {activeMediaSubIndex + 1} / {mediaList.length}
                      </div>
                    </>
                  )}

                  {/* Category Badge & Main Album Navigation Counter */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                      {activePhoto.category}
                    </span>
                    {hasMultiple && (
                      <span className="bg-emerald-800/80 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Album {mediaList.length} Foto
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Thumbnail Strip for Multi-Asset Album */}
            {(() => {
              const mediaList = Array.isArray(activePhoto.mediaUrls)
                ? activePhoto.mediaUrls
                : typeof activePhoto.mediaUrls === 'string'
                ? JSON.parse(activePhoto.mediaUrls || '[]')
                : [];

              if (mediaList.length <= 1) return null;

              return (
                <div className="flex items-center gap-2 overflow-x-auto py-2.5 px-4 sm:px-6 bg-slate-950 border-t border-slate-800 scrollbar-none">
                  {mediaList.map((m: any, mIdx: number) => {
                    const isSelected = activeMediaSubIndex === mIdx;
                    return (
                      <button
                        key={mIdx}
                        onClick={() => setActiveMediaSubIndex(mIdx)}
                        className={`w-14 h-10 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-500/20'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="relative w-full h-full">
                          <SafeImage
                            src={m.thumbnailUrl || m.url}
                            alt="Thumbnail"
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Information Container */}
            <div className="p-5 sm:p-6 bg-slate-900 border-t border-slate-800 space-y-2">
              <h3 className="text-lg sm:text-2xl font-black text-white">{activePhoto.title}</h3>
              {activePhoto.caption && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{activePhoto.caption}</p>
              )}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
                <span>
                  Tanggal Dokumentasi:{' '}
                  <strong className="text-slate-200">
                    {formatDateWithTimezone(activePhoto.takenAt || activePhoto.createdAt, tenant.provinsi)} ({tz})
                  </strong>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  ID: {activePhoto.id}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer Konsisten dengan Beranda */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
