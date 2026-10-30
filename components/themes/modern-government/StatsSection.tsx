'use client';

import React from 'react';
import { Users, TrendingUp, ShieldCheck, Landmark } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { formatRupiah } from './shared';
import { AnimatedCounter } from './Animated';

export default function StatsSection({
  tenant,
  themeConfig,
  totalPendapatan,
}: {
  tenant: ResolvedTenant;
  themeConfig?: any;
  totalPendapatan: number;
}) {
  const statsConfig = themeConfig?.stats || {};
  const totalPenduduk = typeof statsConfig.totalPenduduk === 'number' ? statsConfig.totalPenduduk : 2450;
  const dusunInfo = statsConfig.dusunInfo || 'Wilayah Dusun';
  const totalKK = typeof statsConfig.totalKK === 'number' ? statsConfig.totalKK : 720;
  const statusIdm = statsConfig.statusIdm || 'Desa Mandiri';
  const statusIdmSub = statsConfig.statusIdmSub || 'Status Perkembangan';
  const displayApbdes = totalPendapatan > 0 ? totalPendapatan : (statsConfig.apbdesManual || 0);

  return (
    <section className="scroll-reveal relative -mt-8 sm:-mt-14 z-20 max-w-7xl mx-auto px-4 sm:px-8">
      <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-200 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="scroll-reveal-child stagger-1 flex items-center gap-3 sm:gap-4 min-w-0 p-2 rounded-xl hover:bg-slate-50/70 transition-all duration-200 group cursor-default">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold border border-emerald-200 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Penduduk</span>
            <strong className="text-lg sm:text-xl xl:text-2xl font-black text-slate-900 block truncate mt-0.5">
              <AnimatedCounter target={totalPenduduk} suffix="+ Jiwa" duration={1800} />
            </strong>
            <span className="text-[11px] text-emerald-600 font-semibold block truncate">{dusunInfo}</span>
          </div>
        </div>

        <div className="scroll-reveal-child stagger-2 flex items-center gap-3 sm:gap-4 pt-4 md:pt-0 md:pl-6 min-w-0 p-2 rounded-xl hover:bg-slate-50/70 transition-all duration-200 group cursor-default">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 font-bold border border-teal-200 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Kepala Keluarga</span>
            <strong className="text-lg sm:text-xl xl:text-2xl font-black text-slate-900 block truncate mt-0.5">
              <AnimatedCounter target={totalKK} suffix="+ KK" duration={1600} />
            </strong>
            <span className="text-[11px] text-teal-600 font-semibold block truncate">Terdata di DKB</span>
          </div>
        </div>

        <div className="scroll-reveal-child stagger-3 flex items-center gap-3 sm:gap-4 pt-4 md:pt-0 md:pl-6 min-w-0 p-2 rounded-xl hover:bg-slate-50/70 transition-all duration-200 group cursor-default">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 font-bold border border-blue-200 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Status IDM</span>
            <strong className="text-lg sm:text-xl xl:text-2xl font-black text-slate-900 block truncate mt-0.5">{statusIdm}</strong>
            <span className="text-[11px] text-blue-600 font-semibold block truncate">{statusIdmSub}</span>
          </div>
        </div>

        <div className="scroll-reveal-child stagger-4 flex items-center gap-3 sm:gap-4 pt-4 md:pt-0 md:pl-6 min-w-0 p-2 rounded-xl hover:bg-slate-50/70 transition-all duration-200 group cursor-default">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold border border-amber-200 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">APBDes Terbuka</span>
            {displayApbdes > 0 ? (
              <strong
                className="text-sm sm:text-base lg:text-lg xl:text-xl font-black text-slate-900 truncate block mt-0.5"
                title={formatRupiah(displayApbdes)}
              >
                <AnimatedCounter
                  target={displayApbdes}
                  prefix="Rp "
                  duration={2000}
                />
              </strong>
            ) : (
              <strong className="text-sm sm:text-base font-black text-slate-900 truncate block mt-0.5">
                Akuntabel & Terbuka
              </strong>
            )}
            <span className="text-[11px] text-amber-600 font-semibold block truncate">Transparan & Akuntabel</span>
          </div>
        </div>
      </div>
    </section>
  );
}
