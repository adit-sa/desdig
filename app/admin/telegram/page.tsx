'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  Check,
  Copy,
  RefreshCw,
  Key,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Unlink,
  Search,
  Filter,
  Sparkles,
  User,
  Info,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Radio,
  Clock,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface TelegramUser {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  pairedAt: string;
}

interface OfficialTelegramItem {
  id: string;
  name: string;
  position: string;
  nip: string | null;
  photoUrl: string | null;
  isActive: boolean;
  telegramToken: string | null;
  subscribers: TelegramUser[];
}

interface TelegramPageData {
  tenant: {
    id: string;
    slug: string;
    namaDesa: string;
    generalToken: string;
    hasCustomToken: boolean;
    telegramAttachWindowMinutes: number;
  };
  bot: {
    configured: boolean;
    username: string | null;
    name: string;
  };
  officials: OfficialTelegramItem[];
  unassignedSubscribers: TelegramUser[];
}

export default function TelegramAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [data, setData] = useState<TelegramPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONNECTED' | 'DISCONNECTED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [customTokenModal, setCustomTokenModal] = useState<{
    isOpen: boolean;
    officialId: string | null;
    officialName?: string;
    currentToken: string;
  }>({
    isOpen: false,
    officialId: null,
    currentToken: '',
  });
  const [customTokenValue, setCustomTokenValue] = useState('');
  const [attachWindow, setAttachWindow] = useState<number>(5);

  const currentSlug = currentTenantId || activeTenant?.slug || '';

  const fetchData = async () => {
    if (!currentSlug) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/telegram/officials?tenant=${encodeURIComponent(currentSlug)}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (typeof json.tenant?.telegramAttachWindowMinutes === 'number') {
          setAttachWindow(json.tenant.telegramAttachWindowMinutes);
        }
      }
    } catch (err) {
      console.error('Failed to load telegram officials data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentSlug]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Generate Token (Pamong atau Umum)
  const handleGenerateToken = async (officialId?: string) => {
    const targetKey = officialId || 'general';
    try {
      setActionLoadingId(`gen-${targetKey}`);
      const res = await fetch('/api/telegram/officials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentSlug,
          action: 'generate_token',
          officialId: officialId || null,
        }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Gagal membuat token');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Simpan Custom Token
  const handleSaveCustomToken = async () => {
    if (!customTokenValue.trim() || customTokenValue.trim().length < 4) {
      alert('Token minimal 4 karakter!');
      return;
    }

    try {
      setActionLoadingId('save-custom-token');
      const res = await fetch('/api/telegram/officials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentSlug,
          action: 'set_token',
          officialId: customTokenModal.officialId || null,
          token: customTokenValue.trim(),
        }),
      });
      const result = await res.json();
      if (result.success) {
        setCustomTokenModal({ isOpen: false, officialId: null, currentToken: '' });
        setCustomTokenValue('');
        await fetchData();
      } else {
        alert(result.error || 'Gagal menyimpan token');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Putuskan Sambungan (Unlink)
  const handleUnlink = async (subscriberId: string, name: string) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin memutuskan sambungan akun Telegram "${name}"? Pengguna harus login ulang untuk dapat posting.`
    );
    if (!confirmDelete) return;

    try {
      setActionLoadingId(`unlink-${subscriberId}`);
      const res = await fetch('/api/telegram/officials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentSlug,
          action: 'unlink_subscriber',
          subscriberId,
        }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Gagal memutuskan sambungan');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Simpan Jeda Waktu Foto Susulan Otomatis
  const handleUpdateAttachWindow = async (minutes: number) => {
    try {
      setActionLoadingId('save-attach-window');
      setAttachWindow(minutes);
      const res = await fetch('/api/telegram/officials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentSlug,
          action: 'update_attach_window',
          minutes,
        }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchData();
      } else {
        alert(result.error || 'Gagal menyimpan pengaturan jeda waktu');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter & Search pamong
  const filteredOfficials = useMemo(() => {
    if (!data?.officials) return [];
    return data.officials.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nip && item.nip.includes(searchQuery));

      const isConnected = item.subscribers.length > 0;
      const matchFilter =
        filterStatus === 'ALL' ||
        (filterStatus === 'CONNECTED' && isConnected) ||
        (filterStatus === 'DISCONNECTED' && !isConnected);

      return matchSearch && matchFilter;
    });
  }, [data?.officials, searchQuery, filterStatus]);

  // Statistik Ringkasan
  const stats = useMemo(() => {
    if (!data?.officials) {
      return { total: 0, connected: 0, disconnected: 0, unassigned: 0 };
    }
    const total = data.officials.length;
    const connected = data.officials.filter((o) => o.subscribers.length > 0).length;
    const disconnected = total - connected;
    const unassigned = data.unassignedSubscribers.length;
    return { total, connected, disconnected, unassigned };
  }, [data]);

  const villageName = data?.tenant.namaDesa || 'Desa';
  const botLink = data?.bot.username ? `https://t.me/${data.bot.username}` : '#';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-inner">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Integrasi Bot Telegram desDig
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Mobile Publishing
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Kelola kode pairing rahasia per pamong desa agar publikasi berita, pengumuman, dan galeri kegiatan dari HP tercatat dengan nama penanggung jawab resmi secara akuntabel.
            </p>
          </div>
        </div>

        {/* Status Bot & Link Akses */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          {data?.bot.configured ? (
            <a
              href={botLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-4 h-4" />
              <span>Buka Bot Telegram {data.bot.username ? `(@${data.bot.username})` : ''}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Bot belum dikonfigurasi di server (.env)</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Kartu Statistik Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Aparatur</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">pamong</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Pamong Terhubung</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.connected}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">terautentikasi</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Belum Terhubung</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {stats.disconnected}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">belum pairing</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">Operator Umum</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">
              {stats.unassigned}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">sesi aktif</span>
          </div>
        </div>
      </div>

      {/* 3. Panduan Cepat & Format Perintah (Collapsible Banner) */}
      <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-blue-50 dark:from-slate-900 dark:via-sky-950/30 dark:to-slate-900 border border-sky-100 dark:border-sky-900/60 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowGuide(!showGuide)}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                Cara Kerja & Format Perintah Posting Bot Telegram
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Panduan praktis bagi Pamong Desa untuk menerbitkan konten langsung dari genggaman HP.
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            {showGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showGuide && (
          <div className="mt-5 pt-5 border-t border-sky-200/60 dark:border-sky-900/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[10px]">1</span>
                <span>Langkah 1: Pairing Akun</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Pamong membuka bot Telegram, lalu kirim perintah:
              </p>
              <code className="block p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-mono text-[11px] break-all">
                /login {villageName} [kode_rahasia]
              </code>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Nama desa fleksibel (bisa menggunakan spasi seperti <i>Sinjai Tengah</i> atau slug <i>sinjai-tengah</i>).
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[10px]">2</span>
                <span>Langkah 2: Posting Konten</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>
                  📸 <b>Berita Warta Desa</b>: Kirim foto + caption teks. Foto otomatis dikonversi ke WebP dan baris pertama jadi judul.
                </li>
                <li>
                  📢 <b>Papan Pengumuman</b>: Ketik <code>/pengumuman [isi teks]</code>.
                </li>
                <li>
                  🖼️ <b>Galeri Foto</b>: Kirim foto + caption <code>/galeri [judul foto]</code> (bisa kirim banyak foto sekaligus).
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 flex items-center justify-center text-[10px]">3</span>
                <span>Langkah 3: Tracking Akuntabilitas</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Setiap berita, galeri, dan pengumuman yang diterbitkan akan otomatis mencatat nama pamong yang mengirimkannya.
              </p>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px]">
                ✓ Transparan & Akuntabel: Mencegah posting liar tanpa penanggung jawab.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Daftar Pamong Desa & Token Pairing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-500" />
              <span>Daftar Pamong Desa & Akses Telegram</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola token individual setiap pamong agar postingan dapat dilacak sesuai nama aparatur.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pamong / jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-56"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterStatus('CONNECTED')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === 'CONNECTED'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Terhubung
              </button>
              <button
                onClick={() => setFilterStatus('DISCONNECTED')}
                className={`px-3 py-1 rounded-lg transition ${
                  filterStatus === 'DISCONNECTED'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Belum
              </button>
            </div>
          </div>
        </div>

        {/* Tabel / Daftar Pamong */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-500 mb-2" />
            <p className="text-xs">Memuat daftar aparatur & konfigurasi bot...</p>
          </div>
        ) : filteredOfficials.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">Tidak ada data pamong desa yang sesuai kriteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Pamong / Aparatur</th>
                  <th className="py-3 px-4">Status Akun Telegram</th>
                  <th className="py-3 px-4">Kode Token Pairing</th>
                  <th className="py-3 px-4 text-right">Aksi & Perintah Login</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredOfficials.map((official) => {
                  const hasSubscribers = official.subscribers.length > 0;
                  const token = official.telegramToken;
                  const loginCommand = `/login ${villageName} ${token || 'KODE_TOKEN'}`;
                  const waShareText = encodeURIComponent(
                    `Halo Bapak/Ibu ${official.name} (${official.position}),\n\n` +
                    `Berikut akses publikasi resmi Desa ${villageName} melalui Bot Telegram desDig:\n\n` +
                    `1. Buka Bot Telegram: ${botLink}\n` +
                    `2. Kirim perintah login:\n${loginCommand}\n\n` +
                    `Setelah terhubung, Anda dapat menerbitkan Berita, Galeri Foto, dan Pengumuman langsung dari HP Anda.`
                  );

                  return (
                    <tr
                      key={official.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* 1. Nama & Jabatan */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            {official.photoUrl ? (
                              <img
                                src={official.photoUrl}
                                alt={official.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {official.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {official.position} {official.nip ? `• NIP: ${official.nip}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Status Telegram */}
                      <td className="py-3.5 px-4">
                        {hasSubscribers ? (
                          <div className="space-y-1">
                            {official.subscribers.map((sub) => (
                              <div
                                key={sub.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>
                                  {sub.username ? `@${sub.username}` : sub.firstName || 'Pengguna TG'}
                                </span>
                                <button
                                  title="Putuskan sambungan"
                                  disabled={actionLoadingId === `unlink-${sub.id}`}
                                  onClick={() => handleUnlink(sub.id, official.name)}
                                  className="ml-1 text-emerald-600 hover:text-red-500 transition p-0.5 rounded"
                                >
                                  <Unlink className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Belum Terhubung
                          </span>
                        )}
                      </td>

                      {/* 3. Token Pairing */}
                      <td className="py-3.5 px-4">
                        {token ? (
                          <div className="flex items-center gap-2">
                            <code className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sky-700 dark:text-sky-300 select-all text-xs">
                              {token}
                            </code>
                            <button
                              title="Acak token baru"
                              disabled={actionLoadingId === `gen-${official.id}`}
                              onClick={() => handleGenerateToken(official.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${
                                  actionLoadingId === `gen-${official.id}` ? 'animate-spin' : ''
                                }`}
                              />
                            </button>
                            <button
                              title="Ubah token manual"
                              onClick={() => {
                                setCustomTokenModal({
                                  isOpen: true,
                                  officialId: official.id,
                                  officialName: official.name,
                                  currentToken: token,
                                });
                                setCustomTokenValue(token);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            disabled={actionLoadingId === `gen-${official.id}`}
                            onClick={() => handleGenerateToken(official.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-[11px] transition"
                          >
                            <Sparkles className="w-3 h-3 text-sky-500" />
                            <span>Buat Token</span>
                          </button>
                        )}
                      </td>

                      {/* 4. Aksi & Perintah Salin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {token && (
                            <>
                              <button
                                onClick={() => copyToClipboard(loginCommand, official.id)}
                                title="Salin perintah login Telegram"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] transition"
                              >
                                {copiedId === official.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-slate-500" />
                                    <span>Salin Login</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={`https://api.whatsapp.com/send?text=${waShareText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Kirim instruksi login via WhatsApp"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] transition"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-500" />
                                <span>Kirim WA</span>
                              </a>
                            </>
                          )}
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

      {/* 5. Token Akses Operator Umum Desa */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-sky-500" />
              <span>Token Akses Operator Umum Desa</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gunakan token ini untuk staf redaksi/admin umum yang belum didaftarkan di aparatur desa. Konten akan berlabel <i>Operator Desa</i>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={actionLoadingId === 'gen-general'}
              onClick={() => handleGenerateToken()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${actionLoadingId === 'gen-general' ? 'animate-spin' : ''}`}
              />
              <span>Acak Token Umum</span>
            </button>
            <button
              onClick={() => {
                setCustomTokenModal({
                  isOpen: true,
                  officialId: null,
                  officialName: `Umum Desa ${villageName}`,
                  currentToken: data?.tenant.generalToken || '',
                });
                setCustomTokenValue(data?.tenant.generalToken || '');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Ubah Manual</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Token Rahasia Umum
            </span>
            <div className="flex items-center gap-2">
              <code className="text-base font-black font-mono text-slate-900 dark:text-white select-all">
                {data?.tenant.generalToken || 'DESA-1234'}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(
                    `/login ${villageName} ${data?.tenant.generalToken || ''}`,
                    'general-token'
                  )
                }
                className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition shadow-sm"
              >
                {copiedId === 'general-token' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Perintah Login</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Perintah login: <code>/login {villageName} {data?.tenant.generalToken}</code>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Sesi Operator Umum Aktif ({data?.unassignedSubscribers.length || 0})
            </span>
            {data?.unassignedSubscribers && data.unassignedSubscribers.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {data.unassignedSubscribers.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {sub.username ? `@${sub.username}` : sub.firstName || 'Operator Telegram'}
                      </span>
                    </div>
                    <button
                      title="Putuskan sesi"
                      disabled={actionLoadingId === `unlink-${sub.id}`}
                      onClick={() => handleUnlink(sub.id, sub.username || 'Operator')}
                      className="text-slate-400 hover:text-red-500 p-1 transition"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Belum ada operator umum yang terhubung via token ini.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6. Pengaturan Jeda Waktu Foto Susulan Otomatis */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-500" />
              <span>Jeda Waktu Penyematan Foto Susulan Otomatis</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tentukan batas jeda waktu di mana foto tambahan yang dikirim tanpa teks (caption) akan otomatis disematkan ke dalam artikel warta atau galeri terbaru.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {attachWindow === 0 ? 'Nonaktif' : `Aktif: ${attachWindow} Menit`}
              </span>
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { minutes: 2, label: '2 Menit', desc: 'Singkat' },
              { minutes: 5, label: '5 Menit', desc: 'Standar (Disarankan)' },
              { minutes: 10, label: '10 Menit', desc: 'Santai' },
              { minutes: 15, label: '15 Menit', desc: 'Leluasa' },
              { minutes: 30, label: '30 Menit', desc: 'Panjang' },
              { minutes: 0, label: 'Nonaktif (0)', desc: 'Setiap foto jadi artikel baru' },
            ].map((opt) => {
              const isSelected = attachWindow === opt.minutes;

              return (
                <button
                  key={opt.minutes}
                  disabled={actionLoadingId === 'save-attach-window'}
                  onClick={() => handleUpdateAttachWindow(opt.minutes)}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-400 dark:border-sky-600 ring-2 ring-sky-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-sm font-black ${isSelected ? 'text-sky-700 dark:text-sky-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {opt.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            💡 <b>Tips:</b> Jika pamong sering mengambil foto di lapangan dan mengirimkannya satu per satu, atur ke <b>5 Menit</b> atau <b>10 Menit</b> agar seluruh foto otomatis disematkan ke warta/galeri yang baru saja dibuat tanpa terpisah-pisah.
          </p>
        </div>
      </div>

      {/* 7. Modal Custom Token */}
      {customTokenModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-sky-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Ubah Kode Token Rahasia
                </h3>
              </div>
              <button
                onClick={() => setCustomTokenModal({ isOpen: false, officialId: null, currentToken: '' })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Menyetel kode token rahasia untuk:{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  {customTokenModal.officialName}
                </strong>
              </p>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Kode Token Baru (Minimal 4 Karakter)
              </label>
              <input
                type="text"
                value={customTokenValue}
                onChange={(e) => setCustomTokenValue(e.target.value)}
                placeholder="Contoh: KADES-2026 atau PMG-78A1"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[11px] text-slate-400 mt-1.5 block">
                Pamong harus memasukkan kode ini saat mengirim perintah <code>/login</code> di bot Telegram.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setCustomTokenModal({ isOpen: false, officialId: null, currentToken: '' })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                disabled={actionLoadingId === 'save-custom-token'}
                onClick={handleSaveCustomToken}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition shadow-sm flex items-center gap-1.5"
              >
                {actionLoadingId === 'save-custom-token' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Simpan Token</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
