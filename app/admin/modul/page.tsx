'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

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
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  useEffect(() => {
    fetchModules();
  }, [currentTenantId]);

  const handleToggle = async (mod: ModuleItem) => {
    if (!mod.isAllowedByPlan) {
      alert(`Modul "${mod.name}" membutuhkan paket yang lebih tinggi (${mod.planName}). Silakan upgrade paket langganan desa.`);
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
      case 'profile': return <Building2 className="w-4 h-4 text-emerald-600" />;
      case 'news': return <Newspaper className="w-4 h-4 text-blue-600" />;
      case 'announcements': return <Megaphone className="w-4 h-4 text-amber-600" />;
      case 'events': return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'gallery': return <Image className="w-4 h-4 text-pink-600" />;
      case 'documents': return <FileText className="w-4 h-4 text-teal-600" />;
      case 'tourism': return <Compass className="w-4 h-4 text-orange-600" />;
      case 'umkm': return <ShoppingBag className="w-4 h-4 text-indigo-600" />;
      case 'apbdes': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'complaints': return <MessageSquare className="w-4 h-4 text-rose-600" />;
      case 'services': return <MailCheck className="w-4 h-4 text-cyan-600" />;
      case 'statistics': return <BarChart3 className="w-4 h-4 text-amber-600" />;
      case 'ppid': return <ShieldCheck className="w-4 h-4 text-emerald-700" />;
      case 'seo': return <Globe className="w-4 h-4 text-blue-500" />;
      case 'analytics': return <Activity className="w-4 h-4 text-violet-600" />;
      default: return <Boxes className="w-4 h-4 text-slate-600" />;
    }
  };

  const enabledCount = modules.filter((m) => m.isEnabled).length;
  const disabledCount = modules.length - enabledCount;

  // Filter daftar modul berdasarkan pencarian, status, dan kategori
  const filteredModules = useMemo(() => {
    return modules.filter((mod) => {
      // 1. Filter status
      if (statusFilter === 'enabled' && !mod.isEnabled) return false;
      if (statusFilter === 'disabled' && mod.isEnabled) return false;

      // 2. Filter kategori
      if (categoryFilter !== 'all' && mod.category !== categoryFilter) return false;

      // 3. Filter teks pencarian
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
            <span className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Boxes className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Manajemen Modul & Fitur Layanan Desa
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5" suppressHydrationWarning>
            Aktifkan atau nonaktifkan modul publik untuk{' '}
            <strong className="text-emerald-700 font-bold" suppressHydrationWarning>
              Desa {activeTenant?.nama_desa || ''}
            </strong>. Menonaktifkan modul tidak menghapus data tersimpan di basis data.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Total Modul Aktif</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
              {enabledCount} <span className="text-xs font-semibold text-slate-500">/ {modules.length} Fitur</span>
            </span>
          </div>

          <button
            type="button"
            onClick={fetchModules}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Muat ulang data modul"
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
              className={`px-3 py-1.5 rounded-lg transition ${
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
              className={`px-3 py-1.5 rounded-lg transition ${
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
              className={`px-3 py-1.5 rounded-lg transition ${
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
              className="mt-2 text-emerald-600 hover:underline"
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
                            Upgrade ({mod.planName})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Termasuk Paket
                          </span>
                        )}
                      </td>

                      {/* Status Aktif & Saklar Toggle */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          {mod.isEnabled ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Nonaktif
                            </span>
                          )}

                          <label className={`relative inline-flex items-center ${isProcessing || !mod.isAllowedByPlan ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                              type="checkbox"
                              checked={mod.isEnabled}
                              disabled={isProcessing || !mod.isAllowedByPlan}
                              onChange={() => handleToggle(mod)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                          </label>

                          {isProcessing && (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
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
    </div>
  );
}
