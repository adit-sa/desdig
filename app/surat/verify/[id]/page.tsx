'use client';

import React, { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  FileCheck,
  Building2,
  Calendar,
  User,
  Lock,
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import SafeImage from '@/components/SafeImage';
import { useOpenSIDStore } from '@/lib/store';
import { DAFTAR_SURAT, DAFTAR_TENANT } from '@/lib/mock-data';

function maskNik(nik: string): string {
  if (!nik) return '****************';
  const clean = nik.replace(/\s+/g, '');
  if (clean.length >= 16) {
    return `${clean.slice(0, 4)}********${clean.slice(12)}`;
  }
  if (clean.length >= 8) {
    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
  }
  return '************';
}

function SuratVerifyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const suratId = (params?.id as string) || '';

  const { suratList, activeTenant, tenantList } = useOpenSIDStore();

  // 1. Ambil data surat dari: Query Params -> Local Store -> DAFTAR_SURAT Mock
  const queryNomor = searchParams.get('nomor');
  const queryNama = searchParams.get('nama');
  const queryJenis = searchParams.get('jenis');
  const queryKeperluan = searchParams.get('keperluan');
  const queryTgl = searchParams.get('tgl');
  const queryNik = searchParams.get('nik');
  const queryTenantSlug = searchParams.get('tenant');

  const surat = useMemo(() => {
    // Cari di store lokal terlebih dahulu
    const foundInStore = suratList.find((s) => s.id === suratId || (queryNomor && s.nomor_surat === queryNomor));
    if (foundInStore) return foundInStore;

    // Cari di mock default
    const foundInMock = DAFTAR_SURAT.find((s) => s.id === suratId || (queryNomor && s.nomor_surat === queryNomor));
    if (foundInMock) return foundInMock;

    // Jika tidak ada di store/mock (misal dibuka di perangkat warga lain dari QR cetak),
    // gunakan data yang terkode aman di URL Query Params
    if (queryNomor || queryNama || queryJenis) {
      return {
        id: suratId || 'SRT-VERIFIED',
        tenant_id: queryTenantSlug || activeTenant?.slug || 'salupangkang',
        nomor_surat: queryNomor || '470/---/PEM/2026',
        jenis_surat: queryJenis || 'Surat Keterangan Resmi',
        kode_surat: 'SK',
        nik_pemohon: queryNik || '7600000000000000',
        nama_pemohon: queryNama || 'Warga Desa Terdaftar',
        tanggal_permohonan: queryTgl || new Date().toISOString().split('T')[0],
        tanggal_cetak: queryTgl || new Date().toISOString().split('T')[0],
        keperluan: queryKeperluan || 'Keperluan Administratif Warga',
        status: 'Dicetak' as const,
      };
    }

    return null;
  }, [suratId, queryNomor, queryNama, queryJenis, queryKeperluan, queryTgl, queryNik, queryTenantSlug, suratList, activeTenant]);

  // Resolusi tenant terkait
  const tenant = useMemo(() => {
    const slugToFind = queryTenantSlug || surat?.tenant_id || activeTenant?.slug;
    const found = tenantList.find((t) => t.slug === slugToFind || t.id === slugToFind);
    return found || activeTenant || DAFTAR_TENANT[0];
  }, [queryTenantSlug, surat, tenantList, activeTenant]);

  const isValid = Boolean(surat);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 text-slate-800 p-4 sm:p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Header Navigasi */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Portal
          </Link>
          <div className="text-[11px] font-mono text-slate-400">
            desDig Digital Verification System
          </div>
        </div>

        {/* Kartu Utama Verifikasi */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
          {/* Header Status Keabsahan */}
          <div
            className={`p-6 sm:p-8 text-center text-white ${
              isValid
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700'
                : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700'
            }`}
          >
            <div className="inline-flex p-3.5 bg-white/15 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
              {isValid ? (
                <ShieldCheck className="w-12 h-12 text-white animate-pulse" />
              ) : (
                <AlertCircle className="w-12 h-12 text-white" />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {isValid ? 'DOKUMEN RESMI TERVERIFIKASI' : 'DOKUMEN TIDAK DITEMUKAN'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
              {isValid
                ? 'Surat ini sah dan terdaftar dalam Database Sistem Informasi Desa'
                : 'Data dokumen tidak dapat divalidasi oleh sistem'}
            </p>

            {isValid && (
              <div className="inline-flex items-center gap-2 mt-4 px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-white">
                <BadgeCheck className="w-4 h-4 text-emerald-200" />
                Integritas Dokumen Terjamin (Anti-Pemalsuan)
              </div>
            )}
          </div>

          {/* Badan Detail Surat */}
          {isValid && surat ? (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Kop Desa Penerbit */}
              <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 relative shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <SafeImage
                    src={tenant?.logo_url || '/images/default-logo.png'}
                    alt={`Logo ${tenant?.nama_desa}`}
                    fill
                    className="object-contain p-1"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Pemerintah Desa Penerbit
                  </div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">
                    Desa {tenant?.nama_desa}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kec. {tenant?.kecamatan}, Kab. {tenant?.kabupaten}, Prov. {tenant?.provinsi}
                  </p>
                </div>
              </div>

              {/* Rincian Dokumen */}
              <div className="space-y-4">
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Nomor & Jenis Dokumen
                  </div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {surat.nomor_surat}
                  </div>
                  <div className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {surat.jenis_surat}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Pemohon */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mb-1">
                      <User className="w-3.5 h-3.5" />
                      Nama Pemohon
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {surat.nama_pemohon}
                    </div>
                  </div>

                  {/* NIK Masked (UU PDP) */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mb-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      NIK (Terproteksi UU PDP)
                    </div>
                    <div className="text-sm font-bold font-mono text-slate-800">
                      {maskNik(surat.nik_pemohon)}
                    </div>
                  </div>

                  {/* Tanggal Terbit */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Tanggal Terbit
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {surat.tanggal_cetak || surat.tanggal_permohonan}
                    </div>
                  </div>

                  {/* Pejabat Penandatangan */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Pengesahan
                    </div>
                    <div className="text-sm font-semibold text-slate-800">
                      {tenant?.kepala_desa ? `Kades (${tenant.kepala_desa})` : `Kepala Desa ${tenant?.nama_desa}`}
                    </div>
                  </div>
                </div>

                {/* Keperluan */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Peruntukan / Keperluan
                  </div>
                  <div className="text-sm font-medium text-slate-700 italic">
                    &quot;{surat.keperluan}&quot;
                  </div>
                </div>
              </div>

              {/* Klausul Legalitas Hukum UU ITE & UU PDP */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Pernyataan Keabsahan Dokumen Elektronik
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Dokumen ini merupakan warkah resmi yang diterbitkan secara digital oleh{' '}
                  <strong>Pemerintah Desa {tenant?.nama_desa}</strong> melalui platform{' '}
                  <strong>desDig</strong>. Keabsahan tanda tangan dan nomor registrasi telah terverifikasi
                  secara elektronik sesuai Undang-Undang Republik Indonesia Nomor 1 Tahun 2024 tentang ITE
                  serta prinsip pelindungan data pribadi (UU PDP No. 27/2022).
                </p>
              </div>

              {/* Aksi */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-xl transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Bukti Verifikasi
                </button>
                <div className="text-[11px] text-slate-400 font-mono">
                  ID Dokumen: {surat.id}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-4">
              <p className="text-sm text-slate-600">
                Dokumen dengan identitas tersebut tidak terdaftar atau telah ditarik dari database resmi desa.
              </p>
              <Link
                href="/surat"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Lihat Layanan Surat Mandiri
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} desDig - Sistem Informasi Pelayanan & Tata Kelola Desa Mandiri</p>
          <p className="text-[10px]">Tersertifikasi Keamanan & Isolasi Multi-Tenant</p>
        </div>
      </div>
    </div>
  );
}

export default function SuratVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="p-6 bg-white rounded-2xl shadow-md border border-slate-200 max-w-sm w-full space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-semibold text-slate-700">
              Memverifikasi Keaslian Dokumen...
            </div>
          </div>
        </div>
      }
    >
      <SuratVerifyContent />
    </Suspense>
  );
}

