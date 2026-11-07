'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  Wallet,
  Scale,
  Search,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { ThemeData, SectionOrderFn, formatRupiah, summarizeApbdes } from './shared';
import { AnimatedCounter, AnimatedProgressBar } from './Animated';

export default function ApbdesSection({
  tenant,
  data,
  getSectionOrder,
}: {
  tenant: ResolvedTenant;
  data: ThemeData;
  getSectionOrder: SectionOrderFn;
}) {
  const [apbdesFilter, setApbdesFilter] = useState<'ALL' | 'Pendapatan' | 'Belanja' | 'Pembiayaan'>('Pendapatan');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    totalPendapatan,
    totalAnggaranPendapatan,
    persenTotalPendapatan,
    totalBelanja,
    totalAnggaranBelanja,
    persenTotalBelanja,
    totalPembiayaan,
    totalAnggaranPembiayaan,
    persenTotalPembiayaan,
    surplusDefisitRealisasi,
    danaDesaPagu,
    danaDesaRealisasi,
    apbdesYear,
    countPendapatan,
    countBelanja,
    countPembiayaan,
  } = useMemo(() => summarizeApbdes(data.apbdes), [data.apbdes]);

  const filteredApbdes = useMemo(() => {
    let list = data.apbdes;
    if (apbdesFilter !== 'ALL') {
      list = list.filter((i) => i.category === apbdesFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          (i.accountName || '').toLowerCase().includes(q) ||
          (i.accountCode || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.apbdes, apbdesFilter, searchQuery]);

  // Hitung total filtered untuk baris ringkasan tabel
  const tableTotals = useMemo(() => {
    const budget = filteredApbdes.reduce((acc, curr) => acc + (curr.budget || 0), 0);
    const realization = filteredApbdes.reduce((acc, curr) => acc + (curr.realization || 0), 0);
    const pct = budget > 0 ? Math.min(100, Math.round((realization / budget) * 100)) : 0;
    return { budget, realization, pct, sisa: Math.max(0, budget - realization) };
  }, [filteredApbdes]);

  return (
    <section
      id="apbdes"
      style={{ order: getSectionOrder('apbdes') }}
      className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-slate-100 p-6 sm:p-10 text-slate-900 space-y-8 scroll-reveal"
    >
      {/* Top decorative gradient sheen */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500" />
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-50/70 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-50/70 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Dasar Hukum */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 tracking-wider uppercase flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg shadow-sm">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Keterbukaan Informasi Publik
            </span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
              Permendagri No. 20/2018 & UU No. 6/2014
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black mt-2 text-slate-900 tracking-tight">
            Transparansi Realisasi APBDes {apbdesYear}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Akuntabilitas dan keterbukaan pengelolaan Anggaran Pendapatan dan Belanja Desa {tenant.namaDesa}.
            Seluruh data anggaran dipublikasikan transparan untuk pengawasan masyarakat.
          </p>
        </div>

        {/* View Switcher: Card vs Table */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            Kartu Rinci
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
            Tabel Rekapitulasi
          </button>
        </div>
      </div>

      {/* 3 Pilar Utama APBDes + Surplus / Defisit */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Pendapatan Desa */}
        <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-xs">
                <Coins className="w-4 h-4 text-emerald-600" />
                1. Pendapatan Desa
              </span>
              <span className="text-[10px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-sm tabular-nums">
                <AnimatedCounter target={persenTotalPendapatan} suffix="%" duration={1000} />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono tracking-tight">
              {formatRupiah(totalPendapatan)}
            </div>
            <div className="text-[11px] text-emerald-700 font-mono mt-0.5">
              Target: {formatRupiah(totalAnggaranPendapatan)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-200/60">
            <AnimatedProgressBar percentage={persenTotalPendapatan} category="Pendapatan" />
            <div className="flex justify-between items-center text-[10px] text-emerald-800 mt-1.5 font-medium">
              <span>Sisa Target Penerimaan</span>
              <span className="font-mono font-semibold">
                {formatRupiah(Math.max(0, totalAnggaranPendapatan - totalPendapatan))}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Belanja Desa */}
        <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                <Wallet className="w-4 h-4 text-amber-600" />
                2. Belanja Desa (5 Bidang)
              </span>
              <span className="text-[10px] font-black text-white bg-amber-600 px-2 py-0.5 rounded-full shadow-sm tabular-nums">
                <AnimatedCounter target={persenTotalBelanja} suffix="%" duration={1000} />
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono tracking-tight">
              {formatRupiah(totalBelanja)}
            </div>
            <div className="text-[11px] text-amber-700 font-mono mt-0.5">
              Pagu Anggaran: {formatRupiah(totalAnggaranBelanja)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-200/60">
            <AnimatedProgressBar percentage={persenTotalBelanja} category="Belanja" />
            <div className="flex justify-between items-center text-[10px] text-amber-800 mt-1.5 font-medium">
              <span>Sisa Alokasi Belanja</span>
              <span className="font-mono font-semibold">
                {formatRupiah(Math.max(0, totalAnggaranBelanja - totalBelanja))}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Posisi Surplus / Defisit Berjalan */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs">
                <Scale className="w-4 h-4 text-blue-600" />
                3. Neraca Kas Berjalan
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${
                  surplusDefisitRealisasi >= 0
                    ? 'text-white bg-teal-600'
                    : 'text-white bg-blue-600'
                }`}
              >
                {surplusDefisitRealisasi >= 0 ? 'Surplus Kas' : 'Defisit Terencana'}
              </span>
            </div>
            <div
              className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                surplusDefisitRealisasi >= 0 ? 'text-teal-900' : 'text-blue-900'
              }`}
            >
              {surplusDefisitRealisasi >= 0 ? '+' : '-'} {formatRupiah(Math.abs(surplusDefisitRealisasi))}
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Selisih: Pendapatan - Belanja
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Pembiayaan Netto</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatRupiah(totalPembiayaan)}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Target Pembiayaan</span>
              <span className="font-mono">{formatRupiah(totalAnggaranPembiayaan)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sorotan Dana Desa (DDS APBN) jika ada */}
      {danaDesaPagu > 0 && (
        <div className="relative z-10 bg-emerald-500/10 border border-emerald-300/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                Sorotan: Dana Desa (DDS APBN) {apbdesYear}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Prioritas Nasional
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Alokasi dana transfer dari APBN untuk pembangunan infrastruktur fisik, ketahanan pangan, dan BLT warga.
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4 shrink-0">
            <div className="text-[10px] text-slate-500 font-mono">Pagu DDS: {formatRupiah(danaDesaPagu)}</div>
            <div className="text-sm font-extrabold text-emerald-800 font-mono">
              Realisasi: {formatRupiah(danaDesaRealisasi)}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Box */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setApbdesFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition ${
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
            className={`px-3 py-1.5 rounded-xl transition ${
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
            className={`px-3 py-1.5 rounded-xl transition ${
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
              className={`px-3 py-1.5 rounded-xl transition ${
                apbdesFilter === 'Pembiayaan'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Pembiayaan ({countPembiayaan})
            </button>
          )}
        </div>

        {/* Pencarian Pos Anggaran */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pos / kode rekening..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 transition"
          />
        </div>
      </div>

      {/* Konten APBDes Berdasarkan Mode Tampilan */}
      {viewMode === 'cards' ? (
        /* MODE KARTU */
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredApbdes.map((item) => {
            const pct = item.budget > 0 ? Math.min(100, Math.round((item.realization / item.budget) * 100)) : 0;
            const sisa = Math.max(0, item.budget - item.realization);
            return (
              <div
                key={item.id}
                className="bg-slate-50/90 hover:bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 space-y-3.5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-start text-xs gap-3">
                  <div>
                    <span className="text-slate-400 font-mono text-[10px] block">
                      {item.accountCode} • {item.category}
                    </span>
                    <h6 className="font-extrabold text-sm text-slate-800 mt-0.5">{item.accountName}</h6>
                  </div>
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-lg text-xs border tabular-nums shrink-0 ${
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

                {/* Bar Animasi Realisasi APBDes */}
                <div className="space-y-1">
                  <AnimatedProgressBar percentage={pct} category={item.category} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/70">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pagu Anggaran</span>
                    <strong className="text-slate-700 font-semibold font-mono">
                      {formatRupiah(item.budget)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Realisasi</span>
                    <strong
                      className={`font-semibold font-mono ${
                        item.category === 'Pendapatan'
                          ? 'text-emerald-700'
                          : item.category === 'Belanja'
                          ? 'text-amber-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {formatRupiah(item.realization)}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Sisa Alokasi</span>
                    <strong className="text-slate-600 font-mono">{formatRupiah(sisa)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE TABEL REKAPITULASI RESMI PERMENDAGRI */
        <div className="relative z-10 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/90 text-slate-800 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Kode</th>
                <th scope="col" className="px-4 py-3">Uraian Akun APBDes</th>
                <th scope="col" className="px-4 py-3 text-right">Pagu Anggaran</th>
                <th scope="col" className="px-4 py-3 text-right">Realisasi</th>
                <th scope="col" className="px-4 py-3 text-center">% Serap</th>
                <th scope="col" className="px-4 py-3 text-right">Sisa / Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredApbdes.map((item) => {
                const pct = item.budget > 0 ? Math.min(100, Math.round((item.realization / item.budget) * 100)) : 0;
                const sisa = Math.max(0, item.budget - item.realization);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {item.accountCode}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{item.accountName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {formatRupiah(item.budget)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap text-emerald-700">
                      {formatRupiah(item.realization)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-extrabold px-2 py-0.5 rounded text-[10px] border ${
                          pct >= 80
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : pct >= 50
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500 whitespace-nowrap">
                      {formatRupiah(sisa)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
              <tr>
                <td colSpan={2} className="px-4 py-3 uppercase tracking-wider">
                  Total Rekapitulasi Terpilih
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-800">
                  {formatRupiah(tableTotals.budget)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-700">
                  {formatRupiah(tableTotals.realization)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px]">
                    {tableTotals.pct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">
                  {formatRupiah(tableTotals.sisa)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Catatan Keterbukaan Informasi Publik & UU Desa */}
      <div className="relative z-10 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900">Jaminan Transparansi Publik & Anti-Korupsi</div>
          <p className="leading-relaxed text-[11px]">
            Seluruh data anggaran dipublikasikan secara langsung untuk menjamin transparansi pengelolaan Dana Desa
            dan APBDes sesuai amanat <strong>Undang-Undang Nomor 6 Tahun 2014 tentang Desa</strong> serta{' '}
            <strong>Permendagri Nomor 20 Tahun 2018 tentang Pengelolaan Keuangan Desa</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}
