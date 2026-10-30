'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Trash2,
  Eye,
  Edit3,
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Home,
  RefreshCw,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Loader2,
  ShieldCheck,
  Building2,
  ArrowRight,
  Layers,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

export interface ResidentItem {
  id: string;
  nik: string;
  noKk: string;
  nama: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  agama?: string | null;
  pendidikan?: string | null;
  pekerjaan?: string | null;
  statusKawin?: string | null;
  golonganDarah?: string | null;
  hubunganKeluarga?: string | null;
  alamat?: string | null;
  dusun?: string | null;
  rt?: string | null;
  rw?: string | null;
  telepon?: string | null;
  fotoUrl?: string | null;
  statusDasar: string;
}

export interface DusunItem {
  dusun: string;
  totalJiwa: number;
  laki: number;
  perempuan: number;
  totalKK: number;
  rtCount: number;
  rwCount: number;
  rtList: string[];
  rwList: string[];
  kepalaDusun?: string | null;
}

const AGAMA_OPTIONS = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
  'Kepercayaan Lain',
];

const PENDIDIKAN_OPTIONS = [
  'Tidak / Belum Sekolah',
  'Belum Tamat SD / Sederajat',
  'Tamat SD / Sederajat',
  'SLTP / Sederajat',
  'SLTA / Sederajat',
  'Diploma I / II',
  'Akademi / Diploma III / S.Muda',
  'Diploma IV / Strata I',
  'Strata II',
  'Strata III',
];

const STATUS_KAWIN_OPTIONS = [
  'Belum Kawin',
  'Kawin',
  'Cerai Hidup',
  'Cerai Mati',
];

const HUBUNGAN_KELUARGA_OPTIONS = [
  'Kepala Keluarga',
  'Suami',
  'Istri',
  'Anak',
  'Menantu',
  'Cucu',
  'Orang Tua',
  'Mertua',
  'Famili Lain',
  'Pembantu',
  'Lainnya',
];

const GOLONGAN_DARAH_OPTIONS = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu'];

export default function KependudukanPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();

  // Active Main Tab: 'buku_induk' | 'dusun'
  const [activeTab, setActiveTab] = useState<'buku_induk' | 'dusun'>('buku_induk');

  const [residents, setResidents] = useState<ResidentItem[]>([]);
  const [dusunList, setDusunList] = useState<DusunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDusun, setLoadingDusun] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search for Residents
  const [search, setSearch] = useState('');
  const [filterDusun, setFilterDusun] = useState('Semua');
  const [filterGender, setFilterGender] = useState('Semua');
  const [filterKawin, setFilterKawin] = useState('Semua');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Modal State for Residents
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<ResidentItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modal State for Edit Dusun (Rename)
  const [isEditDusunModalOpen, setIsEditDusunModalOpen] = useState(false);
  const [editingDusunOldName, setEditingDusunOldName] = useState('');
  const [editingDusunNewName, setEditingDusunNewName] = useState('');
  const [savingDusun, setSavingDusun] = useState(false);
  const [dusunModalError, setDusunModalError] = useState<string | null>(null);

  // Form Fields State
  const initialFormData = {
    nik: '',
    noKk: '',
    nama: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: '',
    tanggalLahir: '',
    agama: 'Islam',
    pendidikan: 'SLTA / Sederajat',
    pekerjaan: 'Wiraswasta',
    statusKawin: 'Kawin',
    golonganDarah: 'O',
    hubunganKeluarga: 'Kepala Keluarga',
    alamat: '',
    dusun: '',
    rt: '001',
    rw: '001',
    telepon: '',
    statusDasar: 'Hidup',
  };

  const [formData, setFormData] = useState(initialFormData);

  // Fetch Residents from PostgreSQL API
  const fetchResidents = useCallback(async (isCancelled?: () => boolean) => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/residents?tenant=${slug}&limit=5000`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat data penduduk');
      }
      if (!isCancelled || !isCancelled()) {
        setResidents(data.residents || []);
      }
    } catch (err: any) {
      if (!isCancelled || !isCancelled()) {
        console.error(err);
        setErrorMsg(err.message || 'Terjadi kesalahan saat memuat data penduduk');
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  }, [currentTenantId, activeTenant?.slug]);

  // Fetch Dusun Statistics from API
  const fetchDusunStats = useCallback(async (isCancelled?: () => boolean) => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoadingDusun(true);
      const res = await fetch(`/api/residents/dusun?tenant=${slug}`);
      const data = await res.json();
      if (res.ok && data.dusunList) {
        if (!isCancelled || !isCancelled()) {
          setDusunList(data.dusunList);
        }
      }
    } catch (err) {
      console.error('Gagal memuat statistik dusun:', err);
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoadingDusun(false);
      }
    }
  }, [currentTenantId, activeTenant?.slug]);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    fetchResidents(isCancelled);
    fetchDusunStats(isCancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchResidents, fetchDusunStats]);

  // Ekstrak Dusun yang unik secara dinamis (Strict Multi-Tenancy: tidak di-hardcode)
  const availableDusuns = useMemo(() => {
    const set = new Set<string>();
    residents.forEach((r) => {
      if (r.dusun && r.dusun.trim()) {
        set.add(r.dusun.trim());
      }
    });
    return Array.from(set).sort();
  }, [residents]);

  // Hitung Statistik Kependudukan
  const stats = useMemo(() => {
    const total = residents.length;
    const laki = residents.filter((r) => r.jenisKelamin === 'L').length;
    const perempuan = residents.filter((r) => r.jenisKelamin === 'P').length;
    const kkSet = new Set<string>();
    residents.forEach((r) => {
      if (r.noKk && r.noKk.trim()) kkSet.add(r.noKk.trim());
    });
    return {
      total,
      laki,
      perempuan,
      totalKK: kkSet.size || residents.filter((r) => r.hubunganKeluarga === 'Kepala Keluarga').length,
    };
  }, [residents]);

  // Hitung Statistik Dusun/Wilayah
  const dusunStatsSummary = useMemo(() => {
    const totalDusun = dusunList.filter((d) => d.dusun !== 'Belum Ditetapkan').length;
    let totalRT = 0;
    let totalRW = 0;
    dusunList.forEach((d) => {
      totalRT += d.rtCount;
      totalRW += d.rwCount;
    });
    return { totalDusun, totalRT, totalRW };
  }, [dusunList]);

  // Filter Data di Tabel
  const filteredResidents = useMemo(() => {
    const q = search.toLowerCase().trim();
    return residents.filter((item) => {
      const matchSearch =
        !q ||
        item.nama.toLowerCase().includes(q) ||
        item.nik.includes(q) ||
        (item.noKk && item.noKk.includes(q)) ||
        (item.dusun && item.dusun.toLowerCase().includes(q)) ||
        (item.pekerjaan && item.pekerjaan.toLowerCase().includes(q));

      const matchDusun = filterDusun === 'Semua' || item.dusun === filterDusun;
      const matchGender = filterGender === 'Semua' || item.jenisKelamin === filterGender;
      const matchKawin = filterKawin === 'Semua' || item.statusKawin === filterKawin;

      return matchSearch && matchDusun && matchGender && matchKawin;
    });
  }, [residents, search, filterDusun, filterGender, filterKawin]);

  // Reset pagination saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterDusun, filterGender, filterKawin]);

  // Paginated Residents
  const totalPages = Math.ceil(filteredResidents.length / pageSize) || 1;
  const paginatedResidents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResidents.slice(start, start + pageSize);
  }, [filteredResidents, currentPage, pageSize]);

  // Format Umur
  const hitungUmur = (tglLahir?: string | null) => {
    if (!tglLahir) return '-';
    try {
      const birth = new Date(tglLahir);
      if (isNaN(birth.getTime())) return '-';
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${Math.max(age, 0)} thn`;
    } catch {
      return '-';
    }
  };

  // Open Create Resident Modal
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ...initialFormData,
      dusun: availableDusuns[0] || 'Dusun Krajan',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Resident Modal
  const handleOpenEdit = (res: ResidentItem) => {
    setEditingId(res.id);
    let formattedDate = '';
    if (res.tanggalLahir) {
      try {
        formattedDate = new Date(res.tanggalLahir).toISOString().split('T')[0];
      } catch {
        formattedDate = '';
      }
    }

    setFormData({
      nik: res.nik || '',
      noKk: res.noKk || '',
      nama: res.nama || '',
      jenisKelamin: res.jenisKelamin || 'L',
      tempatLahir: res.tempatLahir || '',
      tanggalLahir: formattedDate,
      agama: res.agama || 'Islam',
      pendidikan: res.pendidikan || 'SLTA / Sederajat',
      pekerjaan: res.pekerjaan || 'Wiraswasta',
      statusKawin: res.statusKawin || 'Kawin',
      golonganDarah: res.golonganDarah || 'O',
      hubunganKeluarga: res.hubunganKeluarga || 'Kepala Keluarga',
      alamat: res.alamat || '',
      dusun: res.dusun || '',
      rt: res.rt || '001',
      rw: res.rw || '001',
      telepon: res.telepon || '',
      statusDasar: res.statusDasar || 'Hidup',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Submit Handler for Resident Form (Create & Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.nik.trim() || formData.nik.trim().length < 16) {
      setFormError('NIK harus berupa 16 digit angka');
      return;
    }

    if (!formData.nama.trim()) {
      setFormError('Nama lengkap penduduk wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/residents/${editingId}?tenant=${currentTenantId}`
        : `/api/residents?tenant=${currentTenantId}`;
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
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan data penduduk');
      }

      setIsFormModalOpen(false);
      await fetchResidents();
      await fetchDusunStats();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan sistem saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  // Delete Resident Handler
  const handleDelete = async (item: ResidentItem) => {
    if (!confirm(`Hapus data kependudukan "${item.nama}" (NIK: ${item.nik}) dari Buku Induk secara permanen?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/residents/${item.id}?tenant=${currentTenantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus data penduduk');
      }
      fetchResidents();
      fetchDusunStats();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  // Open Edit Dusun Modal
  const handleOpenEditDusun = (dusunName: string) => {
    setEditingDusunOldName(dusunName);
    setEditingDusunNewName(dusunName);
    setDusunModalError(null);
    setIsEditDusunModalOpen(true);
  };

  // Submit Rename Dusun
  const handleSaveRenameDusun = async (e: React.FormEvent) => {
    e.preventDefault();
    setDusunModalError(null);

    const trimmedNew = editingDusunNewName.trim();
    if (!trimmedNew) {
      setDusunModalError('Nama dusun baru wajib diisi!');
      return;
    }

    if (trimmedNew === editingDusunOldName) {
      setIsEditDusunModalOpen(false);
      return;
    }

    setSavingDusun(true);
    try {
      const res = await fetch(`/api/residents/dusun?tenant=${currentTenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentTenantId,
          oldDusunName: editingDusunOldName,
          newDusunName: trimmedNew,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memperbarui nama dusun');
      }

      setIsEditDusunModalOpen(false);
      await fetchResidents();
      await fetchDusunStats();
    } catch (err: any) {
      setDusunModalError(err.message || 'Terjadi kesalahan saat mengubah nama dusun');
    } finally {
      setSavingDusun(false);
    }
  };

  // Switch to Resident Tab with Dusun Filter pre-applied
  const handleFilterResidentsByDusun = (dusunName: string) => {
    setFilterDusun(dusunName);
    setActiveTab('buku_induk');
  };

  return (
    <div className="space-y-4">
      {/* ======================================================== */}
      {/* KOP / HEADER BUKU INDUK KEPENDUDUKAN & REGISTER DUSUN    */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 shadow-2xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              <BookOpen className="w-3 h-3" />
              <span>Model A.1 — Administrasi Desa</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Buku Induk Kependudukan & Wilayah Desa
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Pemerintah Desa {activeTenant?.nama_desa} • Kec. {activeTenant?.kecamatan} • Kab. {activeTenant?.kabupaten}
            </p>
          </div>

          {/* Action Tools: Print / Cetak & Tambah Penduduk */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              title="Cetak Lembar Buku Induk"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cetak</span>
            </button>

            <button
              onClick={() => {
                fetchResidents();
                fetchDusunStats();
              }}
              disabled={loading || loadingDusun}
              title="Segarkan Data"
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading || loadingDusun ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-2xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Warga</span>
            </button>
          </div>
        </div>

        {/* Ringkasan Register Kependudukan (Mini Rekapitulasi) */}
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold">
              <Users className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Jiwa</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{stats.total.toLocaleString('id-ID')} Jiwa</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-bold text-xs">
              L
            </span>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Laki-Laki</span>
              <span className="text-sm font-black text-blue-700 dark:text-blue-400">
                {stats.laki.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">({stats.total > 0 ? Math.round((stats.laki / stats.total) * 100) : 0}%)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-400 font-bold text-xs">
              P
            </span>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Perempuan</span>
              <span className="text-sm font-black text-pink-700 dark:text-pink-400">
                {stats.perempuan.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 font-normal">({stats.total > 0 ? Math.round((stats.perempuan / stats.total) * 100) : 0}%)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
              <Home className="w-3.5 h-3.5" />
            </span>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Kepala Keluarga</span>
              <span className="text-sm font-black text-amber-700 dark:text-amber-400">{stats.totalKK.toLocaleString('id-ID')} KK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher (Print: Hidden) */}
      <div className="flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 print:hidden">
        <button
          onClick={() => setActiveTab('buku_induk')}
          className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition cursor-pointer ${
            activeTab === 'buku_induk'
              ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Buku Induk Penduduk</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
            {stats.total.toLocaleString('id-ID')}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('dusun')}
          className={`pb-2 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 -mb-px transition cursor-pointer ${
            activeTab === 'dusun'
              ? 'border-emerald-700 text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Buku Administrasi Wilayah (Dusun & RT/RW)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            {dusunStatsSummary.totalDusun} Dusun
          </span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: BUKU INDUK PENDUDUK (LEBIH COMPACT & TIDAK MELAR) */}
      {/* ======================================================== */}
      {activeTab === 'buku_induk' && (
        <div className="space-y-3">
          {/* Filter Bar (Print: Hidden) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs print:hidden">
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari Nama Warga, NIK, No. KK, atau Pekerjaan..."
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterDusun}
                onChange={(e) => setFilterDusun(e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium dark:text-white"
              >
                <option value="Semua">Semua Dusun</option>
                {availableDusuns.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium dark:text-white"
              >
                <option value="Semua">Semua JK</option>
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <select
                value={filterKawin}
                onChange={(e) => setFilterKawin(e.target.value)}
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-medium dark:text-white"
              >
                <option value="Semua">Semua Status</option>
                {STATUS_KAWIN_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabel Buku Induk Kependudukan (Compact Ledger Style) */}
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider">
                    <th className="px-2 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-8">No</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700">Nama Lengkap & NIK</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700">Nomor KK & Hubungan</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700">Tempat, Tanggal Lahir & JK</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700">Pekerjaan & Pendidikan</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700">Agama & Status</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700">Wilayah / Dusun (RT/RW)</th>
                    <th className="px-2 py-2 text-center print:hidden w-16">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                          <span className="font-semibold text-xs">Memuat Buku Induk Penduduk...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedResidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        <p className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                          Tidak ditemukan data penduduk yang sesuai dengan kriteria.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedResidents.map((item, idx) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {/* 1. No */}
                        <td className="px-2 py-1.5 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-slate-500">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>

                        {/* 2. Nama & NIK */}
                        <td className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-slate-900 dark:text-white leading-tight">{item.nama}</div>
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{item.nik}</div>
                        </td>

                        {/* 3. No KK & Hubungan */}
                        <td className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-800">
                          <div className="font-mono text-slate-700 dark:text-slate-300">{item.noKk || '-'}</div>
                          <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">{item.hubunganKeluarga || 'Warga'}</div>
                        </td>

                        {/* 4. TTL & JK */}
                        <td className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <div className="text-slate-800 dark:text-slate-200 font-medium">
                            {item.tempatLahir ? `${item.tempatLahir}, ` : ''}
                            {item.tanggalLahir
                              ? new Date(item.tanggalLahir).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span className={`font-bold ${item.jenisKelamin === 'L' ? 'text-blue-700' : 'text-pink-700'}`}>
                              {item.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}
                            </span>
                            <span>•</span>
                            <span>{hitungUmur(item.tanggalLahir)}</span>
                          </div>
                        </td>

                        {/* 5. Pekerjaan & Pendidikan */}
                        <td className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-800">
                          <div className="text-slate-800 dark:text-slate-200 font-semibold">{item.pekerjaan || '-'}</div>
                          <div className="text-[10px] text-slate-500">{item.pendidikan || '-'}</div>
                        </td>

                        {/* 6. Agama & Status Kawin */}
                        <td className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <div className="text-slate-800 dark:text-slate-200">{item.agama || '-'}</div>
                          <div className="text-[10px] text-slate-500">{item.statusKawin || '-'}</div>
                        </td>

                        {/* 7. Dusun & RT/RW */}
                        <td className="px-2.5 py-1.5 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white">{item.dusun || '-'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            RT {item.rt || '-'} / RW {item.rw || '-'}
                          </div>
                        </td>

                        {/* 8. Aksi (Print: Hidden) */}
                        <td className="px-2 py-1.5 text-center whitespace-nowrap print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedResident(item)}
                              title="Lihat Detail"
                              className="rounded p-1 text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Data"
                              className="rounded p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              title="Hapus"
                              className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs print:hidden bg-slate-50 dark:bg-slate-800/40">
              <div className="text-slate-500 text-[11px]">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</span> - <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, filteredResidents.length)}</span> dari <span className="font-bold text-slate-900 dark:text-white">{filteredResidents.length.toLocaleString('id-ID')}</span> jiwa
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-0.5 text-xs font-medium"
                >
                  <option value={25}>25 baris</option>
                  <option value={50}>50 baris</option>
                  <option value={100}>100 baris</option>
                  <option value={200}>200 baris</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage <= 1}
                    className="p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-semibold px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TABEL REGISTER WILAYAH & DUSUN (FORMAT RESMI BIP) */}
      {/* ======================================================== */}
      {activeTab === 'dusun' && (
        <div className="space-y-3">
          {/* Tabel Buku Register Wilayah / Dusun (Gaya Buku Induk) */}
          <div className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg overflow-hidden shadow-2xs">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-3 py-2 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                  Buku Register Wilayah Administrasi Dusun Desa
                </h3>
                <p className="text-[10px] text-slate-500">
                  Daftar pembagian dusun, kepala dusun, sebaran RT, RW, dan jumlah jiwa sesuai data kependudukan desa.
                </p>
              </div>

              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                Total {dusunList.length} Dusun
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider">
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-8">No</th>
                    <th className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 min-w-[140px]">Nama Dusun / Wilayah</th>
                    <th className="px-3 py-2 border-r border-slate-300 dark:border-slate-700 min-w-[150px]">Kepala Dusun</th>
                    <th className="px-3 py-2 border-r border-slate-300 dark:border-slate-700">Unit RT Terdaftar</th>
                    <th className="px-2 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-12">RW</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-16">Jumlah KK</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-16">Laki (L)</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-16">Perempuan (P)</th>
                    <th className="px-2.5 py-2 border-r border-slate-300 dark:border-slate-700 text-center w-20">Total Jiwa</th>
                    <th className="px-3 py-2 text-center print:hidden w-28">Aksi</th>
                  </tr>
                  <tr className="bg-slate-200/60 dark:bg-slate-800/60 text-slate-500 text-[9px] font-mono text-center border-b border-slate-300 dark:border-slate-700">
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">1</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">2</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">3</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">4</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">5</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">6</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">7</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">8</td>
                    <td className="py-0.5 border-r border-slate-300 dark:border-slate-700">9</td>
                    <td className="py-0.5 print:hidden">10</td>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loadingDusun ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                          <span className="font-semibold text-xs">Memuat Buku Administrasi Wilayah...</span>
                        </div>
                      </td>
                    </tr>
                  ) : dusunList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Belum ada data dusun tercatat.
                      </td>
                    </tr>
                  ) : (
                    dusunList.map((d, idx) => (
                      <tr
                        key={d.dusun}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        {/* 1. No */}
                        <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* 2. Nama Dusun */}
                        <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                            <span>{d.dusun}</span>
                          </div>
                        </td>

                        {/* 3. Kepala Dusun */}
                        <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                          {d.kepalaDusun ? (
                            <span className="text-slate-900 dark:text-white font-bold">{d.kepalaDusun}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Belum Ditentukan</span>
                          )}
                        </td>

                        {/* 4. Unit RT */}
                        <td className="px-3 py-2 border-r border-slate-200 dark:border-slate-800">
                          <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {d.rtList.length > 0 ? d.rtList.map((rt) => `RT ${rt}`).join(', ') : 'RT 001'}
                          </div>
                          <div className="text-[10px] text-slate-400">Total {d.rtCount} Unit RT</div>
                        </td>

                        {/* 5. RW */}
                        <td className="px-2 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {d.rwCount}
                        </td>

                        {/* 6. Jumlah KK */}
                        <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-black text-amber-700 dark:text-amber-400">
                          {d.totalKK.toLocaleString('id-ID')}
                        </td>

                        {/* 7. Laki-Laki */}
                        <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-black text-blue-700 dark:text-blue-400">
                          {d.laki.toLocaleString('id-ID')}
                        </td>

                        {/* 8. Perempuan */}
                        <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-black text-pink-700 dark:text-pink-400">
                          {d.perempuan.toLocaleString('id-ID')}
                        </td>

                        {/* 9. Total Jiwa */}
                        <td className="px-2.5 py-2 border-r border-slate-200 dark:border-slate-800 text-center font-black text-slate-900 dark:text-white bg-slate-50/80 dark:bg-slate-800/40">
                          {d.totalJiwa.toLocaleString('id-ID')}
                        </td>

                        {/* 10. Aksi */}
                        <td className="px-2 py-2 text-center whitespace-nowrap print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditDusun(d.dusun)}
                              title="Ubah Nama Dusun"
                              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Ubah</span>
                            </button>

                            <button
                              onClick={() => handleFilterResidentsByDusun(d.dusun)}
                              title="Lihat Warga di Buku Induk"
                              className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Warga</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT NAMA DUSUN (RENAME BATCH ACROSS RESIDENTS)     */}
      {/* ======================================================== */}
      {isEditDusunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-300 dark:border-slate-700 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Ubah Nama Wilayah / Dusun
                </h3>
              </div>
              <button
                onClick={() => setIsEditDusunModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {dusunModalError && (
              <div className="mt-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{dusunModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRenameDusun} className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Dusun Saat Ini
                </label>
                <input
                  type="text"
                  disabled
                  value={editingDusunOldName}
                  className="w-full rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 p-2 text-xs text-slate-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Dusun Baru *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingDusunNewName}
                  onChange={(e) => setEditingDusunNewName(e.target.value)}
                  placeholder="Ketik nama dusun baru (contoh: Dusun Krajan)..."
                  className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-2 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[10px] text-amber-800 dark:text-amber-300">
                <p className="font-bold">Sinkronisasi Otomatis Seluruh Warga:</p>
                <p className="mt-0.5">
                  Mengubah nama dusun ini akan otomatis memperbarui data wilayah pada seluruh warga di dusun tersebut pada Buku Induk Penduduk.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditDusunModalOpen(false)}
                  className="rounded border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingDusun}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 font-bold text-white shadow-2xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                >
                  {savingDusun && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL TAMBAH / EDIT PENDUDUK                             */}
      {/* ======================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xl border border-slate-300 dark:border-slate-700 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-700" />
                <span>{editingId ? 'Koreksi Data Warga Buku Induk' : 'Registrasi Penduduk Baru (Buku Induk)'}</span>
              </h2>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* NIK */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    NIK (16 digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                    placeholder="16 digit NIK..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 font-mono text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* No KK */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Nomor KK (16 digit) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.noKk}
                    onChange={(e) => setFormData({ ...formData, noKk: e.target.value.replace(/\D/g, '') })}
                    placeholder="16 digit Nomor KK..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 font-mono text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Nama Lengkap Sesuai KTP *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama lengkap warga..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold"
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Jenis Kelamin *
                  </label>
                  <select
                    value={formData.jenisKelamin}
                    onChange={(e) => setFormData({ ...formData, jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                {/* Hubungan Keluarga */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Hubungan Dalam Keluarga *
                  </label>
                  <select
                    value={formData.hubunganKeluarga}
                    onChange={(e) => setFormData({ ...formData, hubunganKeluarga: e.target.value })}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {HUBUNGAN_KELUARGA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tempat Lahir */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Tempat Lahir</label>
                  <input
                    type="text"
                    value={formData.tempatLahir}
                    onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                    placeholder="Kota / Kab kelahiran..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Agama */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Agama</label>
                  <select
                    value={formData.agama}
                    onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {AGAMA_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Kawin */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Status Perkawinan</label>
                  <select
                    value={formData.statusKawin}
                    onChange={(e) => setFormData({ ...formData, statusKawin: e.target.value })}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {STATUS_KAWIN_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pendidikan */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Pendidikan Terakhir</label>
                  <select
                    value={formData.pendidikan}
                    onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    {PENDIDIKAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pekerjaan */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Pekerjaan</label>
                  <input
                    type="text"
                    value={formData.pekerjaan}
                    onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                    placeholder="Petani, PNS, dll..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                {/* Dusun (Fleksibel / Multi-Tenant Dinamis) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Wilayah / Dusun</label>
                  <input
                    type="text"
                    list="dusun-options"
                    value={formData.dusun}
                    onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                    placeholder="Pilih atau ketik dusun..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                  <datalist id="dusun-options">
                    {availableDusuns.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                {/* RT & RW */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">RT</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.rt}
                      onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                      placeholder="001"
                      className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">RW</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={formData.rw}
                      onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                      placeholder="001"
                      className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Alamat Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-0.5">Alamat Jalan / Gang</label>
                  <input
                    type="text"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Contoh: Jl. Trans Desa Blok B No. 12..."
                    className="w-full rounded border border-slate-300 dark:border-slate-700 dark:bg-slate-800 p-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded bg-emerald-700 px-4 py-1.5 font-bold text-white shadow-2xs hover:bg-emerald-800 transition cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>{editingId ? 'Simpan Koreksi' : 'Catat ke Buku Induk'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETAIL KARTU INDUK PENDUDUK                        */}
      {/* ======================================================== */}
      {selectedResident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-slate-300 dark:border-slate-700 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400">
                  <BookOpen className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Kartu Induk Penduduk (KIP)
                  </h2>
                  <p className="text-[10px] text-slate-400">Pemerintah Desa {activeTenant?.nama_desa}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedResident(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              {/* Header Box NIK & KK */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                    NIK
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                    {selectedResident.nik}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                    Nomor KK
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-xs">
                    {selectedResident.noKk || '-'}
                  </span>
                </div>
              </div>

              {/* Data Warga */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Nama Lengkap</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {selectedResident.nama}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tempat, Tgl Lahir</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedResident.tempatLahir ? `${selectedResident.tempatLahir}, ` : ''}
                    {selectedResident.tanggalLahir
                      ? new Date(selectedResident.tanggalLahir).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Jenis Kelamin</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedResident.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'} ({hitungUmur(selectedResident.tanggalLahir)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Agama</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResident.agama || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status Perkawinan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResident.statusKawin || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Pendidikan Terakhir</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResident.pendidikan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Pekerjaan</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResident.pekerjaan || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hubungan Dalam Keluarga</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedResident.hubunganKeluarga || 'Kepala Keluarga'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Golongan Darah</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedResident.golonganDarah || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Alamat & Domisili</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedResident.alamat ? `${selectedResident.alamat}, ` : ''}
                    {selectedResident.dusun || '-'} RT {selectedResident.rt || '001'} / RW {selectedResident.rw || '001'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <button
                onClick={() => {
                  const r = selectedResident;
                  setSelectedResident(null);
                  handleOpenEdit(r);
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Koreksi Data</span>
              </button>
              <button
                onClick={() => setSelectedResident(null)}
                className="rounded bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer text-xs"
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
