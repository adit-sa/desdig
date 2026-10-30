'use client';

import React, { useMemo, useState } from 'react';
import { summarizeApbdes, type ThemeProps } from './modern-government/shared';
import { ThemeColorStyle, getThemeCssVariables } from './modern-government/themeColors';
import ScrollEffects from './modern-government/ScrollEffects';
import TopBar from './modern-government/TopBar';
import SiteHeader from './modern-government/SiteHeader';
import HeroSection from './modern-government/HeroSection';
import StatsSection from './modern-government/StatsSection';
import QuickLinksSection from './modern-government/QuickLinksSection';
import ProfileSection from './modern-government/ProfileSection';
import NewsSection from './modern-government/NewsSection';
import PamongSection from './modern-government/PamongSection';
import ApbdesSection from './modern-government/ApbdesSection';
import PembangunanSection from './modern-government/PembangunanSection';
import GallerySection from './modern-government/GallerySection';
import PhotoLightbox from './modern-government/PhotoLightbox';
import OfficialModal from './modern-government/OfficialModal';
import ProjectModal from './modern-government/ProjectModal';
import SiteFooter from './modern-government/SiteFooter';

const DEFAULT_SECTIONS_ORDER = [
  'stats',
  'quick_links',
  'pamong',
  'berita',
  'apbdes',
  'pembangunan',
  'galeri',
  'pengumuman',
  'lapak',
  'jam_layanan',
];

/**
 * Tema "Modern Government". Komponen ini hanya menyusun section; state & timer
 * (slide hero, galeri, aparatur, jam) hidup di masing-masing section agar
 * pembaruannya tidak me-render ulang seluruh halaman.
 */
export default function ModernGovernmentTheme({ tenant, data }: ThemeProps) {
  // Modal ditempatkan di root (di luar elemen ber-transform) agar position: fixed tetap benar
  const [activePhoto, setActivePhoto] = useState<any | null>(null);
  const [activePhotoDoc, setActivePhotoDoc] = useState<any | null>(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState<any | null>(null);
  const [selectedOfficialModal, setSelectedOfficialModal] = useState<any | null>(null);

  // Ambil konfigurasi kustomisasi tema beranda dari admin
  const themeConfig = data.themeConfig || tenant.themeConfig?.settings || {};
  const colorScheme = themeConfig.color_scheme;
  const layoutMode = (themeConfig.layout_mode as 'fixed' | 'fluid') || 'fixed';
  const { styleObject } = useMemo(() => getThemeCssVariables(colorScheme), [colorScheme]);

  const { totalPendapatan } = useMemo(() => summarizeApbdes(data.apbdes), [data.apbdes]);

  const hasModule = (key: string) => tenant.enabledModules.length === 0 || tenant.enabledModules.includes(key);
  const hasNews = hasModule('news');
  const hasAnnouncements = hasModule('announcements');
  const hasProfile = hasModule('profile');
  const hasApbdes = hasModule('apbdes');
  const hasGallery = hasModule('gallery');
  const hasUmkm = hasModule('umkm');

  // Jumlah Artikel Beranda (Default: 3, dinamis dari setting admin)
  const homepageArticleCount =
    typeof themeConfig.homepage_article_count === 'number' && themeConfig.homepage_article_count > 0
      ? themeConfig.homepage_article_count
      : 3;

  // Jumlah Galeri Beranda (Default: 4, dinamis dari setting admin)
  const homepageGalleryCount =
    typeof themeConfig.homepage_gallery_count === 'number' && themeConfig.homepage_gallery_count > 0
      ? themeConfig.homepage_gallery_count
      : 4;

  // Urutan modul dan visibilitas
  const sectionsOrder: string[] =
    Array.isArray(themeConfig.homepage_sections_order) && themeConfig.homepage_sections_order.length > 0
      ? themeConfig.homepage_sections_order
      : DEFAULT_SECTIONS_ORDER;
  const sectionsVisibility: Record<string, boolean> = themeConfig.sections_visibility || {};

  const getSectionOrder = (sectionId: string) => {
    const idx = sectionsOrder.indexOf(sectionId);
    return idx !== -1 ? idx : 99;
  };
  const isSectionVisible = (sectionId: string) => sectionsVisibility[sectionId] !== false;

  return (
    <div
      data-theme="modern-government"
      data-layout={layoutMode}
      style={styleObject}
      className={`min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-emerald-600 selection:text-white ${
        layoutMode === 'fluid' ? 'layout-fluid' : 'layout-fixed'
      }`}
    >
      <ThemeColorStyle colorScheme={colorScheme} layoutMode={layoutMode} />
      <ScrollEffects revealKey={data} />

      {/* 1. Official Government Top Bar */}
      <TopBar tenant={tenant} />

      {/* 2. Main Navigation Header */}
      <SiteHeader tenant={tenant} menus={data.menus} />

      {/* 3. Hero Section with Real Landscape Photography / Slideshow / Video */}
      <HeroSection tenant={tenant} officials={data.officials} themeConfig={themeConfig} />

      {/* 4. Infografis Kilat & Status Desa */}
      {isSectionVisible('stats') && (
        <StatsSection tenant={tenant} themeConfig={themeConfig} totalPendapatan={totalPendapatan} />
      )}

      {/* 5. Layanan Unggulan & Akses Cepat Warga */}
      {isSectionVisible('quick_links') && <QuickLinksSection tenant={tenant} />}

      {/* 6. Main Body Sections */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-12 sm:pb-14 flex flex-col gap-8 sm:gap-10">
        {/* Visi & Misi */}
        {hasProfile && <ProfileSection tenant={tenant} themeConfig={themeConfig} />}

        {/* Warta Desa, Lapak UMKM & Papan Pengumuman */}
        {hasNews && isSectionVisible('berita') && (
          <NewsSection
            tenant={tenant}
            data={data}
            articleCount={homepageArticleCount}
            hasAnnouncements={hasAnnouncements}
            hasUmkm={hasUmkm}
            isSectionVisible={isSectionVisible}
            getSectionOrder={getSectionOrder}
          />
        )}

        {/* Struktur Aparatur Pamong Desa & Status Kehadiran Hari Ini */}
        {hasProfile && isSectionVisible('pamong') && (
          <PamongSection
            tenant={tenant}
            data={data}
            getSectionOrder={getSectionOrder}
            setSelectedOfficialModal={setSelectedOfficialModal}
          />
        )}

        {/* Transparansi APBDes */}
        {hasApbdes && isSectionVisible('apbdes') && (
          <ApbdesSection tenant={tenant} data={data} getSectionOrder={getSectionOrder} />
        )}

        {/* Transparansi Proyek Pembangunan Fisik Desa */}
        {isSectionVisible('pembangunan') && (
          <PembangunanSection
            tenant={tenant}
            data={data}
            getSectionOrder={getSectionOrder}
            setSelectedProjectModal={setSelectedProjectModal}
            setActivePhotoDoc={setActivePhotoDoc}
          />
        )}

        {/* Galeri Kegiatan & Potensi Desa */}
        {hasGallery && isSectionVisible('galeri') && (
          <GallerySection
            tenant={tenant}
            galleryItems={data.gallery || []}
            getSectionOrder={getSectionOrder}
            setActivePhoto={setActivePhoto}
            galleryLimit={homepageGalleryCount}
          />
        )}
      </main>

      {/* Lightbox Modal */}
      {activePhoto && <PhotoLightbox activePhoto={activePhoto} setActivePhoto={setActivePhoto} />}

      {/* Modal Detail Profil & Absensi Aparatur */}
      {selectedOfficialModal && (
        <OfficialModal
          tenant={tenant}
          selectedOfficialModal={selectedOfficialModal}
          setSelectedOfficialModal={setSelectedOfficialModal}
        />
      )}

      {/* Modal Detail Proyek Pembangunan Fisik */}
      {selectedProjectModal && (
        <ProjectModal
          tenant={tenant}
          selectedProjectModal={selectedProjectModal}
          setSelectedProjectModal={setSelectedProjectModal}
          activePhotoDoc={activePhotoDoc}
          setActivePhotoDoc={setActivePhotoDoc}
        />
      )}

      {/* 7. Footer */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
