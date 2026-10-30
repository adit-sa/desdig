'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  FileText,
  Send,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  ShieldAlert,
  Search,
  Sparkles,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

export default function PortalPage() {
  const { pendudukList, buatSurat, suratList, activeTenant, beritaList } = useOpenSIDStore();

  // Form Layanan Mandiri
  const [nik, setNik] = useState('');
  const [jenisSurat, setJenisSurat] = useState('SKU');
  const [keperluan, setKeperluan] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cek Status Surat
  const [searchNik, setSearchNik] = useState('');
  const [hasilCek, setHasilCek] = useState<typeof suratList>([]);

  const handleAjukanSurat = (e: React.FormEvent) => {
    e.preventDefault();
    const penduduk = pendudukList.find((p) => p.nik === nik);
    if (!penduduk) {
      alert(`NIK tidak ditemukan dalam Buku Induk Penduduk Desa ${activeTenant.nama_desa}! Silakan hubungi operator desa.`);
      return;
    }

    const tplMap: Record<string, string> = {
      SKU: 'Surat Keterangan Usaha (SKU)',
      SKTM: 'Surat Keterangan Tidak Mampu (SKTM)',
      SKCK: 'Surat Pengantar SKCK',
      SKD: 'Surat Keterangan Domisili',
    };

    const suratBaru = buatSurat({
      nik_pemohon: penduduk.nik,
      nama_pemohon: penduduk.nama,
      jenis_surat: tplMap[jenisSurat] || jenisSurat,
      kode_surat: jenisSurat,
      keperluan,
      keterangan_tambahan: keterangan,
    });

    setSuccessMessage(
      `Permohonan surat berhasil dikirim! Nomor Registrasi: ${suratBaru.nomor_surat}. Surat sedang menunggu verifikasi pamong desa.`
    );
    setNik('');
    setKeperluan('');
    setKeterangan('');
  };

  const handleCariStatus = () => {
    if (!searchNik) return;
    const hasil = suratList.filter((s) => s.nik_pemohon === searchNik);
    setHasilCek(hasil);
  };

  return (
    <div className="space-y-12">
      {/* Hero Banner Web Desa */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-8 sm:p-14 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-emerald-400/30 text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            Portal Layanan Mandiri Desa Digital
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Selamat Datang di Portal Resmi Desa {activeTenant.nama_desa}
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            &ldquo;{activeTenant.visi}&rdquo;
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <a
              href="#layanan-mandiri"
              className="rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-600 transition"
            >
              Ajukan Surat Online &darr;
            </a>
            <Link
              href={activeTenant?.slug ? `/admin?tenant=${activeTenant.slug}` : '/admin'}
              className="rounded-xl bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 transition"
            >
              Kembali ke Panel Admin
            </Link>
          </div>
        </div>
      </section>

      {/* FITUR 1: LAYANAN MANDIRI WARGA (AJUKAN SURAT) */}
      <section id="layanan-mandiri" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Pengajuan Surat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Layanan Mandiri Warga</h2>
              <p className="text-xs text-slate-500">Permohonan surat keterangan dari rumah tanpa antre</p>
            </div>
          </div>

          {successMessage && (
            <div className="my-4 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300">
              <p className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {successMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleAjukanSurat} className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Induk Kependudukan (NIK) *
              </label>
              <input
                type="text"
                required
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Masukkan 16 digit NIK Anda (contoh: 3202111205850001)"
                className="w-full rounded-lg border border-slate-200 p-2.5 font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * NIK harus sudah terdaftar di Buku Induk Penduduk Desa {activeTenant.nama_desa}.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pilih Jenis Surat *
              </label>
              <select
                value={jenisSurat}
                onChange={(e) => setJenisSurat(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="SKU">Surat Keterangan Usaha (SKU)</option>
                <option value="SKTM">Surat Keterangan Tidak Mampu (SKTM)</option>
                <option value="SKCK">Surat Pengantar SKCK</option>
                <option value="SKD">Surat Keterangan Domisili</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keperluan Surat *
              </label>
              <input
                type="text"
                required
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                placeholder="Contoh: Persyaratan Beasiswa, Pengajuan Pinjaman KUR, dll."
                className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan Tambahan
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Nama usaha, nomor telepon warga, dll."
                className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Send className="h-4 w-4" />
              <span>Kirim Permohonan Surat</span>
            </button>
          </form>
        </div>

        {/* Cek Status Permohonan Surat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Lacak Status Surat</h2>
              <p className="text-xs text-slate-500">Ketahui perkembangan permohonan surat Anda secara transparan</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={searchNik}
              onChange={(e) => setSearchNik(e.target.value)}
              placeholder="Masukkan NIK Anda..."
              className="flex-1 rounded-lg border border-slate-200 p-2.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={handleCariStatus}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
            >
              Lacak
            </button>
          </div>

          <div className="mt-4 flex-1">
            {hasilCek.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl p-4 dark:border-slate-800">
                <FileText className="h-8 w-8 text-slate-300 mb-2" />
                <p>Ketikkan NIK Anda di atas untuk melihat riwayat surat.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {hasilCek.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{s.jenis_surat}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          s.status === 'Dicetak'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'Disetujui'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">{s.nomor_surat}</p>
                    <p className="text-[11px] text-slate-600 mt-1">Keperluan: {s.keperluan}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Diajukan: {s.tanggal_permohonan}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FITUR 2: KABAR & BERITA DESA */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kabar & Pengumuman Desa Terbaru
          </h2>
          <p className="text-xs text-slate-500">Informasi pembangunan, kegiatan warga, dan kebijakan desa</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {beritaList.map((berita) => (
            <div
              key={berita.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                    {berita.kategori}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {berita.tanggal}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {berita.judul}
                </h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                  {berita.ringkasan}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[10px]">Oleh: {berita.penulis}</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1 cursor-pointer hover:underline">
                  Baca <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
