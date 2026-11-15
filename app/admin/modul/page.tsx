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
  Image,
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

const HOMEPAGE_MODULES: Record<string, { label: string; desc: string; icon: any; link?: string }> = {
  stats: {
    label: 'Infografis Kilat & Status Desa',
    desc: 'Statistik penduduk, KK terdata, status IDM, dan APBDes terbuka',
    icon: BarChart3,
  },
  quick_links: {
    label: 'Pusat Pelayanan & Layanan Mandiri (Akses Cepat)',
    desc: 'Tombol pintas surat mandiri, portal PPID, aduan warga, transparansi APBDes, pamong, dan galeri',
    icon: Globe,
  },
  profile: {
    label: 'Visi Pembangunan & Misi Kerja',
    desc: 'Visi strategis RKPDes dan agenda misi kerja pemerintah desa periode berjalan',
    icon: Building2,
    link: '/admin/identitas',
  },
  pamong: {
    label: 'Struktur Aparatur & Status Absensi',
    desc: 'Daftar perangkat desa, status kehadiran hari ini & auto-slider',
    icon: Building2,
    link: '/admin/pamong',
  },
  berita: {
    label: 'Warta & Berita Kegiatan Desa',
    desc: 'Kabar terkini dan artikel publikasi resmi pemerintah desa',
    icon: Newspaper,
    link: '/admin/berita',
  },
  apbdes: {
    label: 'Transparansi Realisasi APBDes 2026',
    desc: 'Grafik infografis pendapatan, belanja, dan pembiayaan desa',
    icon: TrendingUp,
    link: '/keuangan',
  },
  pembangunan: {
    label: 'Proyek Pembangunan & Infrastruktur',
    desc: 'Transparansi progres fisik proyek lapangan dan dokumentasi foto',
    icon: FileText,
    link: '/admin/pembangunan',
  },
  galeri: {
    label: 'Galeri Dokumentasi Visual Desa',
    desc: 'Bento showcase foto dokumentasi kegiatan dan potensi desa',
    icon: Image,
    link: '/admin/galeri',
  },
  pengumuman: {
    label: 'Papan Pengumuman & Agenda Publik',
    desc: 'Edaran resmi, imbauan gotong-royong, dan agenda warga',
    icon: Megaphone,
    link: '/admin/pengumuman',
  },
  lapak: {
    label: 'Pasar Desa & Lapak UMKM Warga',
    desc: 'Etalase produk unggulan desa, carousel pelapak ringkas & pemesanan via WhatsApp',
    icon: ShoppingBag,
    link: '/admin/pelapak',
  },
  jam_layanan: {
    label: 'Jam Layanan Kantor & Pengaduan Warga',
    desc: 'Banner jadwal operasional kantor desa & tombol cepat kirim aspirasi/aduan online',
    icon: MailCheck,
  },
};

interface ModuleItem {
  key: string;
  name: string;
  category: string;
  description: string;
  version: string;
  isCore: boolean;
  minPlan: string;
  isEnabled: boolean;
  isAllowedByPlan: boolean;
  planName: string;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: 'Inti Pemerintahan', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  content: { label: 'Publikasi & Warta', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  economy: { label: 'Ekonomi & UMKM', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  transparency: { label: 'Transparansi', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  service: { label: 'Layanan Warga', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  system: { label: 'Sistem & Teknis', color: 'bg-slate-100 text-slate-800 border-slate-200' },
};

export default function ModuleManagementPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [mainTab, setMainTab] = useState<'homepage_modules' | 'system_features'>('homepage_modules');

  // State Modul Sistem & Lisensi
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // State Modul Beranda & Kustomisasi
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
  const [savingTheme, setSavingTheme] = useState(false);
  const [themeSaveSuccess, setThemeSaveSuccess] = useState(false);

  // Fetch modul sistem (Lisensi/Plan)
  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/modules?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.modules) {
        setModules(data.modules);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data modul beranda dari API theme
  const fetchThemeData = async () => {
    try {
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
          Object.keys(HOMEPAGE_MODULES).forEach((k) => {
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
      console.error('Gagal mengambil data modul beranda:', e);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchThemeData();
  }, [currentTenantId]);

  // Handler simpan urutan modul & kustomisasi beranda
  const handleSaveHomepageModules = async () => {
    try {
      setSavingTheme(true);
      setThemeSaveSuccess(false);

      const updatedSettings = {
        ...rawThemeSettings,
        homepage_sections_order: sectionsOrder,
        sections_visibility: sectionsVisibility,
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
        setThemeSaveSuccess(true);
        setFeedback('Urutan modul beranda dan pengaturan tombol layanan berhasil disimpan!');
        setTimeout(() => {
          setThemeSaveSuccess(false);
          setFeedback(null);
        }, 4000);
      } else {
        alert('Gagal menyimpan pengaturan modul beranda.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Terjadi kesalahan saat menyimpan modul: ' + e.message);
    } finally {
      setSavingTheme(false);
    }
  };

  // Navigasi urutan modul beranda
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

  // Operasi kartu link layanan mandiri
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

  const handleToggle = async (mod: ModuleItem) => {
    if (!mod.isAllowedByPlan) {
      alert(
        `Modul "${mod.name}" membutuhkan paket yang lebih tinggi (${mod.planName}). Silakan upgrade paket langganan desa.`
      );
      return;
    }

    setTogglingKey(mod.key);
    const newStatus = !mod.isEnabled;

    try {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleKey: mod.key,
          isEnabled: newStatus,
          tenantSlug: currentTenantId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.key === mod.key ? { ...m, isEnabled: newStatus } : m))
        );
        setFeedback(`Modul "${mod.name}" berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`);
        setTimeout(() => setFeedback(null), 3500);
      } else {
        alert(data.error || 'Gagal mengubah status modul');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingKey(null);
    }
  };

  const getModuleIcon = (key: string) => {
    switch (key) {
      case 'profile':
        return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'news':
        return <Newspaper className="w-4 h-4 text-blue-600" />;
      case 'announcements':
        return <Megaphone className="w-4 h-4 text-amber-600" />;
      case 'events':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'gallery':
        return <Image className="w-4 h-4 text-pink-600" />;
      case 'documents':
        return <FileText className="w-4 h-4 text-teal-600" />;
      case 'tourism':
        return <Compass className="w-4 h-4 text-orange-600" />;
      case 'umkm':
        return <ShoppingBag className="w-4 h-4 text-indigo-600" />;
      case 'apbdes':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'complaints':
        return <MessageSquare className="w-4 h-4 text-rose-600" />;
      case 'services':
        return <MailCheck className="w-4 h-4 text-cyan-600" />;
      case 'statistics':
        return <BarChart3 className="w-4 h-4 text-amber-600" />;
      case 'ppid':
        return <ShieldCheck className="w-4 h-4 text-emerald-700" />;
      case 'seo':
        return <Globe className="w-4 h-4 text-blue-500" />;
      case 'analytics':
        return <Activity className="w-4 h-4 text-violet-600" />;
      default:
        return <Boxes className="w-4 h-4 text-slate-600" />;
    }
  };

  const enabledCount = modules.filter((m) => m.isEnabled).length;
  const disabledCount = modules.length - enabledCount;

  // Filter daftar modul sistem
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      if (statusFilter === 'enabled' && !mod.isEnabled) return false;
      if (statusFilter === 'disabled' && mod.isEnabled) return false;
      if (categoryFilter !== 'all' && mod.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = mod.name.toLowerCase().includes(q);
        const matchDesc = mod.description.toLowerCase().includes(q);
        const matchKey = mod.key.toLowerCase().includes(q);
        return matchName || matchDesc || matchKey;
      }
      return true;
    });
  }, [modules, statusFilter, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Pusat Manajemen &amp; Kustomisasi Modul Desa
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5" suppressHydrationWarning>
            Atur urutan modul beranda, saklar on/off, kustomisasi tombol layanan mandiri, serta lisensi fitur untuk{' '}
            <strong className="text-emerald-700 font-bold" suppressHydrationWarning>
              Desa {activeTenant?.nama_desa || ''}
            </strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <Link
            href={`/?tenant=${currentTenantId}`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lihat Beranda</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={() => {
              fetchModules();
              fetchThemeData();
            }}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Muat ulang seluruh data modul"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in-50 duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TABS UTAMA: Modul Beranda vs Fitur Sistem */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setMainTab('homepage_modules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            mainTab === 'homepage_modules'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Modul Beranda &amp; Kustomisasi Tautan</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-800/80 text-white">
            {sectionsOrder.length} Modul
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('system_features')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            mainTab === 'system_features'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Lisensi &amp; Fitur Sistem Desa</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
            {enabledCount} Aktif
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: Modul Beranda (Urutan, Visibilitas & Kustomisasi Tautan) */}
      {/* ============================================================== */}
      {mainTab === 'homepage_modules' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Card Urutan & Visibilitas Modul Beranda */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-600" />
                  Urutan Posisi &amp; Visibilitas Modul Beranda
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Gunakan tombol <strong>Naik (▲)</strong> dan <strong>Turun (▼)</strong> untuk menata susunan modul di portal publik, atau hilangkan centang untuk menyembunyikan modul sementara.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveHomepageModules}
                disabled={savingTheme}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer self-start sm:self-auto"
              >
                {savingTheme ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : themeSaveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {savingTheme
                    ? 'Menyimpan...'
                    : themeSaveSuccess
                    ? 'Tersimpan ke Beranda!'
                    : 'Simpan Urutan Modul'}
                </span>
              </button>
            </div>

            <div className="space-y-2.5">
              {sectionsOrder.map((key, idx) => {
                const info = HOMEPAGE_MODULES[key];
                if (!info) return null;
                const IconComponent = info.icon;
                const isVisible = sectionsVisibility[key] !== false;

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isVisible
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                        : 'bg-slate-100/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {info.label}
                          </h4>
                          {key === 'quick_links' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Kustomisasi Tombol Tersedia di Bawah ↓
                            </span>
                          )}
                          {info.link && (
                            <Link
                              href={info.link}
                              className="text-[10px] text-slate-500 hover:text-emerald-600 hover:underline flex items-center gap-0.5 font-bold"
                            >
                              <span>Buka CMS Modul</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{info.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Checkbox Tampilkan */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer mr-2">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={() => toggleSectionVisibility(key)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="text-[11px] font-bold">
                          {isVisible ? 'Aktif' : 'Sembunyi'}
                        </span>
                      </label>

                      {/* Tombol Geser Naik */}
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 'up')}
                        disabled={idx === 0}
                        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Geser Posisi Naik"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Tombol Geser Turun */}
                      <button
                        type="button"
                        onClick={() => moveSection(idx, 'down')}
                        disabled={idx === sectionsOrder.length - 1}
                        className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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

          {/* Card Kustomisasi Konten & Tautan Pusat Layanan Mandiri (Quick Links) */}
          <div
            id="quick-links-editor"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Kustomisasi Konten &amp; Tautan &ldquo;Pusat Pelayanan &amp; Informasi Publik Desa&rdquo;
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Modul ini adalah gerbang akses cepat warga di halaman utama. Anda dapat mengubah judul utama, lencana, tautan PPID / Pengaduan, serta menambah atau mengedit kartu-kartu tombol layanan di bawah.
                </p>
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Modul Beranda
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Teks Badge / Lencana Atas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Teks Lencana (Badge Atas)
                </label>
                <input
                  type="text"
                  value={quickLinksConfig.badge}
                  onChange={(e) => setQuickLinksConfig((prev) => ({ ...prev, badge: e.target.value }))}
                  placeholder="Layanan Terpadu Mandiri"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <em>Layanan Terpadu Mandiri</em>
                </p>
              </div>

              {/* Judul Utama Modul */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Utama Modul
                </label>
                <input
                  type="text"
                  value={quickLinksConfig.title}
                  onChange={(e) => setQuickLinksConfig((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Pusat Pelayanan & Informasi Publik Desa"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default: <em>Pusat Pelayanan &amp; Informasi Publik Desa</em>
                </p>
              </div>

              {/* Deskripsi Modul */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi / Penjelasan Singkat di Bawah Judul
                </label>
                <textarea
                  rows={2}
                  value={quickLinksConfig.description}
                  onChange={(e) =>
                    setQuickLinksConfig((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Akses langsung seluruh administrasi surat, permohonan informasi PPID, saluran aduan, dan transparansi anggaran desa."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* URL Kustom PPID */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tautan Khusus PPID Desa (Opsional)
                </label>
                <input
                  type="text"
                  value={quickLinksConfig.ppidUrl}
                  onChange={(e) => setQuickLinksConfig((prev) => ({ ...prev, ppidUrl: e.target.value }))}
                  placeholder="Contoh: https://ppid.namadesa.go.id atau kosongkan"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* URL Kustom Aduan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tautan Khusus Pengaduan / Aspirasi (Opsional)
                </label>
                <input
                  type="text"
                  value={quickLinksConfig.pengaduanUrl}
                  onChange={(e) =>
                    setQuickLinksConfig((prev) => ({ ...prev, pengaduanUrl: e.target.value }))
                  }
                  placeholder="Contoh: https://lapor.go.id atau kosongkan untuk otomatis WhatsApp"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Kelola Kartu-Kartu Layanan & Tombol */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    Kelola Tombol Layanan &amp; Tautan ({quickLinksConfig.items?.length || 0} Tombol)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Edit judul, keterangan, alamat URL tujuan, ikon, warna, ubah urutan (naik/turun), atau tambah tombol layanan baru.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetDefaultQuickLinks}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Kembalikan ke 6 tombol standar sistem"
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

              {/* Grid Kartu-Kartu Layanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {quickLinksConfig.items?.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 relative hover:border-emerald-300 transition shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Header Kartu */}
                      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700 pb-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black flex items-center justify-center flex-shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {item.title || `Kartu #${idx + 1}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveQuickLinkItem(idx, 'up')}
                            disabled={idx === 0}
                            className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Geser Naik"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveQuickLinkItem(idx, 'down')}
                            disabled={idx === (quickLinksConfig.items?.length || 0) - 1}
                            className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title="Geser Turun"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQuickLinkItem(idx)}
                            className="w-7 h-7 rounded-md border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition ml-1 cursor-pointer"
                            title="Hapus Kartu Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Input fields */}
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Judul Tombol
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateQuickLinkItemField(idx, 'title', e.target.value)}
                            placeholder="Misal: Administrasi Surat"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Keterangan Singkat
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateQuickLinkItemField(idx, 'description', e.target.value)
                            }
                            placeholder="Misal: Layanan surat keterangan mandiri"
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              Alamat URL Tujuan
                            </label>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Variabel:{' '}
                              <code className="bg-emerald-50 dark:bg-emerald-950 px-1 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-bold">
                                {'{tenant}'}
                              </code>
                            </span>
                          </div>
                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) => updateQuickLinkItemField(idx, 'url', e.target.value)}
                            placeholder="Misal: /layanan?tenant={tenant} atau #apbdes atau https://..."
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Pilih Ikon
                            </label>
                            <select
                              value={item.icon || 'globe'}
                              onChange={(e) =>
                                updateQuickLinkItemField(idx, 'icon', e.target.value)
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {QUICK_LINK_ICONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Aksen Warna
                            </label>
                            <select
                              value={item.color || 'emerald'}
                              onChange={(e) =>
                                updateQuickLinkItemField(idx, 'color', e.target.value)
                              }
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {QUICK_LINK_COLORS.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Buka di Jendela
                          </label>
                          <select
                            value={item.target || '_self'}
                            onChange={(e) =>
                              updateQuickLinkItemField(idx, 'target', e.target.value)
                            }
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="_self">Tab yang Sama (Halaman Ini)</option>
                            <option value="_blank">Tab Baru (Eksternal / WhatsApp / Blank)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tombol Simpan Modul Quick Links */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveHomepageModules}
                disabled={savingTheme}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {savingTheme ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : themeSaveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {savingTheme
                    ? 'Menyimpan...'
                    : themeSaveSuccess
                    ? 'Tersimpan ke Beranda!'
                    : 'Simpan Seluruh Pengaturan Modul'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: Lisensi & Fitur Sistem Desa                             */}
      {/* ============================================================== */}
      {mainTab === 'system_features' && (
        <div className="space-y-6 animate-in fade-in-50 duration-150">
          {/* Filter & Pencarian Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Kolom Pencarian */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari modul atau kata kunci deskripsi..."
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

            {/* Filter Status & Kategori */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Tabs */}
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
                  Semua ({modules.length})
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
                  Aktif ({enabledCount})
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
                  Nonaktif ({disabledCount})
                </button>
              </div>

              {/* Kategori Select */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="core">Inti Pemerintahan</option>
                <option value="content">Publikasi & Warta</option>
                <option value="economy">Ekonomi & UMKM</option>
                <option value="transparency">Transparansi</option>
                <option value="service">Layanan Warga</option>
                <option value="system">Sistem & Teknis</option>
              </select>
            </div>
          </div>

          {/* Tabel List Tampilan Modul (List Only View) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span>Memuat data modul sistem desa...</span>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="p-16 text-center text-slate-500 text-xs font-bold space-y-2">
                <Boxes className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
                <p>Tidak ada modul yang cocok dengan kriteria pencarian & filter Anda.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setCategoryFilter('all');
                  }}
                  className="mt-2 text-emerald-600 hover:underline cursor-pointer"
                >
                  Reset Filter Pencarian
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px] font-black">
                      <th className="py-3.5 px-4 text-center w-12">No</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Modul & Deskripsi Fitur</th>
                      <th className="py-3.5 px-4 min-w-[140px]">Kategori</th>
                      <th className="py-3.5 px-4 text-center min-w-[90px]">Versi</th>
                      <th className="py-3.5 px-4 min-w-[130px]">Status Lisensi</th>
                      <th className="py-3.5 px-5 text-right min-w-[150px]">Status & Saklar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredModules.map((mod, idx) => {
                      const isProcessing = togglingKey === mod.key;
                      const cat = CATEGORY_LABELS[mod.category] || {
                        label: mod.category,
                        color: 'bg-slate-100 text-slate-700 border-slate-200',
                      };

                      return (
                        <tr
                          key={mod.key}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            !mod.isEnabled ? 'opacity-70 bg-slate-50/30 dark:bg-slate-900/30' : ''
                          }`}
                        >
                          {/* Nomor Urut */}
                          <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>

                          {/* Nama Modul & Deskripsi */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-700/60">
                                {getModuleIcon(mod.key)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                                    {mod.name}
                                  </h3>
                                  <code className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    {mod.key}
                                  </code>
                                  {mod.isCore && (
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                      Inti
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  {mod.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Kategori Modul */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${cat.color}`}>
                              {cat.label}
                            </span>
                          </td>

                          {/* Versi Modul */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500 text-[11px] whitespace-nowrap">
                            v{mod.version}
                          </td>

                          {/* Status Lisensi / Paket */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {mod.isCore ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Standar Inti
                              </span>
                            ) : !mod.isAllowedByPlan ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-300">
                                <Lock className="w-3 h-3" />
                                Butuh {mod.minPlan}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {mod.planName}
                              </span>
                            )}
                          </td>

                          {/* Status Saklar On/Off */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-3">
                              <span
                                className={`text-[11px] font-black uppercase tracking-wider ${
                                  mod.isEnabled
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-400 dark:text-slate-500'
                                }`}
                              >
                                {mod.isEnabled ? 'Aktif' : 'Nonaktif'}
                              </span>

                              <button
                                type="button"
                                role="switch"
                                aria-checked={mod.isEnabled}
                                onClick={() => handleToggle(mod)}
                                disabled={isProcessing || !mod.isAllowedByPlan}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ${
                                  mod.isEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                    mod.isEnabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin text-slate-500" />
                                  ) : mod.isEnabled ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                                  ) : (
                                    <X className="w-2.5 h-2.5 text-slate-400 stroke-[3]" />
                                  )}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
