'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  HeartHandshake,
  CheckCircle2,
  Clock,
  Search,
  Wallet,
  ShieldCheck,
  Plus,
  Users,
  Printer,
  Trash2,
  Filter,
  X,
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

export interface BansosProgram {
  id: string;
  tenant_id: string;
  nama_program: string;
  asal_dana: string;
  periode: string;
  nominal_per_kpm: number;
  jumlah_penerima: number;
}

export interface PenerimaKPM {
  id: string;
  program_id: string;
  tenant_id: string;
  nama: string;
  nik: string;
  no_kk: string;
  alamat: string;
  dusun?: string;
  status_penyaluran: 'Tersalurkan' | 'Menunggu Penyaluran';
  tanggal_terima?: string;
}

interface ResidentOption {
  id: string;
  nik: string;
  noKk: string;
  nama: string;
  dusun?: string | null;
  alamat?: string | null;
}

const DEFAULT_PROGRAMS: BansosProgram[] = [
  {
    id: 'prog-blt-dd',
    tenant_id: 'default',
    nama_program: 'BLT Dana Desa (Penanganan Kemiskinan Ekstrem)',
    asal_dana: 'Dana Desa (APBDes)',
    periode: 'Triwulan I 2026',
    nominal_per_kpm: 300000,
    jumlah_penerima: 45,
  },
  {
    id: 'prog-pkh',
    tenant_id: 'default',
    nama_program: 'Program Keluarga Harapan (PKH)',
    asal_dana: 'APBN (Kemensos)',
    periode: 'Tahap 1 2026',
    nominal_per_kpm: 750000,
    jumlah_penerima: 60,
  },
  {
    id: 'prog-bpnt',
    tenant_id: 'default',
    nama_program: 'Bantuan Pangan Non-Tunai (BPNT / Sembako)',
    asal_dana: 'APBN (Kemensos)',
    periode: 'Maret 2026',
    nominal_per_kpm: 200000,
    jumlah_penerima: 80,
  },
  {
    id: 'prog-beras-cpp',
    tenant_id: 'default',
    nama_program: 'Cadangan Pangan Pemerintah (Beras 10 Kg)',
    asal_dana: 'Badan Pangan Nasional (Bapanas)',
    periode: 'Januari - Maret 2026',
    nominal_per_kpm: 150000,
    jumlah_penerima: 110,
  },
];

export default function BansosPage() {
  const { currentTenantId, activeTenant, pendudukList: storePenduduk } = useOpenSIDStore();
  const slug = currentTenantId || activeTenant?.slug || '';

  // Local Storage Keys scoped by tenant (standar desDig & fallback)
  const STORAGE_KEY_PROGRAMS = `desdig_bansos_programs_${slug}`;
  const OLD_STORAGE_KEY_PROGRAMS = `opensid_bansos_programs_${slug}`;
  const STORAGE_KEY_KPM = `desdig_bansos_kpm_${slug}`;
  const OLD_STORAGE_KEY_KPM = `opensid_bansos_kpm_${slug}`;

  const [programs, setPrograms] = useState<BansosProgram[]>([]);
  const [kpmList, setKpmList] = useState<PenerimaKPM[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Live PostgreSQL Residents State for KPM Picker
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

  // Modals
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [isAddKpmModalOpen, setIsAddKpmModalOpen] = useState(false);

  // Form Program
  const [formProgram, setFormProgram] = useState({
    nama_program: '',
    asal_dana: 'Dana Desa (APBDes)',
    periode: 'Tahun 2026',
    nominal_per_kpm: 300000,
    jumlah_penerima: 50,
  });

  // Form KPM
  const [residentSearch, setResidentSearch] = useState('');
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);
  const [formKpmStatus, setFormKpmStatus] = useState<'Tersalurkan' | 'Menunggu Penyaluran'>('Tersalurkan');
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const storePendudukRef = useRef(storePenduduk);
  useEffect(() => {
    storePendudukRef.current = storePenduduk;
  }, [storePenduduk]);

  // Load programs & KPM from localStorage or defaults
  useEffect(() => {
    if (!slug) return;
    try {
      const savedProgs = localStorage.getItem(STORAGE_KEY_PROGRAMS) || localStorage.getItem(OLD_STORAGE_KEY_PROGRAMS);
      if (savedProgs) {
        const parsed = JSON.parse(savedProgs);
        setPrograms(parsed);
        if (parsed.length > 0) setSelectedProgramId(parsed[0].id);
      } else {
        const seeded = DEFAULT_PROGRAMS.map((p) => ({ ...p, tenant_id: slug }));
        setPrograms(seeded);
        if (seeded.length > 0) setSelectedProgramId(seeded[0].id);
      }

      const savedKpm = localStorage.getItem(STORAGE_KEY_KPM) || localStorage.getItem(OLD_STORAGE_KEY_KPM);
      if (savedKpm) {
        setKpmList(JSON.parse(savedKpm));
      } else {
        // Seed initial KPM from store
        const fallback = storePendudukRef.current || [];
        const initialKpm: PenerimaKPM[] = fallback.slice(0, 8).map((p, idx) => ({
          id: `kpm-${Date.now()}-${idx}`,
          program_id: 'prog-blt-dd',
          tenant_id: slug,
          nama: p.nama,
          nik: p.nik,
          no_kk: p.no_kk,
          alamat: p.alamat || `Dusun ${p.dusun || 'Mekar'}`,
          dusun: p.dusun,
          status_penyaluran: idx % 3 === 0 ? 'Menunggu Penyaluran' : 'Tersalurkan',
          tanggal_terima: '2026-03-15',
        }));
        setKpmList(initialKpm);
      }
    } catch (e) {
      console.error(e);
    }
  }, [slug, STORAGE_KEY_PROGRAMS, STORAGE_KEY_KPM]);

  // Fetch Residents from PostgreSQL API
  const fetchResidents = useCallback(async () => {
    if (!slug) return;
    try {
      setLoadingResidents(true);
      const res = await fetch(`/api/residents?tenant=${slug}&limit=5000`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.residents) && data.residents.length > 0) {
        setResidents(data.residents);
      } else {
        const fallback = storePendudukRef.current || [];
        setResidents(
          fallback.map((p) => ({
            id: p.id,
            nik: p.nik,
            noKk: p.no_kk,
            nama: p.nama,
            dusun: p.dusun,
            alamat: p.alamat,
          }))
        );
      }
    } catch {
      const fallback = storePendudukRef.current || [];
      setResidents(
        fallback.map((p) => ({
          id: p.id,
          nik: p.nik,
          noKk: p.no_kk,
          nama: p.nama,
          dusun: p.dusun,
          alamat: p.alamat,
        }))
      );
    } finally {
      setLoadingResidents(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Selected Program Object
  const activeProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId) || programs[0] || null;
  }, [programs, selectedProgramId]);

  // Filtered KPM list based on selected program and search
  const filteredKpm = useMemo(() => {
    if (!activeProgram) return [];
    const q = search.toLowerCase().trim();
    return kpmList.filter((k) => {
      const matchProgram = k.program_id === activeProgram.id;
      const matchStatus = filterStatus === 'ALL' || k.status_penyaluran === filterStatus;
      const matchQuery =
        !q ||
        k.nama.toLowerCase().includes(q) ||
        k.nik.includes(q) ||
        k.no_kk.includes(q) ||
        k.alamat.toLowerCase().includes(q);
      return matchProgram && matchStatus && matchQuery;
    });
  }, [kpmList, activeProgram, search, filterStatus]);

  // Overall Statistics for KPI Cards
  const totalAnggaran = useMemo(() => {
    return programs.reduce((acc, p) => acc + p.nominal_per_kpm * p.jumlah_penerima, 0);
  }, [programs]);

  const totalKpmAll = kpmList.length;
  const totalTersalurkan = kpmList.filter((k) => k.status_penyaluran === 'Tersalurkan').length;
  const persentasePenyaluran = Math.round((totalTersalurkan / (totalKpmAll || 1)) * 100);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Actions
  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProgram.nama_program) return;
    const newProg: BansosProgram = {
      id: `prog-${Date.now()}`,
      tenant_id: slug,
      ...formProgram,
    };
    const updated = [newProg, ...programs];
    setPrograms(updated);
    setSelectedProgramId(newProg.id);
    localStorage.setItem(STORAGE_KEY_PROGRAMS, JSON.stringify(updated));
    localStorage.setItem(OLD_STORAGE_KEY_PROGRAMS, JSON.stringify(updated));
    setIsAddProgramModalOpen(false);
    setFormProgram({
      nama_program: '',
      asal_dana: 'Dana Desa (APBDes)',
      periode: 'Tahun 2026',
      nominal_per_kpm: 300000,
      jumlah_penerima: 50,
    });
  };

  const handleSaveKpm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !activeProgram) return;

    // Check duplicate NIK in this program
    const exists = kpmList.some((k) => k.program_id === activeProgram.id && k.nik === selectedResident.nik);
    if (exists) {
      alert(`Warga dengan NIK ${selectedResident.nik} sudah terdaftar dalam program ${activeProgram.nama_program}!`);
      return;
    }

    const newKpm: PenerimaKPM = {
      id: `kpm-${Date.now()}`,
      program_id: activeProgram.id,
      tenant_id: slug,
      nama: selectedResident.nama,
      nik: selectedResident.nik,
      no_kk: selectedResident.noKk || '-',
      alamat: selectedResident.alamat || (selectedResident.dusun ? `Dusun ${selectedResident.dusun}` : '-'),
      dusun: selectedResident.dusun || undefined,
      status_penyaluran: formKpmStatus,
      tanggal_terima: formKpmStatus === 'Tersalurkan' ? new Date().toISOString().slice(0, 10) : undefined,
    };

    const updated = [newKpm, ...kpmList];
    setKpmList(updated);
    localStorage.setItem(STORAGE_KEY_KPM, JSON.stringify(updated));
    localStorage.setItem(OLD_STORAGE_KEY_KPM, JSON.stringify(updated));
    setIsAddKpmModalOpen(false);
    setSelectedResident(null);
    setResidentSearch('');
  };

  const handleToggleStatus = (id: string) => {
    const updated = kpmList.map((k) => {
      if (k.id === id) {
        const nextStatus: PenerimaKPM['status_penyaluran'] =
          k.status_penyaluran === 'Tersalurkan' ? 'Menunggu Penyaluran' : 'Tersalurkan';
        return {
          ...k,
          status_penyaluran: nextStatus,
          tanggal_terima: nextStatus === 'Tersalurkan' ? new Date().toISOString().slice(0, 10) : undefined,
        };
      }
      return k;
    });
    setKpmList(updated);
    localStorage.setItem(STORAGE_KEY_KPM, JSON.stringify(updated));
    localStorage.setItem(OLD_STORAGE_KEY_KPM, JSON.stringify(updated));
  };

  const handleDeleteKpm = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penerima manfaat ini?')) return;
    const updated = kpmList.filter((k) => k.id !== id);
    setKpmList(updated);
    localStorage.setItem(STORAGE_KEY_KPM, JSON.stringify(updated));
    localStorage.setItem(OLD_STORAGE_KEY_KPM, JSON.stringify(updated));
  };

  // Filtered residents options in modal
  const filteredResidentsPicker = useMemo(() => {
    if (!residentSearch.trim()) return residents.slice(0, 15);
    const q = residentSearch.toLowerCase().trim();
    return residents
      .filter((r) => r.nama.toLowerCase().includes(q) || r.nik.includes(q) || (r.dusun && r.dusun.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [residents, residentSearch]);

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="h-3 w-3" />
              Transparansi Jaring Pengaman Sosial & DTKS
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <HeartHandshake className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Program Bantuan Sosial Desa {activeTenant.nama_desa}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan Keluarga Penerima Manfaat (KPM), kuota dana desa, penyaluran bansos APBN/APBD, dan akuntabilitas bantuan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddProgramModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tambah Program Bansos</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Rekapitulasi</span>
          </button>
        </div>
      </div>

      {/* KOP CETAK RESMI (HANYA MUNCUL SAAT PRINT A4) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-3 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider">
          PEMERINTAH KABUPATEN {activeTenant.kabupaten?.toUpperCase()}
        </h2>
        <h3 className="text-xs font-bold uppercase tracking-wider">
          KECAMATAN {activeTenant.kecamatan?.toUpperCase()}
        </h3>
        <h1 className="text-base font-black uppercase tracking-widest mt-1">
          KANTOR KEPALA DESA {activeTenant.nama_desa?.toUpperCase()}
        </h1>
        <p className="text-[11px] font-bold text-slate-700 mt-1">
          DAFTAR KELUARGA PENERIMA MANFAAT (KPM) — {activeProgram?.nama_program} ({activeProgram?.periode})
        </p>
      </div>

      {/* KPI Stat Cards (Hidden on print) */}
      <div className="print:hidden grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Program Bansos</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <HeartHandshake className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {programs.length}
            </span>
            <span className="text-xs text-slate-500">Program Aktif</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total KPM Terdaftar</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {totalKpmAll}
            </span>
            <span className="text-xs text-slate-500">Keluarga (KPM)</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Penyaluran Berhasil</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
              {persentasePenyaluran}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {totalTersalurkan}
            </span>
            <span className="text-xs text-slate-500">dari {totalKpmAll} KPM</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Alokasi Dana</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate block">
              {formatRupiah(totalAnggaran)}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Pagu anggaran gabungan 2026</p>
        </div>
      </div>

      {/* Program Selector Cards (Hidden on print) */}
      <div className="print:hidden space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Program Bantuan Sosial:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {programs.map((prog) => {
            const isSelected = prog.id === selectedProgramId;
            const countInProg = kpmList.filter((k) => k.program_id === prog.id).length;
            return (
              <div
                key={prog.id}
                onClick={() => setSelectedProgramId(prog.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-md dark:bg-emerald-950/40 dark:border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-bold">
                    {prog.asal_dana}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{prog.periode}</span>
                </div>

                <h3 className="mt-2 text-xs font-bold text-slate-900 dark:text-white line-clamp-2 h-8">
                  {prog.nama_program}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                    {formatRupiah(prog.nominal_per_kpm)}
                  </span>
                  <span className="text-[10px] text-slate-400">/ KPM</span>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span>Terdaftar: <strong>{countInProg}</strong> / {prog.jumlah_penerima} KPM</span>
                  <span className="font-bold text-emerald-600">{isSelected ? '✓ Terpilih' : 'Pilih'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Table: Penerima KPM Program Terpilih */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Daftar KPM: {activeProgram?.nama_program}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Sumber Dana: <strong>{activeProgram?.asal_dana}</strong> • Nominal: {formatRupiah(activeProgram?.nominal_per_kpm || 0)} / KPM
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari NIK, Nama, Dusun..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Tersalurkan">Tersalurkan</option>
              <option value="Menunggu Penyaluran">Menunggu</option>
            </select>

            <button
              onClick={() => setIsAddKpmModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah KPM</span>
            </button>
          </div>
        </div>

        {/* Tabel Data KPM */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Penerima (KPM)</th>
                <th className="px-4 py-3">NIK & No. KK</th>
                <th className="px-4 py-3">Alamat / Dusun</th>
                <th className="px-4 py-3">Nominal Diterima</th>
                <th className="px-4 py-3">Status Penyaluran</th>
                <th className="px-4 py-3">Tgl Terima</th>
                <th className="print:hidden px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredKpm.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    <HeartHandshake className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-sm">Belum ada data KPM terdaftar untuk program ini</p>
                    <p className="text-xs mt-1">Gunakan tombol &quot;Tambah KPM&quot; untuk mendaftarkan keluarga penerima manfaat dari database penduduk.</p>
                  </td>
                </tr>
              ) : (
                filteredKpm.map((kpm, idx) => (
                  <tr key={kpm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {kpm.nama}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div>{kpm.nik}</div>
                      <div className="text-[10px] text-slate-400">KK: {kpm.no_kk}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <div>{kpm.alamat}</div>
                      {kpm.dusun && <div className="text-[10px] text-slate-400">Dusun {kpm.dusun}</div>}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-emerald-700 dark:text-emerald-400">
                      {formatRupiah(activeProgram?.nominal_per_kpm || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(kpm.id)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold cursor-pointer transition ${
                          kpm.status_penyaluran === 'Tersalurkan'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-200'
                        }`}
                        title="Klik untuk ubah status penyaluran"
                      >
                        {kpm.status_penyaluran === 'Tersalurkan' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{kpm.status_penyaluran}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {kpm.tanggal_terima || '-'}
                    </td>
                    <td className="print:hidden px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteKpm(kpm.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Hapus KPM"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Cetak A4 */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs font-serif">
          <div className="text-center min-w-[200px]">
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Ketua BPD Desa {activeTenant.nama_desa}</p>
            <div className="h-16" />
            <p className="font-bold underline">( ............................................ )</p>
          </div>

          <div className="text-center min-w-[200px]">
            <p>{activeTenant.nama_desa}, {todayStr}</p>
            <p className="font-bold mt-1">Kepala Desa {activeTenant.nama_desa}</p>
            <div className="h-16" />
            <p className="font-bold underline">{activeTenant.kepala_desa || 'Kepala Desa ' + activeTenant.nama_desa}</p>
          </div>
        </div>
      </div>

      {/* MODAL 1: TAMBAH PROGRAM BANSOS */}
      {isAddProgramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-600" />
                Tambah Program Bantuan Sosial Baru
              </h3>
              <button
                onClick={() => setIsAddProgramModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nama Program Bansos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BLT Kebutuhan Khusus Lansia & Disabilitas"
                  value={formProgram.nama_program}
                  onChange={(e) => setFormProgram({ ...formProgram, nama_program: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Asal Sumber Dana *
                </label>
                <select
                  value={formProgram.asal_dana}
                  onChange={(e) => setFormProgram({ ...formProgram, asal_dana: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="Dana Desa (APBDes)">Dana Desa (APBDes)</option>
                  <option value="APBN (Kemensos)">APBN (Kemensos)</option>
                  <option value="APBD Provinsi">APBD Provinsi</option>
                  <option value="APBD Kabupaten">APBD Kabupaten</option>
                  <option value="Swadaya / Donasi Desa">Swadaya / Donasi Desa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Periode / Tahun *
                  </label>
                  <input
                    type="text"
                    required
                    value={formProgram.periode}
                    onChange={(e) => setFormProgram({ ...formProgram, periode: e.target.value })}
                    placeholder="Contoh: Triwulan I 2026"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Kuota Target KPM *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formProgram.jumlah_penerima}
                    onChange={(e) => setFormProgram({ ...formProgram, jumlah_penerima: parseInt(e.target.value, 10) || 1 })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Nominal Bantuan per KPM (Rp) *
                </label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={formProgram.nominal_per_kpm}
                  onChange={(e) => setFormProgram({ ...formProgram, nominal_per_kpm: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddProgramModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  Simpan Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH PENERIMA MANFAAT (KPM) DARI RESIDENTS DATABASE */}
      {isAddKpmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Daftarkan KPM Baru: {activeProgram?.nama_program}
              </h3>
              <button
                onClick={() => setIsAddKpmModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKpm} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Pilih Warga Calon Penerima (Dari Buku Induk) *
                </label>

                {selectedResident ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedResident.nama}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        NIK: {selectedResident.nik} • No. KK: {selectedResident.noKk}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Alamat: {selectedResident.alamat || (selectedResident.dusun ? `Dusun ${selectedResident.dusun}` : '-')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedResident(null)}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Ketik NIK atau Nama warga desa..."
                        value={residentSearch}
                        onChange={(e) => setResidentSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredResidentsPicker.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => {
                            setSelectedResident(res);
                            setResidentSearch('');
                          }}
                          className="w-full text-left p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">{res.nama}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              NIK: {res.nik} • Dusun {res.dusun || '-'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                            Pilih
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Status Penyaluran Saat Ini *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormKpmStatus('Tersalurkan')}
                    className={`p-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                      formKpmStatus === 'Tersalurkan'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span>Tersalurkan</span>
                    {formKpmStatus === 'Tersalurkan' && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormKpmStatus('Menunggu Penyaluran')}
                    className={`p-3 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                      formKpmStatus === 'Menunggu Penyaluran'
                        ? 'bg-amber-50 border-amber-600 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    <span>Menunggu</span>
                    {formKpmStatus === 'Menunggu Penyaluran' && <Check className="h-4 w-4 text-amber-600" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddKpmModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedResident}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                  Daftarkan KPM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
