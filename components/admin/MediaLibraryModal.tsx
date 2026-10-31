'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  Image as ImageIcon,
  Loader2,
  FolderOpen,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';

export interface MediaFileItem {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  folder: string;
  isImage: boolean;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  onSelectImage?: (url: string) => void;
  multiSelect?: boolean;
  onSelectMultiple?: (urls: string[]) => void;
  title?: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  tenantSlug,
  onSelectImage,
  multiSelect = false,
  onSelectMultiple,
  title = 'Pustaka Foto Server Desa',
}: MediaLibraryModalProps) {
  const [files, setFiles] = useState<MediaFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Server Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [limit] = useState(24);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch files from server with pagination & filters
  const fetchFiles = async (
    targetPage = page,
    folder = selectedFolder,
    query = debouncedSearch
  ) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: limit.toString(),
      });
      if (tenantSlug && tenantSlug.trim()) {
        params.append('tenant', tenantSlug.trim());
      }
      if (folder && folder !== 'all') {
        params.append('folder', folder);
      }
      if (query) {
        params.append('search', query);
      }

      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.files) {
        setFiles(data.files);
        if (data.pagination) {
          setTotalFiles(data.pagination.total);
          setTotalPages(data.pagination.totalPages || 1);
          setPage(data.pagination.page || 1);
        }
        if (data.folders) {
          setAvailableFolders(data.folders);
        }
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error('Failed to fetch media:', err);
      setError('Gagal memuat pustaka berkas dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles(page, selectedFolder, debouncedSearch);
      setCopiedUrl(null);
    }
  }, [isOpen, tenantSlug, page, selectedFolder, debouncedSearch]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const targetUploadFolder = selectedFolder !== 'all' ? selectedFolder : 'artikel';

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tenant', tenantSlug);
        formData.append('folder', targetUploadFolder);

        const res = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Gagal mengupload berkas ' + file.name);
          break;
        }
      }
      // Refresh current view (page 1)
      setPage(1);
      fetchFiles(1, selectedFolder, debouncedSearch);
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload berkas');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => {
      setCopiedUrl(null);
    }, 2000);
  };

  const handleDelete = async (url: string, name: string) => {
    if (!confirm(`Hapus foto "${name}" secara permanen dari server?`)) return;

    setDeletingUrl(url);
    try {
      const res = await fetch('/api/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, tenant: tenantSlug }),
      });

      const data = await res.json();
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.url !== url));
        setSelectedUrls((prev) => prev.filter((u) => u !== url));
        setTotalFiles((prev) => Math.max(0, prev - 1));
      } else {
        alert(data.error || 'Gagal menghapus berkas');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus foto');
    } finally {
      setDeletingUrl(null);
    }
  };

  const toggleSelect = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls((prev) => prev.filter((u) => u !== url));
    } else {
      setSelectedUrls((prev) => [...prev, url]);
    }
  };

  const handleConfirmMultiSelect = () => {
    if (onSelectMultiple) {
      onSelectMultiple(selectedUrls);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl relative my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-600" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pustaka berkinerja tinggi dengan kompresi thumbnail instan & paginasi ringan untuk ribuan foto.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Upload, Folder Filter, Search */}
        <div className="py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800">
          
          {/* Action Upload & Folder Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengompres & Mengunggah...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Unggah Foto Baru</span>
                </>
              )}
            </button>

            {/* Folder Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Folder</option>
                {availableFolders.map((f) => (
                  <option key={f} value={f}>
                    Folder: {f}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchFiles(page, selectedFolder, debouncedSearch)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 transition"
              title="Segarkan daftar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari foto di server..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {error && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Grid Media Items */}
        <div className="flex-1 overflow-y-auto py-3 min-h-[300px]">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <span>Memuat foto dari server desa...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <ImageIcon className="w-9 h-9 text-slate-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {searchInput || selectedFolder !== 'all'
                  ? 'Tidak ada foto yang cocok dengan pencarian / folder ini'
                  : 'Belum ada foto tersimpan di server'}
              </p>
              <p className="text-[11px] text-slate-400">
                {searchInput || selectedFolder !== 'all'
                  ? 'Coba ganti kata kunci atau pilih Semua Folder.'
                  : 'Klik tombol "Unggah Foto Baru" untuk mengunggah dari komputer/HP.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {files.map((file) => {
                const isSelected = selectedUrls.includes(file.url);
                const isCopied = copiedUrl === file.url;
                const isDeleting = deletingUrl === file.url;
                const displaySrc = file.thumbnailUrl || file.url;

                return (
                  <div
                    key={file.id}
                    className={`group relative bg-slate-50 dark:bg-slate-800/80 rounded-xl border overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {/* Thumbnail Display with Lazy Loading */}
                    <div className="aspect-square relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
                      <img
                        src={displaySrc}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Multi Select Checkbox Overlay */}
                      {multiSelect && (
                        <button
                          type="button"
                          onClick={() => toggleSelect(file.url)}
                          className="absolute top-1.5 left-1.5 z-10 p-1 rounded-md bg-black/60 text-white hover:bg-black transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      )}

                      {/* Folder & Size Badge */}
                      <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                        {file.sizeFormatted}
                      </span>
                    </div>

                    {/* Info & Action Buttons */}
                    <div className="p-2 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>

                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopyLink(file.url)}
                          className={`px-1.5 py-1 rounded-md text-[9px] font-bold transition flex items-center justify-center gap-1 border ${
                            isCopied
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                          title="Salin link gambar langsung"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Salin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Link</span>
                            </>
                          )}
                        </button>

                        {/* Use / Insert Image Button */}
                        {onSelectImage && !multiSelect && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectImage(file.url);
                              onClose();
                            }}
                            className="px-1.5 py-1 rounded-md text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-1"
                          >
                            <span>Pilih</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDelete(file.url, file.name)}
                          className={`px-1.5 py-1 rounded-md text-[9px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition flex items-center justify-center gap-1 ${
                            onSelectImage && !multiSelect ? 'col-span-2' : ''
                          }`}
                          title="Hapus foto dari server"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination Controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Total {totalFiles.toLocaleString('id-ID')} foto
            </span>
            <span>•</span>
            <span>
              Halaman {page} dari {totalPages || 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Prev / Next Pagination Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {multiSelect && selectedUrls.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmMultiSelect}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Tambahkan {selectedUrls.length} Foto Terpilih</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
