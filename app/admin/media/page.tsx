'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FolderOpen,
  Image as ImageIcon,
  HardDrive,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Layers,
  Sparkles,
  Zap,
  Info,
  X,
  FileCheck2,
  FileQuestion,
  LayoutGrid,
  List,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface MediaItem {
  id: string;
  name: string;
  folder: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  isImage: boolean;
  isUsed: boolean;
  usedIn: string[];
}

interface MediaStats {
  totalFiles: number;
  totalSize: number;
  totalSizeFormatted: string;
  totalUsed: number;
  totalUnused: number;
}

export default function AdminMediaPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [mounted, setMounted] = useState(false);

  // Data states
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [stats, setStats] = useState<MediaStats>({
    totalFiles: 0,
    totalSize: 0,
    totalSizeFormatted: '0 B',
    totalUsed: 0,
    totalUnused: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size_desc' | 'size_asc'>('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // UI Modes & Selections
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Action states
  const [deletingUrls, setDeletingUrls] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProgress, setDeletingProgress] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState(false);
  const [compressingUrl, setCompressingUrl] = useState<string | null>(null);
  const [batchCompressing, setBatchCompressing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState('galeri');
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const tenantSlug = mounted ? (currentTenantId || activeTenant?.slug || '') : '';

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch Media Data
  const fetchMedia = async (isCancelled?: () => boolean) => {
    if (!tenantSlug) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        tenant: tenantSlug,
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
        sort: sortBy,
      });
      if (selectedFolder !== 'all') {
        params.append('folder', selectedFolder);
      }
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();

      if (!isCancelled || !isCancelled()) {
        if (data.success) {
          setFiles(data.files || []);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalFiltered(data.pagination.total || 0);
          }
          if (data.folders) {
            setFolders(data.folders);
          }
          if (data.stats) {
            setStats(data.stats);
          }
        } else {
          setError(data.error || 'Gagal memuat pustaka media');
        }
      }
    } catch (err: any) {
      if (!isCancelled || !isCancelled()) {
        console.error('Fetch media error:', err);
        setError(err.message || 'Gagal memuat media dari server');
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    if (tenantSlug) {
      fetchMedia(isCancelled);
    }
    return () => {
      cancelled = true;
    };
  }, [tenantSlug, page, limit, selectedFolder, statusFilter, sortBy, debouncedSearch]);

  // Handle Copy URL
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Tautan berkas berhasil disalin ke papan klip!', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  // Handle Single Compress
  const handleCompress = async (item: MediaItem) => {
    try {
      setCompressingUrl(item.url);
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compress',
          tenant: tenantSlug,
          url: item.url,
          quality: 82,
        }),
      });
      const data = await res.json();
      if (data.success && data.results?.[0]?.success) {
        const r = data.results[0];
        showToast(
          `Kompresi WebP berhasil! Hemat ${r.savingsPercent}% (${(r.savingsBytes / 1024).toFixed(1)} KB)`,
          'success'
        );
        fetchMedia();
      } else {
        showToast(data.error || 'Gagal mengompresi gambar', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat kompresi: ' + err.message, 'error');
    } finally {
      setCompressingUrl(null);
    }
  };

  // Handle Batch Compress
  const handleBatchCompress = async () => {
    if (selectedUrls.length === 0) return;
    if (!confirm(`Mulai optimasi kompresi WebP untuk ${selectedUrls.length} berkas terpilih?`)) return;

    try {
      setBatchCompressing(true);
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compress',
          tenant: tenantSlug,
          urls: selectedUrls,
          quality: 82,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Berhasil mengoptimalkan ${data.totalCompressed} berkas media ke format WebP!`, 'success');
        setSelectedUrls([]);
        fetchMedia();
      } else {
        showToast(data.error || 'Gagal memproses kompresi massal', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan: ' + err.message, 'error');
    } finally {
      setBatchCompressing(false);
    }
  };

  // Trigger Delete confirmation
  const triggerDelete = (urls: string[]) => {
    setDeletingUrls(urls);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (deletingUrls.length === 0) return;
    try {
      setDeletingProgress(true);
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          urls: deletingUrls,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `${data.deletedCount} berkas berhasil dihapus`, 'success');
        setIsDeleteModalOpen(false);
        setDeletingUrls([]);
        setSelectedUrls((prev) => prev.filter((u) => !deletingUrls.includes(u)));
        fetchMedia();
      } else {
        showToast(data.error || 'Gagal menghapus berkas', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat menghapus: ' + err.message, 'error');
    } finally {
      setDeletingProgress(false);
    }
  };

  // Handle Cleanup All Orphan Files
  const handleCleanupOrphans = async () => {
    try {
      setCleanupProgress(true);
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          cleanupOrphans: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Berhasil membersihkan ${data.deletedCount} berkas yatim!`, 'success');
        setIsCleanupModalOpen(false);
        setSelectedUrls([]);
        fetchMedia();
      } else {
        showToast(data.error || 'Gagal membersihkan berkas yatim', 'error');
      }
    } catch (err: any) {
      showToast('Terjadi kesalahan saat membersihkan: ' + err.message, 'error');
    } finally {
      setCleanupProgress(false);
    }
  };

  // Handle Upload File Baru
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);
      let successCount = 0;

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const data = new FormData();
        data.append('file', file);
        data.append('tenant', tenantSlug);
        data.append('folder', uploadFolder);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        });
        const json = await res.json();
        if (json.success) {
          successCount++;
        }
      }

      showToast(`Berhasil mengunggah ${successCount} foto baru dengan kompresi WebP standar!`, 'success');
      setUploadModalOpen(false);
      fetchMedia();
    } catch (err: any) {
      showToast('Gagal mengunggah foto: ' + err.message, 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle selection
  const toggleSelectUrl = (url: string) => {
    setSelectedUrls((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  const handleSelectAllInPage = () => {
    const pageUrls = files.map((f) => f.url);
    const allSelected = pageUrls.every((u) => selectedUrls.includes(u));
    if (allSelected) {
      setSelectedUrls((prev) => prev.filter((u) => !pageUrls.includes(u)));
    } else {
      setSelectedUrls((prev) => Array.from(new Set([...prev, ...pageUrls])));
    }
  };

  const selectedUsedItems = useMemo(() => {
    return files.filter((f) => deletingUrls.includes(f.url) && f.isUsed);
  }, [files, deletingUrls]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in slide-in-from-bottom-5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/40 backdrop-blur-md'
              : toastMessage.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-500/40 backdrop-blur-md'
              : 'bg-slate-900/90 text-slate-100 border-slate-700 backdrop-blur-md'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 mb-1">
              <Link href="/admin" className="hover:underline">Dashboard</Link>
              <span>&rsaquo;</span>
              <span>Informasi</span>
              <span>&rsaquo;</span>
              <span className="text-white">Pustaka Media</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-emerald-400 shrink-0" />
              Pustaka Media & Foto Server
            </h1>
            <p className="mt-1 text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Arsip terpusat penyimpanan foto dan dokumentasi desa <strong>{activeTenant?.nama_desa}</strong>. Audit file terintegrasi vs file yatim, kompresi otomatis WebP standar web, dan bersihkan berkas yang tidak terpakai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchMedia()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition backdrop-blur-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </button>
            {stats.totalUnused > 0 && (
              <button
                onClick={() => setIsCleanupModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
                title="Bersihkan seluruh berkas yatim yang tidak terhubung dengan database"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Cleanup File Yatim ({stats.totalUnused.toLocaleString('id-ID')})</span>
              </button>
            )}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Foto Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Berkas */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Berkas Tersimpan</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFiles.toLocaleString('id-ID')}</span>
            <span className="text-xs text-slate-500">File Foto</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
            Tersimpan di Cloud Storage R2 & Server Desa
          </div>
        </div>

        {/* Card 2: Ukuran Storage */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Penggunaan Ruang Disk</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <HardDrive className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSizeFormatted}</span>
            <span className="text-xs text-slate-500">Data Media</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
            Kapasitas media terpakai untuk desa ini
          </div>
        </div>

        {/* Card 3: Terintegrasi */}
        <div
          onClick={() => { setStatusFilter('used'); setPage(1); }}
          className={`rounded-xl border p-5 shadow-sm cursor-pointer transition ${
            statusFilter === 'used'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">🟢 Terintegrasi Aktif</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalUsed.toLocaleString('id-ID')}</span>
            <span className="text-xs text-slate-500">Berkas</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800 flex items-center justify-between">
            <span>Dipakai di Berita/Galeri/Pamong</span>
            <span className="text-emerald-600 font-bold">&rarr;</span>
          </div>
        </div>

        {/* Card 4: Yatim / Tidak Terpakai */}
        <div
          onClick={() => { setStatusFilter('unused'); setPage(1); }}
          className={`rounded-xl border p-5 shadow-sm cursor-pointer transition flex flex-col justify-between ${
            statusFilter === 'unused'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">🟡 File Yatim (Tidak Dipakai)</span>
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <FileQuestion className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalUnused.toLocaleString('id-ID')}</span>
              <span className="text-xs text-slate-500">Berkas</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Aman dibersihkan dari storage</span>
              <span className="text-amber-600 font-bold">&rarr;</span>
            </div>
            {stats.totalUnused > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCleanupModalOpen(true);
                }}
                className="w-full py-1.5 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cleanup Semua File Yatim</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua Berkas ({stats.totalFiles})
            </button>
            <button
              onClick={() => { setStatusFilter('used'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'used'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Terintegrasi ({stats.totalUsed})</span>
            </button>
            <button
              onClick={() => { setStatusFilter('unused'); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'unused'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Yatim / Tidak Terpakai ({stats.totalUnused})</span>
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner Alert Saat Tab Yatim Aktif */}
        {statusFilter === 'unused' && stats.totalUnused > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                <FileQuestion className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-amber-950 dark:text-amber-100">
                  Ditemukan {stats.totalUnused.toLocaleString('id-ID')} berkas foto yatim di server desa
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  Berkas ini tidak terikat dengan artikel, galeri, pamong, penduduk, pembangunan, atau identitas desa sehingga aman dibersihkan.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCleanupModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow transition shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bersihkan Semua File Yatim</span>
            </button>
          </div>
        )}

        {/* Folder Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => { setSelectedFolder('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedFolder === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua Folder
          </button>
          {folders.map((fld) => {
            const isSelected = selectedFolder === fld;
            return (
              <button
                key={fld}
                onClick={() => { setSelectedFolder(fld); setPage(1); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{fld}</span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Sort, Batch Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama berkas foto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="size_desc">Ukuran Terbesar</option>
              <option value="size_asc">Ukuran Terkecil</option>
            </select>
          </div>

          {/* Batch action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllInPage}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {files.every((f) => selectedUrls.includes(f.url)) && files.length > 0
                ? 'Batalkan Pilihan'
                : 'Pilih Semua di Halaman'}
            </button>

            {selectedUrls.length > 0 && (
              <>
                <button
                  onClick={handleBatchCompress}
                  disabled={batchCompressing}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{batchCompressing ? 'Mengompres...' : `Kompres (${selectedUrls.length})`}</span>
                </button>
                <button
                  onClick={() => triggerDelete(selectedUrls)}
                  className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus ({selectedUrls.length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">Memindai pustaka berkas server desa...</p>
            <p className="text-[11px] text-slate-400">Menghubungkan ke Cloud Storage R2 dan database...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
            <ImageIcon className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {debouncedSearch || selectedFolder !== 'all' || statusFilter !== 'all'
                ? 'Tidak ada berkas yang sesuai dengan filter'
                : 'Belum ada berkas tersimpan di folder ini'}
            </p>
            <p className="text-xs text-slate-400 max-w-sm">
              {debouncedSearch || selectedFolder !== 'all' || statusFilter !== 'all'
                ? 'Coba ganti filter status atau kata kunci pencarian.'
                : 'Gunakan tombol "Unggah Foto Baru" untuk menambahkan aset ke server.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {files.map((file) => {
              const isSelected = selectedUrls.includes(file.url);
              const isCopied = copiedUrl === file.url;
              const isCompressing = compressingUrl === file.url;
              const isWebP = file.name.toLowerCase().endsWith('.webp');

              return (
                <div
                  key={file.id}
                  className={`group relative bg-slate-50 dark:bg-slate-800/80 rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectUrl(file.url)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer shadow"
                    />
                  </div>

                  {/* Integration Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    {file.isUsed ? (
                      <span
                        title={`Terintegrasi pada: ${file.usedIn.join(', ')}`}
                        className="inline-flex items-center gap-1 bg-emerald-700/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow backdrop-blur-sm cursor-help"
                      >
                        <FileCheck2 className="w-2.5 h-2.5" />
                        <span>Aktif</span>
                      </span>
                    ) : (
                      <span
                        title="Berkas yatim: tidak terhubung pada konten artikel, galeri, atau pamong. Aman dihapus."
                        className="inline-flex items-center gap-1 bg-amber-600/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow backdrop-blur-sm cursor-help"
                      >
                        <FileQuestion className="w-2.5 h-2.5" />
                        <span>Yatim</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => setPreviewItem(file)}
                    className="aspect-square w-full bg-slate-200 dark:bg-slate-800 relative cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="p-2 bg-white/90 text-slate-800 rounded-full shadow hover:bg-white">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono bg-slate-200 dark:bg-slate-700 px-1 rounded text-[9px] uppercase">
                          {file.folder}
                        </span>
                        <span>{file.sizeFormatted}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-1">
                      <button
                        onClick={() => handleCopy(file.url)}
                        title="Salin URL berkas"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {!isWebP && (
                        <button
                          onClick={() => handleCompress(file)}
                          disabled={isCompressing}
                          title="Kompres ke format modern WebP"
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        >
                          <Zap className={`w-3.5 h-3.5 ${isCompressing ? 'animate-spin' : ''}`} />
                        </button>
                      )}

                      <button
                        onClick={() => triggerDelete([file.url])}
                        title="Hapus berkas dari server"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={files.length > 0 && files.every((f) => selectedUrls.includes(f.url))}
                      onChange={handleSelectAllInPage}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="p-3">Pratinjau</th>
                  <th className="p-3">Nama Berkas</th>
                  <th className="p-3">Folder</th>
                  <th className="p-3">Ukuran</th>
                  <th className="p-3">Status Integrasi</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {files.map((file) => {
                  const isSelected = selectedUrls.includes(file.url);
                  const isCopied = copiedUrl === file.url;
                  const isCompressing = compressingUrl === file.url;
                  const isWebP = file.name.toLowerCase().endsWith('.webp');

                  return (
                    <tr
                      key={file.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUrl(file.url)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="p-3">
                        <div
                          onClick={() => setPreviewItem(file)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 cursor-pointer"
                        >
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900 dark:text-white max-w-xs truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{file.url}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300 uppercase">
                          {file.folder}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{file.sizeFormatted}</td>
                      <td className="p-3">
                        {file.isUsed ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              <FileCheck2 className="w-3 h-3 text-emerald-600" />
                              <span>Terintegrasi</span>
                            </span>
                            <p className="text-[10px] text-slate-500 line-clamp-1" title={file.usedIn.join(', ')}>
                              {file.usedIn.join(', ')}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <FileQuestion className="w-3 h-3 text-amber-600" />
                            <span>Yatim (Aman Dihapus)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleCopy(file.url)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 transition"
                            title="Salin URL"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {!isWebP && (
                            <button
                              onClick={() => handleCompress(file)}
                              disabled={isCompressing}
                              className="p-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition"
                              title="Kompresi WebP"
                            >
                              <Zap className={`w-3.5 h-3.5 ${isCompressing ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => triggerDelete([file.url])}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Menampilkan {files.length} dari {totalFiltered.toLocaleString('id-ID')} berkas (Halaman {page} dari {totalPages})
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL PREVIEW DETAIL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>{previewItem.name}</span>
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[50vh]">
              <img src={previewItem.url} alt={previewItem.name} className="max-h-[50vh] object-contain" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Folder</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{previewItem.folder}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Ukuran File</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{previewItem.sizeFormatted}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Status Integrasi</span>
                <span className={`font-bold ${previewItem.isUsed ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {previewItem.isUsed ? '🟢 Terintegrasi' : '🟡 Yatim (Bebas)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Format Berkas</span>
                <span className="font-bold uppercase text-slate-800 dark:text-slate-200">
                  {previewItem.name.split('.').pop()}
                </span>
              </div>
            </div>

            {previewItem.isUsed && (
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3.5 rounded-xl text-xs space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                  Lokasi Penggunaan pada Konten:
                </span>
                <ul className="list-disc list-inside text-emerald-700 dark:text-emerald-400 text-[11px] space-y-0.5">
                  {previewItem.usedIn.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopy(previewItem.url)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Path URL</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Resolusi Penuh</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Konfirmasi Penghapusan
                </h3>
                <p className="text-xs text-slate-500">
                  Akan menghapus permanen {deletingUrls.length} berkas dari server.
                </p>
              </div>
            </div>

            {selectedUsedItems.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Peringatan: Berkas Sedang Digunakan!
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  {selectedUsedItems.length} berkas yang Anda pilih tercatat masih digunakan pada Berita, Pamong, atau Galeri. Jika dihapus, gambar pada konten tersebut akan menjadi rusak (*broken image*).
                </p>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin melanjutkan penghapusan? Berkas akan dihapus secara permanen dari Cloud Storage R2 dan tidak dapat dikembalikan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deletingProgress}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deletingProgress}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingProgress ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI CLEANUP SELURUH FILE YATIM */}
      {isCleanupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-2xl dark:bg-amber-950/60">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Cleanup Seluruh Berkas Yatim
                </h3>
                <p className="text-xs text-slate-500">
                  Akan menghapus permanen {stats.totalUnused.toLocaleString('id-ID')} berkas yatim dari server.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{stats.totalUnused.toLocaleString('id-ID')} Berkas Tidak Terpakai di Database</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Berkas-berkas ini terverifikasi <strong>tidak terhubung</strong> dengan data aktif manapun di desa:
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-amber-900 dark:text-amber-200 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600">&bull;</span> Artikel Berita
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600">&bull;</span> Galeri Kegiatan
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600">&bull;</span> Aparatur Pamong
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600">&bull;</span> Data Penduduk
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600">&bull;</span> Pembangunan Fisik
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-600">&bull;</span> Identitas & Banner
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Berkas yang aktif digunakan dijamin 100% aman dan tidak tersentuh.</span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Aksi ini akan menghapus berkas dari Cloud Storage R2 dan membebaskan ruang penyimpanan desa secara instan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCleanupModalOpen(false)}
                disabled={cleanupProgress}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCleanupOrphans}
                disabled={cleanupProgress || stats.totalUnused === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {cleanupProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ya, Bersihkan Semua ({stats.totalUnused})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UNGGAH FOTO BARU */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Unggah Foto ke Server Desa</span>
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Subfolder Penyimpanan Terisolasi:
                </label>
                <select
                  value={uploadFolder}
                  onChange={(e) => setUploadFolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="galeri">galeri (Dokumentasi Kegiatan & Wisata)</option>
                  <option value="artikel">artikel (Berita & Warta Desa)</option>
                  <option value="user_pict">user_pict (Foto Wajah / Pamong / Penduduk)</option>
                  <option value="pembangunan">pembangunan (Proyek & Fisik Lapangan)</option>
                  <option value="identitas">identitas (Logo & Banner Header)</option>
                  <option value="dokumen">dokumen (Berkas Publik)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Semua foto akan otomatis dikompresi ke standar modern WebP sebelum disimpan ke Cloud Storage R2 desa.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleUploadFile}
                  disabled={uploading}
                  className="hidden"
                  id="modalFileInput"
                />
                <label htmlFor="modalFileInput" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {uploading ? 'Sedang Mengompresi & Mengunggah...' : 'Klik untuk Pilih Foto dari Komputer / HP'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mendukung multi-select (JPG, PNG, WebP). Otomatis dioptimalkan.
                  </p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploading}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

