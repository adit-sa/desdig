'use client';

import React, { useState, useEffect } from 'react';
import {
  Palette,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Sliders,
  Eye,
  Layers,
  Save,
  Check,
  Building2,
  Compass,
  Newspaper,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Video,
  Image as ImageIcon,
  UserCheck,
  FileText,
  TrendingUp,
  HardHat,
  Camera,
  Megaphone,
  BarChart3,
  Globe,
  Settings,
  Plus,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Users,
  Landmark,
  ShieldCheck,
  RefreshCw,
  Pipette,
  Layout,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import {
  THEME_COLOR_PRESETS,
  type ThemeColorScheme,
  generateColorShades,
  getThemeCssVariables,
  type ThemeColorPresetKey,
} from '@/components/themes/modern-government/themeColors';

interface ThemeItem {
  id: string;
  name: string;
  version: string;
  description: string;
  previewImageUrl: string | null;
}

const AVAILABLE_MODULES: Record<string, { label: string; desc: string; icon: any }> = {
  stats: {
    label: 'Infografis Kilat & Status Desa',
    desc: 'Statistik penduduk, KK terdata, status IDM, dan APBDes terbuka',
    icon: BarChart3,
  },
  quick_links: {
    label: 'Layanan Mandiri & Akses Cepat',
    desc: 'Tombol pintas surat, PPID, aduan warga, APBDes, dan galeri',
    icon: Globe,
  },
  pamong: {
    label: 'Struktur Aparatur & Status Absensi',
    desc: 'Daftar perangkat desa, status kehadiran hari ini & auto-slider',
    icon: UserCheck,
  },
  berita: {
    label: 'Warta & Berita Kegiatan Desa',
    desc: 'Kabar terkini dan artikel publikasi resmi pemerintah desa',
    icon: FileText,
  },
  apbdes: {
    label: 'Transparansi Realisasi APBDes 2026',
    desc: 'Grafik infografis pendapatan, belanja, dan pembiayaan desa',
    icon: TrendingUp,
  },
  pembangunan: {
    label: 'Proyek Pembangunan & Infrastruktur',
    desc: 'Transparansi progres fisik proyek lapangan dan dokumentasi foto',
    icon: HardHat,
  },
  galeri: {
    label: 'Galeri Dokumentasi Visual Desa',
    desc: 'Bento showcase foto dokumentasi kegiatan dan potensi desa',
    icon: Camera,
  },
  pengumuman: {
    label: 'Papan Pengumuman & Agenda Publik',
    desc: 'Edaran resmi, imbauan gotong-royong, dan agenda warga',
    icon: Megaphone,
  },
  lapak: {
    label: 'Pasar Desa & Lapak UMKM Warga',
    desc: 'Etalase produk unggulan desa, carousel pelapak ringkas & pemesanan via WhatsApp',
    icon: ShoppingBag,
  },
  jam_layanan: {
    label: 'Jam Layanan Kantor & Pengaduan Warga',
    desc: 'Banner jadwal operasional kantor desa & tombol cepat kirim aspirasi/aduan online',
    icon: Clock,
  },
};

export interface HeroMediaSettingItem {
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

export default function ThemeCustomizerPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [activeThemeId, setActiveThemeId] = useState<string>('modern-government');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'colors' | 'stats' | 'hero' | 'kades' | 'themes'>('modules');

  // Pengaturan Mode Lebar Tampilan (Fixed vs Fluid)
  const [layoutMode, setLayoutMode] = useState<'fixed' | 'fluid'>('fixed');

  // Pengaturan Warna & Nuansa Tema Modern Government
  const [colorScheme, setColorScheme] = useState<ThemeColorScheme>({
    preset: 'emerald',
    primary: '#059669',
    secondary: '#0d9488',
  });
  const [customPrimary, setCustomPrimary] = useState<string>('#059669');
  const [customSecondary, setCustomSecondary] = useState<string>('#0d9488');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // Data Infografis Kilat & Status Desa (StatsSection)
  const [statsData, setStatsData] = useState({
    totalPenduduk: 2450,
    dusunInfo: 'Wilayah Dusun',
    totalKK: 720,
    statusIdm: 'Desa Mandiri',
    statusIdmSub: 'Status Perkembangan',
    apbdesManual: 0,
  });

  // Urutan modul dan visibilitas
  const [sectionsOrder, setSectionsOrder] = useState<string[]>([
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
  ]);

  const [sectionsVisibility, setSectionsVisibility] = useState<Record<string, boolean>>({
    stats: true,
    quick_links: true,
    pamong: true,
    berita: true,
    apbdes: true,
    pembangunan: true,
    galeri: true,
    pengumuman: true,
    lapak: true,
    jam_layanan: true,
  });

  // Jumlah artikel beranda (default: 3)
  const [homepageArticleCount, setHomepageArticleCount] = useState<number>(3);

  // Jumlah galeri dokumentasi beranda (default: 4)
  const [homepageGalleryCount, setHomepageGalleryCount] = useState<number>(4);

  // Background Hero Media (Mendukung Campuran Video & Gambar dalam satu playlist sinematik)
  const [heroMediaList, setHeroMediaList] = useState<HeroMediaSettingItem[]>([
    { type: 'video', url: 'https://dpmd-mateng.adit.lt/logo.webm' },
    { type: 'image', url: '/images/balai_desa_gedung.jpg' },
    { type: 'image', url: '/images/desa_irigasi_pertanian.jpg' },
  ]);
  const [heroSlideInterval, setHeroSlideInterval] = useState<number>(6000);
  const [adminSlidePreviewIndex, setAdminSlidePreviewIndex] = useState(0);
  const [expandedSlideIndex, setExpandedSlideIndex] = useState<number | null>(0);

  // Auto-slide preview di admin (Foto & Video)
  useEffect(() => {
    if (heroMediaList.length <= 1) return;
    const timer = setInterval(() => {
      setAdminSlidePreviewIndex((prev) => (prev + 1) % heroMediaList.length);
    }, heroSlideInterval || 6000);
    return () => clearInterval(timer);
  }, [heroMediaList.length, heroSlideInterval]);

  const addMediaSlide = (type: 'image' | 'video', url: string = '') => {
    setHeroMediaList((prev) => {
      const nextIndex = prev.length;
      setExpandedSlideIndex(nextIndex);
      return [
        ...prev,
        {
          type,
          url: url || (type === 'video' ? 'https://dpmd-mateng.adit.lt/logo.webm' : '/images/balai_desa_gedung.jpg'),
          title: '',
          subtitle: '',
          description: '',
          buttonText: '',
          buttonUrl: '',
        },
      ];
    });
  };

  const updateMediaSlide = (index: number, newUrl: string, newType?: 'image' | 'video') => {
    setHeroMediaList((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          url: newUrl,
          type: newType || updated[index].type,
        };
      }
      return updated;
    });
  };

  const updateMediaSlideField = (index: number, field: keyof HeroMediaSettingItem, value: any) => {
    setHeroMediaList((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          [field]: value,
        };
      }
      return updated;
    });
  };

  const moveMediaSlide = (index: number, direction: 'up' | 'down') => {
    setHeroMediaList((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const removeMediaSlide = (index: number) => {
    setHeroMediaList((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  // Sambutan / Highlight Kepala Desa
  const [kadesHighlight, setKadesHighlight] = useState({
    enabled: true,
    name: activeTenant?.kepala_desa || 'Kepala Desa',
    position: 'Kepala Desa',
    kodeWilayah: activeTenant?.kode_desa || '',
    quote: `Selamat datang di Portal Resmi Pemerintah Desa ${activeTenant?.nama_desa || ''}. Seluruh layanan kependudukan dan transparansi APBDes kini dapat diakses terbuka oleh seluruh warga secara akuntabel.`,
    photoUrl: '/images/kades_portrait.jpg',
  });

  // Data Medsos yang tersimpan agar tidak tertimpa
  const [savedSocialMedia, setSavedSocialMedia] = useState<any>({});

  const fetchThemeData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/theme?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.availableThemes) {
        setThemes(data.availableThemes);
        setActiveThemeId(data.activeThemeId);
      }

      const activeConfig = data.themeConfigs?.find((c: any) => c.themeId === (data.activeThemeId || 'modern-government'));
      if (activeConfig && activeConfig.settings) {
        const s = activeConfig.settings;
        if (Array.isArray(s.homepage_sections_order) && s.homepage_sections_order.length > 0) {
          const loadedOrder = [...s.homepage_sections_order];
          Object.keys(AVAILABLE_MODULES).forEach((k) => {
            if (!loadedOrder.includes(k)) loadedOrder.push(k);
          });
          setSectionsOrder(loadedOrder);
        }
        if (s.sections_visibility) {
          setSectionsVisibility({
            lapak: true,
            jam_layanan: true,
            ...s.sections_visibility,
          });
        }
        if (typeof s.homepage_article_count === 'number') {
          setHomepageArticleCount(s.homepage_article_count);
        }
        if (typeof s.homepage_gallery_count === 'number') {
          setHomepageGalleryCount(s.homepage_gallery_count);
        }
        if (s.hero_background) {
          const hb = s.hero_background;
          const loadedMedia: HeroMediaSettingItem[] = [];

          if (Array.isArray(hb.media) && hb.media.length > 0) {
            hb.media.forEach((item: any) => {
              if (item && item.url) {
                loadedMedia.push({
                  type: item.type === 'video' || item.url.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image',
                  url: item.url,
                  title: item.title || '',
                  subtitle: item.subtitle || '',
                  description: item.description || '',
                  buttonText: item.buttonText || '',
                  buttonUrl: item.buttonUrl || '',
                  buttonText2: item.buttonText2 || '',
                  buttonUrl2: item.buttonUrl2 || '',
                });
              } else if (typeof item === 'string' && item.trim()) {
                loadedMedia.push({
                  type: item.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image',
                  url: item.trim(),
                  title: '',
                  subtitle: '',
                  description: '',
                  buttonText: '',
                  buttonUrl: '',
                });
              }
            });
          } else {
            // Gabungkan video dan gambar yang tersimpan sebelumnya
            if (Array.isArray(hb.videos)) {
              hb.videos.forEach((v: string) => {
                if (v && v.trim()) loadedMedia.push({ type: 'video', url: v.trim(), title: '', description: '', buttonText: '', buttonUrl: '' });
              });
            }
            if (Array.isArray(hb.images)) {
              hb.images.forEach((img: string) => {
                if (img && img.trim()) loadedMedia.push({ type: 'image', url: img.trim(), title: '', description: '', buttonText: '', buttonUrl: '' });
              });
            }
            if (loadedMedia.length === 0 && hb.url) {
              loadedMedia.push({
                type: hb.url.match(/\.(mp4|webm|mov|ogg)$/i) ? 'video' : 'image',
                url: hb.url,
                title: '',
                description: '',
                buttonText: '',
                buttonUrl: '',
              });
            }
          }

          if (loadedMedia.length > 0) {
            setHeroMediaList(loadedMedia);
          }
          if (typeof hb.interval === 'number') {
            setHeroSlideInterval(hb.interval);
          }
        }
        if (s.kades_highlight) {
          setKadesHighlight(s.kades_highlight);
        }
        if (s.stats) {
          setStatsData((prev) => ({
            ...prev,
            ...s.stats,
          }));
        }
        if (s.socialMedia) {
          setSavedSocialMedia(s.socialMedia);
        }
        if (s.color_scheme) {
          setColorScheme(s.color_scheme);
          if (s.color_scheme.primary) setCustomPrimary(s.color_scheme.primary);
          if (s.color_scheme.secondary) setCustomSecondary(s.color_scheme.secondary);
          if (s.color_scheme.preset === 'custom') setIsCustomMode(true);
        }
        if (s.layout_mode === 'fluid' || s.layout_mode === 'fixed') {
          setLayoutMode(s.layout_mode);
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data tema:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchThemeData();
    if (activeTenant) {
      setKadesHighlight((prev) => ({
        ...prev,
        name: !prev.name ? activeTenant.kepala_desa || 'Kepala Desa' : prev.name,
        kodeWilayah: activeTenant.kode_desa || prev.kodeWilayah,
        quote:
          !prev.quote
            ? `Selamat datang di Portal Resmi Pemerintah Desa ${activeTenant.nama_desa}. Seluruh layanan kependudukan dan transparansi APBDes kini dapat diakses terbuka oleh seluruh warga secara akuntabel.`
            : prev.quote,
      }));
    }
  }, [currentTenantId, activeTenant]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sectionsOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setSectionsOrder(newOrder);
  };

  const toggleSectionVisibility = (key: string) => {
    setSectionsVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectPreset = (presetKey: string) => {
    if (presetKey === 'custom') {
      setIsCustomMode(true);
      const shades = generateColorShades(customPrimary);
      const secShades = generateColorShades(customSecondary);
      setColorScheme({
        preset: 'custom',
        primary: customPrimary,
        secondary: customSecondary,
        customShades: { primary: shades, secondary: secShades },
      });
      return;
    }
    setIsCustomMode(false);
    const p = THEME_COLOR_PRESETS[presetKey as keyof typeof THEME_COLOR_PRESETS];
    if (p) {
      setColorScheme({
        preset: p.id,
        primary: p.primary,
        secondary: p.secondary,
        customShades: { primary: p.primaryShades, secondary: p.secondaryShades },
      });
      setCustomPrimary(p.primary);
      setCustomSecondary(p.secondary);
    }
  };

  const handleApplyCustomColors = (primary: string, secondary: string) => {
    setIsCustomMode(true);
    setCustomPrimary(primary);
    setCustomSecondary(secondary);
    const shades = generateColorShades(primary);
    const secShades = generateColorShades(secondary);
    setColorScheme({
      preset: 'custom',
      primary,
      secondary,
      customShades: { primary: shades, secondary: secShades },
    });
  };

  const previewColorVars = React.useMemo(() => {
    return getThemeCssVariables(colorScheme, '.theme-preview-scope');
  }, [colorScheme]);

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const fullSettings = {
        socialMedia: savedSocialMedia,
        color_scheme: colorScheme,
        layout_mode: layoutMode,
        homepage_article_count: homepageArticleCount,
        homepage_gallery_count: homepageGalleryCount,
        homepage_sections_order: sectionsOrder,
        sections_visibility: sectionsVisibility,
        hero_background: {
          type: 'mixed',
          url: heroMediaList[0]?.url || 'https://dpmd-mateng.adit.lt/logo.webm',
          media: heroMediaList
            .filter((m) => m.url && m.url.trim().length > 0)
            .map((m) => ({
              type: m.type,
              url: m.url.trim(),
              title: m.title?.trim() || undefined,
              subtitle: m.subtitle?.trim() || undefined,
              description: m.description?.trim() || undefined,
              buttonText: m.buttonText?.trim() || undefined,
              buttonUrl: m.buttonUrl?.trim() || undefined,
              buttonText2: m.buttonText2?.trim() || undefined,
              buttonUrl2: m.buttonUrl2?.trim() || undefined,
            })),
          images: heroMediaList.filter((m) => m.type === 'image' && m.url.trim()).map((m) => m.url.trim()),
          videos: heroMediaList.filter((m) => m.type === 'video' && m.url.trim()).map((m) => m.url.trim()),
          interval: Number(heroSlideInterval) || 6000,
        },
        kades_highlight: kadesHighlight,
        stats: statsData,
      };

      const res = await fetch(`/api/theme?tenant=${currentTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: activeThemeId,
          settings: fullSettings,
          tenantSlug: currentTenantId,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        alert('Gagal menyimpan konfigurasi tampilan');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan koneksi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Palette className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Pengaturan Tampilan & Tata Letak Beranda
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5" suppressHydrationWarning>
            Kustomisasi urutan modul, latar belakang foto/video, sambutan kepala desa, serta jumlah artikel beranda{' '}
            <strong className="text-emerald-700" suppressHydrationWarning>Desa {activeTenant?.nama_desa || ''}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            suppressHydrationWarning
            href={mounted && currentTenantId ? `/?tenant=${currentTenantId}` : (currentTenantId ? `/?tenant=${currentTenantId}` : '/')}
            target="_blank"
            rel="noreferrer"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Lihat Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in-50 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Pengaturan tampilan berhasil disimpan dan langsung diterapkan ke halaman utama website!</span>
        </div>
      )}

      {/* Tabs Navigasi */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'modules'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Tata Letak & Urutan Modul</span>
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'colors'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Warna & Aksen Tema</span>
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'stats'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Infografis & Status Desa</span>
        </button>

        <button
          onClick={() => setActiveTab('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'hero'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Latar Hero (Foto / Video)</span>
        </button>

        <button
          onClick={() => setActiveTab('kades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'kades'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Sambutan Kepala Desa</span>
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'themes'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Katalog Tema</span>
        </button>
      </div>

      {/* TAB 1: Tata Letak (Fixed vs Fluid) & Urutan Modul */}
      {activeTab === 'modules' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Card Pengaturan Mode Lebar Tampilan (Fixed vs Fluid) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-emerald-600" />
                  Mode Lebar Tata Letak Beranda (Fixed vs Fluid Layout)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur apakah tata letak beranda dibatasi pada lebar kontainer terpusat (Fixed 1280px) atau membentang penuh mengikuti layar monitor pengunjung (Fluid Widescreen).
                </p>
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Aktif: {layoutMode === 'fluid' ? 'Fluid (Widescreen)' : 'Fixed (1280px)'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Pilihan 1: Mode Fixed */}
              <div
                onClick={() => setLayoutMode('fixed')}
                className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  layoutMode === 'fixed'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      <Minimize2 className="w-3 h-3 text-slate-500" />
                      Standar Pemerintah
                    </span>
                    {layoutMode === 'fixed' ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </div>

                  {/* Visual Diagram Mode Fixed */}
                  <div className="bg-slate-200/80 p-3 rounded-lg mb-3 border border-slate-300/60 flex justify-center">
                    <div className="w-3/5 bg-white rounded shadow-sm border border-slate-300 p-2 space-y-1.5">
                      <div className="h-2 bg-emerald-600/70 rounded w-1/3" />
                      <div className="h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                        Hero Box (1280px)
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    Mode Fixed (Kontainer Terpusat)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lebar konten dibatasi maksimal <strong>1280px (max-w-7xl)</strong> dan berada tepat di tengah layar monitor. Format paling rapi dan seimbang untuk membaca artikel warta, infografis anggaran, dan dokumen resmi desa.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>Lebar: Max 1280px</span>
                  <span className="text-emerald-700">Rekomendasi Dokumen</span>
                </div>
              </div>

              {/* Pilihan 2: Mode Fluid */}
              <div
                onClick={() => setLayoutMode('fluid')}
                className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                  layoutMode === 'fluid'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-emerald-700" />
                      Widescreen Panorama
                    </span>
                    {layoutMode === 'fluid' ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </div>

                  {/* Visual Diagram Mode Fluid */}
                  <div className="bg-slate-200/80 p-3 rounded-lg mb-3 border border-slate-300/60 flex justify-center">
                    <div className="w-full bg-white rounded shadow-sm border border-slate-300 p-2 space-y-1.5">
                      <div className="h-2 bg-emerald-600/70 rounded w-1/4" />
                      <div className="h-6 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 font-bold">
                        Widescreen Panorama (100% / Max 1760px)
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                        <div className="h-3 bg-slate-100 rounded border border-slate-200" />
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    Mode Fluid (Rentang Lebar Penuh)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Lebar konten membentang luas <strong>(hingga 1760px / lebar layar)</strong> dengan bantalan tepi responsif. Menghadirkan pengalaman sinematik yang megah, modern, dan sangat mengesankan pada monitor PC lebar.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-slate-600 flex items-center justify-between">
                  <span>Lebar: Max 1760px (Fluid)</span>
                  <span className="text-emerald-700">Sinematik & Megah</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Pengaturan Jumlah Artikel Beranda */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Jumlah Artikel di Halaman Utama (Beranda)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur berapa banyak warta/artikel yang ditampilkan di beranda agar tidak menumpuk. Sisa artikel dapat diakses melalui tombol &ldquo;Lihat Semua Artikel&rdquo;.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Tampilkan:</span>
                <select
                  value={homepageArticleCount}
                  onChange={(e) => setHomepageArticleCount(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={3}>3 Artikel (Rekomendasi Utama)</option>
                  <option value={4}>4 Artikel</option>
                  <option value={5}>5 Artikel</option>
                  <option value={6}>6 Artikel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card Pengaturan Jumlah Galeri Beranda */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  Jumlah Galeri Dokumentasi di Halaman Utama (Beranda)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Atur berapa banyak item/album kegiatan yang tampil di showcase beranda. Default standar adalah 4 kegiatan.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Tampilkan:</span>
                <select
                  value={homepageGalleryCount}
                  onChange={(e) => setHomepageGalleryCount(parseInt(e.target.value, 10))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={3}>3 Kegiatan</option>
                  <option value={4}>4 Kegiatan (Default Rekomendasi)</option>
                  <option value={6}>6 Kegiatan</option>
                  <option value={8}>8 Kegiatan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card Pengaturan Urutan Posisi Modul */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                Urutan Posisi Modul Beranda (Reorder Sections)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan tombol <strong>Naik (▲)</strong> dan <strong>Turun (▼)</strong> untuk menata posisi modul seperti APBDes, Proyek Pembangunan, Berita, Aparatur, dsb.
              </p>
            </div>

            <div className="space-y-2.5">
              {sectionsOrder.map((key, idx) => {
                const info = AVAILABLE_MODULES[key];
                if (!info) return null;
                const IconComponent = info.icon;
                const isVisible = sectionsVisibility[key] !== false;

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isVisible
                        ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-300'
                        : 'bg-slate-100/50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{info.label}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">{info.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Checkbox Tampilkan */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleSectionVisibility(key)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="hidden sm:inline">{isVisible ? 'Aktif' : 'Nonaktif'}</span>
                      </label>

                      {/* Tombol Geser Naik */}
                      <button
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Geser Posisi Naik"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Tombol Geser Turun */}
                      <button
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === sectionsOrder.length - 1}
                        className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Geser Posisi Turun"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Kustomisasi Warna & Nuansa Tema Modern Government */}
      {activeTab === 'colors' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Header Banner Kustomisasi Warna */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  Kustomisasi Warna & Aksen Tema Modern Government
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Ubah identitas visual website <strong className="text-slate-800" suppressHydrationWarning>Desa {activeTenant?.nama_desa || ''}</strong> dengan memilih salah satu dari 8 palet resmi pemerintah daerah, atau tentukan kode warna sendiri (Hex/Color Picker) sesuai lambang daerah kabupaten/desa Anda.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('emerald')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-lg transition flex items-center gap-1.5"
                  title="Kembalikan ke warna standar resmi desDig (Hijau Zamrud)"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menyimpan...' : 'Simpan Warna'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grid 8 Palet Warna Resmi Standar Pemerintahan */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Palet Warna Resmi Siap Pakai
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap palet telah diuji kontras keterbacaannya sesuai standar aksesibilitas WCAG & desain portal publik.
                </p>
              </div>

              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                8 Pilihan Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {(Object.keys(THEME_COLOR_PRESETS) as Array<keyof typeof THEME_COLOR_PRESETS>).map((key) => {
                const preset = THEME_COLOR_PRESETS[key];
                const isSelected = colorScheme.preset === preset.id && !isCustomMode;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all relative flex flex-col justify-between group ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div>
                      {/* Badge Tipe / Karakter */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                          {preset.badge}
                        </span>

                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-slate-400" />
                        )}
                      </div>

                      {/* Visual Swatch Warna Utama & Sekunder */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-8 h-8 rounded-xl shadow-sm border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: preset.primary }}
                          title={`Warna Utama: ${preset.primary}`}
                        />
                        <div
                          className="w-8 h-8 rounded-xl shadow-sm border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: preset.secondary }}
                          title={`Warna Sekunder: ${preset.secondary}`}
                        />
                        <div
                          className="h-8 flex-1 rounded-xl shadow-sm border border-black/10"
                          style={{
                            background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
                          }}
                          title="Gradien Aksen Tema"
                        />
                      </div>

                      {/* Judul & Deskripsi */}
                      <h5 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition">
                        {preset.name}
                      </h5>
                      <span className="text-[11px] font-bold text-slate-500 block mb-1">
                        {preset.label}
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {preset.desc}
                      </p>
                    </div>

                    {/* Tag Kode Hex */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                      <span>{preset.primary}</span>
                      <span>{preset.secondary}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Kustom Warna Mandiri (Color Picker / Hex Code) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Pipette className="w-4 h-4 text-emerald-600" />
                  Pilih Warna Mandiri (Kustom Hex / Color Picker)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan warna utama dan warna pendamping gradien secara presisi sesuai kode hex lambang kabupaten / daerah.
                </p>
              </div>

              {colorScheme.preset === 'custom' && (
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-1 rounded-md self-start sm:self-auto">
                  Mode Kustom Aktif
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {/* Input Warna Utama */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    Warna Utama (Primary Accent):
                  </label>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Dipakai di Tombol, Teks Highlight & Border
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customPrimary}
                    onChange={(e) => {
                      setCustomPrimary(e.target.value);
                      handleApplyCustomColors(e.target.value, customSecondary);
                    }}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-sm"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customPrimary}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomPrimary(val);
                        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                          handleApplyCustomColors(val, customSecondary);
                        }
                      }}
                      placeholder="#059669"
                      maxLength={7}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Warna ini akan menggantikan seluruh aksen hijau zamrud pada tombol, ikon utama, border aktif, dan sorotan teks.
                </p>
              </div>

              {/* Input Warna Sekunder / Gradient */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800">
                    Warna Sekunder (Secondary / Gradient Accent):
                  </label>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Dipakai di Gradien Hero & Efek Cahaya
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customSecondary}
                    onChange={(e) => {
                      setCustomSecondary(e.target.value);
                      handleApplyCustomColors(customPrimary, e.target.value);
                    }}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-sm"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={customSecondary}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomSecondary(val);
                        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                          handleApplyCustomColors(customPrimary, val);
                        }
                      }}
                      placeholder="#0d9488"
                      maxLength={7}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Warna ini bertindak sebagai aksen transisi kedua pada gradien teks judul hero, floating energy orbs, dan tombol pelengkap.
                </p>
              </div>
            </div>

            {/* Spektrum Shade yang Dihasilkan Otomatis */}
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Rentang Spektrum Kontras Warna Utama (Otomatis Dihitung 50 - 950):
              </span>
              <div className="grid grid-cols-11 gap-1 text-center font-mono text-[9px]">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => {
                  const hex = previewColorVars.primaryShades[shade] || '#059669';
                  const isDark = shade >= 600;
                  return (
                    <div key={shade} className="space-y-1">
                      <div
                        className="h-10 rounded-lg flex items-center justify-center font-bold shadow-sm border border-black/5"
                        style={{ backgroundColor: hex, color: isDark ? '#ffffff' : '#0f172a' }}
                      >
                        {shade}
                      </div>
                      <span className="text-slate-500 text-[8px] block truncate">{hex}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pratinjau Interaktif Langsung (Live Simulation Scope) */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Pratinjau Interaktif Website (Live Preview Tema Modern Government)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulasi tampilan komponen halaman utama website dengan skema warna yang sedang aktif di atas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Toggle Cepat Mode Layout di Pratinjau */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('fixed')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                      layoutMode === 'fixed'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>Fixed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('fluid')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                      layoutMode === 'fluid'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>Fluid</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 hidden sm:inline">Warna:</span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: previewColorVars.primaryHex }}
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    {previewColorVars.primaryHex}
                  </span>
                </div>
              </div>
            </div>

            {/* Kotak Simulasi Tema (Scoped Container) */}
            <div
              className={`theme-preview-scope rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 p-4 sm:p-6 space-y-4 transition-all duration-300 ${
                layoutMode === 'fixed' ? 'max-w-4xl mx-auto' : 'w-full'
              }`}
              data-layout={layoutMode}
              style={previewColorVars.styleObject}
            >
              {/* Injeksi Style Scoped untuk Pratinjau */}
              <style dangerouslySetInnerHTML={{ __html: previewColorVars.cssString }} />

              {/* 1. Header Simulasi */}
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-md">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-700 block">
                      Website Resmi
                    </span>
                    <span className="text-sm font-black text-slate-900" suppressHydrationWarning>
                      Pemerintah Desa {activeTenant?.nama_desa || ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 shadow-sm">
                    Beranda
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700">
                    Warta
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700">
                    Galeri
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-emerald-700">
                    APBDes
                  </span>
                </div>
              </div>

              {/* 2. Hero Card Simulasi */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-white p-6 sm:p-8 shadow-lg">
                {/* Glowing Energy Orbs Simulasi */}
                <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4 max-w-xl">
                  <span className="text-emerald-300 font-extrabold uppercase tracking-widest text-xs inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Portal Resmi Pemerintah Desa
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                    Pemerintah Desa{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200" suppressHydrationWarning>
                      {activeTenant?.nama_desa || ''}
                    </span>
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Akses keterbukaan informasi publik desa, transparansi realisasi anggaran APBDes 2026, warta kegiatan, dan layanan mandiri warga secara transparan.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition text-xs flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Layanan Mandiri Warga</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-md transition text-xs flex items-center gap-2"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Transparansi APBDes</span>
                    </button>
                  </div>
                </div>

                {/* Sambutan Kades Mini di Hero */}
                <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-3 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10 max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/80 inline-block">
                      Kepala Desa
                    </span>
                    <h6 className="text-xs font-bold text-white mt-0.5">
                      {kadesHighlight.name || activeTenant?.kepala_desa || 'Kepala Desa'}
                    </h6>
                    <p className="text-[10px] text-slate-300 line-clamp-1 italic">
                      &ldquo;Transparansi dan pelayanan prima untuk kemakmuran warga desa.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Baris Widget: Infografis Stat, Progress APBDes & Absensi Aparatur */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Widget 1: Infografis */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Penduduk Terdata</span>
                    <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    2.450 <span className="text-xs font-normal text-slate-500">Jiwa</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                    ✓ Status Desa Mandiri
                  </span>
                </div>

                {/* Widget 2: APBDes Realisasi Progress Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Realisasi APBDes 2026</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      84.5%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm transition-all duration-500"
                      style={{ width: '84.5%' }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Rp 1.450.000.000 / Rp 1.715.000.000
                  </span>
                </div>

                {/* Widget 3: Status Absensi Pamong */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Aparatur Pamong Desa</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Hadir Absensi
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      SK
                    </div>
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 leading-tight">Sekretaris Desa</h6>
                      <span className="text-[10px] text-slate-500 block">Kantor Pelayanan Terpadu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Simpan Bawah */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleSelectPreset('emerald')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                Reset ke Default
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Skema Warna'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB STATS: Infografis Kilat & Status Desa */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Pratinjau Tampilan 4 Kartu di Beranda */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Pengaturan Modul: Infografis Kilat & Status Desa
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modul ini tampil tepat di bawah banner Hero utama beranda website desa untuk menampilkan ringkasan data kependudukan, status IDM Kemendes, dan transparansi APBDes.
                </p>
              </div>
            </div>

            {/* Live Mini Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                Pratinjau Live Kartu di Beranda:
              </span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3 p-2 bg-emerald-50/50 rounded-lg">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Total Penduduk</span>
                    <strong className="text-sm font-black text-slate-900 block truncate">{statsData.totalPenduduk.toLocaleString('id-ID')}+ Jiwa</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block truncate">{statsData.dusunInfo}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-teal-50/50 rounded-lg">
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Kepala Keluarga</span>
                    <strong className="text-sm font-black text-slate-900 block truncate">{statsData.totalKK.toLocaleString('id-ID')}+ KK</strong>
                    <span className="text-[10px] text-teal-600 font-semibold block truncate">Terdata di DKB</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded-lg">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">Status IDM</span>
                    <strong className="text-sm font-black text-slate-900 block truncate">{statsData.statusIdm}</strong>
                    <span className="text-[10px] text-blue-600 font-semibold block truncate">{statsData.statusIdmSub}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 bg-amber-50/50 rounded-lg">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">APBDes Terbuka</span>
                    <strong className="text-xs font-black text-slate-900 block truncate">Otomatis / Real-Time</strong>
                    <span className="text-[10px] text-amber-600 font-semibold block truncate">Dari Modul Keuangan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulir Pengaturan 4 Kartu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Kartu 1: Total Penduduk */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>1. Kartu Total Penduduk</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jumlah Penduduk (Jiwa)
                  </label>
                  <input
                    type="number"
                    value={statsData.totalPenduduk}
                    onChange={(e) => setStatsData({ ...statsData, totalPenduduk: Number(e.target.value) || 0 })}
                    placeholder="Contoh: 2450"
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Label Keterangan Bawah
                  </label>
                  <input
                    type="text"
                    value={statsData.dusunInfo}
                    onChange={(e) => setStatsData({ ...statsData, dusunInfo: e.target.value })}
                    placeholder="Contoh: 4 Wilayah Dusun"
                    className="w-full text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Teks hijau di bawah angka penduduk</span>
                </div>
              </div>

              {/* Kartu 2: Kepala Keluarga */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                <div className="flex items-center gap-2 text-teal-800 font-extrabold text-xs">
                  <Landmark className="w-4 h-4 text-teal-600" />
                  <span>2. Kartu Kepala Keluarga</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Jumlah Kepala Keluarga (KK)
                  </label>
                  <input
                    type="number"
                    value={statsData.totalKK}
                    onChange={(e) => setStatsData({ ...statsData, totalKK: Number(e.target.value) || 0 })}
                    placeholder="Contoh: 720"
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Keterangan Basis Data
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Terdata di DKB"
                    className="w-full text-xs p-2.5 bg-slate-100 rounded-lg border border-slate-200 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Standar pencatatan administrasi kependudukan (DKB)</span>
                </div>
              </div>

              {/* Kartu 3: Status IDM */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>3. Kartu Status IDM (Indeks Desa Membangun)</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Status Perkembangan IDM
                  </label>
                  <input
                    type="text"
                    value={statsData.statusIdm}
                    onChange={(e) => setStatsData({ ...statsData, statusIdm: e.target.value })}
                    placeholder="Contoh: Desa Mandiri, Desa Maju, dll."
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  {/* Pilihan cepat */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">Pilih Cepat:</span>
                    {['Desa Mandiri', 'Desa Maju', 'Desa Berkembang', 'Desa Tertinggal'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatsData({ ...statsData, statusIdm: st })}
                        className={`text-[10px] px-2 py-0.5 rounded font-bold transition border cursor-pointer ${
                          statsData.statusIdm === st
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Label Sub-Keterangan
                  </label>
                  <input
                    type="text"
                    value={statsData.statusIdmSub}
                    onChange={(e) => setStatsData({ ...statsData, statusIdmSub: e.target.value })}
                    placeholder="Status Perkembangan"
                    className="w-full text-xs p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Kartu 4: APBDes Terbuka */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-white">
                <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>4. Kartu APBDes Terbuka</span>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1.5">
                  <p className="font-bold text-amber-900">
                    Otomatis Tersinkronisasi dari Modul Keuangan
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Nominal pada kartu ini secara otomatis menghitung <strong>Total Pendapatan APBDes</strong> yang Anda masukkan di menu <strong>Admin &gt; Keuangan APBDes</strong>.
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nominal Manual Cadangan (Opsional)
                  </label>
                  <input
                    type="number"
                    value={statsData.apbdesManual || ''}
                    onChange={(e) => setStatsData({ ...statsData, apbdesManual: Number(e.target.value) || 0 })}
                    placeholder="0 (jika diisi, dipakai jika data keuangan kosong)"
                    className="w-full text-xs font-semibold p-2.5 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Biarkan 0 agar menggunakan data resmi menu Keuangan APBDes.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Latar Hero (Mendukung Campuran Video & Gambar dalam satu playlist) */}
      {activeTab === 'hero' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              Latar Belakang Hero Beranda (Background Media Video & Foto)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur kombinasi video animasi/drone (MP4/WebM) dan foto autentik desa secara bersamaan dalam satu alur slideshow beranda. Setiap slide dapat memiliki Judul, Deskripsi, dan Tautan khusus atau menggunakan identitas default desa secara otomatis.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl">
            {/* Banner Informasi Hero Default Otomatis */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span className="text-xs font-extrabold text-emerald-950">
                  Format Hero Default Otomatis (Jika Kolom Slide Dikosongkan):
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                Jika Anda tidak mengisi Judul atau Deskripsi pada suatu foto/video, sistem akan otomatis menampilkan identitas resmi desa:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200/80 shadow-xs">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Subjudul:</span>
                  <span className="text-slate-900 font-bold">Selamat Datang di Website Resmi • Kecamatan {activeTenant?.kecamatan || '...'}</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200/80 shadow-xs">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Judul Utama:</span>
                  <span className="text-emerald-800 font-extrabold">Pemerintah Desa {activeTenant?.nama_desa || '...'}</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-emerald-200/80 shadow-xs">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Deskripsi / Visi:</span>
                  <span className="text-slate-700 italic truncate block">&ldquo;{activeTenant?.visi || 'Mewujudkan tata kelola desa yang transparan...'}&rdquo;</span>
                </div>
              </div>
            </div>

            {/* Header Daftar Media & Tombol Tambah */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-900">
                  Daftar Media Slideshow ({heroMediaList.length} Media Aktif)
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Anda dapat menggabungkan video dan foto dalam urutan apa pun, serta memberi judul/tautan khusus pada setiap slide.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addMediaSlide('image')}
                  className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambah Foto
                </button>
                <button
                  type="button"
                  onClick={() => addMediaSlide('video')}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambah Video
                </button>
              </div>
            </div>

            {/* List Slide Media */}
            <div className="space-y-3">
              {heroMediaList.map((media, idx) => {
                const isExpanded = expandedSlideIndex === idx;
                const hasCustom = Boolean(media.title?.trim() || media.description?.trim() || media.buttonText?.trim());

                return (
                  <div
                    key={idx}
                    className={`p-3.5 bg-slate-50 border rounded-xl transition ${
                      isExpanded ? 'border-emerald-300 ring-2 ring-emerald-500/10 bg-white' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Urutan Nomor */}
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-extrabold shrink-0">
                        {idx + 1}
                      </div>

                      {/* Thumbnail / Mini Preview */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-200 relative flex items-center justify-center shadow-xs">
                        {media.type === 'video' ? (
                          <>
                            <video
                              src={media.url}
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center pointer-events-none">
                              <Video className="w-4 h-4 text-emerald-400" />
                            </div>
                          </>
                        ) : (
                          <img
                            src={media.url}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/balai_desa_gedung.jpg';
                            }}
                          />
                        )}
                      </div>

                      {/* Type Selector & URL Input */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <select
                            value={media.type}
                            onChange={(e) => updateMediaSlide(idx, media.url, e.target.value as 'image' | 'video')}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border focus:outline-none ${
                              media.type === 'video'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <option value="image">FOTO</option>
                            <option value="video">VIDEO (MP4/WebM)</option>
                          </select>
                          <span className="text-[10px] text-slate-400">
                            {media.type === 'video' ? 'Format .mp4 / .webm' : 'Format .jpg / .png / .webp'}
                          </span>
                        </div>

                        <input
                          type="text"
                          value={media.url}
                          onChange={(e) => updateMediaSlide(idx, e.target.value)}
                          placeholder={media.type === 'video' ? 'https://... atau /video.webm' : '/images/... atau https://...'}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveMediaSlide(idx, 'up')}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          title="Geser Ke Atas"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === heroMediaList.length - 1}
                          onClick={() => moveMediaSlide(idx, 'down')}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          title="Geser Ke Bawah"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={heroMediaList.length <= 1}
                          onClick={() => removeMediaSlide(idx)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                          title="Hapus Media Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subline Action: Toggle Accordion Kustomisasi Teks & Tautan */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hasCustom ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            {media.title ? `Kustom: ${media.title}` : 'Kustomisasi Teks Aktif'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                            🏷️ Format Default Desa (Pemerintah Desa {activeTenant?.nama_desa || ''})
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedSlideIndex(isExpanded ? null : idx)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-emerald-50 transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Tutup Kustomisasi' : 'Atur Judul, Deskripsi & Tautan'}</span>
                      </button>
                    </div>

                    {/* Expandable Form: Judul, Deskripsi, & Tautan */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-in fade-in-50 duration-150">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            Pengaturan Teks & Tautan Khusus Slide {idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            *Kosongkan kolom bila ingin otomatis memakai format default desa
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Subjudul */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Subjudul / Label Atas (Opsional)
                            </label>
                            <input
                              type="text"
                              value={media.subtitle || ''}
                              onChange={(e) => updateMediaSlideField(idx, 'subtitle', e.target.value)}
                              placeholder={`Default: Selamat Datang di Website Resmi • Kecamatan ${activeTenant?.kecamatan || '...'}`}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Judul */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Judul Utama Slide (Opsional)
                            </label>
                            <input
                              type="text"
                              value={media.title || ''}
                              onChange={(e) => updateMediaSlideField(idx, 'title', e.target.value)}
                              placeholder={`Default: Pemerintah Desa ${activeTenant?.nama_desa || '...'}`}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Deskripsi */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Deskripsi / Keterangan Slide (Opsional)
                          </label>
                          <textarea
                            rows={2}
                            value={media.description || ''}
                            onChange={(e) => updateMediaSlideField(idx, 'description', e.target.value)}
                            placeholder="Default: Visi atau Slogan Resmi Desa"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Tautan Tombol */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Teks Tombol Aksi (Opsional)
                            </label>
                            <input
                              type="text"
                              value={media.buttonText || ''}
                              onChange={(e) => updateMediaSlideField(idx, 'buttonText', e.target.value)}
                              placeholder="Default: Jelajahi Warta Desa"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              URL Tautan Tombol (Opsional)
                            </label>
                            <input
                              type="text"
                              value={media.buttonUrl || ''}
                              onChange={(e) => updateMediaSlideField(idx, 'buttonUrl', e.target.value)}
                              placeholder="Default: #berita (atau /pembangunan, /lapak, https://...)"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Preset Cepat Foto & Video */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-2">
              <span className="block text-[11px] font-bold text-emerald-900">
                Tambah Cepat Preset Koleksi Media Desa Tersedia:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => addMediaSlide('video', 'https://dpmd-mateng.adit.lt/logo.webm')}
                  className="px-2.5 py-1 bg-white border border-purple-200 text-purple-800 hover:bg-purple-50 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <Video className="w-3 h-3 text-purple-600" />
                  + Video Logo Animasi Resmi (WebM)
                </button>
                <button
                  type="button"
                  onClick={() => addMediaSlide('image', '/images/balai_desa_gedung.jpg')}
                  className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3 text-emerald-600" />
                  + Foto Balai Desa
                </button>
                <button
                  type="button"
                  onClick={() => addMediaSlide('image', '/images/desa_irigasi_pertanian.jpg')}
                  className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3 text-emerald-600" />
                  + Foto Irigasi Pertanian
                </button>
                <button
                  type="button"
                  onClick={() => addMediaSlide('image', '/images/desa_umkm_produk.jpg')}
                  className="px-2.5 py-1 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <ImageIcon className="w-3 h-3 text-emerald-600" />
                  + Foto UMKM Potensi Warga
                </button>
                <button
                  type="button"
                  onClick={() => addMediaSlide('video', 'https://assets.mixkit.co/videos/preview/mixkit-drone-view-of-a-rural-landscape-with-farms-and-trees-42486-large.mp4')}
                  className="px-2.5 py-1 bg-white border border-purple-200 text-purple-800 hover:bg-purple-50 rounded-lg text-[11px] font-medium transition flex items-center gap-1 cursor-pointer"
                >
                  <Video className="w-3 h-3 text-purple-600" />
                  + Video Drone Persawahan
                </button>
              </div>
            </div>

            {/* Kecepatan / Durasi Pergantian Slide */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Kecepatan Pergantian Slide Antar-Media:
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { val: 4000, label: '4 Detik (Cepat)' },
                  { val: 6000, label: '6 Detik (Standar Sinematik)' },
                  { val: 8000, label: '8 Detik (Tenang)' },
                  { val: 10000, label: '10 Detik' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setHeroSlideInterval(opt.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      heroSlideInterval === opt.val
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE PREVIEW INTERAKTIF */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  Pratinjau Langsung Latar & Teks Hero (Animasi Slideshow):
                </span>
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Slide Berjalan (Slide {(adminSlidePreviewIndex % heroMediaList.length) + 1} / {heroMediaList.length})
                </span>
              </div>

              <div className="relative aspect-[16/8] sm:aspect-[16/7] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner">
                {/* Background Slideshow */}
                <div className="absolute inset-0">
                  {heroMediaList.map((media, idx) => {
                    const isActive =
                      heroMediaList.length <= 1
                        ? idx === 0
                        : idx === (adminSlidePreviewIndex % heroMediaList.length);

                    return (
                      <div
                        key={idx}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                          isActive ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
                        }`}
                      >
                        {media.type === 'video' ? (
                          <video
                            src={media.url}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-out transform ${
                              isActive ? 'scale-105' : 'scale-100'
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

                {/* Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30 pointer-events-none" />

                {/* Animated Hero Text Overlay in Preview */}
                {(() => {
                  const activeMedia = heroMediaList[adminSlidePreviewIndex % heroMediaList.length];
                  const previewSubtitle = activeMedia?.subtitle || `Selamat Datang di Website Resmi • Kecamatan ${activeTenant?.kecamatan || '...'}`;
                  const previewTitle = activeMedia?.title || `Pemerintah Desa ${activeTenant?.nama_desa || '...'}`;
                  const previewDesc = activeMedia?.description || (activeTenant?.visi || 'Mewujudkan tata kelola desa yang transparan, akuntabel, dan mengutamakan pelayanan...');
                  const previewBtnText = activeMedia?.buttonText || 'Jelajahi Warta Desa';

                  return (
                    <div
                      key={`preview-text-${adminSlidePreviewIndex % heroMediaList.length}`}
                      className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-center max-w-lg text-white pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-500"
                    >
                      <p className="text-emerald-300 font-extrabold uppercase tracking-wider text-[10px] sm:text-xs">
                        {previewSubtitle}
                      </p>
                      <h3 className="text-lg sm:text-2xl font-black text-white leading-tight mt-1">
                        {previewTitle}
                      </h3>
                      <p className="text-slate-200 text-xs line-clamp-2 mt-1.5 leading-relaxed font-normal">
                        {previewDesc}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                          {previewBtnText}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                        <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg border border-white/20">
                          Transparansi Anggaran
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Preview Overlay info */}
                <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between pointer-events-none">
                  <span className="text-[10px] text-white font-bold bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5">
                    {heroMediaList[adminSlidePreviewIndex % heroMediaList.length]?.type === 'video' ? (
                      <Video className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                    )}
                    Slide {(adminSlidePreviewIndex % heroMediaList.length) + 1} / {heroMediaList.length} (
                    {heroMediaList[adminSlidePreviewIndex % heroMediaList.length]?.type?.toUpperCase()})
                  </span>

                  {heroMediaList.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-md">
                      {heroMediaList.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === (adminSlidePreviewIndex % heroMediaList.length)
                              ? 'w-4 bg-emerald-400'
                              : 'w-1.5 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Sambutan Kepala Desa */}
      {activeTab === 'kades' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Sambutan / Pesan Khusus Kepala Desa di Beranda
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aktifkan, sembunyikan, atau sesuaikan kutipan sambutan resmi dan informasi penting kepala desa pada banner utama beranda.
            </p>
          </div>

          <div className="space-y-4 max-w-2xl">
            {/* Toggle Aktif */}
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="toggleKades"
                checked={kadesHighlight.enabled}
                onChange={(e) => setKadesHighlight((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="toggleKades" className="text-xs font-bold text-slate-800 cursor-pointer">
                Tampilkan Kotak Sambutan Kepala Desa di Beranda
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pejabat / Kepala Desa:</label>
                <input
                  type="text"
                  value={kadesHighlight.name}
                  onChange={(e) => setKadesHighlight((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={activeTenant?.kepala_desa || 'Nama Kepala Desa'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan:</label>
                <input
                  type="text"
                  value={kadesHighlight.position}
                  onChange={(e) => setKadesHighlight((prev) => ({ ...prev, position: e.target.value }))}
                  placeholder="Kepala Desa"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kode Wilayah Desa:</label>
                <input
                  type="text"
                  value={kadesHighlight.kodeWilayah}
                  onChange={(e) => setKadesHighlight((prev) => ({ ...prev, kodeWilayah: e.target.value }))}
                  placeholder="7606042009"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Foto Pejabat:</label>
                <input
                  type="text"
                  value={kadesHighlight.photoUrl}
                  onChange={(e) => setKadesHighlight((prev) => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="/images/kades_portrait.jpg"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kutipan Sambutan / Informasi Pengumuman Penting:
              </label>
              <textarea
                rows={4}
                value={kadesHighlight.quote}
                onChange={(e) => setKadesHighlight((prev) => ({ ...prev, quote: e.target.value }))}
                placeholder="Tuliskan kata sambutan atau info penting terbaru untuk masyarakat..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Katalog Tema Resmi */}
      {activeTab === 'themes' && (
        <div className="space-y-4 animate-in fade-in-50 duration-150">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Pilihan Tema Resmi</h2>
            <p className="text-xs text-slate-500">Pilih salah satu dari tema terverifikasi sistem di bawah ini.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {themes.map((thm) => {
              const isActive = activeThemeId === thm.id;
              return (
                <div
                  key={thm.id}
                  className={`bg-white rounded-xl border-2 transition-all p-6 flex flex-col justify-between ${
                    thm.id === 'modern-government'
                      ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 opacity-60 bg-slate-50/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-slate-100 rounded-xl">
                        {thm.id === 'traditional-village' ? (
                          <Compass className="w-6 h-6 text-amber-500" />
                        ) : thm.id === 'modern-editorial' ? (
                          <Newspaper className="w-6 h-6 text-indigo-500" />
                        ) : (
                          <Building2 className="w-6 h-6 text-emerald-500" />
                        )}
                      </div>
                      {thm.id === 'modern-government' ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tema Aktif Utama
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full">
                          Dinonaktifkan
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900">{thm.name}</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {thm.id === 'modern-government'
                        ? 'Tema resmi terverifikasi dengan desain standar desDig / Kemendagri, foto dokumentasi asli, dan transparansi absensi pamong.'
                        : `${thm.description} (Dinonaktifkan sementara untuk fokus pada tema resmi Modern Government).`}
                    </p>

                    {thm.id === 'modern-government' && (
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Warna: {colorScheme.preset.toUpperCase()}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          Lebar: {layoutMode === 'fluid' ? 'Fluid (Widescreen)' : 'Fixed (1280px)'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      disabled
                      className="bg-emerald-50 text-emerald-700 font-bold text-xs px-4 py-2 rounded-xl border border-emerald-200 cursor-default"
                    >
                      ✓ Sedang Aktif
                    </button>
                    {thm.id === 'modern-government' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('colors')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Kustomisasi Warna</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}