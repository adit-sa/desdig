'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Calendar,
  Clock,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  ShieldCheck,
  Search,
  Users,
  X,
  Building2,
  Home,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import SafeImage from '@/components/SafeImage';

interface OfficialAttendanceItem {
  id: string;
  name: string;
  position: string;
  nip: string | null;
  photoUrl: string | null;
  attendance: {
    id: string;
    date: string;
    status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR' | 'ALFA';
    checkInTime: string | null;
    checkOutTime: string | null;
    notes: string | null;
  } | null;
}

interface MonthlyReportItem {
  officialId: string;
  name: string;
  position: string;
  nip: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  dinasLuar: number;
  alfa: number;
  totalHariKerja: number;
  totalKehadiranEfektif: number;
  persentase: number;
}

export default function AbsensiPamongAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'harian' | 'rekap'>('harian');

  // State Harian
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-22');
  const [officials, setOfficials] = useState<OfficialAttendanceItem[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // State Rekap Bulanan
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportItem[]>([]);
  const [totalWorkDays, setTotalWorkDays] = useState(22);
  const [loadingReport, setLoadingReport] = useState(false);

  // Hydrate current date on client mount
  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setSelectedDate(now.toISOString().split('T')[0]);
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  }, []);

  // Search & Group Filter State (Pemerintahan, Dusun, BPD)
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'PEMERINTAH' | 'DUSUN' | 'BPD'>('ALL');

  const getCategory = (position: string) => {
    const p = (position || '').toLowerCase();
    if (p.includes('dusun')) return 'DUSUN';
    if (p.includes('bpd')) return 'BPD';
    return 'PEMERINTAH';
  };

  const filteredOfficials = React.useMemo(() => {
    let list = officials;
    if (groupFilter !== 'ALL') {
      list = list.filter((o) => getCategory(o.position) === groupFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          (o.nip && o.nip.toLowerCase().includes(q))
      );
    }
    return list;
  }, [officials, groupFilter, searchQuery]);

  const filteredMonthlyReport = React.useMemo(() => {
    let list = monthlyReport;
    if (groupFilter !== 'ALL') {
      list = list.filter((r) => getCategory(r.position) === groupFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.position.toLowerCase().includes(q) ||
          (r.nip && r.nip.toLowerCase().includes(q))
      );
    }
    return list;
  }, [monthlyReport, groupFilter, searchQuery]);

  const groupCounts = React.useMemo(() => {
    return {
      all: officials.length,
      pemerintah: officials.filter((o) => getCategory(o.position) === 'PEMERINTAH').length,
      dusun: officials.filter((o) => getCategory(o.position) === 'DUSUN').length,
      bpd: officials.filter((o) => getCategory(o.position) === 'BPD').length,
    };
  }, [officials]);

  // 1. Fetch Presensi Harian
  const fetchDailyAttendance = async (isCancelled?: () => boolean) => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoadingDaily(true);
      const res = await fetch(`/api/attendance?tenant=${slug}&date=${selectedDate}`);
      const data = await res.json();
      if (!isCancelled || !isCancelled()) {
        if (data.officials) {
          setOfficials(data.officials);
        }
      }
    } catch (e) {
      if (!isCancelled || !isCancelled()) {
        console.error('Gagal mengambil absensi harian:', e);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoadingDaily(false);
      }
    }
  };

  // 2. Fetch Rekap Bulanan
  const fetchMonthlyReport = async (isCancelled?: () => boolean) => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoadingReport(true);
      const res = await fetch(
        `/api/attendance/report?tenant=${slug}&month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      if (!isCancelled || !isCancelled()) {
        if (data.report) {
          setMonthlyReport(data.report);
          setTotalWorkDays(data.period.totalWorkDays);
        }
      }
    } catch (e) {
      if (!isCancelled || !isCancelled()) {
        console.error('Gagal mengambil rekap bulanan:', e);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoadingReport(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    if (activeTab === 'harian') {
      fetchDailyAttendance(isCancelled);
    } else {
      fetchMonthlyReport(isCancelled);
    }
    return () => {
      cancelled = true;
    };
  }, [currentTenantId, activeTenant?.slug, selectedDate, activeTab, selectedMonth, selectedYear]);

  // Handle Update Status Presensi Harian
  const handleUpdateStatus = async (
    officialId: string,
    status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR' | 'ALFA',
    notes: string = ''
  ) => {
    try {
      setSavingId(officialId);
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentTenantId,
          officialId,
          date: selectedDate,
          status,
          notes,
          checkInTime: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        fetchDailyAttendance();
      } else {
        alert('Gagal menyimpan status absensi');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  // Download File CSV
  const handleDownloadCsv = () => {
    const url = `/api/attendance/report?tenant=${currentTenantId}&month=${selectedMonth}&year=${selectedYear}&format=csv`;
    window.open(url, '_blank');
  };

  // Nama-nama bulan
  const NAMA_BULAN = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const rataRataKehadiran = monthlyReport.length > 0
    ? Math.round(monthlyReport.reduce((acc, c) => acc + c.persentase, 0) / monthlyReport.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <UserCheck className="w-6 h-6" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Disiplin Kerja Pamong
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Absensi & Kehadiran Aparatur Desa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Catat absensi harian dan pantau laporan rekapitulasi kehadiran pamong untuk pertanggungjawaban Siltap.
          </p>
        </div>

        {/* Action Buttons & Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 self-start md:self-auto">
          <Link
            suppressHydrationWarning
            href={mounted && currentTenantId ? `/absen?tenant=${currentTenantId}` : '/absen'}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition"
          >
            <Clock className="w-4 h-4" />
            <span>Buka Kiosk Absen PIN</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </Link>

          <Link
            href="/admin/perangkat"
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Monitor className="w-4 h-4 text-emerald-600" />
            <span>Kunci Komputer</span>
          </Link>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('harian')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'harian'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Harian</span>
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rekap'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Rekap</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: PRESENSI HARIAN */}
      {activeTab === 'harian' && (
        <div className="space-y-6">
          {/* Filter Tanggal, Group & Pencarian */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Tanggal Absensi:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold px-3 py-2 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="text-xs text-slate-500">
                Menampilkan <strong>{filteredOfficials.length}</strong> dari <strong>{officials.length} Pamong</strong>
              </div>
            </div>

            {/* Toolbar Filter Group & Search */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Filter Group: Pemerintahan, Dusun, BPD */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGroupFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    groupFilter === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Semua</span>
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{groupCounts.all}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('PEMERINTAH')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    groupFilter === 'PEMERINTAH'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Pemerintahan Desa</span>
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{groupCounts.pemerintah}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('DUSUN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    groupFilter === 'DUSUN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Kepala Dusun</span>
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{groupCounts.dusun}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGroupFilter('BPD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    groupFilter === 'BPD'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>BPD</span>
                  <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{groupCounts.bpd}</span>
                </button>
              </div>

              {/* Kolom Pencarian */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari pamong, jabatan, NIP..."
                  className="w-full pl-10 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Reset pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Daftar Aparatur Presensi Harian */}
          {filteredOfficials.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              Tidak ada aparatur yang cocok dengan filter atau kata kunci &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOfficials.map((ofc) => {
                const att = ofc.attendance;
                const isSaving = savingId === ofc.id;

                return (
                  <div
                    key={ofc.id}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4"
                  >
                  <div className="flex items-start gap-4">
                    {ofc.photoUrl ? (
                      <SafeImage
                        src={ofc.photoUrl}
                        alt={ofc.name}
                        width={64}
                        height={64}
                        fallbackSrc="/images/kades_portrait.jpg"
                        className="w-16 h-16 rounded-2xl object-cover object-top border-2 border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center flex-shrink-0">
                        {ofc.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
                        {ofc.position}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight truncate">
                        {ofc.name}
                      </h4>
                      {ofc.nip && <p className="text-[11px] font-mono text-slate-400 mt-0.5">NIP. {ofc.nip}</p>}

                      {/* Status Terkini */}
                      <div className="mt-2">
                        {att?.status === 'HADIR' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Hadir (Masuk: {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB)
                          </span>
                        )}
                        {att?.status === 'TERLAMBAT' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            Terlambat
                          </span>
                        )}
                        {att?.status === 'DINAS_LUAR' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Dinas Luar {att.notes ? `(${att.notes})` : ''}
                          </span>
                        )}
                        {att?.status === 'IZIN' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                            Izin {att.notes ? `(${att.notes})` : ''}
                          </span>
                        )}
                        {att?.status === 'SAKIT' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            Sakit
                          </span>
                        )}
                        {(!att || att?.status === 'ALFA') && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            Belum Ada Absensi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Cepat Presensi */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tandai Kehadiran:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleUpdateStatus(ofc.id, 'HADIR')}
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          att?.status === 'HADIR'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        ✓ Hadir
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(ofc.id, 'TERLAMBAT')}
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          att?.status === 'TERLAMBAT'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        Terlambat
                      </button>
                      <button
                        onClick={() => {
                          const n = prompt('Keterangan dinas luar:', 'Rakor di Kantor Kecamatan');
                          if (n !== null) handleUpdateStatus(ofc.id, 'DINAS_LUAR', n);
                        }}
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          att?.status === 'DINAS_LUAR'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        Dinas Luar
                      </button>
                      <button
                        onClick={() => {
                          const n = prompt('Keterangan izin/sakit:', 'Keperluan keluarga');
                          if (n !== null) handleUpdateStatus(ofc.id, 'IZIN', n);
                        }}
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          att?.status === 'IZIN'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                        }`}
                      >
                        Izin
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(ofc.id, 'SAKIT', 'Surat dokter')}
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          att?.status === 'SAKIT'
                            ? 'bg-red-600 text-white border-red-600 shadow-sm'
                            : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                        }`}
                      >
                        Sakit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}

      {/* TAB 2: REKAP BULANAN & TARIK DATA */}
      {activeTab === 'rekap' && (
        <div className="space-y-6">
          {/* Filter Bulan & Tombol Tarik Data */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Periode:</span>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {NAMA_BULAN.map((bln, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {bln}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {[2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Tombol Tarik Data CSV */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadCsv}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>📥 Tarik Data / Ekspor CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap</span>
              </button>
            </div>
          </div>

          {/* KPI Ringkasan Bulan Terpilih */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block">Total Hari Kerja Efektif</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {totalWorkDays} Hari
              </span>
              <span className="text-[11px] text-slate-400">Senin sampai Jumat (Hari Kerja)</span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block">Rata-Rata Kehadiran Desa</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">
                {rataRataKehadiran}%
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                Tingkat Disiplin Baik
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block">Total Pamong Terdaftar</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {monthlyReport.length} Orang
              </span>
              <span className="text-[11px] text-slate-400">Aparatur berstatus aktif</span>
            </div>
          </div>

          {/* Tabel Rekapitulasi Presensi */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Tabel Rekapitulasi Absensi {NAMA_BULAN[selectedMonth - 1]} {selectedYear}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lampiran resmi absensi bulanan aparatur Pemerintah Desa {activeTenant.nama_desa}
                </p>
              </div>

              {/* Toolbar Group & Search di Rekap */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setGroupFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      groupFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupFilter('PEMERINTAH')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      groupFilter === 'PEMERINTAH' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Pemerintahan
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupFilter('DUSUN')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      groupFilter === 'DUSUN' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Dusun
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupFilter('BPD')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      groupFilter === 'BPD' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    BPD
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter pamong..."
                    className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">No</th>
                    <th className="py-3.5 px-4">Nama Aparatur</th>
                    <th className="py-3.5 px-4">Jabatan</th>
                    <th className="py-3.5 px-3 text-center">Hadir</th>
                    <th className="py-3.5 px-3 text-center">Terlambat</th>
                    <th className="py-3.5 px-3 text-center">Dinas Luar</th>
                    <th className="py-3.5 px-3 text-center">Izin</th>
                    <th className="py-3.5 px-3 text-center">Sakit</th>
                    <th className="py-3.5 px-3 text-center">Alfa</th>
                    <th className="py-3.5 px-4 text-center">Total Efektif</th>
                    <th className="py-3.5 px-4 text-center">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {filteredMonthlyReport.map((row, idx) => (
                    <tr key={row.officialId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{row.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">NIP: {row.nip}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {row.position}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-600">{row.hadir}</td>
                      <td className="py-3.5 px-3 text-center text-amber-600">{row.terlambat}</td>
                      <td className="py-3.5 px-3 text-center text-blue-600">{row.dinasLuar}</td>
                      <td className="py-3.5 px-3 text-center text-purple-600">{row.izin}</td>
                      <td className="py-3.5 px-3 text-center text-red-600">{row.sakit}</td>
                      <td className="py-3.5 px-3 text-center font-mono text-slate-400">{row.alfa}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {row.totalKehadiranEfektif} / {row.totalHariKerja}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                            row.persentase >= 80
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : row.persentase >= 50
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-red-50 text-red-800 border border-red-200'
                          }`}
                        >
                          {row.persentase}%
                        </span>
                      </td>
                    </tr>
                  ))}

                  {monthlyReport.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                        Belum ada data absensi pada bulan yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
