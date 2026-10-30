'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  MapPin,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  RefreshCw,
  Printer,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Building2,
  PieChart,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface ResidentData {
  id: string;
  nik: string;
  noKk: string;
  nama: string;
  jenisKelamin: string;
  agama?: string | null;
  pendidikan?: string | null;
  pekerjaan?: string | null;
  statusKawin?: string | null;
  dusun?: string | null;
  statusDasar?: string;
}

export default function StatistikPage() {
  const { currentTenantId, activeTenant, pendudukList: storePenduduk } = useOpenSIDStore();

  const [residents, setResidents] = useState<ResidentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDusun, setSelectedDusun] = useState<string>('ALL');

  const slug = currentTenantId || activeTenant?.slug || '';

  const storePendudukRef = useRef(storePenduduk);
  useEffect(() => {
    storePendudukRef.current = storePenduduk;
  }, [storePenduduk]);

  // Fetch data penduduk riil dari PostgreSQL
  const fetchResidents = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/residents?tenant=${slug}&limit=10000`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.residents) && data.residents.length > 0) {
        setResidents(data.residents);
      } else {
        // Fallback jika database belum ada penduduk baru, sinkronkan dari store
        const fallback = storePendudukRef.current || [];
        const mapped = fallback.map((p) => ({
          id: p.id,
          nik: p.nik,
          noKk: p.no_kk,
          nama: p.nama,
          jenisKelamin: p.jenis_kelamin,
          agama: p.agama,
          pendidikan: p.pendidikan,
          pekerjaan: p.pekerjaan,
          statusKawin: p.status_kawin,
          dusun: p.dusun,
          statusDasar: 'Hidup',
        }));
        setResidents(mapped);
      }
    } catch (err: any) {
      console.warn('Gagal memuat API residents, menggunakan store fallback:', err);
      const fallback = storePendudukRef.current || [];
      const mapped = fallback.map((p) => ({
        id: p.id,
        nik: p.nik,
        noKk: p.no_kk,
        nama: p.nama,
        jenisKelamin: p.jenis_kelamin,
        agama: p.agama,
        pendidikan: p.pendidikan,
        pekerjaan: p.pekerjaan,
        statusKawin: p.status_kawin,
        dusun: p.dusun,
        statusDasar: 'Hidup',
      }));
      setResidents(mapped);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Daftar Dusun Unik
  const dusunOptions = useMemo(() => {
    const set = new Set<string>();
    residents.forEach((r) => {
      if (r.dusun && r.dusun.trim()) set.add(r.dusun.trim());
    });
    return Array.from(set).sort();
  }, [residents]);

  // Filtered residents berdasarkan dusun terpilih
  const filteredResidents = useMemo(() => {
    if (selectedDusun === 'ALL') return residents;
    return residents.filter((r) => r.dusun === selectedDusun);
  }, [residents, selectedDusun]);

  const totalJiwa = filteredResidents.length || 1;

  // 1. Gender Breakdown
  const totalLaki = filteredResidents.filter((p) => p.jenisKelamin === 'L').length;
  const totalPerempuan = filteredResidents.filter((p) => p.jenisKelamin === 'P').length;
  const persenLaki = Math.round((totalLaki / totalJiwa) * 100);
  const persenPerempuan = Math.round((totalPerempuan / totalJiwa) * 100);

  // 2. Kepala Keluarga (Distinct noKk)
  const totalKK = useMemo(() => {
    const kks = new Set<string>();
    filteredResidents.forEach((p) => {
      if (p.noKk && p.noKk.trim()) kks.add(p.noKk.trim());
    });
    return kks.size;
  }, [filteredResidents]);

  // 3. Distribusi Dusun
  const dusunDistribution = useMemo(() => {
    const map: Record<string, { total: number; laki: number; perempuan: number }> = {};
    residents.forEach((p) => {
      const d = p.dusun || 'Tanpa Dusun';
      if (!map[d]) map[d] = { total: 0, laki: 0, perempuan: 0 };
      map[d].total++;
      if (p.jenisKelamin === 'L') map[d].laki++;
      if (p.jenisKelamin === 'P') map[d].perempuan++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [residents]);

  // 4. Pekerjaan (Ranked)
  const pekerjaanDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredResidents.forEach((p) => {
      const job = p.pekerjaan || 'Belum / Tidak Bekerja';
      map[job] = (map[job] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredResidents]);

  // 5. Pendidikan (Ranked)
  const pendidikanDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredResidents.forEach((p) => {
      const edu = p.pendidikan || 'Tidak / Belum Sekolah';
      map[edu] = (map[edu] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredResidents]);

  // 6. Status Perkawinan
  const kawinDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredResidents.forEach((p) => {
      const st = p.statusKawin || 'Belum Kawin';
      map[st] = (map[st] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredResidents]);

  // 7. Agama
  const agamaDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    filteredResidents.forEach((p) => {
      const ag = p.agama || 'Islam';
      map[ag] = (map[ag] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredResidents]);

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden on print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="h-3 w-3" />
              Sistem Informasi Demografi & Kependudukan
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Statistik Penduduk Desa {activeTenant.nama_desa}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi data kependudukan riil, rasio gender, persebaran dusun, profesi, dan tingkat pendidikan warga desa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dusun Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 shadow-2xs text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedDusun}
              onChange={(e) => setSelectedDusun(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Wilayah Dusun ({residents.length} Jiwa)</option>
              {dusunOptions.map((d) => (
                <option key={d} value={d}>
                  Dusun {d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchResidents()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-2xs"
            title="Muat Ulang Data dari Database"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* KOP LAPORAN STATISTIK RESMI (HANYA MUNCUL SAAT CETAK / PRINT A4) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h2 className="text-base font-bold uppercase tracking-wider">
          PEMERINTAH KABUPATEN {activeTenant.kabupaten?.toUpperCase()}
        </h2>
        <h3 className="text-sm font-bold uppercase tracking-wider">
          KECAMATAN {activeTenant.kecamatan?.toUpperCase()}
        </h3>
        <h1 className="text-lg font-black uppercase tracking-widest mt-1">
          KANTOR KEPALA DESA {activeTenant.nama_desa?.toUpperCase()}
        </h1>
        <p className="text-xs text-slate-600 mt-1">
          LAPORAN RESMI STATISTIK & DEMOGRAFI KEPENDUDUKAN DESA TAHUN 2026
        </p>
      </div>

      {/* KPI Stat Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penduduk */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Penduduk</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {filteredResidents.length.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Jiwa</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {selectedDusun === 'ALL' ? 'Seluruh wilayah desa' : `Wilayah Dusun ${selectedDusun}`}
          </p>
        </div>

        {/* Kepala Keluarga */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kepala Keluarga (KK)</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalKK.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Keluarga</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Rata-rata: {(filteredResidents.length / (totalKK || 1)).toFixed(1)} jiwa / KK
          </p>
        </div>

        {/* Rasio Laki-Laki */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Laki-Laki</span>
            <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
              {persenLaki}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalLaki.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Jiwa</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${persenLaki}%` }} />
          </div>
        </div>

        {/* Rasio Perempuan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Perempuan</span>
            <span className="rounded-full bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 px-2 py-0.5 text-[10px] font-bold">
              {persenPerempuan}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalPerempuan.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-500">Jiwa</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${persenPerempuan}%` }} />
          </div>
        </div>
      </div>

      {/* Grid 2 Kolom: Detail Demografi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom 1: Persebaran Wilayah Dusun */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                Persebaran Penduduk per Dusun
              </h2>
              <p className="text-[11px] text-slate-400">Distribusi jumlah jiwa dan gender per kewilayahan</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
              {dusunDistribution.length} Dusun
            </span>
          </div>

          <div className="space-y-4">
            {dusunDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada data dusun</p>
            ) : (
              dusunDistribution.map(([dusunName, stats]) => {
                const pct = Math.round((stats.total / (residents.length || 1)) * 100);
                return (
                  <div key={dusunName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Dusun {dusunName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          L: {stats.laki} | P: {stats.perempuan}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {stats.total} Jiwa ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kolom 2: Mata Pencaharian & Profesi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-600" />
                Mata Pencaharian & Profesi Warga
              </h2>
              <p className="text-[11px] text-slate-400">Komposisi sektor ekonomi dan pekerjaan masyarakat</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-lg">
              {pekerjaanDistribution.length} Sektor
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {pekerjaanDistribution.slice(0, 10).map(([job, count]) => {
              const pct = Math.round((count / totalJiwa) * 100);
              return (
                <div key={job} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                      {job}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {count} Orang ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom 3: Tingkat Pendidikan Terakhir */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                Tingkat Pendidikan Terakhir
              </h2>
              <p className="text-[11px] text-slate-400">Jenjang pendidikan formal yang telah ditamatkan</p>
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-lg">
              {pendidikanDistribution.length} Kategori
            </span>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {pendidikanDistribution.map(([edu, count]) => {
              const pct = Math.round((count / totalJiwa) * 100);
              return (
                <div key={edu} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                      {edu}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {count} Orang ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom 4: Status Perkawinan & Agama */}
        <div className="space-y-6">
          {/* Status Kawin */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-rose-500" />
              Status Perkawinan Warga
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {kawinDistribution.map(([status, count]) => (
                <div key={status} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{status}</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                    {count.toLocaleString('id-ID')}
                  </p>
                  <span className="text-[10px] font-bold text-slate-400">
                    {Math.round((count / totalJiwa) * 100)}% dari total
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Komposisi Agama */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-indigo-500" />
              Komposisi Agama & Kepercayaan
            </h2>
            <div className="space-y-2">
              {agamaDistribution.map(([religion, count]) => {
                const pct = Math.round((count / totalJiwa) * 100);
                return (
                  <div key={religion} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{religion}</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {count} Jiwa ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner Navigasi ke Buku Induk Penduduk */}
      <div className="print:hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <h3 className="font-bold text-base">Kelola Buku Induk Penduduk</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Ingin menambah warga baru, mencetak biodata penduduk, atau memverifikasi Kartu Keluarga?
          </p>
        </div>
        <Link
          href="/kependudukan"
          className="inline-flex items-center gap-1.5 self-start rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow"
        >
          <span>Buka Data Kependudukan</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
