'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log ke layanan observabilitas produksi
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-16 text-slate-800 antialiased font-sans">
      <div className="max-w-md w-full bg-white rounded-xl border border-red-200 p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            Kendala Sistem Terdeteksi
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
            Terjadi Kesalahan pada Aplikasi
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Terjadi kendala saat memuat data desa. Permintaan Anda telah dicatat oleh sistem keamanan.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200 inline-block">
              ID Masalah: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Ulang Halaman</span>
          </button>
          <Link
            href="/"
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400">
          Layanan Bantuan Pengelola Sistem Informasi Desa
        </div>
      </div>
    </div>
  );
}
