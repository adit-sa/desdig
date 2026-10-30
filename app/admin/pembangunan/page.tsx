'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  Upload,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface Documentation {
  id: string;
  persentase: string;
  keterangan: string | null;
  gambar: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  judul: string;
  slug: string;
  keterangan: string | null;
  lokasi: string | null;
  tahunAnggaran: number;
  anggaran: number;
  volume: string | null;
  pelaksanaKegiatan: string | null;
  sumberDana: string | null;
  manfaat: string | null;
  waktu: string | null;
  sifatProyek: string | null;
  status: string | null;
  progressPersen: number;
  foto: string | null;
  createdAt: string;
  updatedAt: string;
  documentations: Documentation[];
}

export default function AdminPembangunanPage() {
  const { activeTenant, currentTenantId } = useOpenSIDStore();
  const currentTenantSlug = activeTenant?.slug || currentTenantId || '';
  const [mounted, setMounted] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<string>('2026');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
    const yr = new Date().getFullYear().toString();
    setCurrentYear(yr);
    setSelectedYear(yr);
  }, []);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal Documentation Progress State
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [activeProjectForProgress, setActiveProjectForProgress] = useState<Project | null>(null);
  const [newProgressPercent, setNewProgressPercent] = useState('50%');
  const [newProgressNote, setNewProgressNote] = useState('');
  const [newProgressImage, setNewProgressImage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    keterangan: '',
    lokasi: '',
    tahunAnggaran: 2026,
    anggaran: 0,
    volume: '',
    pelaksanaKegiatan: 'Kasi Kesejahteraan',
    sumberDana: 'Pendapatan Transfer (Dana Desa)',
    manfaat: '',
    waktu: '30 Hari',
    sifatProyek: 'BARU',
    status: 'Proses',
    progressPersen: 0,
    foto: '',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pembangunan?tenant=${currentTenantSlug}`);
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Failed to fetch pembangunan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentTenantSlug]);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = projects.length;
    const totalAnggaran = projects.reduce((acc, p) => acc + (p.anggaran || 0), 0);
    const selesai = projects.filter((p) => p.status === 'Selesai' || p.progressPersen === 100).length;
    const proses = total - selesai;
    return { total, totalAnggaran, selesai, proses };
  }, [projects]);

  // Daftar tahun anggaran unik
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(projects.map((p) => p.tahunAnggaran))).filter(Boolean);
    return years.sort((a, b) => b - a);
  }, [projects]);

  // Filter list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        p.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.lokasi && p.lokasi.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.pelaksanaKegiatan && p.pelaksanaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchYear = selectedYear === 'ALL' || p.tahunAnggaran.toString() === selectedYear;
      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'Selesai' && (p.status === 'Selesai' || p.progressPersen === 100)) ||
        (selectedStatus === 'Proses' && p.status !== 'Selesai' && p.progressPersen < 100);

      return matchSearch && matchYear && matchStatus;
    });
  }, [projects, searchQuery, selectedYear, selectedStatus]);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormData({
      judul: '',
      keterangan: '',
      lokasi: '',
      tahunAnggaran: new Date().getFullYear(),
      anggaran: 25000000,
      volume: '',
      pelaksanaKegiatan: 'Kasi Kesejahteraan',
      sumberDana: 'Pendapatan Transfer (Dana Desa)',
      manfaat: '',
      waktu: '30 Hari',
      sifatProyek: 'BARU',
      status: 'Proses',
      progressPersen: 0,
      foto: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      judul: project.judul,
      keterangan: project.keterangan || '',
      lokasi: project.lokasi || '',
      tahunAnggaran: project.tahunAnggaran,
      anggaran: project.anggaran || 0,
      volume: project.volume || '',
      pelaksanaKegiatan: project.pelaksanaKegiatan || '',
      sumberDana: project.sumberDana || 'Pendapatan Transfer (Dana Desa)',
      manfaat: project.manfaat || '',
      waktu: project.waktu || '',
      sifatProyek: project.sifatProyek || 'BARU',
      status: project.status || 'Proses',
      progressPersen: project.progressPersen || 0,
      foto: project.foto || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenProgress = (project: Project) => {
    setActiveProjectForProgress(project);
    setNewProgressPercent('50%');
    setNewProgressNote('');
    setNewProgressImage('');
    setIsProgressModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul) return alert('Nama kegiatan pembangunan wajib diisi');

    setSubmitting(true);
    try {
      if (editingProject) {
        const res = await fetch(`/api/pembangunan/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchProjects();
        } else {
          const err = await res.json();
          alert(err.error || 'Gagal memperbarui proyek');
        }
      } else {
        const res = await fetch('/api/pembangunan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, tenantSlug: currentTenantSlug }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchProjects();
        } else {
          const err = await res.json();
          alert(err.error || 'Gagal menambahkan proyek');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectForProgress) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/pembangunan/${activeProjectForProgress.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDocumentation: {
            persentase: newProgressPercent,
            keterangan: newProgressNote,
            gambar: newProgressImage || null,
          },
          // Auto update status if 100%
          progressPersen: parseInt(newProgressPercent.replace('%', ''), 10) || activeProjectForProgress.progressPersen,
          status: newProgressPercent === '100%' ? 'Selesai' : activeProjectForProgress.status,
        }),
      });

      if (res.ok) {
        setIsProgressModalOpen(false);
        fetchProjects();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan dokumentasi progress');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, judul: string) => {
    if (!confirm(`Hapus proyek pembangunan "${judul}" beserta seluruh data dokumentasinya?`)) return;

    try {
      const res = await fetch(`/api/pembangunan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProjects();
      } else {
        alert('Gagal menghapus proyek');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <HardHat className="w-6 h-6" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Infrastruktur & Pembangunan Desa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Manajemen Pembangunan & Realisasi Fisik
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-2xl">
            Kelola data proyek infrastruktur desa, pantau tahapan progress (0% hingga 100%), rincian anggaran APBDes, dan unggah dokumentasi fisik lapangan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            suppressHydrationWarning
            href={mounted && currentTenantSlug ? `/pembangunan?tenant=${currentTenantSlug}` : '/pembangunan'}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-emerald-600" />
            <span>Lihat Halaman Publik</span>
          </Link>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Proyek Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Ringkasan Statistik Proyek */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Proyek</span>
            <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats.total}
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold">Tercatat di Sistem</span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Total Alokasi Anggaran</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {formatRupiah(stats.totalAnggaran)}
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold">Dana APBDes</span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Selesai 100%</span>
            <strong className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1 block">
              {stats.selesai}
            </strong>
            <span className="text-[11px] text-slate-400">Siap Digunakan Warga</span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Sedang Berjalan</span>
            <strong className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
              {stats.proses}
            </strong>
            <span className="text-[11px] text-amber-600 font-semibold">Proses Pengerjaan</span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Pencarian */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tahun:
          </span>
          <button
            onClick={() => setSelectedYear('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              selectedYear === 'ALL'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua ({projects.length})
          </button>
          {availableYears.map((yr) => {
            const count = projects.filter((p) => p.tahunAnggaran === yr).length;
            return (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedYear === yr.toString()
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {yr} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kegiatan, lokasi dusun, pelaksana..."
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* 4. Daftar Proyek Pembangunan */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-16 text-center border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
          Memuat data pembangunan desa...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-16 text-center border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <HardHat className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada proyek pembangunan yang cocok</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Coba sesuaikan filter tahun atau kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const isFinished = p.status === 'Selesai' || p.progressPersen === 100;
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Foto Utama Proyek */}
                  <div className="relative h-48 bg-slate-900 overflow-hidden">
                    {p.foto ? (
                      <img
                        src={p.foto}
                        alt={p.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/desa_irigasi_pertanian.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-500">
                        <Camera className="w-8 h-8 mb-1" />
                        <span className="text-[11px]">Belum ada foto</span>
                      </div>
                    )}

                    {/* Badge Tahun & Status */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-slate-900/80 backdrop-blur-md text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-md border border-white/20">
                        Tahun {p.tahunAnggaran}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow backdrop-blur-md ${
                          isFinished
                            ? 'bg-emerald-600/95 text-white'
                            : 'bg-amber-600/95 text-white'
                        }`}
                      >
                        {isFinished ? 'Selesai 100%' : `Proses ${p.progressPersen}%`}
                      </span>
                    </div>

                    {/* Progress Bar di Bagian Bawah Gambar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                      <div
                        className={`h-full ${isFinished ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, p.progressPersen || (isFinished ? 100 : 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Konten Keterangan Proyek */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {p.judul}
                      </h3>
                      {p.lokasi && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{p.lokasi}</span>
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Alokasi Anggaran:</span>
                        <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold font-mono">
                          {formatRupiah(p.anggaran)}
                        </strong>
                      </div>
                      {p.volume && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Volume Fisik:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{p.volume}</span>
                        </div>
                      )}
                      {p.sumberDana && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Sumber Biaya:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[150px]">
                            {p.sumberDana}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rangkuman Dokumentasi Foto Tahapan */}
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          Tahapan Fisik ({p.documentations.length})
                        </span>
                        <button
                          onClick={() => handleOpenProgress(p)}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          + Isi Progress
                        </button>
                      </div>

                      {p.documentations.length > 0 ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                          {p.documentations.map((d) => (
                            <div
                              key={d.id}
                              className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 group/doc"
                              title={`${d.persentase} - ${d.keterangan || ''}`}
                            >
                              <img
                                src={d.gambar || '/images/desa_irigasi_pertanian.jpg'}
                                alt={d.persentase}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] font-bold text-center text-white font-mono">
                                {d.persentase}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Belum ada dokumentasi tahapan.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => handleOpenProgress(p)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Dokumentasi</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Sunting Proyek"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.judul)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: FORM TAMBAH / SUNTING PROYEK PEMBANGUNAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingProject ? 'Sunting Proyek Pembangunan' : 'Tambah Proyek Pembangunan Baru'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Isi data kegiatan pembangunan fisik untuk transparansi publik dan administrasi desa.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama / Judul Kegiatan Pembangunan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Pembangunan Talud Dusun Krajan"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Anggaran *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.tahunAnggaran}
                    onChange={(e) => setFormData({ ...formData, tahunAnggaran: parseInt(e.target.value, 10) || 2026 })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alokasi Pagu Anggaran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.anggaran}
                    onChange={(e) => setFormData({ ...formData, anggaran: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lokasi Spesifik / Dusun
                  </label>
                  <input
                    type="text"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                    placeholder="Contoh: Rt/Rw 002/002 Dusun Krajan"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Volume Fisik / Ukuran
                  </label>
                  <input
                    type="text"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                    placeholder="Contoh: 70 Meter atau 104 Meter Persegi"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pelaksana Kegiatan (TPK)
                  </label>
                  <input
                    type="text"
                    value={formData.pelaksanaKegiatan}
                    onChange={(e) => setFormData({ ...formData, pelaksanaKegiatan: e.target.value })}
                    placeholder="Contoh: Kasi Kesejahteraan / TPK Desa"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sumber Biaya / Pendanaan
                  </label>
                  <input
                    type="text"
                    value={formData.sumberDana}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                    placeholder="Contoh: Pendapatan Transfer (Dana Desa)"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Proyek
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Proses">Sedang Berjalan (Proses)</option>
                    <option value="Selesai">Selesai 100%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Progress Fisik (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progressPersen}
                    onChange={(e) => setFormData({ ...formData, progressPersen: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sifat Proyek
                  </label>
                  <select
                    value={formData.sifatProyek}
                    onChange={(e) => setFormData({ ...formData, sifatProyek: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BARU">BARU</option>
                    <option value="LANJUTAN">LANJUTAN</option>
                    <option value="REHABILITASI">REHABILITASI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Foto Utama Lapangan
                </label>
                <input
                  type="text"
                  value={formData.foto}
                  onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                  placeholder="https://... atau /images/..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan & Spesifikasi Singkat
                </label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Tujuan dan deskripsi fisik kegiatan pembangunan..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Manfaat bagi Masyarakat / Target SDGs Desa
                </label>
                <input
                  type="text"
                  value={formData.manfaat}
                  onChange={(e) => setFormData({ ...formData, manfaat: e.target.value })}
                  placeholder="Contoh: Terpenuhinya SDGs Desa Nomor 9 (Infrastruktur dan Inovasi)"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-2"
                >
                  {submitting ? 'Menyimpan...' : editingProject ? 'Perbarui Proyek' : 'Simpan Proyek Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISI DOKUMENTASI PROGRESS TAHAPAN (0%, 30%, 80%, 100%) */}
      {isProgressModalOpen && activeProjectForProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                  Progress Realisasi Fisik
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {activeProjectForProgress.judul}
                </h3>
              </div>
              <button
                onClick={() => setIsProgressModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Riwayat Dokumentasi Foto yang Sudah Ada */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                Tahapan Dokumentasi yang Telah Diinput:
              </h4>

              {activeProjectForProgress.documentations.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                  Belum ada dokumentasi tahapan yang diunggah.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {activeProjectForProgress.documentations.map((d) => (
                    <div
                      key={d.id}
                      className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2.5"
                    >
                      <div className="w-12 h-12 rounded bg-black overflow-hidden flex-shrink-0">
                        <img
                          src={d.gambar || '/images/desa_irigasi_pertanian.jpg'}
                          alt={d.persentase}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs overflow-hidden">
                        <strong className="text-emerald-700 dark:text-emerald-400 font-bold block">
                          {d.persentase}
                        </strong>
                        <p className="text-[10px] text-slate-500 truncate">{d.keterangan || 'Dokumentasi kegiatan'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Tambah Dokumentasi Baru */}
            <form onSubmit={handleAddProgress} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Tambah Tahapan Dokumentasi Baru
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahapan Persentase *
                  </label>
                  <select
                    value={newProgressPercent}
                    onChange={(e) => setNewProgressPercent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
                  >
                    <option value="0%">0% (Awal / Titik Nol)</option>
                    <option value="30%">30% (Pengerjaan Pondasi/Struktur)</option>
                    <option value="50%">50% (Pengerjaan Pertengahan)</option>
                    <option value="80%">80% (Penyelesaian Finishing)</option>
                    <option value="100%">100% (Selesai Tuntas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Singkat Tahapan
                  </label>
                  <input
                    type="text"
                    value={newProgressNote}
                    onChange={(e) => setNewProgressNote(e.target.value)}
                    placeholder="Contoh: Kondisi 50% pengerjaan talud"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Foto Dokumentasi Lapangan *
                </label>
                <input
                  type="text"
                  required
                  value={newProgressImage}
                  onChange={(e) => setNewProgressImage(e.target.value)}
                  placeholder="https://... atau link foto dokumentasi lapangan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProgressModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Dokumentasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
