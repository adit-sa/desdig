'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Home,
  FileText,
  Wallet,
  ArrowUpRight,
  UserPlus,
  Printer,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import { ADMIN_MENU_GROUPS } from '@/lib/admin-menu';

export default function DashboardPage() {
  const { pendudukList, keluargaList, suratList, activeTenant, apbdesList, aparaturList, isLoaded } = useOpenSIDStore();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem('desdig_current_user') || localStorage.getItem('opensid_current_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const targetTenantSlug = isMounted ? (activeTenant?.slug || activeTenant?.id || '') : '';
  const buildHref = (path: string) => {
    if (!targetTenantSlug || path.startsWith('/saas')) return path;
    return `${path}${path.includes('?') ? '&' : '?'}tenant=${targetTenantSlug}`;
  };

  const isSuperAdmin = currentUser?.globalRole === 'SUPER_ADMIN';
  const userRole = currentUser?.role || 'VILLAGE_ADMIN';

  // Filter kelompok direktori modul sesuai izin peran (RBAC) pengguna aktif
  const accessibleGroups = useMemo(() => {
    return ADMIN_MENU_GROUPS.filter((g) => g.id !== 'utama')
      .map((group) => {
        const allowedItems = group.items.filter((item) => {
          if (!isSuperAdmin && item.allowedRoles && userRole) {
            return item.allowedRoles.includes(userRole as any);
          }
          return true;
        });
        return {
          ...group,
          items: allowedItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [isSuperAdmin, userRole]);

  const totalPenduduk = pendudukList.length;
  const totalLaki = pendudukList.filter(p => p.jenis_kelamin === 'L').length;
  const totalPerempuan = pendudukList.filter(p => p.jenis_kelamin === 'P').length;
  const totalKeluarga = keluargaList.length;
  const totalSurat = suratList.length;
  const suratMenunggu = suratList.filter(s => s.status === 'Menunggu').length;

  const totalPendapatanAnggaran = apbdesList
    .filter(i => i.kategori === 'Pendapatan')
    .reduce((acc, curr) => acc + curr.anggaran, 0);

  const totalBelanjaRealisasi = apbdesList
    .filter(i => i.kategori === 'Belanja')
    .reduce((acc, curr) => acc + curr.realisasi, 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const getRoleLabel = () => {
    if (isSuperAdmin) return 'Super Admin Platform (Mode Inspeksi)';
    switch (userRole) {
      case 'VILLAGE_ADMIN':
        return 'Admin Utama Desa';
      case 'EDITOR':
        return 'Operator Desa';
      case 'AUTHOR':
        return 'Penulis Berita';
      case 'APARATUR':
        return 'Aparatur / Pamong';
      case 'AUDITOR':
        return 'Auditor / Pengawas';
      default:
        return 'Pengelola Desa';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner Profil Desa */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div suppressHydrationWarning className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/60 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-emerald-400/30">
                <MapPin className="h-3.5 w-3.5" />
                Kec. {activeTenant.kecamatan}, Kab. {activeTenant.kabupaten}
              </div>
              <div suppressHydrationWarning className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md border border-white/20 text-white">
                <Shield className="h-3.5 w-3.5 text-amber-300" />
                {getRoleLabel()}
              </div>
            </div>
            <h1 suppressHydrationWarning className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pemerintah Desa {activeTenant.nama_desa}
            </h1>
            <p className="mt-1 text-sm text-emerald-100 max-w-2xl">
              Sistem Informasi Desa terpadu untuk pelayanan administrasi kependudukan, transparansi keuangan, dan surat-menyurat online warga.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
              <Link
                href={buildHref('/surat')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition"
              >
                <FileText className="h-4 w-4" />
                <span>Buat Surat Desa</span>
              </Link>
            )}
            {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
              <Link
                href={buildHref('/kependudukan')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/80 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 border border-emerald-400/30 transition"
              >
                <UserPlus className="h-4 w-4" />
                <span>Tambah Penduduk</span>
              </Link>
            )}
            {userRole === 'AUTHOR' && (
              <Link
                href={buildHref('/admin/berita')}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-md hover:bg-emerald-50 transition"
              >
                <FileText className="h-4 w-4" />
                <span>Tulis Berita Baru</span>
              </Link>
            )}
            {(userRole === 'APARATUR' || userRole === 'VILLAGE_ADMIN') && (
              <Link
                href={buildHref('/admin/absen')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/80 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 border border-emerald-400/30 transition"
              >
                <Clock className="h-4 w-4" />
                <span>Absensi Pamong</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Penduduk */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Penduduk</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalPenduduk}</span>
            <span className="text-xs text-slate-500">Jiwa</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800">
            <span>L: {totalLaki} ({Math.round((totalLaki / (totalPenduduk || 1)) * 100)}%)</span>
            <span>P: {totalPerempuan} ({Math.round((totalPerempuan / (totalPenduduk || 1)) * 100)}%)</span>
          </div>
        </div>

        {/* Card 2: Total Keluarga */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kepala Keluarga (KK)</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Home className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalKeluarga}</span>
            <span className="text-xs text-slate-500">Keluarga</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800 flex items-center justify-between">
            <span>Rata-rata: {((totalPenduduk / (totalKeluarga || 1))).toFixed(1)} jiwa/KK</span>
            {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
              <Link href={buildHref('/kependudukan')} className="text-blue-600 hover:underline">Kelola &rarr;</Link>
            )}
          </div>
        </div>

        {/* Card 3: Permohonan Surat */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pelayanan Surat</span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalSurat}</span>
            <span className="text-xs text-slate-500">Berkas Terbit</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800 flex items-center justify-between">
            <span className={`font-semibold ${suratMenunggu > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {suratMenunggu} permohonan baru
            </span>
            {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
              <Link href={buildHref('/surat')} className="text-amber-600 hover:underline">Proses &rarr;</Link>
            )}
          </div>
        </div>

        {/* Card 4: APBDes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dana Desa & APBDes 2026</span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatRupiah(totalPendapatanAnggaran)}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2 dark:border-slate-800 flex items-center justify-between">
            <span>Realisasi Belanja: {Math.round((totalBelanjaRealisasi / (totalPendapatanAnggaran || 1)) * 100)}%</span>
            {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'AUDITOR') && (
              <Link href={buildHref('/keuangan')} className="text-purple-600 hover:underline">Detail &rarr;</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Permohonan Surat Terbaru & Komposisi Wilayah */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Permohonan Surat Terbaru */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Permohonan Surat Terbaru</h2>
              <p className="text-xs text-slate-500">Antrean permohonan administrasi warga desa</p>
            </div>
            {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
              <Link
                href={buildHref('/surat')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {suratList.slice(0, 4).map((surat) => (
              <div key={surat.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{surat.jenis_surat}</h3>
                    <p className="text-xs text-slate-500">
                      Pemohon: <span className="font-medium text-slate-700 dark:text-slate-300">{surat.nama_pemohon}</span> (NIK: {surat.nik_pemohon})
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Keperluan: {surat.keperluan}</p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      surat.status === 'Dicetak'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : surat.status === 'Disetujui'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {surat.status === 'Dicetak' && <Printer className="h-3 w-3" />}
                    {surat.status === 'Disetujui' && <CheckCircle2 className="h-3 w-3" />}
                    {surat.status === 'Menunggu' && <Clock className="h-3 w-3" />}
                    {surat.status}
                  </span>
                  <span className="text-[10px] text-slate-400">{surat.tanggal_permohonan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom 3: Aparatur Desa & Ringkasan Wilayah */}
        <div className="space-y-6">
          {/* Aparatur Desa */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Pamong / Aparatur Desa</h2>
            <p className="text-xs text-slate-500 mb-4">Struktur Pemerintah Desa {activeTenant.nama_desa}</p>

            <div className="space-y-3">
              {aparaturList.slice(0, 4).map((aparat) => (
                <div key={aparat.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{aparat.nama}</p>
                    <p className="text-[11px] text-slate-500">{aparat.jabatan}</p>
                  </div>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {aparat.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Akses Cepat Modul */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Akses Cepat Modul</h2>
            <p className="text-xs text-slate-500 mb-3">Pintasan fitur administrasi desa</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
                <Link
                  href={buildHref('/kependudukan')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition"
                >
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="truncate">Buku Induk Penduduk</span>
                </Link>
              )}
              {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
                <Link
                  href={buildHref('/surat')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition"
                >
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="truncate">Cetak E-Surat</span>
                </Link>
              )}
              {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR') && (
                <Link
                  href={buildHref('/bansos')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition"
                >
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="truncate">Bantuan Sosial</span>
                </Link>
              )}
              {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'AUDITOR') && (
                <Link
                  href={buildHref('/keuangan')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition"
                >
                  <Wallet className="h-4 w-4 text-amber-600" />
                  <span className="truncate">Laporan APBDes</span>
                </Link>
              )}
              {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'EDITOR' || userRole === 'AUTHOR') && (
                <Link
                  href={buildHref('/admin/berita')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition"
                >
                  <FileText className="h-4 w-4 text-teal-600" />
                  <span className="truncate">Kelola Berita</span>
                </Link>
              )}
              {(isSuperAdmin || userRole === 'VILLAGE_ADMIN' || userRole === 'APARATUR') && (
                <Link
                  href={buildHref('/admin/absen')}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 transition"
                >
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="truncate">Absensi Pamong</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Direktori Pengelolaan Berdasarkan Fungsi */}
      <div className="pt-2">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Direktori Modul & Pengelolaan Desa
            </h2>
            <p className="text-xs text-slate-500">
              Akses cepat seluruh fitur administrasi yang terkelompok berdasarkan fungsinya
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60">
            Terstruktur & Terpadu
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accessibleGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    {group.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {group.items.length} Menu
                  </span>
                </div>
                {group.description && (
                  <p className="text-[11px] text-slate-400 mb-3 line-clamp-1">{group.description}</p>
                )}

                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={buildHref(item.href)}
                        className="group flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-100 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950 dark:group-hover:text-emerald-400 transition">
                            <ItemIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {item.label}
                            </p>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.badge && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
