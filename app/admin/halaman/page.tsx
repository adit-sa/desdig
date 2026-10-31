'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  Image as ImageIcon,
  Heading,
  Bold,
  Italic,
  List,
  Quote,
  Sparkles,
  ArrowLeft,
  X,
  Layers,
  Calendar,
  FolderOpen,
  Link2,
  Table as TableIcon,
  Loader2,
  Save,
  Info,
  Images,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import MediaLibraryModal from '@/components/admin/MediaLibraryModal';
import InsertLinkModal from '@/components/admin/InsertLinkModal';
import { formatArticleContent } from '@/lib/utils/formatContent';

interface AlbumItem {
  url: string;
  caption: string;
}

interface PageItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  galleryUrls?: any;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCustomPagesPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Media Library & Link Modals
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalPurpose, setMediaModalPurpose] = useState<'cover' | 'inline' | 'album'>('inline');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const albumFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    coverImageUrl: '',
    galleryUrls: [] as AlbumItem[],
    status: 'PUBLISHED' as 'DRAFT' | 'PUBLISHED',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pages?tenant=${currentTenantId}&q=${searchQuery}&status=${statusFilter}`);
      const data = await res.json();
      if (data.pages) {
        setPages(data.pages);
      }
    } catch (e) {
      console.error('Failed to fetch pages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [currentTenantId, searchQuery, statusFilter]);

  // Handle Slug Generation
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
      slug: prev.slug === '' || !editingId ? slug : prev.slug,
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      coverImageUrl: '',
      galleryUrls: [],
      status: 'PUBLISHED',
    });
    setFormError(null);
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (page: PageItem) => {
    setEditingId(page.id);

    let parsedAlbum: AlbumItem[] = [];
    if (page.galleryUrls) {
      if (Array.isArray(page.galleryUrls)) {
        parsedAlbum = page.galleryUrls
          .map((item: any) => {
            if (typeof item === 'string') return { url: item, caption: '' };
            return { url: item.url || '', caption: item.caption || '' };
          })
          .filter((item: any) => Boolean(item.url));
      }
    }

    setFormData({
      title: page.title,
      slug: page.slug,
      summary: page.summary || '',
      content: page.content,
      coverImageUrl: page.coverImageUrl || '',
      galleryUrls: parsedAlbum,
      status: page.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
    });
    setFormError(null);
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  // Upload Cover Image
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingCover(true);
      setFormError(null);
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Gagal mengunggah gambar');
      }

      setFormData((prev) => ({ ...prev, coverImageUrl: json.url }));
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengunggah foto cover');
    } finally {
      setUploadingCover(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Track selection inside textarea
  const updateSelection = () => {
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart ?? 0,
        end: textareaRef.current.selectionEnd ?? 0,
      };
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
      const imgTag = `\n\n![Dokumentasi Halaman](${url})\n\n`;
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

  // Upload multi foto album dari komputer
  const handleUploadAlbumFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingAlbum(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('tenant', currentTenantId);
        fd.append('folder', 'halaman');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        return data.success && data.url ? { url: data.url, caption: '' } : null;
      });

      const results = await Promise.all(uploadPromises);
      const validUrls = results.filter(Boolean) as AlbumItem[];
      setFormData((prev) => ({
        ...prev,
        galleryUrls: [...(prev.galleryUrls || []), ...validUrls],
      }));
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah foto album');
    } finally {
      setUploadingAlbum(false);
      if (albumFileInputRef.current) albumFileInputRef.current.value = '';
    }
  };

  const handleRemoveAlbumPhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryUrls: prev.galleryUrls.filter((_, i) => i !== index),
    }));
  };

  // Upload inline image directly into content
  const handleUploadInlineImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingInline(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant', currentTenantId);
      fd.append('folder', 'halaman');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        insertIntoContent(`\n\n![Gambar Halaman](${data.url})\n\n`, '');
      } else {
        alert('Gagal mengunggah gambar: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload gambar');
    } finally {
      setUploadingInline(false);
      if (inlineFileInputRef.current) inlineFileInputRef.current.value = '';
    }
  };

  // Template Halaman Resmi Desa
  const handleApplyTemplate = () => {
    if (formData.content.trim() && !confirm('Ganti isi konten halaman dengan template struktur profil/informasi desa? Konten sebelumnya akan ditimpa.')) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      content: `## Pendahuluan
Tuliskan pengantar latar belakang atau tujuan resmi dokumen/halaman informasi desa ini di sini.

## Latar Belakang & Sejarah
Pemerintah desa senantiasa berkomitmen memberikan pelayanan terbaik, akuntabel, dan transparan kepada seluruh masyarakat.

## Landasan Kebijakan & Tujuan
- Mempercepat akses pelayanan publik warga
- Mewujudkan tata kelola desa yang transparan dan partisipatif
- Meningkatkan kesejahteraan sosial dan ekonomi masyarakat desa

## Informasi Pelayanan & Kontak Terkait
| Jenis Layanan | Penanggung Jawab | Lokasi Pelayanan |
| :--- | :--- | :--- |
| Administrasi Warga | Kasi Pemerintahan | Kantor Balai Desa |
| Pelayanan Kesejahteraan | Kasi Kesejahteraan | Kantor Balai Desa |

> "Komitmen kami adalah melayani masyarakat desa dengan penuh integritas, keikhlasan, dan keterbukaan."
`,
    }));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Judul halaman wajib diisi');
      return;
    }
    if (!formData.content.trim()) {
      setFormError('Isi konten halaman wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const url = editingId ? `/api/pages/${editingId}` : '/api/pages';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tenantSlug: currentTenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan halaman');
      }

      setIsModalOpen(false);
      fetchPages();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus halaman "${title}"?`)) return;

    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPages();
      } else {
        alert('Gagal menghapus halaman');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan jaringan');
    }
  };

  // Copy Link Helper
  const handleCopyLink = (slug: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/halaman/${slug}?tenant=${currentTenantId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Statistics
  const totalPublished = pages.filter((p) => p.status === 'PUBLISHED').length;
  const totalDraft = pages.filter((p) => p.status === 'DRAFT').length;
  const totalViews = pages.reduce((sum, p) => sum + p.viewCount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileCode className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Halaman Statis & Dinamis
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola halaman profil tambahan, sejarah, visi misi, regulasi desa, atau halaman informasi khusus untuk Desa{' '}
            <strong>{activeTenant.nama_desa}</strong>.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition hover:shadow-lg self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Halaman Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Halaman</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{pages.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Dipublikasikan</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{totalPublished}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Draft</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{totalDraft}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Total Pembaca</span>
          <span className="text-2xl font-black text-blue-700 mt-1 block">{totalViews}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul, ringkasan, atau slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {['ALL', 'PUBLISHED', 'DRAFT'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  statusFilter === st ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Semua' : st === 'PUBLISHED' ? 'Terbit' : 'Draft'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Memuat daftar halaman desa...</div>
        ) : pages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileCode className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum ada halaman yang dibuat</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Buat halaman baru untuk menampilkan profil khusus, regulasi desa, atau sejarah wilayah desa Anda.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow hover:bg-emerald-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Halaman & Ringkasan</th>
                  <th className="py-3.5 px-4">Slug & URL Publik</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Pembaca</th>
                  <th className="py-3.5 px-4">Dibuat</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-4 max-w-xs sm:max-w-md">
                      <div className="flex items-start gap-3">
                        {p.coverImageUrl ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                            <img src={p.coverImageUrl} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100 font-bold">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm truncate">{p.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {p.summary || 'Tidak ada ringkasan.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[180px]">
                          /halaman/{p.slug}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(p.slug)}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded transition cursor-pointer"
                          title="Salin tautan halaman"
                        >
                          {copiedSlug === p.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {p.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.viewCount}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/halaman/${p.slug}?tenant=${currentTenantId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Halaman"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Halaman"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Buat / Edit Halaman (Ultra Compact 2 Kolom Berdaya Tinggi) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-none">
                    {editingId ? 'Edit Halaman Khusus' : 'Tulis Halaman Baru'}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Halaman statis desa (Profil, Sejarah, Potensi, Regulasi, Standar Pelayanan)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      activeTab === 'edit' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Editor Konten
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      activeTab === 'preview' ? 'bg-white text-emerald-700 shadow-xs' : 'hover:text-slate-900'
                    }`}
                  >
                    Pratinjau Live
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && (
              <div className="m-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 flex-shrink-0">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {activeTab === 'preview' ? (
                /* Tab Pratinjau Live */
                <div className="space-y-4 max-w-4xl mx-auto py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                      Halaman Resmi Desa
                    </span>
                    <span className="text-xs text-slate-400">• /halaman/{formData.slug || 'url'}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                    {formData.title || 'Judul Halaman Belum Diisi'}
                  </h1>

                  {/* Summary / Lead */}
                  {formData.summary && (
                    <div className="p-3.5 bg-slate-50 border-l-4 border-emerald-600 rounded-r-xl text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                      {formData.summary}
                    </div>
                  )}

                  {/* Cover */}
                  {formData.coverImageUrl && (
                    <div className="rounded-xl overflow-hidden shadow-md border border-slate-200 max-h-[380px]">
                      <img src={formData.coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Rendered Body with typography identical to public page */}
                  <div
                    className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 space-y-3 leading-relaxed border-t border-slate-100 pt-3 prose-headings:font-black prose-headings:text-slate-900 prose-a:text-emerald-700 prose-a:font-bold hover:prose-a:underline"
                    dangerouslySetInnerHTML={{
                      __html: formData.content
                        ? formatArticleContent(formData.content)
                        : '<p class="text-slate-400 italic">Konten halaman belum diisi...</p>',
                    }}
                  />

                  {/* Pratinjau Album Multi-Foto */}
                  {formData.galleryUrls.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Images className="w-4 h-4 text-emerald-600" />
                        Album Dokumentasi ({formData.galleryUrls.length} Foto)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {formData.galleryUrls.map((p, idx) => (
                          <div key={idx} className="aspect-4/3 rounded-lg overflow-hidden bg-slate-200 relative border border-slate-200">
                            <img src={p.url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab Form Editor - 2 Kolom Ultra Compact persis seperti admin/berita */
                <form id="page-form" onSubmit={handleSubmit} className="h-full">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
                    {/* KOLOM KIRI (70% / col-span-8): AREA MENULIS LUAS & COMPACT */}
                    <div className="lg:col-span-8 flex flex-col space-y-2.5 h-full">
                      {/* Judul Halaman */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Judul Halaman *
                          </label>
                          <button
                            type="button"
                            onClick={handleApplyTemplate}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                            title="Isi otomatis dengan struktur halaman informasi desa baku"
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
                          placeholder="Contoh: Sejarah Singkat Desa, Profil Wilayah, dll..."
                          className="w-full text-sm font-bold p-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        />
                      </div>

                      {/* Ringkasan Singkat (Lead / Meta Description) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Ringkasan Singkat / Sinopsis
                          </label>
                          <span className="text-[10px] text-slate-400">Pengantar 1-2 kalimat untuk kartu &amp; SEO</span>
                        </div>
                        <textarea
                          rows={2}
                          value={formData.summary}
                          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                          placeholder="Ringkasan singkat pengantar isi halaman..."
                          className="w-full text-xs p-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 resize-none"
                        />
                      </div>

                      {/* Badan Konten Lengkap & Toolbar Ribbon */}
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Isi / Konten Halaman Lengkap *
                          </label>
                          <span className="text-[10px] text-slate-400">
                            Enter 2x = Paragraf baru • Format Markdown &amp; HTML didukung
                          </span>
                        </div>

                        {/* Toolbar Format & Sisipkan Foto (Ribbon 1 Baris Compact) */}
                        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-t-lg overflow-x-auto flex-nowrap text-xs">
                          {/* Foto Server ke Konten */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setMediaModalPurpose('inline');
                              setIsMediaModalOpen(true);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-xs flex items-center gap-1 transition cursor-pointer flex-shrink-0"
                            title="Ambil foto dari server untuk disisipkan ke halaman"
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
                            className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded border border-slate-200 flex items-center gap-1 transition disabled:opacity-50 cursor-pointer flex-shrink-0"
                            title="Upload gambar dari komputer langsung masuk ke teks"
                          >
                            {uploadingInline ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3 text-slate-500" />}
                            <span>+ Upload</span>
                          </button>

                          <div className="h-3.5 w-px bg-slate-300 mx-0.5 flex-shrink-0" />

                          {/* Heading H2 & H3 */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n## ', '\n')}
                            className="px-1.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Judul Bagian (H2)"
                          >
                            H2
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n### ', '\n')}
                            className="px-1.5 py-1 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-black rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Subjudul Bagian (H3)"
                          >
                            H3
                          </button>

                          <div className="h-3.5 w-px bg-slate-300 mx-0.5 flex-shrink-0" />

                          {/* Bold & Italic */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('**', '**')}
                            className="p-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Teks Tebal"
                          >
                            <Bold className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('*', '*')}
                            className="p-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Teks Miring"
                          >
                            <Italic className="w-3.5 h-3.5" />
                          </button>

                          {/* Tombol Sisipkan Link */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleOpenLinkModal}
                            className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold text-[10px] rounded border border-emerald-300 flex items-center gap-1 flex-shrink-0 cursor-pointer"
                            title="Sisipkan tautan web yang bisa diklik pembaca"
                          >
                            <Link2 className="w-3 h-3 text-emerald-600" />
                            <span>Link</span>
                          </button>

                          <div className="h-3.5 w-px bg-slate-300 mx-0.5 flex-shrink-0" />

                          {/* Kutipan, List, Tabel, Garis */}
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n> "', '"\n')}
                            className="p-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Kutipan Resmi"
                          >
                            <Quote className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n- Poin pertama\n- Poin kedua\n- Poin ketiga\n')}
                            className="p-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Daftar Butir Poin"
                          >
                            <List className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n1. Langkah pertama\n2. Langkah kedua\n3. Langkah ketiga\n')}
                            className="px-1.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Daftar Penomoran"
                          >
                            1.
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n| Kolom 1 | Kolom 2 | Kolom 3 |\n| :--- | :--- | :--- |\n| Baris 1 | Data A | Data B |\n| Baris 2 | Data C | Data D |\n\n')}
                            className="p-1 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-200 flex-shrink-0 cursor-pointer"
                            title="Sisipkan Tabel Informasi"
                          >
                            <TableIcon className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => insertIntoContent('\n\n---\n\n')}
                            className="px-1.5 py-1 bg-white hover:bg-slate-50 text-slate-500 text-[10px] rounded border border-slate-200 flex-shrink-0 cursor-pointer"
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
                          placeholder="Ketik isi halaman di sini... Tekan Enter 2x untuk membuat paragraf baru, gunakan toolbar di atas untuk menyisipkan gambar server, heading, atau tabel."
                          className="w-full flex-1 min-h-[340px] text-xs sm:text-sm p-3 bg-slate-50 rounded-b-lg border border-t-0 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed text-slate-900"
                        />
                      </div>
                    </div>

                    {/* KOLOM KANAN (30% / col-span-4): SIDEBAR METADATA COMPACT */}
                    <div className="lg:col-span-4 space-y-3">
                      {/* Panel 1: Status & Publikasi */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                        <h4 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Status &amp; Publikasi</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-0.5 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                            className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              formData.status === 'PUBLISHED'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>✓ Terbitkan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, status: 'DRAFT' })}
                            className={`py-1.5 px-2 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              formData.status === 'DRAFT'
                                ? 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <span>Draf</span>
                          </button>
                        </div>
                      </div>

                      {/* Panel 2: Slug URL */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Slug URL Halaman *
                        </label>
                        <div className="flex items-center">
                          <span className="px-2.5 py-2 bg-slate-200/80 border border-r-0 border-slate-300 rounded-l-lg text-slate-500 text-[11px] font-mono">
                            /halaman/
                          </span>
                          <input
                            type="text"
                            required
                            placeholder="sejarah-desa"
                            value={formData.slug}
                            onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                            className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-r-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block">Alamat tautan publik untuk menu navigasi</span>
                      </div>

                      {/* Panel 3: Foto Cover / Banner Halaman */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Foto Cover / Banner (Opsional)
                        </label>

                        {formData.coverImageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-28 group">
                            <img src={formData.coverImageUrl} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, coverImageUrl: '' }))}
                              className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-md transition cursor-pointer"
                              title="Hapus Cover"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : null}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMediaModalPurpose('cover');
                              setIsMediaModalOpen(true);
                            }}
                            className="w-full px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 flex items-center justify-center gap-1 transition cursor-pointer"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pustaka Server</span>
                          </button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={uploadingCover}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
                          >
                            {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-500" />}
                            <span>Upload PC</span>
                          </button>
                        </div>
                      </div>

                      {/* Panel 4: Album Dokumentasi (Multi-Foto) - Compact Grid */}
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5">
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
                              className="text-[10px] font-bold text-slate-700 hover:text-emerald-700 bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer disabled:opacity-50"
                              title="Upload dari Komputer"
                            >
                              {uploadingAlbum ? <Loader2 className="w-3 h-3 animate-spin" /> : '+ Upload'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMediaModalPurpose('album');
                                setIsMediaModalOpen(true);
                              }}
                              className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded cursor-pointer"
                              title="Pilih dari Server"
                            >
                              + Server
                            </button>
                          </div>
                        </div>

                        {formData.galleryUrls.length === 0 ? (
                          <div className="p-2.5 text-center text-[10px] text-slate-400 border border-dashed border-slate-300 rounded-lg bg-white">
                            <span>Belum ada foto album dokumentasi.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto pr-0.5">
                            {formData.galleryUrls.map((photo, idx) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-md overflow-hidden bg-slate-100 relative group border border-slate-200"
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

                      {/* Panel 5: Tips & Bantuan */}
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                        <span className="font-extrabold text-emerald-900 flex items-center gap-1 text-[11px]">
                          <Info className="w-3.5 h-3.5 text-emerald-600" /> Tips Penulisan Halaman
                        </span>
                        <p className="text-[10px] text-emerald-800 leading-relaxed">
                          Halaman yang Anda terbitkan dapat dipasang sebagai menu navigasi header melalui menu <strong>Admin &gt; Pengaturan Menu</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between flex-shrink-0">
              <span className="text-[11px] text-slate-400">
                {formData.content.length} karakter • {formData.galleryUrls.length} foto album
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  form="page-form"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{editingId ? 'Simpan Perubahan' : 'Terbitkan Halaman'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pustaka Media Server */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        tenantSlug={activeTenant?.slug || currentTenantId || ''}
        onSelectImage={handleSelectMedia}
        multiSelect={mediaModalPurpose === 'album'}
        onSelectMultiple={handleSelectMultipleMedia}
        title={
          mediaModalPurpose === 'cover'
            ? 'Pilih Foto Cover Halaman'
            : mediaModalPurpose === 'album'
            ? 'Pilih Foto untuk Album Dokumentasi'
            : 'Sisipkan Foto ke Dalam Konten'
        }
      />

      {/* Modal Sisipkan Link */}
      <InsertLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        initialText={selectedTextForLink}
        onInsert={handleInsertLink}
      />
    </div>
  );
}
