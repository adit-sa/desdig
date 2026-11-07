'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import TopBar from '@/components/themes/modern-government/TopBar';
import SiteHeader from '@/components/themes/modern-government/SiteHeader';
import SiteFooter from '@/components/themes/modern-government/SiteFooter';
import { buildTenantHref } from '@/components/themes/modern-government/shared';
import { formatProjectTitle } from '@/lib/formatters';
import SafeImage from '@/components/SafeImage';
import {
  HardHat,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  Layers,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Building2,
  FileText,
} from 'lucide-react';

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

export default function PembangunanClientView({
  initialProjects,
  tenant,
  menus,
}: {
  initialProjects: Project[];
  tenant: ResolvedTenant;
  menus?: any[];
}) {
  const [projects] = useState<Project[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal Detail & Dokumentasi Tahapan
  const [selectedProjectModal, setSelectedProjectModal] = useState<Project | null>(null);
  const [activePhotoDoc, setActivePhotoDoc] = useState<Documentation | null>(null);

  // Statistik Ringkas
  const stats = useMemo(() => {
    const total = projects.length;
    const totalAnggaran = projects.reduce((acc, p) => acc + (p.anggaran || 0), 0);
    const selesai = projects.filter((p) => p.status === 'Selesai' || p.progressPersen === 100).length;
    const proses = total - selesai;
    return { total, totalAnggaran, selesai, proses };
  }, [projects]);

  // Daftar tahun unik (selalu sertakan tahun berjalan)
  const availableYears = useMemo(() => {
    const currentYearNum = new Date().getFullYear();
    const years = Array.from(new Set([currentYearNum, ...projects.map((p) => p.tahunAnggaran)])).filter(Boolean);
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

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const layoutMode = (tenant.themeConfig?.settings?.layout_mode as 'fixed' | 'fluid') || 'fixed';

  return (
    <div
      data-theme="modern-government"
      data-layout={layoutMode}
      className={`min-h-screen bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-emerald-600 selection:text-white ${
        layoutMode === 'fluid' ? 'layout-fluid' : 'layout-fixed'
      }`}
    >
      {/* 1. Official Government Top Bar Konsisten dengan Beranda */}
      <TopBar tenant={tenant} />

      {/* 2. Main Navigation Header Konsisten dengan Beranda */}
      <SiteHeader tenant={tenant} menus={menus} />

      {/* 3. Hero Banner Transparansi */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white py-10 sm:py-14 px-4 sm:px-8 border-b border-emerald-900/40 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Link href={buildTenantHref('/', tenant.slug)} className="hover:underline">
                Beranda
              </Link>
              <span>/</span>
              <span className="text-slate-300">Pembangunan Desa</span>
            </div>

            <BackButton
              fallbackUrl={buildTenantHref('/', tenant.slug)}
              label="Kembali ke Beranda"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
              iconClassName="w-3.5 h-3.5 text-emerald-400"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Keterbukaan Informasi Publik & Realisasi Dana Desa</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white max-w-3xl leading-tight">
            Transparansi Pembangunan Fisik & Infrastruktur Desa
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Masyarakat dapat memantau langsung seluruh kegiatan pembangunan desa tahun anggaran berjalan, rincian pagu anggaran APBDes, volume fisik, hingga dokumentasi foto tahapan di lapangan (0% sampai 100%).
          </p>
        </div>
      </section>

      {/* 3. Infografis Statistik Singkat */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 -mt-8 relative z-20">
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xl border border-slate-200/90 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Kegiatan</span>
              <strong className="text-xl sm:text-2xl font-black text-slate-900">{stats.total} Proyek</strong>
              <span className="text-[11px] text-emerald-600 font-semibold block">Tercatat Resmi</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:pl-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200 flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Anggaran</span>
              <strong className="text-lg sm:text-xl font-black text-slate-900">{formatRupiah(stats.totalAnggaran)}</strong>
              <span className="text-[11px] text-blue-600 font-semibold block">Alokasi APBDes</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:pl-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Selesai 100%</span>
              <strong className="text-xl sm:text-2xl font-black text-emerald-950">{stats.selesai} Titik</strong>
              <span className="text-[11px] text-emerald-600 font-semibold block">Tuntas & Digunakan</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-3 md:pt-0 md:pl-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold border border-amber-200 flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Dalam Pengerjaan</span>
              <strong className="text-xl sm:text-2xl font-black text-amber-950">{stats.proses} Proyek</strong>
              <span className="text-[11px] text-amber-600 font-semibold block">Tahapan Berjalan</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Filter Bar & Pencarian */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Tahun:
            </span>
            <button
              onClick={() => setSelectedYear('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                selectedYear === 'ALL'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {yr} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan, dusun, atau lokasi..."
              className="w-full pl-10 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        {/* 5. Grid Kartu Proyek Pembangunan */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-dashed border-slate-300 space-y-3">
            <HardHat className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Tidak ada data pembangunan yang sesuai</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Coba ganti filter tahun anggaran atau sesuaikan kata kunci pencarian.
            </p>
            {selectedYear !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedYear('ALL')}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition cursor-pointer"
              >
                Tampilkan Semua Tahun ({projects.length})
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((p) => {
              const isFinished = p.status === 'Selesai' || p.progressPersen === 100;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Foto Utama */}
                    <div className="relative h-52 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setSelectedProjectModal(p)}>
                      {p.foto ? (
                        <SafeImage
                          src={p.foto}
                          fallbackSrc="/images/desa_irigasi_pertanian.jpg"
                          alt={p.judul}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-800 to-slate-900 text-slate-400">
                          <HardHat className="w-8 h-8 mb-1" />
                          <span className="text-xs">Foto Proyek Desa</span>
                        </div>
                      )}

                      {/* Badges Overlay */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="bg-slate-950/80 backdrop-blur-md text-white font-mono font-bold text-[10px] px-2.5 py-1 rounded-md border border-white/20">
                          Tahun {p.tahunAnggaran}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-md shadow backdrop-blur-md ${
                            isFinished ? 'bg-emerald-600/95 text-white' : 'bg-amber-600/95 text-white'
                          }`}
                        >
                          {isFinished ? 'Selesai 100%' : `Proses ${p.progressPersen}%`}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                        <div
                          className={`h-full ${isFinished ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(100, p.progressPersen || (isFinished ? 100 : 0))}%` }}
                        />
                      </div>
                    </div>

                    {/* Informasi Kegiatan */}
                    <div className="p-5 space-y-3.5">
                      <div>
                        <h3
                          onClick={() => setSelectedProjectModal(p)}
                          className="font-bold text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition cursor-pointer"
                        >
                          {formatProjectTitle(p.judul)}
                        </h3>
                        {p.lokasi && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{p.lokasi}</span>
                          </p>
                        )}
                      </div>

                      {/* Kotak Rincian Keuangan & Teknis */}
                      <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Pagu Anggaran:</span>
                          <strong className="text-emerald-700 font-extrabold font-mono text-sm">
                            {formatRupiah(p.anggaran)}
                          </strong>
                        </div>
                        {p.volume && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Volume Fisik:</span>
                            <span className="text-slate-700 font-semibold">{p.volume}</span>
                          </div>
                        )}
                        {p.pelaksanaKegiatan && (
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Pelaksana:</span>
                            <span className="text-slate-700 font-semibold">{p.pelaksanaKegiatan}</span>
                          </div>
                        )}
                      </div>

                      {p.manfaat && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          &ldquo;{p.manfaat}&rdquo;
                        </p>
                      )}

                      {/* Tahapan Foto Dokumentasi (0% - 100%) */}
                      {p.documentations.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Tahapan Fisik ({p.documentations.length} Foto)
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                            {p.documentations.map((d) => (
                              <div
                                key={d.id}
                                onClick={() => {
                                  setSelectedProjectModal(p);
                                  setActivePhotoDoc(d);
                                }}
                                className="relative w-14 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 cursor-pointer hover:border-emerald-500 transition group/thumb"
                                title={`${d.persentase} - ${d.keterangan || ''}`}
                              >
                                <SafeImage
                                  src={d.gambar}
                                  fallbackSrc="/images/desa_irigasi_pertanian.jpg"
                                  alt={d.persentase}
                                  fill
                                  sizes="56px"
                                  className="object-cover group-hover/thumb:scale-110 transition duration-300"
                                />
                                <span className="absolute bottom-0 inset-x-0 bg-slate-950/85 text-[9px] font-bold text-center text-white font-mono z-10">
                                  {d.persentase}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tombol Rincian Lengkap */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setSelectedProjectModal(p)}
                      className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Lihat Rincian & Dokumentasi Fisik</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tombol Navigasi Kembali di Bagian Bawah */}
        <div className="pt-10 pb-6 flex justify-center">
          <BackButton
            fallbackUrl={`/?tenant=${tenant.slug}`}
            label="Kembali ke Halaman Sebelumnya"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 px-6 py-3 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
            iconClassName="w-4 h-4 text-emerald-600"
          />
        </div>
      </main>

      {/* 6. MODAL DETAIL RINCIAN & DOKUMENTASI FISIK */}
      {selectedProjectModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in"
          onClick={() => {
            setSelectedProjectModal(null);
            setActivePhotoDoc(null);
          }}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative text-slate-800 animate-in zoom-in-95 duration-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 relative">
              <button
                onClick={() => {
                  setSelectedProjectModal(null);
                  setActivePhotoDoc(null);
                }}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2.5 py-0.5 rounded-md">
                  Tahun Anggaran {selectedProjectModal.tahunAnggaran}
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-md">
                  {selectedProjectModal.status === 'Selesai' ? 'Selesai 100%' : `Proses ${selectedProjectModal.progressPersen}%`}
                </span>
              </div>
              <h3 className="text-xl font-bold leading-snug">{formatProjectTitle(selectedProjectModal.judul)}</h3>
              {selectedProjectModal.lokasi && (
                <p className="text-xs text-emerald-100/90 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{selectedProjectModal.lokasi}</span>
                </p>
              )}
            </div>

            {/* Isi Konten */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Foto Utama / Foto Tahapan yang Dipilih */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
                <SafeImage
                  src={activePhotoDoc?.gambar || selectedProjectModal.foto}
                  fallbackSrc="/images/desa_irigasi_pertanian.jpg"
                  alt={selectedProjectModal.judul}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
                {activePhotoDoc && (
                  <div className="absolute bottom-3 left-3 bg-slate-950/85 text-white px-3 py-1 rounded-md text-xs font-bold backdrop-blur-md">
                    Dokumentasi {activePhotoDoc.persentase}: {activePhotoDoc.keterangan || 'Kondisi Lapangan'}
                  </div>
                )}
              </div>

              {/* Slider Thumbnail Tahapan */}
              {selectedProjectModal.documentations.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Pilih Tahapan Dokumentasi Progres:
                  </h4>
                  <div className="grid grid-cols-4 gap-2.5">
                    {selectedProjectModal.documentations.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setActivePhotoDoc(d)}
                        className={`p-1.5 rounded-lg border text-left transition flex flex-col items-center gap-1 ${
                          activePhotoDoc?.id === d.id
                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative w-full h-16 rounded overflow-hidden bg-slate-200">
                          <SafeImage
                            src={d.gambar}
                            fallbackSrc="/images/desa_irigasi_pertanian.jpg"
                            alt={d.persentase}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800">{d.persentase}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Rincian Teknis & Anggaran */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Alokasi Pagu Anggaran</span>
                  <strong className="text-emerald-700 font-mono font-bold text-sm">
                    {formatRupiah(selectedProjectModal.anggaran)}
                  </strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Sumber Pendanaan</span>
                  <strong className="text-slate-800 font-bold">{selectedProjectModal.sumberDana || 'Dana Desa'}</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Volume Fisik</span>
                  <strong className="text-slate-800 font-bold">{selectedProjectModal.volume || '-'}</strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Pelaksana Kegiatan</span>
                  <strong className="text-slate-800 font-bold">{selectedProjectModal.pelaksanaKegiatan || '-'}</strong>
                </div>
              </div>

              {selectedProjectModal.keterangan && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Deskripsi & Keterangan Proyek:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {selectedProjectModal.keterangan}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => {
                  setSelectedProjectModal(null);
                  setActivePhotoDoc(null);
                }}
                className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Footer Konsisten dengan Beranda */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
