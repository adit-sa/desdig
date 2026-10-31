'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Newspaper,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  Heading,
  Bold,
  Italic,
  List,
  Quote,
  Loader2,
  FileImage,
  Sparkles,
  Tag,
  FolderOpen,
  Images,
  Table as TableIcon,
  Info,
  ChevronRight,
  PlusCircle,
  Link2,
  Save,
  UserCheck,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import CategoryManagerModal from '@/components/admin/CategoryManagerModal';
import InsertLinkModal from '@/components/admin/InsertLinkModal';
import ResidentPicker from '@/components/admin/ResidentPicker';
import { formatArticleContent } from '@/lib/utils/formatContent';

interface AlbumItem {
  url: string;
  caption: string;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageUrl?: string | null;
  galleryUrls?: any;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string } | null;
  author: { name: string; email: string } | null;
  authorResidentId?: string | null;
  authorResident?: {
    id: string;
    nik: string;
    nama: string;
    dusun?: string | null;
  } | null;
}

export default function CmsBeritaPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Filter Tahun Default: Tahun ini (2026)
  const [currentYear, setCurrentYear] = useState<string>('2026');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  useEffect(() => {
    const yr = new Date().getFullYear().toString();
    setCurrentYear(yr);
    setSelectedYear(yr);
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);

  // Media Library & Category Manager Modals
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalPurpose, setMediaModalPurpose] = useState<'cover' | 'inline' | 'album'>('inline');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const albumFileInputRef = useRef<HTMLInputElement>(null);
  const lastSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const updateSelection = () => {
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    coverImageUrl: '',
    categoryId: '',
    galleryUrls: [] as AlbumItem[],
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED',
    authorResidentId: null as string | null,
    authorResidentName: '' as string,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch articles from API
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/articles?tenant=${currentTenantId}&q=${encodeURIComponent(searchQuery)}&status=${statusFilter}&categoryId=${selectedCategoryFilter}`
      );
      const data = await res.json();
      if (data.articles) {
        setArticles(data.articles);
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error('Gagal mengambil artikel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [currentTenantId, searchQuery, statusFilter, selectedCategoryFilter]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>([currentYear]);
    articles.forEach((art) => {
      const dateStr = art.publishedAt || art.createdAt;
      if (dateStr) {
        const yr = new Date(dateStr).getFullYear().toString();
        if (yr && !isNaN(Number(yr))) years.add(yr);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [articles, currentYear]);

  // Filtered Articles based on Year
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (selectedYear !== 'ALL') {
        const artYear = new Date(art.publishedAt || art.createdAt).getFullYear().toString();
        if (artYear !== selectedYear) return false;
      }
      return true;
    });
  }, [articles, selectedYear]);

  // Handle slug auto-generation from title
  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editingId ? prev.slug : slug,
    }));
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      coverImageUrl: '',
      categoryId: categories[0]?.id || '',
      galleryUrls: [],
      status: 'PUBLISHED',
      authorResidentId: null,
      authorResidentName: '',
    });
    setActiveTab('edit');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (art: ArticleItem) => {
    setEditingId(art.id);

    let parsedAlbum: AlbumItem[] = [];
    if (art.galleryUrls) {
      if (Array.isArray(art.galleryUrls)) {
        parsedAlbum = art.galleryUrls.map((item: any) => {
          if (typeof item === 'string') return { url: item, caption: '' };
          return { url: item.url || '', caption: item.caption || '' };
        }).filter((item) => Boolean(item.url));
      }
    }

    setFormData({
      title: art.title,
      slug: art.slug,
      summary: art.summary,
      content: art.content,
      coverImageUrl: art.coverImageUrl || '',
      categoryId: art.category?.id || '',
      galleryUrls: parsedAlbum,
      status: art.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      authorResidentId: art.authorResidentId || art.authorResident?.id || null,
      authorResidentName: art.authorResident ? `${art.authorResident.nama} (${art.authorResident.nik})` : '',
    });
    setActiveTab('edit');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Upload Cover Image
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant', currentTenantId);
      fd.append('folder', 'artikel');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, coverImageUrl: data.url }));
      } else {
        alert('Gagal mengupload cover: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload gambar');
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = '';
    }
  };

  // Insert Text / Tag at cursor in Content without scroll jumping
  const insertIntoContent = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormData((prev) => ({ ...prev, content: prev.content + before + after }));
      return;
    }

    const prevScrollTop = textarea.scrollTop;
    const start = lastSelectionRef.current.start ?? textarea.selectionStart ?? 0;
    const end = lastSelectionRef.current.end ?? textarea.selectionEnd ?? 0;

    // Smart prefix: jika diawali \n\n tapi kursor di awal artikel (0) atau sudah ada baris baru, rapikan
    let smartBefore = before;
    if (before.startsWith('\n\n')) {
      if (start === 0 || formData.content.slice(0, start).endsWith('\n\n')) {
        smartBefore = before.replace(/^\n+/, '');
      } else if (formData.content.slice(0, start).endsWith('\n')) {
        smartBefore = before.replace(/^\n/, '');
      }
    }

    const selectedText = formData.content.substring(start, end);
    const replacement = smartBefore + (selectedText || 'Teks') + after;
    const newContent = formData.content.substring(0, start) + replacement + formData.content.substring(end);
    setFormData((prev) => ({ ...prev, content: newContent }));

    const newCursorStart = start + smartBefore.length;
    const newCursorEnd = start + replacement.length - after.length;
    lastSelectionRef.current = { start: newCursorStart, end: newCursorEnd };

    // Gunakan preventScroll: true agar browser tidak melompatkan scroll ke bawah
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus({ preventScroll: true });
        textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
        textareaRef.current.scrollTop = prevScrollTop;
      }
    }, 10);
  };

  // Link Modal Handlers
  const handleOpenLinkModal = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = lastSelectionRef.current.start ?? textarea.selectionStart ?? 0;
      const end = lastSelectionRef.current.end ?? textarea.selectionEnd ?? 0;
      const selected = formData.content.substring(start, end);
      setSelectedTextForLink(selected);
    } else {
      setSelectedTextForLink('');
    }
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = (title: string, url: string) => {
    const mdLink = `[${title}](${url})`;
    insertIntoContent(mdLink, '');
  };

  // Media Library handler (for cover, inline, or album)
  const handleSelectMedia = (url: string) => {
    if (mediaModalPurpose === 'cover') {
      setFormData((prev) => ({ ...prev, coverImageUrl: url }));
    } else if (mediaModalPurpose === 'inline') {
      const imgTag = `\n\n![Dokumentasi Kegiatan](${url})\n\n`;
      insertIntoContent(imgTag, '');
    } else if (mediaModalPurpose === 'album') {
      setFormData((prev) => ({
        ...prev,
        galleryUrls: [...(prev.galleryUrls || []), { url, caption: '' }],
      }));
    }
  };

  const handleSelectMultipleMedia = (urls: string[]) => {
    if (urls.length === 0) return;
    const newItems: AlbumItem[] = urls.map((u) => ({ url: u, caption: '' }));
    setFormData((prev) => ({
      ...prev,
      galleryUrls: [...(prev.galleryUrls || []), ...newItems],
    }));
  };

  // Upload inline image directly
  const handleUploadInlineImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant', currentTenantId);
      fd.append('folder', 'artikel');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        const imgTag = `\n\n![Dokumentasi: ${cleanName}](${data.url})\n\n`;
        insertIntoContent(imgTag, '');
      } else {
        alert('Gagal mengupload gambar artikel: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload gambar artikel');
    } finally {
      setUploadingInline(false);
      if (inlineFileInputRef.current) inlineFileInputRef.current.value = '';
    }
  };

  // Upload multiple photos to album
  const handleUploadAlbumFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAlbum(true);
    try {
      const uploadedItems: AlbumItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append('file', file);
        fd.append('tenant', currentTenantId);
        fd.append('folder', 'artikel');

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success && data.url) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          uploadedItems.push({ url: data.url, caption: cleanName });
        }
      }

      if (uploadedItems.length > 0) {
        setFormData((prev) => ({
          ...prev,
          galleryUrls: [...(prev.galleryUrls || []), ...uploadedItems],
        }));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat mengunggah foto album');
    } finally {
      setUploadingAlbum(false);
      if (albumFileInputRef.current) albumFileInputRef.current.value = '';
    }
  };

  const handleRemoveAlbumPhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateAlbumCaption = (index: number, caption: string) => {
    setFormData((prev) => {
      const updated = [...prev.galleryUrls];
      if (updated[index]) {
        updated[index] = { ...updated[index], caption };
      }
      return { ...prev, galleryUrls: updated };
    });
  };

  // Fast News Template Generator
  const handleApplyTemplate = () => {
    if (formData.content.trim() && !confirm('Ganti isi artikel saat ini dengan Format Berita Desa Resmi?')) {
      return;
    }

    const desaName = activeTenant?.nama_desa || 'Desa';
    const templateContent = `## 1. Latar Belakang & Pembukaan\nDalam rangka mewujudkan pelayanan publik yang prima dan mendorong partisipasi aktif masyarakat, Pemerintah Desa ${desaName} telah menyelenggarakan kegiatan kemasyarakatan...\n\n## 2. Waktu dan Lokasi Pelaksanaan\nKegiatan ini telah terlaksana secara tertib, aman, dan lancar dengan rincian jadwal sebagai berikut:\n- **Hari / Tanggal:** [Hari, Tanggal Bulan Tahun]\n- **Waktu:** 09.00 - Selesai\n- **Lokasi:** Balai Desa ${desaName}\n- **Peserta:** Kepala Desa, Perangkat Desa, BPD, Tokoh Masyarakat, dan Warga Desa.\n\n## 3. Rangkaian Kegiatan\nAcara dibuka secara resmi dengan menyanyikan lagu Indonesia Raya, dilanjutkan dengan sambutan Kepala Desa serta dialog interaktif bersama seluruh warga yang hadir.\n\n> "Kami sangat mengapresiasi kebersamaan dan antusiasme warga. Gotong royong dan transparansi adalah fondasi utama memajukan desa kita."\n\n## 4. Kesimpulan dan Harapan\nPemerintah Desa menyampaikan terima kasih kepada seluruh pihak yang telah mendukung kelancaran kegiatan. Semoga hasil kegiatan ini membawa berkah serta kemajuan nyata bagi seluruh warga desa.`;

    setFormData((prev) => ({
      ...prev,
      summary:
        prev.summary ||
        `Pemerintah Desa ${desaName} sukses menyelenggarakan kegiatan kemasyarakatan yang dihadiri aparatur dan perwakilan warga secara tertib dan transparan.`,
      content: templateContent,
    }));
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus artikel "${title}" secara permanen?`)) return;

    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchArticles();
      } else {
        alert('Gagal menghapus artikel');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const url = editingId ? `/api/articles/${editingId}` : `/api/articles?tenant=${currentTenantId}`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          authorResidentId: formData.authorResidentId || null,
          tenantSlug: currentTenantId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setFormError(result.error || 'Terjadi kesalahan');
        return;
      }

      setIsModalOpen(false);
      fetchArticles();
    } catch (e: any) {
      setFormError(e.message || 'Gagal mengirim data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Newspaper className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                CMS Berita & Warta Desa
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kelola artikel, kategori berita, pustaka foto server, dan album dokumentasi untuk{' '}
                <strong className="text-emerald-600">Desa {activeTenant?.nama_desa}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Kelola Kategori */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Kelola Kategori ({categories.length})</span>
          </button>

          {/* Tombol Pustaka Foto Server */}
          <button
            onClick={() => {
              setMediaModalPurpose('inline');
              setIsMediaModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>Pustaka Foto Server</span>
          </button>

          {/* Tombol Tulis Berita */}
          <button
            onClick={handleOpenCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Berita Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul atau ringkasan berita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Kategori:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">Semua Status</option>
                <option value="PUBLISHED">Terbit (Published)</option>
                <option value="DRAFT">Draf</option>
              </select>
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setSelectedYear(currentYear)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                  selectedYear === currentYear
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                ★ {currentYear}
              </button>
              {availableYears
                .filter((yr) => yr !== currentYear)
                .map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                      selectedYear === yr
                        ? 'bg-emerald-600 text-white shadow-sm'
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
          </div>
        </div>
      </div>

      {/* Tabel Daftar Berita */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">Memuat artikel...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <Newspaper className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">Belum ada artikel yang cocok</p>
            <p className="text-slate-400">Klik &ldquo;Tulis Berita Baru&rdquo; untuk menerbitkan warta desa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Berita</th>
                  <th className="px-5 py-3.5 font-semibold">Kategori</th>
                  <th className="px-5 py-3.5 font-semibold">Album Foto</th>
                  <th className="px-5 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold">Dibaca</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredArticles.map((art) => {
                  const albumCount = Array.isArray(art.galleryUrls) ? art.galleryUrls.length : 0;
                  return (
                    <tr key={art.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {art.coverImageUrl ? (
                              <img
                                src={art.coverImageUrl}
                                alt={art.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Newspaper className="w-5 h-5 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                              {art.title}
                            </h4>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>
                                {new Date(art.publishedAt || art.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                              <span>•</span>
                              {art.authorResident ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                  <UserCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{art.authorResident.nama}</span>
                                </span>
                              ) : (
                                <span>{art.author?.name || 'Operator'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                          {art.category?.name || 'Kabar Desa'}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {albumCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] border border-amber-200 dark:border-amber-800">
                            <Images className="w-3 h-3 text-amber-600" />
                            {albumCount} Foto
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {art.status === 'PUBLISHED' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Terbit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            Draf
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-400 font-mono">
                        {art.viewCount}x
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/berita/${art.slug}?tenant=${currentTenantId}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Lihat di Web Publik"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleOpenEditModal(art)}
                            title="Edit Artikel"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id, art.title)}
                            title="Hapus Artikel"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal Form Tambah / Edit Berita - Layout Lebih Luas & Sangat Compact */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-3 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-7xl w-full p-3 sm:p-4 shadow-2xl relative my-auto h-[96vh] sm:h-[94vh] flex flex-col">
            {/* Modal Header Ultra Compact */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                  <Edit className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {editingId ? 'Sunting Berita Desa' : 'Tulis Berita Desa Baru'}
                  </h3>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Tab Selector Edit vs Preview */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'edit'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Edit className="w-3 h-3" />
                    <span>Editor Tulis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>Pratinjau</span>
                  </button>
                </div>

                {/* Quick Save in Header */}
                <button
                  type="submit"
                  form="articleForm"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{editingId ? 'Simpan' : 'Terbitkan'}</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="mt-2 p-2 rounded-lg bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2 flex-shrink-0">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Body: 2 Kolom (Kiri: Editor Luas, Kanan: Sidebar Metadata Compact) */}
            <div className="overflow-y-auto py-2.5 flex-1 pr-1">
              {activeTab === 'preview' ? (
                /* Tab Pratinjau Live - Luas & Indah */
                <div className="space-y-4 max-w-4xl mx-auto py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                      {categories.find((c) => c.id === formData.categoryId)?.name || 'Kategori Umum'}
                    </span>
                    <span className="text-xs text-slate-400">• Rilis Resmi Hari Ini</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
                    {formData.title || 'Judul Berita Belum Diisi'}
                  </h1>

                  {/* Excerpt / Lead */}
                  {formData.summary && (
                    <div className="p-3.5 bg-slate-50 border-l-4 border-emerald-600 rounded-r-xl text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                      {formData.summary}
                    </div>
                  )}

                  {/* Cover */}
                  {formData.coverImageUrl && (
                    <div className="rounded-xl overflow-hidden shadow-md border border-slate-200 max-h-[420px]">
                      <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Body Content */}
                  <div
                    className="prose max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-200 space-y-3 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3"
                    dangerouslySetInnerHTML={{
                      __html: formData.content
                        ? formatArticleContent(formData.content)
                        : '<p class="text-slate-400 italic">Konten artikel belum diisi...</p>',
                    }}
                  />

                  {/* Album Preview */}
                  {formData.galleryUrls.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mt-4 space-y-2.5">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Images className="w-4 h-4 text-emerald-600" />
                        Album Dokumentasi ({formData.galleryUrls.length} Foto)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {formData.galleryUrls.map((p, idx) => (
                          <div key={idx} className="aspect-4/3 rounded-lg overflow-hidden bg-slate-200 relative">
                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab Form Editor - 2 Kolom Ultra Compact */
                <form id="articleForm" onSubmit={handleSubmit} className="h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-full">
                    {/* ======================================================== */}
                    {/* KOLOM KIRI (70% / col-span-8): AREA MENULIS LUAS & COMPACT*/}
                    {/* ======================================================== */}
                    <div className="lg:col-span-8 flex flex-col space-y-2 h-full">
                      {/* Judul Berita */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Judul Berita *
                          </label>
                          <button
                            type="button"
                            onClick={handleApplyTemplate}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                            title="Isi otomatis dengan struktur berita baku rilis desa"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Gunakan Template</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="Ketik judul berita desa di sini..."
                          className="w-full text-sm font-bold p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Ringkasan Singkat (Lead / Excerpt) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Ringkasan Singkat (Lead / Excerpt) *
                          </label>
                          <span className="text-[10px] text-slate-400">Pengantar 1-2 kalimat untuk kartu berita</span>
                        </div>
                        <textarea
                          required
                          rows={2}
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          placeholder="Ringkasan pengantar singkat untuk kartu berita dan pembuka artikel..."
                          className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                        />
                      </div>

                      {/* Badan Artikel & Konten Lengkap - LUAS */}
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Isi / Konten Berita Lengkap *
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Enter 2x = Paragraf baru • Enter 1x = Baris baru
                          </span>
                        </div>

                        {/* Toolbar Format & Sisipkan Foto (Ribbon 1 Baris Compact) */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-t-lg overflow-x-auto flex-nowrap text-xs">
                          {/* Foto Server ke Konten */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setMediaModalPurpose('inline');
                              setIsMediaModalOpen(true);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-xs flex items-center gap-1 transition cursor-pointer flex-shrink-0"
                            title="Ambil foto dari server untuk disisipkan ke artikel"
                          >
                            <FolderOpen className="w-3 h-3" />
                            <span>+ Foto Server</span>
                          </button>

                          {/* Upload Komputer ke Konten */}
                          <input
                            ref={inlineFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleUploadInlineImage}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={uploadingInline}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => inlineFileInputRef.current?.click()}
                            className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition disabled:opacity-50 cursor-pointer flex-shrink-0"
                            title="Upload gambar dari komputer langsung masuk ke teks artikel"
                          >
                            {uploadingInline ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 text-slate-500" />}
                            <span>+ Upload</span>
                          </button>

                          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 flex-shrink-0" />

                          {/* Heading H2 & H3 */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n## ', '\n')}
                            className="px-1.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Judul Bagian (H2)"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n### ', '\n')}
                            className="px-1.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-[10px] font-black rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Subjudul Bagian (H3)"
                          >
                            H3
                          </button>

                          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 flex-shrink-0" />

                          {/* Bold & Italic */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('**', '**')}
                            className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Teks Tebal"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('*', '*')}
                            className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Teks Miring"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Sisipkan Link */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleOpenLinkModal}
                            className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                            title="Sisipkan tautan web yang bisa diklik pembaca"
                          >
                            <Link2 className="w-3 h-3 text-emerald-600" />
                            <span>Link</span>
                          </button>

                          <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5 flex-shrink-0" />

                          {/* Kutipan, List Poin, List Nomor, Garis */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n> "', '"\n')}
                            className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Kutipan Tokoh / Kepala Desa"
                          >
                            <Quote className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n- Poin pertama\n- Poin kedua\n- Poin ketiga\n')}
                            className="p-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Daftar Butir Poin"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga\n')}
                            className="px-1.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 font-bold text-[10px] rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Daftar Penomoran"
                          >
                            1.
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n---\n\n')}
                            className="px-1.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-500 text-[10px] rounded border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer"
                            title="Garis Pemisah"
                          >
                            Garis
                          </button>
                        </div>

                        {/* Textarea LUAS & Fleksibel */}
                        <textarea
                          ref={textareaRef}
                          required
                          value={formData.content}
                          onChange={(e) => {
                            setFormData({ ...formData, content: e.target.value });
                            updateSelection();
                          }}
                          onSelect={updateSelection}
                          onKeyUp={updateSelection}
                          onClick={updateSelection}
                          placeholder="Ketik isi artikel dengan leluasa di sini... Cukup tekan Enter 2x untuk membuat paragraf baru seperti mengetik di Word atau WhatsApp."
                          className="w-full flex-1 min-h-[320px] text-xs sm:text-sm p-3 bg-slate-50 dark:bg-slate-800 rounded-b-lg border border-t-0 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* ======================================================== */}
                    {/* KOLOM KANAN (30% / col-span-4): SIDEBAR ULTRA COMPACT   */}
                    {/* ======================================================== */}
                    <div className="lg:col-span-4 space-y-2.5">
                      {/* Panel 1: Status & Pengaturan Publikasi */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Status & Publikasi</span>
                          </h4>
                        </div>

                        {/* Status Switcher Compact */}
                        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 dark:bg-slate-900 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                            className={`py-1 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              formData.status === 'PUBLISHED'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            <span>✓ Terbitkan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
                            className={`py-1 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              formData.status === 'DRAFT'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                          >
                            <span>Draf</span>
                          </button>
                        </div>

                        {/* Kategori */}
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              Kategori Berita
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsCategoryModalOpen(true)}
                              className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                            >
                              + Kelola Kategori
                            </button>
                          </div>
                          <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white font-medium"
                          >
                            <option value="">Pilih Kategori...</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Slug URL */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                            Slug URL Halaman
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full text-[10px] font-mono p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Panel Penulis Berita (Sumber Data Penduduk Desa) */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Penulis / Pewarta Berita</span>
                          </label>
                          {formData.authorResidentId && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                              Terverifikasi Penduduk
                            </span>
                          )}
                        </div>
                        <ResidentPicker
                          tenantSlug={currentTenantId}
                          selectedResidentId={formData.authorResidentId}
                          selectedResidentName={formData.authorResidentName}
                          label="Pilih Sumber dari Data Penduduk"
                          placeholder="Cari nama atau NIK warga sebagai penulis..."
                          helperText="Penulis artikel ditautkan langsung ke data penduduk desa."
                          onSelect={(resident) => {
                            setFormData((prev) => ({
                              ...prev,
                              authorResidentId: resident.id,
                              authorResidentName: `${resident.nama} (${resident.nik})`,
                            }));
                          }}
                          onClear={() => {
                            setFormData((prev) => ({
                              ...prev,
                              authorResidentId: null,
                              authorResidentName: '',
                            }));
                          }}
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          Nama penulis berita otomatis diverifikasi dari data kependudukan desa.
                        </p>
                      </div>

                      {/* Panel 2: Foto Sampul (Cover Berita) - Compact Horizontal */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Foto Sampul (Cover)</span>
                          </label>
                          {formData.coverImageUrl && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                              className="text-[10px] text-rose-600 hover:underline font-bold cursor-pointer"
                            >
                              Hapus Cover
                            </button>
                          )}
                        </div>

                        {/* Compact Thumbnail + Action Buttons Grid */}
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-24 h-16 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {formData.coverImageUrl ? (
                              <img
                                src={formData.coverImageUrl}
                                alt="Cover"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FileImage className="w-5 h-5 stroke-1 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <input
                              ref={coverFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleUploadCover}
                              className="hidden"
                            />
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                disabled={uploadingCover}
                                onClick={() => coverFileInputRef.current?.click()}
                                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-md shadow-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {uploadingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                <span>Upload</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMediaModalPurpose('cover');
                                  setIsMediaModalOpen(true);
                                }}
                                className="flex-1 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-600 transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <FolderOpen className="w-3 h-3 text-amber-600" />
                                <span>Server</span>
                              </button>
                            </div>
                            <span className="text-[9px] text-slate-400 block truncate">
                              {formData.coverImageUrl ? 'Foto terpasang' : 'Pilih atau upload gambar'}
                            </span>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={formData.coverImageUrl}
                          onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                          placeholder="atau tempel link URL foto (/uploads/...)"
                          className="w-full text-[10px] p-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-slate-700 dark:text-slate-300"
                        />
                      </div>

                      {/* Panel 3: Album Dokumentasi (Multi-Foto) - Compact Grid */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Images className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Album Foto ({formData.galleryUrls.length})</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              ref={albumFileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleUploadAlbumFiles}
                              className="hidden"
                            />
                            <button
                              type="button"
                              disabled={uploadingAlbum}
                              onClick={() => albumFileInputRef.current?.click()}
                              className="text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 cursor-pointer"
                              title="Upload dari Komputer"
                            >
                              + Upload
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMediaModalPurpose('album');
                                setIsMediaModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-1.5 py-0.5 rounded cursor-pointer"
                              title="Pilih dari Server"
                            >
                              + Server
                            </button>
                          </div>
                        </div>

                        {formData.galleryUrls.length === 0 ? (
                          <div className="p-2 text-center text-[10px] text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                            <span>Belum ada foto album tambahan.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {formData.galleryUrls.map((photo, idx) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 relative group border border-slate-200 dark:border-slate-700"
                              >
                                <img src={photo.url} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAlbumPhoto(idx)}
                                  className="absolute top-0.5 right-0.5 p-0.5 rounded bg-rose-600 text-white hover:bg-rose-700 transition shadow cursor-pointer opacity-70 group-hover:opacity-100"
                                  title="Hapus foto"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                                <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[7px] font-mono px-0.5 rounded">
                                  {idx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer Compact */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-slate-400">
                {formData.content.length} karakter • {formData.galleryUrls.length} foto album
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="articleForm"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Terbitkan Berita'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pustaka Foto Server */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        tenantSlug={activeTenant?.slug || currentTenantId || ''}
        onSelectImage={handleSelectMedia}
        multiSelect={mediaModalPurpose === 'album'}
        onSelectMultiple={handleSelectMultipleMedia}
        title={
          mediaModalPurpose === 'cover'
            ? 'Pilih Foto Cover dari Server'
            : mediaModalPurpose === 'album'
            ? 'Pilih Foto untuk Album Dokumentasi'
            : 'Pustaka Foto Server Desa'
        }
      />

      {/* Modal Kelola Kategori Berita */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        tenantSlug={currentTenantId}
        onCategoriesChanged={fetchArticles}
      />

      {/* Modal Sisipkan Link Ramah Pengguna */}
      <InsertLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        initialText={selectedTextForLink}
        onInsert={handleInsertLink}
      />
    </div>
  );
}
