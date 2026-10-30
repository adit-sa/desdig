'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Users, TrendingUp, ShieldCheck, Megaphone, Camera } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { handleScrollToSection, getPpidUrl, getPengaduanUrl } from './shared';

export default function QuickLinksSection({ tenant }: { tenant: ResolvedTenant }) {
  const ppidUrl = getPpidUrl(tenant);
  const pengaduanUrl = getPengaduanUrl(tenant);
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-12 scroll-reveal">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-black text-emerald-700 tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Layanan Terpadu Mandiri
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          Pusat Pelayanan & Informasi Publik Desa
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Akses langsung seluruh administrasi surat, permohonan informasi PPID, saluran aduan, dan transparansi anggaran desa.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Layanan Surat Mandiri */}
        <Link
          href={`/layanan?tenant=${tenant.slug}`}
          className="scroll-reveal stagger-1 group card-bento-glow bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm transition-all duration-300 flex flex-col items-center text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 mb-3 shadow-sm">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700">Administrasi Surat</h4>
          <p className="text-[10px] text-slate-500 mt-1">Layanan surat keterangan mandiri</p>
        </Link>

        {/* 2. PPID Desa */}
        <Link
          href={ppidUrl}
          target={ppidUrl.startsWith('http') ? '_blank' : '_self'}
          rel={ppidUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="scroll-reveal stagger-2 group bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-teal-500 transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 mb-3 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-teal-700">PPID Informasi</h4>
          <p className="text-[10px] text-slate-500 mt-1">Permohonan data publik resmi</p>
        </Link>

        {/* 3. Pengaduan Warga */}
        <Link
          href={pengaduanUrl}
          target={pengaduanUrl.startsWith('http') ? '_blank' : '_self'}
          rel={pengaduanUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="scroll-reveal stagger-3 group bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-rose-500 transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 mb-3 shadow-sm">
            <Megaphone className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-rose-700">Lapor & Aspirasi</h4>
          <p className="text-[10px] text-slate-500 mt-1">Saluran aduan langsung warga</p>
        </Link>

        {/* 4. Transparansi APBDes */}
        <Link
          href="#apbdes"
          onClick={(e) => handleScrollToSection(e, '#apbdes')}
          className="scroll-reveal stagger-4 group bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-500 transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 mb-3 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-amber-700">Dana Desa APBDes</h4>
          <p className="text-[10px] text-slate-500 mt-1">Realisasi belanja transparan</p>
        </Link>

        {/* 5. Galeri Foto */}
        <Link
          href={`/galeri?tenant=${tenant.slug}`}
          className="scroll-reveal stagger-5 group bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-cyan-500 transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-600 group-hover:text-white transition-all duration-300 mb-3 shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-700">Galeri Foto</h4>
          <p className="text-[10px] text-slate-500 mt-1">Potret kegiatan pembangunan</p>
        </Link>

        {/* 6. Aparatur & Kehadiran */}
        <Link
          href="#pamong"
          onClick={(e) => handleScrollToSection(e, '#pamong')}
          className="scroll-reveal stagger-6 group bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 mb-3 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-700">Aparatur Desa</h4>
          <p className="text-[10px] text-slate-500 mt-1">Status absensi hari ini</p>
        </Link>
      </div>
    </section>
  );
}
