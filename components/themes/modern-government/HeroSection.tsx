'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, ChevronRight, ChevronLeft, Video, Image as ImageIcon } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { handleScrollToSection, getTimezoneByProvince } from './shared';
import LiveClock from './LiveClock';

export interface HeroMediaItem {
  type: 'image' | 'video';
  url: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonText2?: string;
  buttonUrl2?: string;
}

function HeroVideoSlide({
  url,
  isActive,
  isOnlyOne,
  onEnded,
}: {
  url: string;
  isActive: boolean;
  isOnlyOne: boolean;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [isActive]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      loop={isOnlyOne}
      onEnded={onEnded}
      className={`w-full h-full object-cover transform ${
        isActive ? 'scale-105' : 'scale-100'
      } transition-transform duration-1000`}
    >
      <source src={url} />
    </video>
  );
}

export default function HeroSection({ tenant, officials, themeConfig }: { tenant: ResolvedTenant; officials: any[]; themeConfig: any }) {
  // Background Hero Media: Mendukung Campuran Video & Gambar secara bersamaan
  const heroBgConfig = themeConfig.hero_background || {};

  const mediaList: HeroMediaItem[] = useMemo(() => {
    // 1. Jika ada heroBgConfig.media terstruktur (array of { type, url, title, description, button... } atau string)
    if (Array.isArray(heroBgConfig.media) && heroBgConfig.media.length > 0) {
      const parsed: HeroMediaItem[] = [];
      heroBgConfig.media.forEach((item: any) => {
        if (!item) return;
        if (typeof item === 'string' && item.trim()) {
          parsed.push({
            type: item.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image',
            url: item.trim(),
          });
        } else if (typeof item === 'object' && item.url && item.url.trim()) {
          parsed.push({
            type: item.type === 'video' || item.url.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image',
            url: item.url.trim(),
            title: item.title?.trim() || undefined,
            subtitle: item.subtitle?.trim() || undefined,
            description: item.description?.trim() || undefined,
            buttonText: item.buttonText?.trim() || undefined,
            buttonUrl: item.buttonUrl?.trim() || undefined,
            buttonText2: item.buttonText2?.trim() || undefined,
            buttonUrl2: item.buttonUrl2?.trim() || undefined,
          });
        }
      });
      if (parsed.length > 0) return parsed;
    }

    // 2. Gabungkan video & foto dari konfigurasi (Mendukung Campuran Video + Foto)
    const combined: HeroMediaItem[] = [];

    const videos: string[] = [];
    if (Array.isArray(heroBgConfig.videos)) {
      heroBgConfig.videos.forEach((v: any) => {
        if (typeof v === 'string' && v.trim()) videos.push(v.trim());
      });
    }
    if (heroBgConfig.url && heroBgConfig.url.match(/\.(mp4|webm)$/i) && !videos.includes(heroBgConfig.url)) {
      videos.unshift(heroBgConfig.url);
    }

    const images: string[] = [];
    if (Array.isArray(heroBgConfig.images)) {
      heroBgConfig.images.forEach((img: any) => {
        if (typeof img === 'string' && img.trim()) images.push(img.trim());
      });
    }
    if (heroBgConfig.url && !heroBgConfig.url.match(/\.(mp4|webm)$/i) && !images.includes(heroBgConfig.url)) {
      images.unshift(heroBgConfig.url);
    }

    // Masukkan video
    videos.forEach((v) => combined.push({ type: 'video', url: v }));
    // Masukkan foto
    images.forEach((img) => combined.push({ type: 'image', url: img }));

    if (combined.length > 0) return combined;

    // 3. Fallback default jika belum ada konfigurasi: paduan video drone/animasi dan foto desa autentik
    const defaultList: HeroMediaItem[] = [];
    defaultList.push({ type: 'video', url: 'https://dpmd-mateng.adit.lt/logo.webm' });
    if (tenant.heroImageUrl) {
      defaultList.push({ type: 'image', url: tenant.heroImageUrl });
    }
    defaultList.push({ type: 'image', url: tenant.logoUrl || '/images/balai_desa_gedung.jpg' });
    defaultList.push({ type: 'image', url: '/images/desa_irigasi_pertanian.jpg' });

    return defaultList;
  }, [heroBgConfig.media, heroBgConfig.videos, heroBgConfig.images, heroBgConfig.url, tenant.heroImageUrl, tenant.logoUrl]);

  const slideInterval = typeof heroBgConfig.interval === 'number' ? heroBgConfig.interval : 6000;

  // State slide hanya hidup di section ini, jadi pergantian slide tidak me-render ulang seluruh halaman
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Auto-slide lembut sinematik untuk background hero (Mendukung Campuran Multi-Foto & Multi-Video)
  useEffect(() => {
    if (mediaList.length <= 1 || isHeroHovered) return;
    const currentMedia = mediaList[currentHeroSlide % mediaList.length];

    // Jika slide saat ini adalah video, beri waktu secukupnya atau biarkan onEnded yang memicu pergantian
    const duration = currentMedia.type === 'video' ? Math.max(slideInterval, 10000) : slideInterval;

    const timer = setInterval(() => {
      setCurrentHeroSlide((prev) => (prev + 1) % mediaList.length);
    }, duration);
    return () => clearInterval(timer);
  }, [mediaList, currentHeroSlide, isHeroHovered, slideInterval]);

  // Sambutan / Highlight Kepala Desa
  const kadesHighlight = themeConfig.kades_highlight || {};
  const showKadesHighlight = kadesHighlight.enabled !== false;

  // Deteksi foto & profil Kepala Desa autentik dari data aparatur
  const kades = useMemo(
    () =>
      officials.find(
        (o) => o.position?.toLowerCase().includes('kepala desa') || o.position?.toLowerCase().includes('kades')
      ) || officials[0],
    [officials]
  );

  const kadesName = kadesHighlight.name || kades?.name || tenant.kepalaDesa || 'Kepala Desa';
  const kadesPosition = kadesHighlight.position || kades?.position || 'Kepala Desa';
  const kadesQuote =
    kadesHighlight.quote ||
    `Selamat datang di Portal Resmi Pemerintah Desa ${tenant.namaDesa}. Seluruh layanan kependudukan dan transparansi APBDes kini dapat diakses terbuka oleh seluruh warga secara akuntabel.`;
  const kadesPhoto = kades?.photoUrl || kadesHighlight.photoUrl || '/images/kades_portrait.jpg';

  const currentMedia = mediaList[currentHeroSlide % mediaList.length];

  // Fallback Konten Hero Default (Dinamis Multi-Tenant)
  const defaultSubtitle = 'Selamat Datang di Website Resmi';
  const defaultDistrict = tenant.kecamatan ? `Kecamatan ${tenant.kecamatan}` : '';
  const defaultTitle = 'Pemerintah Desa';
  const defaultTitleVillage = tenant.namaDesa;
  const defaultDescription =
    tenant.visi ||
    'Mewujudkan tata kelola desa yang transparan, akuntabel, dan mengutamakan pelayanan masyarakat secara prima demi kemakmuran bersama.';
  const defaultButton1Text = 'Jelajahi Warta Desa';
  const defaultButton1Url = '#berita';
  const defaultButton2Text = 'Transparansi Anggaran';
  const defaultButton2Url = '#apbdes';

  // Konten Aktif untuk Slide yang Sedang Tampil
  const activeSubtitle = currentMedia?.subtitle || defaultSubtitle;
  const activeTitle = currentMedia?.title || null;
  const activeDescription = currentMedia?.description || defaultDescription;
  const activeButton1Text = currentMedia?.buttonText || defaultButton1Text;
  const activeButton1Url = currentMedia?.buttonUrl || defaultButton1Url;
  const activeButton2Text = currentMedia?.buttonText2 || (currentMedia?.buttonText ? null : defaultButton2Text);
  const activeButton2Url = currentMedia?.buttonUrl2 || (currentMedia?.buttonUrl ? null : defaultButton2Url);

  return (
    <section
      id="beranda"
      onMouseEnter={() => setIsHeroHovered(true)}
      onMouseLeave={() => setIsHeroHovered(false)}
      className="relative min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden"
    >
      {/* Ambient Glowing Energy Orbs (Inspired by GiGi Landing Page) */}
      <div className="absolute top-12 left-10 w-72 h-72 rounded-full bg-emerald-500/20 blur-[100px] pointer-events-none animate-float z-[2]" />
      <div className="absolute bottom-20 right-16 w-80 h-80 rounded-full bg-teal-400/15 blur-[120px] pointer-events-none animate-float-delayed z-[2]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-400/10 blur-[140px] pointer-events-none z-[1]" />

      {/* Background Media Slideshow (Mendukung Campuran Video & Gambar) */}
      <div
        data-parallax="hero-bg"
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ willChange: 'transform' }}
      >
        <div className="absolute inset-0">
          {mediaList.map((media, idx) => {
            const isActive = idx === (currentHeroSlide % mediaList.length);
            return (
              <div
                key={`${media.url}-${idx}`}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
                }`}
              >
                {media.type === 'video' ? (
                  <HeroVideoSlide
                    url={media.url}
                    isActive={isActive}
                    isOnlyOne={mediaList.length === 1}
                    onEnded={() => {
                      if (mediaList.length > 1) {
                        setCurrentHeroSlide((prev) => (prev + 1) % mediaList.length);
                      }
                    }}
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-1200 ease-in-out transform ${
                      isActive ? 'scale-105 animate-ken-burns' : 'scale-100'
                    }`}
                    style={{
                      backgroundImage: `url(${media.url})`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gradient Scrims for Perfect Text Legibility */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90 pointer-events-none z-[1]" />

      {/* Professional Slideshow Navigation & Indicators (tampil jika terdapat 2 atau lebih media foto/video) */}
      {mediaList.length > 1 && (
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-20 flex items-center gap-2 sm:gap-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/15 shadow-2xl scale-90 sm:scale-100 origin-bottom-right">
          <button
            type="button"
            onClick={() => setCurrentHeroSlide((prev) => (prev - 1 + mediaList.length) % mediaList.length)}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Media Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            {mediaList.map((media, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentHeroSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  idx === (currentHeroSlide % mediaList.length)
                    ? 'w-6 bg-gradient-to-r from-emerald-400 to-teal-300 shadow-sm shadow-emerald-400/50'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                title={`${media.type === 'video' ? 'Video' : 'Foto'} ${idx + 1}`}
              />
            ))}
          </div>

          <span className="text-[10px] font-mono font-bold text-white/90 pl-1 select-none flex items-center gap-1">
            {currentMedia?.type === 'video' ? (
              <Video className="w-3 h-3 text-emerald-400" />
            ) : (
              <ImageIcon className="w-3 h-3 text-emerald-400" />
            )}
            0{(currentHeroSlide % mediaList.length) + 1} / 0{mediaList.length}
          </span>

          <button
            type="button"
            onClick={() => setCurrentHeroSlide((prev) => (prev + 1) % mediaList.length)}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Media Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div
        data-parallax="hero-content"
        style={{ willChange: 'transform, opacity' }}
        className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center"
      >
        <div className={`${showKadesHighlight ? 'lg:col-span-8' : 'lg:col-span-12'} text-white`}>
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <LiveClock timezone={getTimezoneByProvince(tenant.provinsi)} />
          </div>

          {/* Animated Slide Content - Animasi Pergantian Halus & Elegan Antar-Slide */}
          <div
            key={`hero-text-slide-${currentHeroSlide % mediaList.length}`}
            className="space-y-6 animate-fade-up will-change-transform"
          >
            <div className="space-y-2">
              <p className="text-emerald-300 font-extrabold uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 flex-wrap">
                <span>{activeSubtitle}</span>
                {defaultDistrict && !currentMedia?.subtitle && (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300 font-normal">{defaultDistrict}</span>
                  </>
                )}
              </p>

              {activeTitle ? (
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 drop-shadow-sm">
                    {activeTitle}
                  </span>
                </h2>
              ) : (
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                  Pemerintah Desa{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 drop-shadow-sm">
                    {defaultTitleVillage}
                  </span>
                </h2>
              )}
            </div>

            <p className="text-slate-200 text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
              {activeDescription}
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              {activeButton1Text && (
                <Link
                  href={activeButton1Url.startsWith('#') ? activeButton1Url : activeButton1Url}
                  onClick={activeButton1Url.startsWith('#') ? (e) => handleScrollToSection(e, activeButton1Url) : undefined}
                  className="btn-shimmer bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-xl shadow-emerald-600/30 transition flex items-center gap-2 text-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>{activeButton1Text}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {activeButton2Text && (
                <Link
                  href={activeButton2Url || '#'}
                  onClick={activeButton2Url?.startsWith('#') ? (e) => handleScrollToSection(e, activeButton2Url) : undefined}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl border border-white/20 backdrop-blur-md transition text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>{activeButton2Text}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sambutan Resmi / Highlight Kepala Desa (Customizable dari Admin) */}
        {showKadesHighlight && (
          <div className="lg:col-span-4 card-bento-glow bg-white text-slate-900 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden ring-1 ring-slate-900/5">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={kadesPhoto}
                alt={kadesName}
                fetchPriority="high"
                decoding="async"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover object-top shadow-md border-2 border-emerald-600/30 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = kades?.photoUrl || '/images/kades_portrait.jpg';
                }}
              />
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-block mb-1">
                  {kadesPosition}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {kadesName}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Pemerintah Desa Resmi</p>
              </div>
            </div>

            <div className="pt-4 space-y-3 text-xs leading-relaxed text-slate-700">
              <p className="italic text-slate-600">
                &ldquo;{kadesQuote}&rdquo;
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Kecamatan</span>
                  <span className="font-bold text-slate-900">{tenant.kecamatan}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Kabupaten</span>
                  <span className="font-bold text-slate-900">{tenant.kabupaten}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated Scroll Down Indicator Prompt */}
      <div
        data-parallax="hero-prompt"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition cursor-pointer"
        onClick={() => {
          const el = document.getElementById('profil') || document.querySelector('main');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span className="text-[10px] uppercase tracking-widest font-bold">Gulir ke bawah</span>
        <div className="w-5 h-8 rounded-full border-2 border-white/40 flex justify-center pt-1.5 backdrop-blur-sm">
          <span className="w-1.5 h-2 bg-emerald-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
