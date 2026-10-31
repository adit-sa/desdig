'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Pin,
  Trash2,
  Edit,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  Hourglass,
  CalendarOff,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import { formatAnnouncementDateTime } from '@/lib/timezone';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  status: string;
  expiresAt?: string | null;
  authorName?: string | null;
  createdAt: string;
}

export default function PengumumanAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [list, setList] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentYear, setCurrentYear] = useState<string>('2026');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ALL' | 'EXPIRED'>('ACTIVE'); // DEFAULT AKTIF
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const yr = new Date().getFullYear().toString();
    setCurrentYear(yr);
    setSelectedYear(yr); // DEFAULT TAHUN INI
  }, []);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string>(''); // YYYY-MM-DD or empty
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/announcements?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.announcements) setList(data.announcements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [currentTenantId]);

  // Check if announcement is expired
  const isItemExpired = (item: AnnouncementItem): boolean => {
    if (!item.expiresAt) return false;
    return new Date(item.expiresAt).getTime() < Date.now();
  };

  // Available Years
  const availableYears = useMemo(() => {
    const current = currentYear;
    const years = new Set<string>([current]);
    list.forEach((item) => {
      if (item.createdAt) {
        const y = new Date(item.createdAt).getFullYear().toString();
        if (y && !isNaN(Number(y))) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [list, currentYear]);

  // Filtered List
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const expired = isItemExpired(item);

      // Status filter
      if (statusFilter === 'ACTIVE' && expired) return false;
      if (statusFilter === 'EXPIRED' && !expired) return false;

      // Year filter
      if (selectedYear !== 'ALL') {
        const itemYear = new Date(item.createdAt).getFullYear().toString();
        if (itemYear !== selectedYear) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchContent = item.content?.toLowerCase().includes(q);
        if (!matchTitle && !matchContent) return false;
      }

      return true;
    });
  }, [list, statusFilter, selectedYear, searchQuery]);

  // Grouped by Year
  const groupedByYear = useMemo(() => {
    const groups: { [year: string]: AnnouncementItem[] } = {};
    filteredList.forEach((item) => {
      const yr = new Date(item.createdAt).getFullYear().toString() || 'Lainnya';
      if (!groups[yr]) groups[yr] = [];
      groups[yr].push(item);
    });

    // Sort years descending
    const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedYears.map((yr) => ({
      year: yr,
      items: groups[yr],
    }));
  }, [filteredList]);

  // Counts for Badges
  const counts = useMemo(() => {
    const total = list.length;
    const expiredCount = list.filter((i) => isItemExpired(i)).length;
    const activeCount = total - expiredCount;
    return { total, activeCount, expiredCount };
  }, [list]);

  const handleOpenModal = (item?: AnnouncementItem) => {
    if (item) {
      setEditingId(item.id);
      setTitle(item.title);
      setContent(item.content);
      setIsPinned(item.isPinned);
      setExpiresAt(
        item.expiresAt ? new Date(item.expiresAt).toISOString().split('T')[0] : ''
      );
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setExpiresAt('');
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleSetQuickExpiry = (days: number | null) => {
    if (days === null) {
      setExpiresAt('');
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setExpiresAt(d.toISOString().split('T')[0]);
  };

  const handleSetEndOfMonth = () => {
    const d = new Date();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setExpiresAt(end.toISOString().split('T')[0]);
  };

  const handleSetEndOfYear = () => {
    const d = new Date();
    const end = new Date(d.getFullYear(), 11, 31);
    setExpiresAt(end.toISOString().split('T')[0]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengumuman ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) fetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId
        ? `/api/announcements/${editingId}`
        : `/api/announcements?tenant=${currentTenantId}`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          isPinned,
          status: 'PUBLISHED',
          expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null,
          tenantSlug: currentTenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan pengumuman');
        return;
      }

      setIsModalOpen(false);
      fetchList();
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Papan Pengumuman & Edaran Desa
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kelola maklumat publik, jadwal kegiatan, dan masa kedaluwarsa tayang untuk{' '}
                <strong className="text-amber-600 dark:text-amber-400">
                  Desa {activeTenant?.nama_desa}
                </strong>
                .
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Buat Pengumuman Baru
        </button>
      </div>

      {/* Filter Bar (Status & Tahun & Pencarian) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Status Tabs: Aktif (Default) / Semua / Kedaluwarsa */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aktif Berjalan</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {counts.activeCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Semua</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              statusFilter === 'EXPIRED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Kedaluwarsa</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === 'EXPIRED'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {counts.expiredCount}
            </span>
          </button>
        </div>

        {/* Filter Tahun Grouping */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <span>Tahun:</span>
          </div>

          <button
            onClick={() => setSelectedYear(currentYear)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              selectedYear === currentYear
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            ★ {currentYear} (Tahun Ini)
          </button>

          {availableYears
            .filter((yr) => yr !== currentYear)
            .map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                  selectedYear === yr
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}

          <button
            onClick={() => setSelectedYear('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
              selectedYear === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Semua Tahun
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengumuman..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Konten Berdasarkan Grouping Tahun */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Memuat data pengumuman...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Tidak ada pengumuman ditemukan
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilter === 'ACTIVE'
              ? `Belum ada pengumuman aktif untuk tahun ${selectedYear === 'ALL' ? 'semua' : selectedYear}.`
              : statusFilter === 'EXPIRED'
              ? 'Tidak ada pengumuman yang kedaluwarsa.'
              : 'Belum ada data pengumuman.'}
          </p>
          {statusFilter === 'ACTIVE' && counts.expiredCount > 0 && (
            <button
              onClick={() => setStatusFilter('ALL')}
              className="mt-3 text-xs font-bold text-amber-600 hover:underline"
            >
              Lihat Semua Pengumuman (termasuk yang telah kedaluwarsa)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByYear.map((group) => (
            <div key={group.year} className="space-y-4">
              {/* Header Group Tahun */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3.5 py-1.5 rounded-xl text-amber-800 dark:text-amber-300 font-extrabold text-sm">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Tahun {group.year}</span>
                  <span className="text-xs font-semibold bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded-md ml-1 text-slate-700 dark:text-slate-300 border border-amber-200/50">
                    {group.items.length} Pengumuman
                  </span>
                </div>
                <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
              </div>

              {/* Grid Kartu Pengumuman pada Tahun Ini */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((item) => {
                  const expired = isItemExpired(item);
                  return (
                    <div
                      key={item.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                        expired
                          ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
                          : item.isPinned
                          ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Top Meta: Tanggal Terbit, Status Expired, Pin */}
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            {formatAnnouncementDateTime(item.createdAt, activeTenant?.provinsi)}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Status Expired Badge */}
                            {expired ? (
                              <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                                <CalendarOff className="w-3 h-3 text-rose-600" />
                                Kedaluwarsa
                              </span>
                            ) : item.expiresAt ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                <Hourglass className="w-3 h-3 text-emerald-600" />
                                s.d. {new Date(item.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Permanen
                              </span>
                            )}

                            {/* Pin Badge */}
                            {item.isPinned && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                <Pin className="w-2.5 h-2.5 fill-amber-700" />
                                Disematkan
                              </span>
                            )}
                          </div>
                        </div>

                        <h3 className={`font-bold text-base text-slate-900 dark:text-white mb-2 leading-snug ${expired ? 'line-through text-slate-500' : ''}`}>
                          {item.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line line-clamp-4">
                          {item.content}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
                          {item.authorName && (
                            <span className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200/50">
                              Oleh: {item.authorName}
                            </span>
                          )}
                          <span>
                            {item.expiresAt ? (
                              <span>Batas: {new Date(item.expiresAt).toLocaleDateString('id-ID')}</span>
                            ) : (
                              <span>Tanpa batas kedaluwarsa</span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Sunting Pengumuman & Masa Tayang"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Hapus Pengumuman"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Pengumuman */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {editingId ? 'Sunting Pengumuman' : 'Tulis Pengumuman Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Tentukan batas tanggal kedaluwarsa agar pengumuman tidak menumpuk usai kegiatan.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Pengumuman *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jadwal Posyandu Balita & Pembagian PMT Desa"
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Maklumat / Pengumuman *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Jelaskan jadwal, lokasi, sasaran warga, dan informasi penting lainnya..."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white leading-relaxed"
                />
              </div>

              {/* FITUR EXPIRED POST */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-amber-600" />
                    Batas Tayang / Kedaluwarsa (Expired Post)
                  </label>
                  {expiresAt && (
                    <button
                      type="button"
                      onClick={() => setExpiresAt('')}
                      className="text-[11px] text-rose-600 hover:underline font-bold"
                    >
                      Hapus Batas (Permanen)
                    </button>
                  )}
                </div>

                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                />

                {/* Preset Cepat */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-400 font-semibold mr-1">Preset:</span>
                  <button
                    type="button"
                    onClick={() => handleSetQuickExpiry(7)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                  >
                    +7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickExpiry(14)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                  >
                    +14 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetQuickExpiry(30)}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                  >
                    +30 Hari
                  </button>
                  <button
                    type="button"
                    onClick={handleSetEndOfMonth}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                  >
                    Akhir Bulan
                  </button>
                  <button
                    type="button"
                    onClick={handleSetEndOfYear}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                  >
                    Akhir Tahun
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {expiresAt
                    ? `Pengumuman akan otomatis ditandai kedaluwarsa setelah tanggal ${new Date(expiresAt).toLocaleDateString('id-ID')}.`
                    : 'Kosongkan jika pengumuman ini berlaku terus (permanen).'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label
                  htmlFor="pinCheck"
                  className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Sematkan di baris paling atas (Pin to top)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Menyimpan...'
                    : editingId
                    ? 'Simpan Perubahan'
                    : 'Terbitkan Pengumuman'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
