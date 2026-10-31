'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  ExternalLink,
  Calendar,
  X,
  CheckCircle2,
  Sparkles,
  Camera,
  FolderOpen,
  Upload,
  Loader2,
  Check,
  Video,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  FileCheck,
  Server,
  Maximize2,
  Info,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import { formatAnnouncementDateTime } from '@/lib/timezone';

export interface MediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'YOUTUBE';
  caption?: string;
  thumbnailUrl?: string;
  size?: number;
  savingsPercent?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  caption: string | null;
  category: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'YOUTUBE' | 'ALBUM';
  videoUrl: string | null;
  mediaUrls: MediaItem[] | null;
  takenAt: string | null;
  createdAt: string;
}

interface ServerFile {
  url: string;
  name: string;
  size: number;
  folder: string;
  type: 'image' | 'video';
  modifiedAt: string;
}

function YouTubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}

const CATEGORIES = [
  'Kegiatan',
  'Pembangunan',
  'Budaya & Adat',
  'Kegiatan Warga',
  'Ekonomi Warga / UMKM',
  'Pelayanan Publik',
  'Potensi Desa',
];

export default function GaleriAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMediaType, setSelectedMediaType] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'ALBUM'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    category: 'Kegiatan',
    caption: '',
    takenAt: '',
    mediaType: 'ALBUM' as 'ALBUM' | 'IMAGE' | 'VIDEO' | 'YOUTUBE',
    videoUrl: '',
    mediaUrls: [] as MediaItem[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Server Library Modal / Drawer State
  const [isServerLibraryOpen, setIsServerLibraryOpen] = useState(false);
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [serverFolders, setServerFolders] = useState<string[]>([]);
  const [selectedServerFolder, setSelectedServerFolder] = useState<string>('ALL');
  const [serverSearchQuery, setServerSearchQuery] = useState('');
  const [loadingServerFiles, setLoadingServerFiles] = useState(false);

  // Preview Lightbox State
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [previewMediaIndex, setPreviewMediaIndex] = useState(0);

  // YouTube input state in modal
  const [tempYouTubeUrl, setTempYouTubeUrl] = useState('');

  // Fetch Galeri
  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/gallery?tenant=${currentTenantId}&category=${selectedCategory}&q=${searchQuery}`
      );
      const data = await res.json();
      if (data.photos) {
        setPhotos(data.photos);
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error('Gagal mengambil galeri:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, [currentTenantId, selectedCategory, searchQuery]);

  // Fetch Server Media Library
  const fetchServerLibrary = async () => {
    try {
      setLoadingServerFiles(true);
      const tenantParam = activeTenant?.slug || currentTenantId || '';
      const params = new URLSearchParams();
      if (tenantParam) params.append('tenant', tenantParam);
      if (selectedServerFolder && selectedServerFolder !== 'ALL') {
        params.append('folder', selectedServerFolder);
      }
      if (serverSearchQuery && serverSearchQuery.trim()) {
        params.append('q', serverSearchQuery.trim());
      }
      const res = await fetch(`/api/media/library?${params.toString()}`);
      const data = await res.json();
      if (data.files) {
        setServerFiles(data.files);
        setServerFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Gagal mengambil pustaka media server:', err);
    } finally {
      setLoadingServerFiles(false);
    }
  };

  useEffect(() => {
    if (isServerLibraryOpen) {
      fetchServerLibrary();
    }
  }, [isServerLibraryOpen, currentTenantId, selectedServerFolder, serverSearchQuery]);

  // Multi-file upload with WebP compression
  const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadProgress({ current: 0, total: files.length });

      const uploadedMediaItems: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });

        const fd = new FormData();
        fd.append('file', file);
        fd.append('tenant', currentTenantId);
        fd.append('folder', 'galeri');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: fd,
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || `Gagal mengunggah berkas ${file.name}`);
        }

        const isVideo = result.type === 'video';
        uploadedMediaItems.push({
          url: result.url,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          size: result.size,
          savingsPercent: result.savingsPercent,
        });
      }

      setFormData((prev) => {
        const merged = [...prev.mediaUrls, ...uploadedMediaItems];
        const defaultCover = prev.imageUrl || (merged.length > 0 ? merged[0].url : '');
        const autoTitle =
          prev.title ||
          (files.length === 1
            ? files[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
            : `Dokumentasi Kegiatan ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`);

        return {
          ...prev,
          title: autoTitle,
          imageUrl: defaultCover,
          mediaUrls: merged,
          mediaType: merged.length > 1 ? 'ALBUM' : uploadedMediaItems[0]?.type || 'IMAGE',
        };
      });
    } catch (err: any) {
      setUploadError(err.message || 'Gagal mengunggah berkas');
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      // Reset input
      e.target.value = '';
    }
  };

  // Add YouTube URL to Media List
  const handleAddYouTubeUrl = () => {
    if (!tempYouTubeUrl.trim()) return;
    const ytid = getYouTubeId(tempYouTubeUrl);
    if (!ytid) {
      alert('Format URL YouTube tidak valid. Harap masukkan tautan YouTube yang benar.');
      return;
    }

    const embedUrl = `https://www.youtube.com/embed/${ytid}`;
    const thumbUrl = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;

    const newMedia: MediaItem = {
      url: embedUrl,
      type: 'YOUTUBE',
      caption: 'Video Liputan YouTube',
      thumbnailUrl: thumbUrl,
    };

    setFormData((prev) => {
      const merged = [...prev.mediaUrls, newMedia];
      return {
        ...prev,
        videoUrl: tempYouTubeUrl,
        imageUrl: prev.imageUrl || thumbUrl,
        mediaUrls: merged,
        mediaType: merged.length > 1 ? 'ALBUM' : 'YOUTUBE',
      };
    });

    setTempYouTubeUrl('');
  };

  // Select photo from server library
  const handleSelectServerFile = (file: ServerFile) => {
    const isVideo = file.type === 'video';
    const newMedia: MediaItem = {
      url: file.url,
      type: isVideo ? 'VIDEO' : 'IMAGE',
      caption: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      size: file.size,
    };

    setFormData((prev) => {
      const merged = [...prev.mediaUrls, newMedia];
      return {
        ...prev,
        imageUrl: prev.imageUrl || (!isVideo ? file.url : ''),
        mediaUrls: merged,
        mediaType: merged.length > 1 ? 'ALBUM' : isVideo ? 'VIDEO' : 'IMAGE',
      };
    });

    setIsServerLibraryOpen(false);
  };

  // Remove media item from list
  const handleRemoveMediaItem = (index: number) => {
    setFormData((prev) => {
      const updated = prev.mediaUrls.filter((_, idx) => idx !== index);
      let newCover = prev.imageUrl;
      if (prev.mediaUrls[index]?.url === prev.imageUrl) {
        const remainingImages = updated.filter((m) => m.type === 'IMAGE' || m.thumbnailUrl);
        newCover = remainingImages.length > 0 ? remainingImages[0].url : '';
      }
      return {
        ...prev,
        imageUrl: newCover,
        mediaUrls: updated,
        mediaType: updated.length > 1 ? 'ALBUM' : updated[0]?.type || 'IMAGE',
      };
    });
  };

  // Set specific media as cover image
  const handleSetAsCover = (url: string) => {
    setFormData((prev) => ({ ...prev, imageUrl: url }));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      title: '',
      imageUrl: '',
      category: 'Kegiatan',
      caption: '',
      takenAt: new Date().toISOString().split('T')[0],
      mediaType: 'ALBUM',
      videoUrl: '',
      mediaUrls: [],
    });
    setTempYouTubeUrl('');
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: GalleryItem) => {
    setEditingId(p.id);
    let rawMediaUrls: MediaItem[] = [];
    if (Array.isArray(p.mediaUrls)) {
      rawMediaUrls = p.mediaUrls;
    } else if (typeof p.mediaUrls === 'string') {
      try {
        rawMediaUrls = JSON.parse(p.mediaUrls);
      } catch {
        rawMediaUrls = [];
      }
    }

    if (rawMediaUrls.length === 0 && p.imageUrl) {
      rawMediaUrls.push({
        url: p.imageUrl,
        type: p.mediaType === 'VIDEO' ? 'VIDEO' : p.mediaType === 'YOUTUBE' ? 'YOUTUBE' : 'IMAGE',
        caption: p.title,
      });
    }

    setFormData({
      title: p.title,
      imageUrl: p.imageUrl || '',
      category: p.category || 'Kegiatan',
      caption: p.caption || '',
      takenAt: p.takenAt ? p.takenAt.split('T')[0] : new Date().toISOString().split('T')[0],
      mediaType: p.mediaType || (rawMediaUrls.length > 1 ? 'ALBUM' : 'IMAGE'),
      videoUrl: p.videoUrl || '',
      mediaUrls: rawMediaUrls,
    });
    setTempYouTubeUrl(p.videoUrl || '');
    setUploadError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus dokumentasi "${title}" dari galeri desa?`)) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGallery();
      } else {
        alert('Gagal menghapus dokumentasi');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Judul kegiatan wajib diisi!');
      return;
    }

    if (!formData.imageUrl && formData.mediaUrls.length === 0 && !formData.videoUrl) {
      alert('Harap unggah minimal 1 foto/video atau tempel link video YouTube!');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingId ? `/api/gallery/${editingId}` : '/api/gallery';
      const method = editingId ? 'PUT' : 'POST';

      const coverUrl =
        formData.imageUrl ||
        formData.mediaUrls.find((m) => m.type === 'IMAGE')?.url ||
        formData.mediaUrls[0]?.url ||
        '/images/desa_irigasi_pertanian.jpg';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          imageUrl: coverUrl,
          tenantSlug: currentTenantId,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchGallery();
      } else {
        const err = await res.json();
        alert('Gagal menyimpan kegiatan: ' + (err.error || 'Terjadi kesalahan'));
      }
    } catch (e: any) {
      console.error(e);
      alert('Terjadi kesalahan: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Photos List
  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (selectedMediaType !== 'ALL') {
        if (selectedMediaType === 'ALBUM' && p.mediaType !== 'ALBUM') return false;
        if (
          selectedMediaType === 'VIDEO' &&
          p.mediaType !== 'VIDEO' &&
          p.mediaType !== 'YOUTUBE' &&
          !p.videoUrl
        )
          return false;
        if (selectedMediaType === 'IMAGE' && p.mediaType !== 'IMAGE') return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.caption && p.caption.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [photos, selectedCategory, selectedMediaType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
              <Camera className="w-6 h-6" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Media Hub & Dokumentasi Terpadu
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> WebP Auto-Compress
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Galeri & Dokumentasi Kegiatan Desa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola arsip foto puluhan lembar per kegiatan, video drone/kegiatan, dan sematan YouTube Desa {activeTenant.nama_desa} dengan penyimpanan terisolasi per desa.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Dokumentasi Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Tipe Media */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSelectedMediaType('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                selectedMediaType === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              Semua Media
            </button>
            <button
              onClick={() => setSelectedMediaType('ALBUM')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedMediaType === 'ALBUM'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Album Multi-Foto
            </button>
            <button
              onClick={() => setSelectedMediaType('VIDEO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                selectedMediaType === 'VIDEO'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Video / YouTube
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kegiatan, adat, album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-52 sm:w-64"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong>{filteredPhotos.length}</strong> kegiatan dokumentasi
        </div>
      </div>

      {/* Grid Kartu Galeri */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span>Memuat arsip galeri desa...</span>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Camera className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">Belum Ada Dokumentasi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada foto atau video yang cocok dengan filter saat ini.
          </p>
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl mt-2 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((p) => {
            const mediaList = Array.isArray(p.mediaUrls)
              ? p.mediaUrls
              : typeof p.mediaUrls === 'string'
              ? JSON.parse(p.mediaUrls || '[]')
              : [];
            const hasVideo = p.mediaType === 'VIDEO' || p.mediaType === 'YOUTUBE' || !!p.videoUrl;
            const photoCount = mediaList.filter((m: any) => m.type === 'IMAGE' || !m.type).length;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Media Thumbnail Container */}
                  <div
                    onClick={() => {
                      setPreviewItem(p);
                      setPreviewMediaIndex(0);
                    }}
                    className="relative h-52 sm:h-56 overflow-hidden bg-slate-950 cursor-pointer"
                  >
                    <img
                      src={p.imageUrl || '/images/desa_irigasi_pertanian.jpg'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20">
                      {p.category}
                    </span>

                    {/* Media Type Indicators */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {photoCount > 1 && (
                        <span className="bg-emerald-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 border border-emerald-400/30 shadow-md">
                          <Layers className="w-3 h-3" /> {photoCount} Foto
                        </span>
                      )}
                      {hasVideo && (
                        <span className="bg-rose-600/90 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 border border-rose-400/30 shadow-md">
                          <Play className="w-2.5 h-2.5 fill-white" /> Video
                        </span>
                      )}
                    </div>

                    {/* Center Play Button if Video */}
                    {hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata inside Image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-medium">
                      <span className="flex items-center gap-1 drop-shadow">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        {p.takenAt ? new Date(p.takenAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                      </span>
                      <span className="text-[10px] text-slate-300 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        Klik untuk melihat
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2">
                    <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 transition">
                      {p.title}
                    </h4>
                    {p.caption && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {p.caption}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mt-3">
                  <button
                    onClick={() => {
                      setPreviewItem(p);
                      setPreviewMediaIndex(0);
                    }}
                    className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Buka Album <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Edit Dokumentasi"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                      title="Hapus Dokumentasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL INPUT / EDIT DOKUMENTASI (UKURAN BESAR & ERGONOMIS MAX-W-5XL)        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {editingId ? 'Edit Dokumentasi Kegiatan' : 'Tambah Dokumentasi Kegiatan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mendukung upload puluhan foto terkompresi WebP, video lokal, dan sematan video YouTube.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900 flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* KOLOM KIRI (7 Kolom): Upload Multi-Asset, Sumber Media & Preview List */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" /> Berkas Foto & Video Kegiatan ({formData.mediaUrls.length})
                    </label>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      Otomatis Terkompres WebP (Ringan & Cepat)
                    </span>
                  </div>

                  {/* DROPZONE / MULTI-UPLOAD BOX */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-3xl p-6 text-center transition bg-slate-50/60 dark:bg-slate-800/40 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-800 dark:text-white">
                        Pilih Puluhan Foto atau Video dari Perangkat
                      </h5>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Klik tombol di bawah atau pilih banyak file sekaligus (CTRL + Klik). File foto otomatis dikonversi ke format WebP super ringan tanpa mengurangi ketajaman.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-3 rounded-2xl cursor-pointer transition shadow-md shadow-emerald-700/20 hover:scale-105 active:scale-95">
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>
                              Mengompres & Mengunggah ({uploadProgress.current}/{uploadProgress.total})...
                            </span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>+ Pilih Banyak Foto / Video</span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/mp4,video/webm"
                          onChange={handleMultipleFilesUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setIsServerLibraryOpen(true)}
                        className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-5 py-3 rounded-2xl cursor-pointer transition border border-slate-300 dark:border-slate-700"
                      >
                        <Server className="w-4 h-4 text-emerald-600" />
                        <span>Pustaka Server Desa</span>
                      </button>
                    </div>
                  </div>

                  {/* INPUT SEMATKAN YOUTUBE / DIRECT VIDEO URL */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-red-600" /> Sematkan Video YouTube / URL Eksternal
                      </span>
                      <span className="text-[10px] text-slate-400">Hemat Storage Server</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                        value={tempYouTubeUrl}
                        onChange={(e) => setTempYouTubeUrl(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddYouTubeUrl}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambahkan
                      </button>
                    </div>
                  </div>

                  {/* DAFTAR ASSET TERPILIH (MULTI-MEDIA GRID) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Daftar Asset Kegiatan ({formData.mediaUrls.length}):</span>
                      <span className="text-[10px] text-slate-400">
                        Klik &quot;Jadikan Cover&quot; untuk memilih foto utama yang tampil di beranda
                      </span>
                    </div>

                    {formData.mediaUrls.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        Belum ada foto atau video yang ditambahkan ke kegiatan ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                        {formData.mediaUrls.map((item, idx) => {
                          const isCover = formData.imageUrl === item.url;
                          const isYt = item.type === 'YOUTUBE';
                          const isVid = item.type === 'VIDEO';

                          return (
                            <div
                              key={idx}
                              className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                                isCover
                                  ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                                  : 'border-slate-200 dark:border-slate-700'
                              } bg-slate-950 aspect-video flex items-center justify-center`}
                            >
                              {isYt ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                                  {item.thumbnailUrl ? (
                                    <img
                                      src={item.thumbnailUrl}
                                      alt="YouTube Thumbnail"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Video className="w-8 h-8 text-red-600" />
                                  )}
                                  <span className="absolute bottom-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    YouTube
                                  </span>
                                </div>
                              ) : isVid ? (
                                <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                                  <video src={item.url} className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    Video
                                  </span>
                                </div>
                              ) : (
                                <img src={item.url} alt="Uploaded" className="w-full h-full object-cover" />
                              )}

                              {/* Cover Badge */}
                              {isCover && (
                                <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                                  COVER UTAMA
                                </span>
                              )}

                              {/* Action Hover Controls */}
                              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                {!isCover && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetAsCover(item.url)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg w-full transition cursor-pointer"
                                  >
                                    Jadikan Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMediaItem(idx)}
                                  className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg w-full transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" /> Hapus
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* KOLOM KANAN (5 Kolom): Data & Informasi Kegiatan */}
                <div className="lg:col-span-5 space-y-4 bg-slate-50/70 dark:bg-slate-800/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Detail Informasi Kegiatan
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Judul Dokumentasi Kegiatan *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Dokumentasi Musyawarah Desa / Kegiatan Warga"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kategori Kegiatan
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-3 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Kegiatan
                      </label>
                      <input
                        type="date"
                        value={formData.takenAt}
                        onChange={(e) => setFormData({ ...formData, takenAt: e.target.value })}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-3.5 py-3 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Deskripsi / Narasi Lengkap Dokumentasi
                    </label>
                    <textarea
                      rows={5}
                      placeholder="Tuliskan keterangan detail kegiatan, rangkaian acara, nama dusun / lokasi, atau apresiasi kebersamaan warga desa..."
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>

                  {/* Cover Preview Card */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Preview Cover Terpilih:
                    </label>
                    <div className="h-36 rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700 relative flex items-center justify-center">
                      {formData.imageUrl ? (
                        <img
                          src={formData.imageUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/desa_irigasi_pertanian.jpg';
                          }}
                        />
                      ) : (
                        <span className="text-xs text-slate-500">Pilih berkas untuk menetapkan cover</span>
                      )}
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-[90%]">
                        {formData.imageUrl || 'Belum dipilih'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Folder Desa: <strong className="text-emerald-700 font-mono">/public/uploads/{currentTenantId}/galeri/</strong>
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="px-8 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition shadow-lg shadow-emerald-700/20 cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Kegiatan & Galeri</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PUSTAKA SERVER MEDIA (PILIH FOTO YANG SUDAH TERSIMPAN DI SERVER)     */}
      {/* ========================================================================= */}
      {isServerLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" /> Pustaka Media Server Desa {activeTenant.nama_desa}
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih dari arsip foto yang sudah pernah diunggah di server untuk digunakan pada dokumentasi ini.
                </p>
              </div>
              <button
                onClick={() => setIsServerLibraryOpen(false)}
                className="p-2 rounded-2xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subfolder & Search Filter */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <button
                  type="button"
                  onClick={() => setSelectedServerFolder('ALL')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    selectedServerFolder === 'ALL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                  }`}
                >
                  Semua ({serverFiles.length})
                </button>
                {serverFolders.map((fld) => (
                  <button
                    key={fld}
                    type="button"
                    onClick={() => setSelectedServerFolder(fld)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      selectedServerFolder === fld
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                    }`}
                  >
                    {fld}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama berkas..."
                  value={serverSearchQuery}
                  onChange={(e) => setServerSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-xl outline-none w-48 sm:w-60"
                />
              </div>
            </div>

            {/* Grid Berkas Server */}
            <div className="flex-1 overflow-y-auto py-4">
              {loadingServerFiles ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Memindai pustaka berkas server...
                </div>
              ) : serverFiles.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Tidak ada berkas yang ditemukan di pustaka server folder ini.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {serverFiles.map((file) => (
                    <div
                      key={file.url}
                      onClick={() => handleSelectServerFile(file)}
                      className="group cursor-pointer rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-square relative hover:ring-2 hover:ring-emerald-500 transition-all"
                    >
                      {file.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                          <Play className="w-8 h-8 text-rose-500" />
                        </div>
                      ) : (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-white font-bold truncate block">{file.name}</span>
                        <span className="text-[9px] text-emerald-400 font-mono">
                          {(file.size / 1024).toFixed(0)} KB • {file.folder}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LIGHTBOX PREVIEW DOKUMENTASI & MULTI-PHOTO CAROUSEL                 */}
      {/* ========================================================================= */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white flex flex-col max-h-[90vh]"
          >
            {/* Lightbox Media Viewport */}
            {(() => {
              const mediaList = Array.isArray(previewItem.mediaUrls)
                ? previewItem.mediaUrls
                : typeof previewItem.mediaUrls === 'string'
                ? JSON.parse(previewItem.mediaUrls || '[]')
                : [];

              const currentMedia =
                mediaList.length > 0
                  ? mediaList[previewMediaIndex] || mediaList[0]
                  : { url: previewItem.imageUrl, type: previewItem.mediaType };

              const hasMultiple = mediaList.length > 1;
              const isYt = currentMedia?.type === 'YOUTUBE' || getYouTubeId(currentMedia?.url);
              const isVid = currentMedia?.type === 'VIDEO';

              return (
                <div className="relative h-[55vh] bg-black flex items-center justify-center overflow-hidden">
                  {isYt ? (
                    <iframe
                      src={
                        currentMedia.url.includes('embed')
                          ? currentMedia.url
                          : `https://www.youtube.com/embed/${getYouTubeId(currentMedia.url)}`
                      }
                      title={previewItem.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isVid ? (
                    <video src={currentMedia.url} controls className="max-h-full max-w-full object-contain" />
                  ) : (
                    <img
                      src={currentMedia.url}
                      alt={previewItem.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}

                  {/* Close Lightbox */}
                  <button
                    onClick={() => setPreviewItem(null)}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer backdrop-blur-md transition z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Carousel Prev / Next Controls */}
                  {hasMultiple && (
                    <>
                      <button
                        onClick={() =>
                          setPreviewMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length)
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer backdrop-blur-md transition shadow-lg"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() =>
                          setPreviewMediaIndex((prev) => (prev + 1) % mediaList.length)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white cursor-pointer backdrop-blur-md transition shadow-lg"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Pagination Counter */}
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs font-mono font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/20">
                        {previewMediaIndex + 1} / {mediaList.length}
                      </span>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Lightbox Details */}
            <div className="p-6 space-y-2 overflow-y-auto">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  {previewItem.category}
                </span>
                <span className="text-xs text-slate-400">
                  {previewItem.takenAt
                    ? new Date(previewItem.takenAt).toLocaleDateString('id-ID', { dateStyle: 'long' })
                    : '-'}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white">{previewItem.title}</h3>
              {previewItem.caption && (
                <p className="text-xs text-slate-300 leading-relaxed font-sans">{previewItem.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
