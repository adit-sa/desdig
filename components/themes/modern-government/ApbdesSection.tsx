'use client';

import React, { useState, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { ThemeData, SectionOrderFn, formatRupiah, summarizeApbdes } from './shared';
import { AnimatedCounter, AnimatedProgressBar } from './Animated';

export default function ApbdesSection({ tenant, data, getSectionOrder }: { tenant: ResolvedTenant; data: ThemeData; getSectionOrder: SectionOrderFn }) {
  const [apbdesFilter, setApbdesFilter] = useState<'ALL' | 'Pendapatan' | 'Belanja' | 'Pembiayaan'>('Pendapatan');

  const {
    totalPendapatan,
    totalAnggaranPendapatan,
    persenTotalPendapatan,
    totalBelanja,
    totalAnggaranBelanja,
    persenTotalBelanja,
    apbdesYear,
    countPendapatan,
    countBelanja,
    countPembiayaan,
  } = useMemo(() => summarizeApbdes(data.apbdes), [data.apbdes]);

  const filteredApbdes = useMemo(() => {
    if (apbdesFilter === 'ALL') return data.apbdes;
    return data.apbdes.filter((i) => i.category === apbdesFilter);
  }, [data.apbdes, apbdesFilter]);
  return (
    <section
      id="apbdes"
      style={{ order: getSectionOrder('apbdes') }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-100 p-6 sm:p-10 text-slate-900 space-y-7 scroll-reveal"
    >
      {/* Top decorative gradient sheen */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-50/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-50/70 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Metric Summary */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg shadow-sm">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Keterbukaan Informasi Publik
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-2 text-slate-900 tracking-tight">
            Transparansi Realisasi APBDes {apbdesYear}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Akuntabilitas dan keterbukaan pengelolaan Anggaran Pendapatan dan Belanja Desa {tenant.namaDesa}.
          </p>
        </div>

        {/* Stat Summary Cards Terang */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
          <div className="bg-emerald-50/80 p-3.5 sm:p-4 rounded-xl border border-emerald-200/90 hover:border-emerald-300 transition-colors shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-emerald-800 font-bold text-[11px]">Realisasi Pendapatan</span>
              <span className="text-[10px] font-extrabold text-white bg-emerald-600 px-1.5 py-0.5 rounded shadow-sm tabular-nums">
                <AnimatedCounter target={persenTotalPendapatan} suffix="%" duration={1000} />
              </span>
            </div>
            <span className="text-emerald-950 font-black text-base sm:text-lg font-mono">
              {formatRupiah(totalPendapatan)}
            </span>
            <span className="text-[10px] text-emerald-700 font-mono mt-0.5">
              Target: {formatRupiah(totalAnggaranPendapatan)}
            </span>
            <div className="mt-2">
              <AnimatedProgressBar percentage={persenTotalPendapatan} category="Pendapatan" />
            </div>
          </div>

          <div className="bg-amber-50/80 p-3.5 sm:p-4 rounded-xl border border-amber-200/90 hover:border-amber-300 transition-colors shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-amber-900 font-bold text-[11px]">Realisasi Belanja</span>
              <span className="text-[10px] font-extrabold text-white bg-amber-600 px-1.5 py-0.5 rounded shadow-sm tabular-nums">
                <AnimatedCounter target={persenTotalBelanja} suffix="%" duration={1000} />
              </span>
            </div>
            <span className="text-amber-950 font-black text-base sm:text-lg font-mono">
              {formatRupiah(totalBelanja)}
            </span>
            <span className="text-[10px] text-amber-700 font-mono mt-0.5">
              Pagu: {formatRupiah(totalAnggaranBelanja)}
            </span>
            <div className="mt-2">
              <AnimatedProgressBar percentage={persenTotalBelanja} category="Belanja" />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setApbdesFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              apbdesFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua Pos ({data.apbdes.length})
          </button>
          <button
            type="button"
            onClick={() => setApbdesFilter('Pendapatan')}
            className={`px-3 py-1.5 rounded-lg transition ${
              apbdesFilter === 'Pendapatan'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Pendapatan ({countPendapatan})
          </button>
          <button
            type="button"
            onClick={() => setApbdesFilter('Belanja')}
            className={`px-3 py-1.5 rounded-lg transition ${
              apbdesFilter === 'Belanja'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Belanja ({countBelanja})
          </button>
          {countPembiayaan > 0 && (
            <button
              type="button"
              onClick={() => setApbdesFilter('Pembiayaan')}
              className={`px-3 py-1.5 rounded-lg transition ${
                apbdesFilter === 'Pembiayaan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Pembiayaan ({countPembiayaan})
            </button>
          )}
        </div>

        <span className="text-xs text-slate-400">
          Menampilkan <strong className="text-slate-700">{filteredApbdes.length}</strong> rincian akun
        </span>
      </div>

      {/* List Kartu Pos APBDes Terang */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredApbdes.map((item) => {
          const pct = item.budget > 0 ? Math.min(100, Math.round((item.realization / item.budget) * 100)) : 0;
          return (
            <div
              key={item.id}
              className="bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-emerald-300 rounded-xl p-5 space-y-3.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in-50 duration-200"
            >
              <div className="flex justify-between items-start text-xs">
                <div>
                  <span className="text-slate-400 font-mono text-[10px] block">
                    {item.accountCode} • {item.category}
                  </span>
                  <h6 className="font-extrabold text-sm text-slate-800 mt-0.5">{item.accountName}</h6>
                </div>
                <span
                  className={`font-extrabold px-2.5 py-0.5 rounded text-xs border tabular-nums ${
                    item.category === 'Pendapatan'
                      ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                      : item.category === 'Belanja'
                      ? 'text-amber-800 bg-amber-100 border-amber-200'
                      : 'text-blue-800 bg-blue-100 border-blue-200'
                  }`}
                >
                  <AnimatedCounter target={pct} suffix="%" duration={1000} />
                </span>
              </div>

              {/* Bar Animasi Realisasi APBDes Terang */}
              <div className="space-y-1">
                <AnimatedProgressBar percentage={pct} category={item.category} />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500">
                <span>
                  Anggaran: <strong className="text-slate-700 font-semibold">{formatRupiah(item.budget)}</strong>
                </span>
                <span>
                  Terserap:{' '}
                  <strong
                    className={`font-semibold ${
                      item.category === 'Pendapatan'
                        ? 'text-emerald-700'
                        : item.category === 'Belanja'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {formatRupiah(item.realization)}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
