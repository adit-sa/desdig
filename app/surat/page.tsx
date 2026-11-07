'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  PlusCircle,
  Search,
  ArrowLeft,
  CheckCircle,
  Clock,
  QrCode,
  X,
  FileCheck,
  Send,
  Trash2,
  Filter,
  User,
  Building2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
} from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import DynamicQrCode from '@/components/DynamicQrCode';
import { formatTanggalIndo } from '@/lib/formatters';
import { useOpenSIDStore } from '@/lib/store';
import { SuratPermohonan } from '@/lib/types';

interface ResidentOption {
  id: string;
  nik: string;
  noKk: string;
  nama: string;
  jenisKelamin: string;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  agama?: string | null;
  pekerjaan?: string | null;
  alamat?: string | null;
  dusun?: string | null;
  rt?: string | null;
  rw?: string | null;
  statusKawin?: string | null;
}

const TEMPLATE_SURAT = [
  {
    kode: 'SKU',
    nama: 'Surat Keterangan Usaha (SKU)',
    deskripsi: 'Untuk pengajuan pinjaman perbankan / KUR dan legalitas izin usaha mikro warga',
    isiTemplate: 'Nama yang bersangkutan di atas benar-benar memiliki usaha produktif di wilayah Desa kami.',
  },
  {
    kode: 'SKTM',
    nama: 'Surat Keterangan Tidak Mampu (SKTM)',
    deskripsi: 'Untuk beasiswa pendidikan, keringanan biaya rumah sakit, dan pendaftaran bantuan sosial',
    isiTemplate: 'Nama yang bersangkutan di atas benar-benar tergolong dalam keluarga ekonomi kurang mampu / prasejahtera.',
  },
  {
    kode: 'SKCK',
    nama: 'Surat Pengantar SKCK',
    deskripsi: 'Untuk pengurusan Surat Keterangan Catatan Kepolisian di Polsek / Polres',
    isiTemplate: 'Nama yang bersangkutan di atas berkelakuan baik, tidak sedang menjalani proses hukum pidana.',
  },
  {
    kode: 'SKD',
    nama: 'Surat Keterangan Domisili',
    deskripsi: 'Keterangan tempat tinggal sah warga atau pendirian kantor badan usaha',
    isiTemplate: 'Nama yang bersangkutan di atas benar-benar bertempat tinggal dan berdomisili sah di alamat tersebut.',
  },
  {
    kode: 'SKBM',
    nama: 'Surat Keterangan Belum Menikah',
    deskripsi: 'Untuk persyaratan melamar pekerjaan, beasiswa, atau pengajuan KPR perumahan',
    isiTemplate: 'Nama yang bersangkutan di atas berstatus belum pernah menikah / lajang berdasarkan catatan sipil desa.',
  },
  {
    kode: 'SKP',
    nama: 'Surat Keterangan Penghasilan',
    deskripsi: 'Untuk pendaftaran sekolah, KIP Kuliah, dan verifikasi kemampuan finansial orang tua',
    isiTemplate: 'Nama yang bersangkutan di atas memiliki rata-rata penghasilan keluarga sebagaimana tercatat.',
  },
  {
    kode: 'SKK',
    nama: 'Surat Keterangan Kematian',
    deskripsi: 'Keterangan kematian warga untuk pengurusan waris, asuransi, dan penutupan data kependudukan',
    isiTemplate: 'Menerangkan bahwa warga yang bersangkutan telah meninggal dunia di wilayah desa kami.',
  },
  {
    kode: 'SKL',
    nama: 'Surat Keterangan Kelahiran',
    deskripsi: 'Keterangan kelahiran bayi untuk pembuatan akta kelahiran baru di Disdukcapil',
    isiTemplate: 'Menerangkan bahwa telah lahir seorang anak dari pasangan suami-istri yang bersangkutan.',
  },
];

export default function SuratPage() {
  const { suratList, buatSurat, updateStatusSurat, activeTenant, currentTenantId, pendudukList: storePenduduk } =
    useOpenSIDStore();

  const [activeTab, setActiveTab] = useState<'daftar' | 'cetak'>('daftar');
  const [selectedSurat, setSelectedSurat] = useState<SuratPermohonan | null>(null);
  const [isModalCreateOpen, setIsModalCreateOpen] = useState(false);

  // Live Database Residents State
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form Buat Surat State
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('SKU');
  const [keperluan, setKeperluan] = useState('');
  const [keteranganTambahan, setKeteranganTambahan] = useState('');
  const [penghasilan, setPenghasilan] = useState('');

  const slug = currentTenantId || activeTenant?.slug || '';

  const storePendudukRef = useRef(storePenduduk);
  useEffect(() => {
    storePendudukRef.current = storePenduduk;
  }, [storePenduduk]);

  // 1. Fetch Real Residents from PostgreSQL API
  const fetchResidents = useCallback(async () => {
    if (!slug) return;
    try {
      setLoadingResidents(true);
      const res = await fetch(`/api/residents?tenant=${slug}&limit=5000`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.residents) && data.residents.length > 0) {
        setResidents(data.residents);
      } else {
        // Fallback to store
        const fallback = storePendudukRef.current || [];
        const mapped: ResidentOption[] = fallback.map((p) => ({
          id: p.id,
          nik: p.nik,
          noKk: p.no_kk,
          nama: p.nama,
          jenisKelamin: p.jenis_kelamin,
          tempatLahir: p.tempat_lahir,
          tanggalLahir: p.tanggal_lahir,
          agama: p.agama,
          pekerjaan: p.pekerjaan,
          alamat: p.alamat,
          dusun: p.dusun,
          rt: p.rt,
          rw: p.rw,
          statusKawin: p.status_kawin,
        }));
        setResidents(mapped);
      }
    } catch (err) {
      console.warn('Gagal memuat penduduk dari API, fallback ke store:', err);
    } finally {
      setLoadingResidents(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchResidents();
  }, [fetchResidents]);

  // Set default selected surat if available
  useEffect(() => {
    if (!selectedSurat && suratList.length > 0) {
      setSelectedSurat(suratList[0]);
    }
  }, [suratList, selectedSurat]);

  // Filtered residents for resident search in create modal
  const filteredResidentOptions = useMemo(() => {
    if (!residentSearchQuery.trim()) return residents.slice(0, 15);
    const q = residentSearchQuery.toLowerCase().trim();
    return residents
      .filter((r) => r.nama.toLowerCase().includes(q) || r.nik.includes(q) || (r.dusun && r.dusun.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [residents, residentSearchQuery]);

  // Filtered Surat List in Tab Daftar
  const filteredSuratList = useMemo(() => {
    return suratList.filter((s) => {
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.nama_pemohon.toLowerCase().includes(q) ||
        s.nik_pemohon.includes(q) ||
        s.nomor_surat.toLowerCase().includes(q) ||
        s.jenis_surat.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [suratList, filterStatus, searchQuery]);

  const handleBuatSurat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident) {
      alert('Pilih warga pemohon terlebih dahulu!');
      return;
    }

    const tpl = TEMPLATE_SURAT.find((t) => t.kode === selectedTemplate);
    const newSurat = buatSurat({
      nik_pemohon: selectedResident.nik,
      nama_pemohon: selectedResident.nama,
      jenis_surat: tpl?.nama || selectedTemplate,
      kode_surat: selectedTemplate,
      keperluan,
      keterangan_tambahan: keteranganTambahan + (penghasilan ? ` (Penghasilan: ${penghasilan})` : ''),
    });

    setIsModalCreateOpen(false);
    setSelectedSurat(newSurat);
    setActiveTab('cetak');
    // Reset form
    setSelectedResident(null);
    setResidentSearchQuery('');
    setKeperluan('');
    setKeteranganTambahan('');
    setPenghasilan('');
  };

  // Pastikan ada surat yang terpilih untuk pratinjau cetak default
  useEffect(() => {
    if (!selectedSurat && suratList.length > 0) {
      setSelectedSurat(suratList[0]);
    }
  }, [suratList, selectedSurat]);

  const handleCetak = (surat: SuratPermohonan) => {
    setSelectedSurat(surat);
    updateStatusSurat(surat.id, 'Dicetak');
    setActiveTab('cetak');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Cari data lengkap pemohon dari daftar resident untuk keperluan pratinjau cetak
  const dataPendudukCetak = useMemo(() => {
    if (!selectedSurat) return null;
    return residents.find((r) => r.nik === selectedSurat.nik_pemohon);
  }, [selectedSurat, residents]);

  const templateDetail = useMemo(() => {
    if (!selectedSurat) return null;
    return TEMPLATE_SURAT.find((t) => t.nama === selectedSurat.jenis_surat || t.kode === selectedSurat.kode_surat);
  }, [selectedSurat]);

  return (
    <div className="space-y-6">
      {/* Header (Hidden on print) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="h-3 w-3" />
              Sistem Persuratan & E-Surat Resmi
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            Layanan Persuratan Desa {activeTenant.nama_desa}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan surat administrasi warga, arsip persuratan digital, dan cetak dokumen resmi format A4 berstandar Permendagri
          </p>
        </div>

        <button
          onClick={() => setIsModalCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Buat Surat Baru</span>
        </button>
      </div>

      {/* Tabs Navigation (Hidden on print) */}
      <div className="print:hidden flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('daftar')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === 'daftar'
            ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <FileText className="h-4 w-4" />
          <span>Daftar Arsip Surat ({suratList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('cetak')}
          className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${activeTab === 'cetak'
            ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Printer className="h-4 w-4" />
          <span>Format & Pratinjau Cetak A4</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR ARSIP SURAT */}
      <div className={activeTab === 'daftar' ? 'print:hidden space-y-4' : 'hidden'}>
        {/* Controls: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor surat, jenis surat, nama pemohon, atau NIK..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="Menunggu">Menunggu</option>
                <option value="Disetujui">Disetujui</option>
                <option value="Dicetak">Dicetak</option>
              </select>
            </div>
          </div>

          {/* Table Arsip Surat */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Nomor Surat</th>
                    <th className="px-4 py-3.5">Jenis Surat</th>
                    <th className="px-4 py-3.5">Pemohon</th>
                    <th className="px-4 py-3.5">Keperluan</th>
                    <th className="px-4 py-3.5">Tanggal</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSuratList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-semibold text-sm">Tidak ada arsip surat yang sesuai</p>
                        <p className="text-xs mt-1">Gunakan tombol &quot;Buat Surat Baru&quot; untuk menerbitkan surat administrasi warga.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuratList.map((surat) => (
                      <tr key={surat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {surat.nomor_surat}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {surat.jenis_surat}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">{surat.nama_pemohon}</div>
                          <div className="text-[10px] text-slate-400 font-mono">NIK: {surat.nik_pemohon}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {surat.keperluan}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">{formatTanggalIndo(surat.tanggal_permohonan)}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${surat.status === 'Dicetak'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : surat.status === 'Disetujui'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                          >
                            {surat.status === 'Dicetak' && <CheckCircle2 className="h-3 w-3" />}
                            {surat.status === 'Disetujui' && <CheckCircle className="h-3 w-3" />}
                            {surat.status === 'Menunggu' && <Clock className="h-3 w-3" />}
                            {surat.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          {surat.status === 'Menunggu' && (
                            <button
                              onClick={() => updateStatusSurat(surat.id, 'Disetujui')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition"
                            >
                              Setujui
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedSurat(surat);
                              setActiveTab('cetak');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Pratinjau / Cetak</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* TAB 2 / LEMBAR CETAK RESMI: FORMAT & PRATINJAU CETAK A4 */}
      {selectedSurat && (
        <div className={activeTab === 'cetak' ? 'space-y-4' : 'hidden print:block'}>
          {/* Action Bar Navigasi & Print Tools (Hidden on Print) */}
          <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('daftar')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Daftar</span>
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Pilih Dokumen:</span>
                <select
                  value={selectedSurat.id}
                  onChange={(e) => {
                    const found = suratList.find((s) => s.id === e.target.value);
                    if (found) setSelectedSurat(found);
                  }}
                  className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {suratList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nomor_surat} - {s.nama_pemohon} ({s.kode_surat})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCetak(selectedSurat)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak Lembar A4 (Ctrl + P)</span>
              </button>
            </div>
          </div>

          {/* LEMBAR KERTAS A4 RESMI CETAK (STANDAR TATA NASKAH DINAS PERMENDAGRI) */}
          <div className="print-sheet-a4 mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white p-8 sm:p-14 shadow-2xl rounded-2xl border border-slate-200 text-black font-serif print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:rounded-none">
            {/* KOP SURAT RESMI DINAS */}
            <div className="relative border-b-2 border-black pb-2 text-black">
              <div className="flex items-center gap-4">
                {/* Logo Pemkab / Lambang Daerah */}
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  <SafeImage
                    src={activeTenant.logo_url || '/images/default-logo.png'}
                    alt={`Lambang ${activeTenant.nama_desa}`}
                    width={80}
                    height={80}
                    className="max-h-20 max-w-20 object-contain"
                    unoptimized
                  />
                </div>

                {/* Teks Lembaga Pemda & Kantor Desa */}
                <div className="flex-1 text-center pr-20">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider font-serif leading-tight">
                    PEMERINTAH KABUPATEN {activeTenant.kabupaten?.toUpperCase()}
                  </h3>
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider font-serif leading-tight">
                    KECAMATAN {activeTenant.kecamatan?.toUpperCase()}
                  </h3>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-widest font-serif leading-tight mt-0.5">
                    KANTOR KEPALA DESA {activeTenant.nama_desa?.toUpperCase()}
                  </h2>
                  <p className="text-[10.5px] sm:text-[11px] font-sans text-black mt-1 leading-tight">
                    {activeTenant.alamat_kantor || `Jalan Poros Desa ${activeTenant.nama_desa}`}
                    {activeTenant.kode_pos ? ` • Kode Pos ${activeTenant.kode_pos}` : ''}
                  </p>
                  <p className="text-[10px] sm:text-[10.5px] font-sans text-black leading-tight">
                    {activeTenant.email ? `Email: ${activeTenant.email}` : `Email: desa@${process.env.NEXT_PUBLIC_APP_DOMAIN || 'adit.lt'}`}
                    {activeTenant.telepon ? ` • Telp: ${activeTenant.telepon}` : ''}
                    {` • Website: ${activeTenant.slug}.${process.env.NEXT_PUBLIC_APP_DOMAIN || 'adit.lt'}`}
                  </p>
                </div>
              </div>
            </div>
            {/* Garis Ganda Tipis Bawah (Garis Naskah Dinas Resmi) */}
            <div className="border-b border-black mt-[1.5px] mb-5"></div>

            {/* JUDUL DAN NOMOR SURAT */}
            <div className="text-center my-4">
              <h1 className="text-base sm:text-lg font-bold uppercase underline tracking-wider font-serif">
                {selectedSurat.jenis_surat}
              </h1>
              <p className="text-xs sm:text-sm font-sans mt-0.5 font-medium tracking-normal text-black">
                Nomor : {selectedSurat.nomor_surat}
              </p>
            </div>

            {/* ISI SURAT */}
            <div className="text-xs sm:text-[13px] leading-relaxed space-y-3 font-serif text-black">
              <p className="text-justify indent-8">
                Yang bertanda tangan di bawah ini Kepala Desa {activeTenant.nama_desa}, Kecamatan {activeTenant.kecamatan}, Kabupaten {activeTenant.kabupaten}, Provinsi {activeTenant.provinsi || 'Indonesia'}, menerangkan dengan sebenarnya bahwa:
              </p>

              {/* TABEL BIODATA PEMOHON */}
              <table className="w-full my-2.5 text-xs sm:text-[13px] leading-relaxed font-serif text-black border-collapse">
                <tbody>
                  <tr>
                    <td className="w-48 py-0.5 align-top">1. Nama Lengkap</td>
                    <td className="w-4 py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top font-bold uppercase">{selectedSurat.nama_pemohon}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">2. NIK</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top font-mono font-bold tracking-wider">{selectedSurat.nik_pemohon}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">3. Nomor KK</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top font-mono">{dataPendudukCetak?.noKk || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">4. Tempat / Tgl. Lahir</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top">
                      {dataPendudukCetak?.tempatLahir || '-'}, {dataPendudukCetak?.tanggalLahir ? formatTanggalIndo(dataPendudukCetak.tanggalLahir) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">5. Jenis Kelamin</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top">
                      {dataPendudukCetak?.jenisKelamin === 'L' ? 'Laki-Laki' : dataPendudukCetak?.jenisKelamin === 'P' ? 'Perempuan' : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">6. Warga Negara / Agama</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top">Indonesia / {dataPendudukCetak?.agama || 'Islam'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">7. Status Perkawinan</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top">{dataPendudukCetak?.statusKawin || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">8. Pekerjaan</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top">{dataPendudukCetak?.pekerjaan || 'Wiraswasta'}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 align-top">9. Tempat Tinggal / Alamat</td>
                    <td className="py-0.5 align-top text-center">:</td>
                    <td className="py-0.5 align-top">
                      {dataPendudukCetak?.alamat || `Dusun ${dataPendudukCetak?.dusun || '-'}`} RT {dataPendudukCetak?.rt || '001'} / RW {dataPendudukCetak?.rw || '001'}, Desa {activeTenant.nama_desa}, Kec. {activeTenant.kecamatan}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p className="text-justify indent-8">
                {templateDetail?.isiTemplate || `Berdasarkan catatan dan data kependudukan resmi kami, orang tersebut di atas adalah benar-benar penduduk yang bertempat tinggal dan berdomisili sah di Desa ${activeTenant.nama_desa}, Kecamatan ${activeTenant.kecamatan}, Kabupaten ${activeTenant.kabupaten}.`}
              </p>

              {selectedSurat.keterangan_tambahan && (
                <div className="p-2.5 my-1.5 border border-black rounded font-sans text-xs bg-slate-50 print:bg-transparent print:border-black">
                  <span className="font-bold">Keterangan Khusus:</span> {selectedSurat.keterangan_tambahan}
                </div>
              )}

              <p className="text-justify indent-8">
                Surat keterangan ini diberikan atas permintaan yang bersangkutan untuk keperluan:{' '}
                <strong className="underline">{selectedSurat.keperluan}</strong>.
              </p>

              <p className="text-justify indent-8">
                Demikian surat keterangan ini kami buat dengan sebenarnya dan penuh rasa tanggung jawab agar dapat dipergunakan sebagaimana mestinya oleh pihak yang berkepentingan.
              </p>
            </div>

            {/* TANDA TANGAN & LEGALISIR */}
            <div className="mt-8 flex justify-between items-end text-xs font-sans text-black break-inside-avoid">
              {/* QR Code Verifikasi Dokumen Digital */}
              <div className="border border-black p-2.5 rounded-xl flex items-center gap-3 max-w-[280px]">
                <DynamicQrCode
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/surat/verify/${selectedSurat.id}?tenant=${activeTenant.slug}&nomor=${encodeURIComponent(selectedSurat.nomor_surat)}&nama=${encodeURIComponent(selectedSurat.nama_pemohon)}&jenis=${encodeURIComponent(selectedSurat.jenis_surat)}&keperluan=${encodeURIComponent(selectedSurat.keperluan)}&tgl=${encodeURIComponent(selectedSurat.tanggal_cetak || selectedSurat.tanggal_permohonan)}&nik=${encodeURIComponent(selectedSurat.nik_pemohon)}`
                      : `/surat/verify/${selectedSurat.id}?tenant=${activeTenant.slug}`
                  }
                  size={64}
                  className="h-16 w-16 shrink-0"
                  alt={`QR Verifikasi Surat ${selectedSurat.nomor_surat}`}
                />
                <div className="text-[9.5px] leading-tight text-black">
                  <p className="font-bold uppercase tracking-tight">VERIFIKASI DIGITAL DESDIG</p>
                  <p className="mt-0.5">Dokumen sah diterbitkan oleh Pemdes {activeTenant.nama_desa}.</p>
                  <p className="text-[8.5px] text-slate-600 print:text-black mt-1 font-mono">Pindai QR untuk uji keabsahan.</p>
                </div>
              </div>

              {/* Tanda Tangan Kades */}
              <div className="text-center min-w-[220px]">
                <p className="text-xs">
                  {activeTenant.nama_desa}, {formatTanggalIndo(selectedSurat.tanggal_cetak || selectedSurat.tanggal_permohonan)}
                </p>
                <p className="font-bold mt-0.5 uppercase">Kepala Desa {activeTenant.nama_desa}</p>
                <div className="h-18 flex items-center justify-center italic text-slate-400 print:text-slate-300 text-[10px]">
                  [ Tanda Tangan & Cap Stempel ]
                </div>
                <p className="font-bold underline text-sm uppercase tracking-wide">
                  {activeTenant.kepala_desa || 'Kepala Desa ' + activeTenant.nama_desa}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUAT SURAT BARU */}
      {isModalCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Penerbitan Surat Administrasi Warga
              </h2>
              <button
                onClick={() => setIsModalCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBuatSurat} className="mt-4 space-y-4 text-xs">
              {/* 1. Pilih Warga dari Database PostgreSQL */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  1. Pilih Warga Pemohon (Buku Induk Desa) *
                </label>

                {selectedResident ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedResident.nama}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                        NIK: {selectedResident.nik} | Dusun {selectedResident.dusun || '-'}
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
                        placeholder="Ketik NIK atau Nama warga..."
                        value={residentSearchQuery}
                        onChange={(e) => setResidentSearchQuery(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredResidentOptions.map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => {
                            setSelectedResident(res);
                            setResidentSearchQuery('');
                          }}
                          className="w-full text-left p-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800 transition flex items-center justify-between text-xs"
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

              {/* 2. Jenis Surat */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  2. Jenis Dokumen / Template Surat *
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {TEMPLATE_SURAT.map((t) => (
                    <option key={t.kode} value={t.kode}>
                      {t.nama}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {TEMPLATE_SURAT.find((t) => t.kode === selectedTemplate)?.deskripsi}
                </p>
              </div>

              {/* 3. Keperluan Surat */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  3. Keperluan Pembuatan Surat *
                </label>
                <input
                  type="text"
                  required
                  value={keperluan}
                  onChange={(e) => setKeperluan(e.target.value)}
                  placeholder="Contoh: Pengajuan Kredit Usaha Rakyat (KUR) BRI Cabang Unit Desa"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 4. Keterangan Tambahan */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  4. Keterangan Tambahan / Detail Dokumen (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={keteranganTambahan}
                  onChange={(e) => setKeteranganTambahan(e.target.value)}
                  placeholder="Contoh: Jenis Usaha: Warung Kelontong dan Toko Sembako, Lama Usaha: 3 Tahun."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalCreateOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!selectedResident}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Terbitkan Dokumen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
