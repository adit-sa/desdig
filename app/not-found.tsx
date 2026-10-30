import React from 'react';
import Link from 'next/link';
import { Landmark, ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-16 text-slate-800 antialiased font-sans">
      <div className="max-w-md w-full bg-white rounded-xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-black">
          <Landmark className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Galat 404 • Halaman Tidak Ditemukan
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight pt-2">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Halaman atau dokumen publik desa yang Anda tuju mungkin telah dipindahkan, dinonaktifkan, atau alamat URL yang dimasukkan salah.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Ke Beranda Desa</span>
          </Link>
          <Link
            href="/admin"
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl border border-slate-200 transition flex items-center justify-center gap-2"
          >
            <span>Balai Admin</span>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400">
          Sistem Informasi Desa Terpadu • Multi-Tenant Platform
        </div>
      </div>
    </div>
  );
}
