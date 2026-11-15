'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  RefreshCw,
  Building2,
  Newspaper,
  Megaphone,
  Calendar,
  Image as ImageIcon,
  FileText,
  Compass,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  MailCheck,
  BarChart3,
  ShieldCheck,
  Globe,
  Activity,
  Layers,
  Search,
  Check,
  X,
  SlidersHorizontal,
  Layout,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Plus,
  Trash2,
  Save,
  Sliders,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Camera,
  Users,
  HardHat,
  Award,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

export interface QuickLinkSettingItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
  color?: string;
  target?: '_self' | '_blank';
}

const QUICK_LINK_ICONS = [
  { value: 'file-text', label: '📄 Surat / Administrasi (FileText)' },
  { value: 'shield', label: '🛡️ PPID / Regulasi (ShieldCheck)' },
  { value: 'megaphone', label: '📢 Pengaduan / Aspirasi (Megaphone)' },
  { value: 'trending-up', label: '📈 APBDes / Transparansi (TrendingUp)' },
  { value: 'camera', label: '📷 Galeri Foto Kegiatan (Camera)' },
  { value: 'users', label: '👥 Aparatur / Pamong / Penduduk (Users)' },
  { value: 'globe', label: '🌐 Portal Web Publik (Globe)' },
  { value: 'shopping-bag', label: '🛍️ Pasar / Lapak UMKM (ShoppingBag)' },
  { value: 'map-pin', label: '📍 Peta Wilayah & Wisata (MapPin)' },
  { value: 'heart', label: '🤝 Bansos & Posyandu (Heart)' },
  { value: 'book', label: '📖 Regulasi & Perpustakaan (BookOpen)' },
  { value: 'phone', label: '📞 Telepon / Kontak Darurat (Phone)' },
  { value: 'external-link', label: '🔗 Tautan Luar (ExternalLink)' },
  { value: 'sparkles', label: '✨ Inovasi & Potensi (Sparkles)' },
];

const QUICK_LINK_COLORS = [
  { value: 'emerald', label: 'Hijau Zamrud (Emerald)' },
  { value: 'teal', label: 'Toska (Teal)' },
  { value: 'rose', label: 'Merah (Rose)' },
  { value: 'amber', label: 'Kuning Jingga (Amber)' },
  { value: 'cyan', label: 'Biru Cerah (Cyan)' },
  { value: 'indigo', label: 'Nila (Indigo)' },
  { value: 'blue', label: 'Biru Safir (Blue)' },
  { value: 'purple', label: 'Ungu Elegan (Purple)' },
  { value: 'slate', label: 'Abu-Abu Netral (Slate)' },
];

interface ModuleMetadata {
  label: string;
  desc: string;
  category: string;
  icon: any;
  cmsLink?: string;
  planTier?: string;
}

const MODULE_REGISTRY: Record<string, ModuleMetadata> = {
  stats: {
    label: 'Infografis Kilat & Status Desa',
    desc: 'Statistik penduduk, KK terdata, status IDM, dan APBDes terbuka di beranda',
    category: 'Layanan Warga',
    icon: BarChart3,
    planTier: 'Inti',
  },
  quick_links: {
    label: 'Pusat Pelayanan & Layanan Mandiri (Akses Cepat)',
    desc: 'Tombol pintas surat mandiri, portal PPID, aduan warga, APBDes, pamong, dan galeri',
    category: 'Layanan Warga',
    icon: Globe,
    planTier: 'Inti',
  },
  profile: {
    label: 'Visi Pembangunan & Misi Kerja',
    desc: 'Visi strategis RKPDes dan agenda misi kerja pemerintah desa periode berjalan',
    category: 'Inti Pemerintahan',
    icon: Award,
    cmsLink: '/admin/identitas',
    planTier: 'Inti',
  },
  pamong: {
    label: 'Struktur Aparatur & Status Absensi',
    desc: 'Daftar perangkat desa, status kehadiran hari ini & auto-slider aparatur',
    category: 'Inti Pemerintahan',
    icon: Users,
    cmsLink: '/admin/pamong',
    planTier: 'Inti',
  },
  berita: {
    label: 'Warta & Berita Kegiatan Desa',
    desc: 'Kabar terkini dan artikel publikasi resmi pemerintah desa',
    category: 'Publikasi & Warta',
    icon: Newspaper,
    cmsLink: '/admin/berita',
    planTier: 'Inti',
  },
  apbdes: {
    label: 'Transparansi Realisasi APBDes 2026',
    desc: 'Grafik infografis pendapatan, belanja, dan pembiayaan anggaran desa',
    category: 'Transparansi',
    icon: TrendingUp,
    cmsLink: '/keuangan',
    planTier: 'Inti',
  },
  pembangunan: {
    label: 'Proyek Pembangunan & Infrastruktur',
    desc: 'Transparansi progres fisik proyek lapangan dan dokumentasi foto kegiatan',
    category: 'Transparansi',
    icon: HardHat,
    cmsLink: '/admin/pembangunan',
    planTier: 'Pro',
  },
  galeri: {
    label: 'Galeri Dokumentasi Visual Desa',
    desc: 'Bento showcase foto dokumentasi kegiatan dan potensi desa',
    category: 'Publikasi & Warta',
    icon: Camera,
    cmsLink: '/admin/galeri',
    planTier: 'Inti',
  },
  pengumuman: {
    label: 'Papan Pengumuman & Agenda Publik',
    desc: 'Edaran resmi, imbauan gotong-royong, agenda warga & slide maklumat',
    category: 'Publikasi & Warta',
    icon: Megaphone,
    cmsLink: '/admin/pengumuman',
    planTier: 'Inti',
  },
  lapak: {
    label: 'Pasar Desa & Lapak UMKM Warga',
    desc: 'Etalase produk unggulan desa, carousel pelapak ringkas & pemesanan via WhatsApp',
    category: 'Ekonomi & UMKM',
    icon: ShoppingBag,
    cmsLink: '/admin/pelapak',
    planTier: 'Pro',
  },
  jam_layanan: {
    label: 'Jam Layanan Kantor & Pengaduan Warga',
    desc: 'Banner jadwal operasional kantor desa & tombol cepat kirim aspirasi/aduan online',
    category: 'Layanan Warga',
    icon: Clock,
    planTier: 'Inti',
  },
};

export default function UnifiedModuleManagementPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  // Accordion state: modul mana yang sedang dibuka kustomisasinya (default: 'quick_links')
  const [expandedKey, setExpandedKey] = useState<string | null>('quick_links');

  // State Urutan & Visibilitas Modul
  const [sectionsOrder, setSectionsOrder] = useState<string[]>([
    'stats',
    'quick_links',
    'profile',
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
    profile: true,
    pamong: true,
    berita: true,
    apbdes: true,
    pembangunan: true,
    galeri: true,
    pengumuman: true,
    lapak: true,
    jam_layanan: true,
  });

  // State Pengaturan Modul-Modul Tertentu
  const [homepageArticleCount, setHomepageArticleCount] = useState<number>(3);
  const [homepageGalleryCount, setHomepageGalleryCount] = useState<number>(4);
  const [homepageAnnouncementCount, setHomepageAnnouncementCount] = useState<number>(4);
  const [announcementPerSlide, setAnnouncementPerSlide] = useState<number>(2);

  const [statsData, setStatsData] = useState({
    totalPenduduk: 2450,
    dusunInfo: 'Wilayah Dusun',
    totalKK: 720,
    statusIdm: 'Desa Mandiri',
    statusIdmSub: 'Status Perkembangan',
    apbdesManual: 0,
  });

  // Kustomisasi Pusat Layanan Mandiri (Quick Links)
  const [quickLinksConfig, setQuickLinksConfig] = useState<{
    badge: string;
    title: string;
    description: string;
    ppidUrl?: string;
    pengaduanUrl?: string;
    items: QuickLinkSettingItem[];
  }>({
    badge: 'Layanan Terpadu Mandiri',
    title: 'Pusat Pelayanan & Informasi Publik Desa',
    description:
      'Akses langsung seluruh administrasi surat, permohonan informasi PPID, saluran aduan, dan transparansi anggaran desa.',
    ppidUrl: '',
    pengaduanUrl: '',
    items: [
      {
        id: 'surat',
        title: 'Administrasi Surat',
        description: 'Layanan surat keterangan mandiri',
        url: '/layanan?tenant={tenant}',
        icon: 'file-text',
        color: 'emerald',
        target: '_self',
      },
      {
        id: 'ppid',
        title: 'PPID Informasi',
        description: 'Permohonan data publik resmi',
        url: '/layanan?tenant={tenant}#ppid',
        icon: 'shield',
        color: 'teal',
        target: '_self',
      },
      {
        id: 'pengaduan',
        title: 'Lapor & Aspirasi',
        description: 'Saluran aduan langsung warga',
        url: '',
        icon: 'megaphone',
        color: 'rose',
        target: '_blank',
      },
      {
        id: 'apbdes',
        title: 'Dana Desa APBDes',
        description: 'Realisasi belanja transparan',
        url: '#apbdes',
        icon: 'trending-up',
        color: 'amber',
        target: '_self',
      },
      {
        id: 'galeri',
        title: 'Galeri Foto',
        description: 'Potret kegiatan pembangunan',
        url: '/galeri?tenant={tenant}',
        icon: 'camera',
        color: 'cyan',
        target: '_self',
      },
      {
        id: 'pamong',
        title: 'Aparatur Desa',
        description: 'Status absensi hari ini',
        url: '#pamong',
        icon: 'users',
        color: 'indigo',
        target: '_self',
      },
    ],
  });

  const [activeThemeId, setActiveThemeId] = useState<string>('modern-government');
  const [rawThemeSettings, setRawThemeSettings] = useState<any>({});

  // Muat data pengaturan modul dan beranda
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/theme?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.activeThemeId) {
        setActiveThemeId(data.activeThemeId);
      }
      const activeConfig = data.themeConfigs?.find(
        (c: any) => c.themeId === (data.activeThemeId || 'modern-government')
      );
      if (activeConfig && activeConfig.settings) {
        const s = activeConfig.settings;
        setRawThemeSettings(s);

        if (Array.isArray(s.homepage_sections_order) && s.homepage_sections_order.length > 0) {
          const loadedOrder = [...s.homepage_sections_order];
          if (!loadedOrder.includes('profile')) {
            const qIdx = loadedOrder.indexOf('quick_links');
            if (qIdx !== -1) loadedOrder.splice(qIdx + 1, 0, 'profile');
            else loadedOrder.push('profile');
          }
          Object.keys(MODULE_REGISTRY).forEach((k) => {
            if (!loadedOrder.includes(k)) loadedOrder.push(k);
          });
          setSectionsOrder(loadedOrder);
        }

        if (s.sections_visibility) {
          setSectionsVisibility({
            profile: true,
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
        if (typeof s.homepage_announcement_count === 'number') {
          setHomepageAnnouncementCount(s.homepage_announcement_count);
        }
        if (typeof s.announcement_per_slide === 'number') {
          setAnnouncementPerSlide(s.announcement_per_slide);
        }
        if (s.stats) {
          setStatsData((prev) => ({ ...prev, ...s.stats }));
        }

        if (s.quick_links) {
          setQuickLinksConfig((prev) => ({
            ...prev,
            ...s.quick_links,
            items:
              Array.isArray(s.quick_links.items) && s.quick_links.items.length > 0
                ? s.quick_links.items
                : prev.items,
          }));
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data modul:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentTenantId]);

  // Simpan seluruh urutan posisi, visibilitas, dan kustomisasi modul
  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);

      const updatedSettings = {
        ...rawThemeSettings,
        homepage_sections_order: sectionsOrder,
        sections_visibility: sectionsVisibility,
        homepage_article_count: homepageArticleCount,
        homepage_gallery_count: homepageGalleryCount,
        homepage_announcement_count: homepageAnnouncementCount,
        announcement_per_slide: announcementPerSlide,
        stats: statsData,
        quick_links: quickLinksConfig,
      };

      const res = await fetch(`/api/theme?tenant=${currentTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId: activeThemeId,
          settings: updatedSettings,
          tenantSlug: currentTenantId,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setFeedback('Seluruh urutan posisi dan kustomisasi modul berhasil disimpan!');
        setTimeout(() => {
          setSaveSuccess(false);
          setFeedback(null);
        }, 4000);
      } else {
        alert('Gagal menyimpan pengaturan modul.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Terjadi kesalahan saat menyimpan modul: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Navigasi urutan modul
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

  const toggleExpand = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  // Operasi item tombol link layanan mandiri (quick_links)
  const addQuickLinkItem = () => {
    setQuickLinksConfig((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          id: 'link_' + Date.now(),
          title: 'Layanan Baru',
          description: 'Keterangan ringkas layanan publik',
          url: '/layanan?tenant={tenant}',
          icon: 'globe',
          color: 'emerald',
          target: '_self',
        },
      ],
    }));
  };

  const updateQuickLinkItemField = (index: number, field: keyof QuickLinkSettingItem, value: any) => {
    setQuickLinksConfig((prev) => {
      const nextItems = [...(prev.items || [])];
      if (nextItems[index]) {
        nextItems[index] = { ...nextItems[index], [field]: value };
      }
      return { ...prev, items: nextItems };
    });
  };

  const moveQuickLinkItem = (index: number, direction: 'up' | 'down') => {
    setQuickLinksConfig((prev) => {
      const items = [...(prev.items || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, items };
    });
  };

  const removeQuickLinkItem = (index: number) => {
    setQuickLinksConfig((prev) => {
      const items = [...(prev.items || [])];
      if (items.length <= 1) {
        alert('Minimal harus menyisakan 1 kartu layanan.');
        return prev;
      }
      items.splice(index, 1);
      return { ...prev, items };
    });
  };

  const resetDefaultQuickLinks = () => {
    if (confirm('Kembalikan daftar tombol ke 6 tautan standar bawaan sistem?')) {
      setQuickLinksConfig((prev) => ({
        ...prev,
        items: [
          {
            id: 'surat',
            title: 'Administrasi Surat',
            description: 'Layanan surat keterangan mandiri',
            url: '/layanan?tenant={tenant}',
            icon: 'file-text',
            color: 'emerald',
            target: '_self',
          },
          {
            id: 'ppid',
            title: 'PPID Informasi',
            description: 'Permohonan data publik resmi',
            url: '/layanan?tenant={tenant}#ppid',
            icon: 'shield',
            color: 'teal',
            target: '_self',
          },
          {
            id: 'pengaduan',
            title: 'Lapor & Aspirasi',
            description: 'Saluran aduan langsung warga',
            url: '',
            icon: 'megaphone',
            color: 'rose',
            target: '_blank',
          },
          {
            id: 'apbdes',
            title: 'Dana Desa APBDes',
            description: 'Realisasi belanja transparan',
            url: '#apbdes',
            icon: 'trending-up',
            color: 'amber',
            target: '_self',
          },
          {
            id: 'galeri',
            title: 'Galeri Foto',
            description: 'Potret kegiatan pembangunan',
            url: '/galeri?tenant={tenant}',
            icon: 'camera',
            color: 'cyan',
            target: '_self',
          },
          {
            id: 'pamong',
            title: 'Aparatur Desa',
            description: 'Status absensi hari ini',
            url: '#pamong',
            icon: 'users',
            color: 'indigo',
            target: '_self',
          },
        ],
      }));
    }
  };

  // Filter modul berdasarkan pencarian dan status
  const visibleModulesList = useMemo(() => {
    return sectionsOrder.filter((key) => {
      const mod = MODULE_REGISTRY[key];
      if (!mod) return false;
      const isVis = sectionsVisibility[key] !== false;

      if (statusFilter === 'enabled' && !isVis) return false;
      if (statusFilter === 'disabled' && isVis) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = mod.label.toLowerCase().includes(q);
        const matchDesc = mod.desc.toLowerCase().includes(q);
        const matchCat = mod.category.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchCat;
      }
      return true;
    });
  }, [sectionsOrder, sectionsVisibility, statusFilter, searchQuery]);

  const activeCount = Object.values(sectionsVisibility).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header Banner Terpadu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Manajemen Modul &amp; Kustomisasi Layanan Desa
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5" suppressHydrationWarning>
            Pusat satu pintu untuk mengatur urutan posisi modul di beranda, saklar aktif/nonaktif, serta kustomisasi tombol dan tautan layanan untuk{' '}
            <strong className="text-emerald-700 font-bold" suppressHydrationWarning>
              Desa {activeTenant?.nama_desa || ''}
            </strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-shrink-0">
          <Link
            href={`/?tenant=${currentTenantId}`}
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lihat Beranda</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan!' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in-50 duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Bar Ringkas */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul atau kata kunci..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua ({sectionsOrder.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('enabled')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'enabled'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                statusFilter === 'disabled'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Nonaktif ({sectionsOrder.length - activeCount})
            </button>
          </div>
        </div>
      </div>

      {/* DAFTAR SATU PINTU: Seluruh Modul Desa (Urutan, Saklar On/Off, & Accordion Kustomisasi) */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Memuat susunan modul desa...</span>
          </div>
        ) : visibleModulesList.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-xs font-bold space-y-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Boxes className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
            <p>Tidak ada modul yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          visibleModulesList.map((key) => {
            const modIndex = sectionsOrder.indexOf(key);
            const info = MODULE_REGISTRY[key];
            if (!info) return null;
            const IconComp = info.icon;
            const isVisible = sectionsVisibility[key] !== false;
            const isExpanded = expandedKey === key;

            return (
              <div
                key={key}
                className={`rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isExpanded
                    ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white dark:bg-slate-900'
                    : isVisible
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-70'
                }`}
              >
                {/* Baris Utama Modul */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Kiri: Posisi Urutan, Ikon & Nama Modul */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Urutan & Tombol Reorder */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center">
                        {modIndex + 1}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveSection(modIndex, 'up')}
                          disabled={modIndex === 0}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition text-[10px] cursor-pointer"
                          title="Geser Posisi Naik"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(modIndex, 'down')}
                          disabled={modIndex === sectionsOrder.length - 1}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-20 disabled:cursor-not-allowed transition text-[10px] cursor-pointer"
                          title="Geser Posisi Turun"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Ikon Modul */}
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-200/60">
                      <IconComp className="w-5 h-5" />
                    </div>

                    {/* Judul & Detail */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {info.label}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {info.category}
                        </span>
                        {info.planTier && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200">
                            {info.planTier}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {info.desc}
                      </p>
                    </div>
                  </div>

                  {/* Kanan: Saklar On/Off & Tombol Buka Kustomisasi */}
                  <div className="flex items-center justify-between sm:justify-end gap-3.5 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                    {/* Saklar Toggle Aktif/Nonaktif */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider ${
                          isVisible
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {isVisible ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isVisible}
                        onClick={() => toggleSectionVisibility(key)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isVisible ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                            isVisible ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {isVisible ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <X className="w-2.5 h-2.5 text-slate-400 stroke-[3]" />
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Tombol Expand/Collapse Kustomisasi */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(key)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        isExpanded
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Tutup' : 'Kustomisasi'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* PANEL KUSTOMISASI KHUSUS MODUL (HANYA MUNCUL JIKA DIBUKA) */}
                {/* ========================================================= */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 sm:p-6 animate-in fade-in-50 duration-200 space-y-5">
                    {/* 1. KUSTOMISASI: PUSAT PELAYANAN & INFORMASI PUBLIK (QUICK LINKS) */}
                    {key === 'quick_links' && (
                      <div className="space-y-5">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <Globe className="w-4 h-4 text-emerald-600" />
                            Kustomisasi Teks &amp; Tautan Layanan Mandiri
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ubah teks judul, lencana, serta kelola kartu tombol akses cepat yang tampil di beranda website desa.
                          </p>
                        </div>

                        {/* Input Teks Utama */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Teks Lencana (Badge Atas)
                            </label>
                            <input
                              type="text"
                              value={quickLinksConfig.badge}
                              onChange={(e) =>
                                setQuickLinksConfig((prev) => ({ ...prev, badge: e.target.value }))
                              }
                              placeholder="Layanan Terpadu Mandiri"
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Judul Utama Modul
                            </label>
                            <input
                              type="text"
                              value={quickLinksConfig.title}
                              onChange={(e) =>
                                setQuickLinksConfig((prev) => ({ ...prev, title: e.target.value }))
                              }
                              placeholder="Pusat Pelayanan & Informasi Publik Desa"
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Deskripsi Singkat di Bawah Judul
                            </label>
                            <textarea
                              rows={2}
                              value={quickLinksConfig.description}
                              onChange={(e) =>
                                setQuickLinksConfig((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                            />
                          </div>
                        </div>

                        {/* Editor Kartu-Kartu Tombol Layanan Mandiri */}
                        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                                Kelola Tombol Layanan &amp; Tautan ({quickLinksConfig.items?.length || 0} Kartu)
                              </h5>
                              <p className="text-[11px] text-slate-500">
                                Edit judul tombol, URL tujuan, ikon, warna, atau tambah tautan baru.
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={resetDefaultQuickLinks}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                <span>Reset Default</span>
                              </button>

                              <button
                                type="button"
                                onClick={addQuickLinkItem}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Tautan Baru</span>
                              </button>
                            </div>
                          </div>

                          {/* Daftar List Kartu Tombol */}
                          <div className="space-y-2.5">
                            {quickLinksConfig.items?.map((item, itIdx) => (
                              <div
                                key={item.id || itIdx}
                                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition flex flex-col lg:flex-row lg:items-center gap-3"
                              >
                                {/* Nomor & Tombol Urutan */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center shadow-xs">
                                    {itIdx + 1}
                                  </span>
                                  <div className="flex lg:flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => moveQuickLinkItem(itIdx, 'up')}
                                      disabled={itIdx === 0}
                                      className="w-5 h-5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                                      title="Geser Naik"
                                    >
                                      <ArrowUp className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveQuickLinkItem(itIdx, 'down')}
                                      disabled={
                                        itIdx === (quickLinksConfig.items?.length || 0) - 1
                                      }
                                      className="w-5 h-5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                                      title="Geser Turun"
                                    >
                                      <ArrowDown className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Pilihan Ikon & Warna */}
                                <div className="grid grid-cols-2 lg:flex lg:items-center gap-1.5 shrink-0">
                                  <div>
                                    <label className="block lg:hidden text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                      Ikon
                                    </label>
                                    <select
                                      value={item.icon || 'globe'}
                                      onChange={(e) =>
                                        updateQuickLinkItemField(itIdx, 'icon', e.target.value)
                                      }
                                      className="w-full lg:w-32 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                      {QUICK_LINK_ICONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block lg:hidden text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                      Warna
                                    </label>
                                    <select
                                      value={item.color || 'emerald'}
                                      onChange={(e) =>
                                        updateQuickLinkItemField(itIdx, 'color', e.target.value)
                                      }
                                      className="w-full lg:w-28 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                                    >
                                      {QUICK_LINK_COLORS.map((c) => (
                                        <option key={c.value} value={c.value}>
                                          {c.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Kolom Input Teks: Judul & Keterangan */}
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                                  <div>
                                    <label className="block lg:hidden text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                      Judul Tombol
                                    </label>
                                    <input
                                      type="text"
                                      value={item.title}
                                      onChange={(e) =>
                                        updateQuickLinkItemField(itIdx, 'title', e.target.value)
                                      }
                                      placeholder="Judul Tombol (misal: Administrasi Surat)"
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block lg:hidden text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                      Keterangan Singkat
                                    </label>
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) =>
                                        updateQuickLinkItemField(
                                          itIdx,
                                          'description',
                                          e.target.value
                                        )
                                      }
                                      placeholder="Keterangan singkat tombol..."
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                  </div>
                                </div>

                                {/* Kolom URL Tujuan */}
                                <div className="w-full lg:w-64 xl:w-72 shrink-0">
                                  <label className="block lg:hidden text-[9px] font-bold text-slate-500 uppercase mb-0.5">
                                    URL Tujuan
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      value={item.url}
                                      onChange={(e) =>
                                        updateQuickLinkItemField(itIdx, 'url', e.target.value)
                                      }
                                      placeholder="/layanan?tenant={tenant}"
                                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-2.5 pr-14 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <span className="absolute right-2 top-2 text-[9px] font-mono text-emerald-600 dark:text-emerald-400 pointer-events-none">
                                      {'{tenant}'}
                                    </span>
                                  </div>
                                </div>

                                {/* Target Jendela Baru & Tombol Hapus */}
                                <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700">
                                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={item.target === '_blank'}
                                      onChange={(e) =>
                                        updateQuickLinkItemField(
                                          itIdx,
                                          'target',
                                          e.target.checked ? '_blank' : '_self'
                                        )
                                      }
                                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-[11px] whitespace-nowrap">Tab Baru</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => removeQuickLinkItem(itIdx)}
                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                                    title="Hapus Tombol Tautan Ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. KUSTOMISASI: PAPAN PENGUMUMAN */}
                    {key === 'pengumuman' && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-emerald-600" />
                            Kustomisasi Tampilan Papan Pengumuman
                          </h4>
                          {info.cmsLink && (
                            <Link
                              href={info.cmsLink}
                              className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>Kelola Daftar Pengumuman di CMS</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Jumlah Pengumuman Per Slide
                            </label>
                            <select
                              value={announcementPerSlide}
                              onChange={(e) =>
                                setAnnouncementPerSlide(parseInt(e.target.value, 10))
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                            >
                              <option value={1}>1 Pengumuman (Tampilan Besar/Fokus)</option>
                              <option value={2}>2 Pengumuman (Standar Rekomendasi)</option>
                              <option value={3}>3 Pengumuman</option>
                              <option value={4}>4 Pengumuman</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Total Kuota Tayang di Beranda
                            </label>
                            <select
                              value={homepageAnnouncementCount}
                              onChange={(e) =>
                                setHomepageAnnouncementCount(parseInt(e.target.value, 10))
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                            >
                              <option value={2}>2 Pengumuman</option>
                              <option value={3}>3 Pengumuman</option>
                              <option value={4}>4 Pengumuman (Default)</option>
                              <option value={6}>6 Pengumuman</option>
                              <option value={8}>8 Pengumuman</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. KUSTOMISASI: WARTA BERITA DESA */}
                    {key === 'berita' && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <Newspaper className="w-4 h-4 text-emerald-600" />
                            Kustomisasi Tampilan Berita di Beranda
                          </h4>
                          {info.cmsLink && (
                            <Link
                              href={info.cmsLink}
                              className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>Tulis Berita Baru di CMS</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        <div className="max-w-xs">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Jumlah Artikel Ditampilkan di Beranda
                          </label>
                          <select
                            value={homepageArticleCount}
                            onChange={(e) =>
                              setHomepageArticleCount(parseInt(e.target.value, 10))
                            }
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            <option value={3}>3 Artikel (Rekomendasi Utama)</option>
                            <option value={4}>4 Artikel</option>
                            <option value={5}>5 Artikel</option>
                            <option value={6}>6 Artikel</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 4. KUSTOMISASI: GALERI FOTO */}
                    {key === 'galeri' && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <Camera className="w-4 h-4 text-emerald-600" />
                            Kustomisasi Tampilan Galeri Foto Beranda
                          </h4>
                          {info.cmsLink && (
                            <Link
                              href={info.cmsLink}
                              className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
                            >
                              <span>Kelola Album &amp; Foto di CMS</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>

                        <div className="max-w-xs">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Jumlah Kegiatan Foto di Beranda
                          </label>
                          <select
                            value={homepageGalleryCount}
                            onChange={(e) =>
                              setHomepageGalleryCount(parseInt(e.target.value, 10))
                            }
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            <option value={3}>3 Kegiatan</option>
                            <option value={4}>4 Kegiatan (Default)</option>
                            <option value={6}>6 Kegiatan</option>
                            <option value={8}>8 Kegiatan</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* 5. KUSTOMISASI: STATISTIK KILAT */}
                    {key === 'stats' && (
                      <div className="space-y-4">
                        <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-600" />
                            Kustomisasi Infografis Statistik Kilat Desa
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Angka indikator ini ditampilkan di kartu statistik cepat beranda desa.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Status IDM
                            </label>
                            <input
                              type="text"
                              value={statsData.statusIdm}
                              onChange={(e) =>
                                setStatsData((prev) => ({ ...prev, statusIdm: e.target.value }))
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Total Penduduk (Manual/Fallback)
                            </label>
                            <input
                              type="number"
                              value={statsData.totalPenduduk}
                              onChange={(e) =>
                                setStatsData((prev) => ({
                                  ...prev,
                                  totalPenduduk: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Total Kepala Keluarga (KK)
                            </label>
                            <input
                              type="number"
                              value={statsData.totalKK}
                              onChange={(e) =>
                                setStatsData((prev) => ({
                                  ...prev,
                                  totalKK: parseInt(e.target.value, 10) || 0,
                                }))
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. MODUL LAINNYA (PROFILE, PAMONG, APBDES, PEMBANGUNAN, LAPAK, JAM LAYANAN) */}
                    {key !== 'quick_links' &&
                      key !== 'pengumuman' &&
                      key !== 'berita' &&
                      key !== 'galeri' &&
                      key !== 'stats' && (
                        <div className="space-y-3">
                          <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                              <IconComp className="w-4 h-4 text-emerald-600" />
                              Pengaturan &amp; Data Modul {info.label}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">{info.desc}</p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                                Kelola Konten &amp; Data Master Modul Ini
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Data modul ini disinkronisasikan otomatis langsung dari modul backoffice terkait.
                              </span>
                            </div>

                            {info.cmsLink && (
                              <Link
                                href={info.cmsLink}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 self-start sm:self-auto shadow-xs whitespace-nowrap"
                              >
                                <span>Buka Manajemen {info.label}</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Tombol Simpan Cepat di Dalam Setiap Panel Kustomisasi */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : saveSuccess ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan Modul'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tombol Simpan Sticky di Bawah */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          Seluruh susunan urutan modul, saklar aktif/nonaktif, dan kustomisasi tombol akan langsung diterapkan ke portal beranda.
        </span>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Menyimpan...' : saveSuccess ? 'Tersimpan ke Beranda!' : 'Simpan Seluruh Pengaturan Modul'}</span>
        </button>
      </div>
    </div>
  );
}
