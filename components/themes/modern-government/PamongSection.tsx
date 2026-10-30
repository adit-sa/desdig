'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, LayoutGrid, X, Search } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { ThemeData, Setter, SectionOrderFn, getTimezoneByProvince } from './shared';

export default function PamongSection({
  tenant,
  data,
  getSectionOrder,
  setSelectedOfficialModal,
}: {
  tenant: ResolvedTenant;
  data: ThemeData;
  getSectionOrder: SectionOrderFn;
  setSelectedOfficialModal: Setter<any | null>;
}) {
  const timezone = getTimezoneByProvince(tenant.provinsi);
  const [officialCategory, setOfficialCategory] = useState<'all' | 'pemerintah' | 'dusun' | 'bpd'>('pemerintah');
  const [officialSearch, setOfficialSearch] = useState('');
  const [officialViewMode, setOfficialViewMode] = useState<'slide' | 'grid'>('slide');
  const officialSliderRef = useRef<HTMLDivElement>(null);
  const [isSliderHovered, setIsSliderHovered] = useState(false);
  const [autoSlideEnabled, setAutoSlideEnabled] = useState(true);

  // Auto-slide lembut bergantian jika jumlah aparatur lebih lebar dari layar
  useEffect(() => {
    if (officialViewMode !== 'slide' || !autoSlideEnabled || isSliderHovered) return;

    const interval = setInterval(() => {
      const el = officialSliderRef.current;
      if (!el) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 15) return; // Tidak melebihi layar

      if (el.scrollLeft >= maxScroll - 25) {
        // Jika sudah di ujung kanan, kembali bergantian ke awal secara lembut
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        // Geser ke kartu berikutnya secara lembut (280px + 16px gap = 296px)
        el.scrollBy({ left: 296, behavior: 'smooth' });
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [officialViewMode, autoSlideEnabled, isSliderHovered]);

  // Kartu yang baru muncul setelah ganti mode/filter langsung ditampilkan (observer global hanya memindai saat mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.querySelectorAll('#pamong .scroll-reveal').forEach((el) => el.classList.add('is-visible'));
  }, [officialViewMode, officialCategory, officialSearch]);

  const scrollOfficialSlider = (direction: 'left' | 'right') => {
    officialSliderRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  // Klasifikasi & Pencarian Aparatur
  const filteredOfficials = useMemo(() => {
    let list = data.officials;

    if (officialCategory === 'pemerintah') {
      list = list.filter((o) => {
        const p = o.position.toLowerCase();
        return !p.includes('dusun') && !p.includes('bpd');
      });
    } else if (officialCategory === 'dusun') {
      list = list.filter((o) => o.position.toLowerCase().includes('dusun'));
    } else if (officialCategory === 'bpd') {
      list = list.filter((o) => o.position.toLowerCase().includes('bpd'));
    }

    if (officialSearch.trim()) {
      const q = officialSearch.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          (o.nip && o.nip.toLowerCase().includes(q))
      );
    }

    return list;
  }, [data.officials, officialCategory, officialSearch]);
  return (
    <section id="pamong" style={{ order: getSectionOrder('pamong') }} className="space-y-6 scroll-reveal">
      {/* Header & Title */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-black text-emerald-700 tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Aparatur Desa
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Pemerintah Desa
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aparatur Pemerintah Desa yang bertugas melayani masyarakat di Desa {tenant.namaDesa}.
          </p>
        </div>

        {/* Action Buttons & Slide Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Geser Slide Kiri & Kanan & Toggle Auto-Slide */}
          {officialViewMode === 'slide' && (
            <div className="flex items-center gap-1.5 mr-1">
              <button
                onClick={() => scrollOfficialSlider('left')}
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition shadow-sm"
                title="Geser Aparatur ke Kiri"
                aria-label="Geser Aparatur ke Kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollOfficialSlider('right')}
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center transition shadow-sm"
                title="Geser Aparatur ke Kanan"
                aria-label="Geser Aparatur ke Kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setAutoSlideEnabled(!autoSlideEnabled)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow-sm ${
                  autoSlideEnabled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title={autoSlideEnabled ? 'Slide otomatis bergantian aktif (Otomatis jeda saat disentuh/hover). Klik untuk jeda.' : 'Klik untuk mengaktifkan slide bergantian otomatis.'}
              >
                <span className={`w-2 h-2 rounded-full ${autoSlideEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className="hidden sm:inline">{autoSlideEnabled ? 'Auto-Slide' : 'Manual'}</span>
              </button>
            </div>
          )}

          {/* Toggle 1 Baris (Slide) vs Grid */}
          <button
            onClick={() => setOfficialViewMode(officialViewMode === 'slide' ? 'grid' : 'slide')}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-lg transition"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            <span>{officialViewMode === 'slide' ? 'Buka Grid' : '1 Baris (Slide)'}</span>
          </button>
        </div>
      </div>

      {/* Categorized Filter Tabs & Search Box */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          <button
            onClick={() => setOfficialCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              officialCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Semua Aparatur ({data.officials.length})
          </button>
          <button
            onClick={() => setOfficialCategory('pemerintah')}
            className={`px-3 py-1.5 rounded-lg transition ${
              officialCategory === 'pemerintah'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Pemerintah Desa
          </button>
          <button
            onClick={() => setOfficialCategory('dusun')}
            className={`px-3 py-1.5 rounded-lg transition ${
              officialCategory === 'dusun'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Kepala Dusun (6)
          </button>
          <button
            onClick={() => setOfficialCategory('bpd')}
            className={`px-3 py-1.5 rounded-lg transition ${
              officialCategory === 'bpd'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            BPD
          </button>
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau jabatan..."
            value={officialSearch}
            onChange={(e) => setOfficialSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition"
          />
          {officialSearch && (
            <button
              type="button"
              onClick={() => setOfficialSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full transition"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Kontainer Kartu Aparatur: Mode 1 Baris (Slide) atau Mode Grid */}
      {officialViewMode === 'slide' ? (
        <div className="relative">
          {/* Horizontal Scroll / Slide Container (1 Baris Saja dengan Auto-slide Lembut) */}
          <div
            ref={officialSliderRef}
            onMouseEnter={() => setIsSliderHovered(true)}
            onMouseLeave={() => setIsSliderHovered(false)}
            onTouchStart={() => setIsSliderHovered(true)}
            onTouchEnd={() => setIsSliderHovered(false)}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x pb-4 pt-1 scrollbar-none"
          >
            {filteredOfficials.map((ofc) => {
              const att = ofc.attendances && ofc.attendances[0];

              return (
                <div
                  key={ofc.id}
                  onClick={() => setSelectedOfficialModal(ofc)}
                  className="w-[260px] sm:w-[280px] flex-shrink-0 snap-start bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  {/* Foto Besar, Jelas & Simpel */}
                  <div className="h-60 sm:h-64 relative w-full bg-slate-900 overflow-hidden">
                    {ofc.photoUrl ? (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={ofc.photoUrl}
                        alt={ofc.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/kades_portrait.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-800 via-teal-900 to-slate-900 flex items-center justify-center text-white text-4xl font-black">
                        {ofc.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                    {/* Badge Status Kehadiran di pojok bawah foto */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md shadow ${
                          att?.status === 'HADIR'
                            ? 'bg-emerald-600/95 text-white'
                            : att?.status === 'DINAS_LUAR'
                            ? 'bg-blue-600/95 text-white'
                            : att?.status === 'IZIN' || att?.status === 'SAKIT'
                            ? 'bg-purple-600/95 text-white'
                            : att?.status === 'TERLAMBAT'
                            ? 'bg-amber-600/95 text-white'
                            : 'bg-slate-800/90 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            att?.status === 'HADIR' ? 'bg-white animate-pulse' : 'bg-white'
                          }`}
                        />
                        {att?.status === 'HADIR'
                          ? 'Hadir di Balai'
                          : att?.status === 'DINAS_LUAR'
                          ? 'Dinas Luar'
                          : att?.status === 'IZIN'
                          ? 'Izin Resmi'
                          : att?.status === 'SAKIT'
                          ? 'Sakit'
                          : att?.status === 'TERLAMBAT'
                          ? 'Terlambat'
                          : 'Belum Absen'}
                      </span>

                      {att?.checkInTime && (
                        <span className="text-[10px] font-mono font-medium text-slate-200 bg-slate-950/70 px-1.5 py-0.5 rounded-md">
                          {new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} {timezone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informasi Nama & Jabatan */}
                  <div className="p-4 flex-1 flex flex-col justify-center space-y-1">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                      {ofc.name}
                    </h4>
                    <p className="text-xs text-emerald-700 font-bold line-clamp-1">
                      {ofc.position}
                    </p>
                    {ofc.nip && (
                      <p className="text-[10px] font-mono text-slate-400">
                        NIP. {ofc.nip}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Bar Slide: Info & Tombol Buka Grid */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <span className="text-slate-400">
              Menampilkan <strong className="text-slate-700">{filteredOfficials.length}</strong> Aparatur • Geser ke samping atau gunakan tombol panah
            </span>
            <button
              onClick={() => setOfficialViewMode('grid')}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-sm transition"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tampilkan Seluruh Grid ({filteredOfficials.length})</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Full Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredOfficials.map((ofc) => {
              const att = ofc.attendances && ofc.attendances[0];

              return (
                <div
                  key={ofc.id}
                  onClick={() => setSelectedOfficialModal(ofc)}
                  className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  {/* Foto Besar, Jelas & Simpel */}
                  <div className="h-60 sm:h-64 relative w-full bg-slate-900 overflow-hidden">
                    {ofc.photoUrl ? (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={ofc.photoUrl}
                        alt={ofc.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/kades_portrait.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-emerald-800 via-teal-900 to-slate-900 flex items-center justify-center text-white text-4xl font-black">
                        {ofc.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />

                    {/* Badge Status Kehadiran di pojok bawah foto */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md shadow ${
                          att?.status === 'HADIR'
                            ? 'bg-emerald-600/95 text-white'
                            : att?.status === 'DINAS_LUAR'
                            ? 'bg-blue-600/95 text-white'
                            : att?.status === 'IZIN' || att?.status === 'SAKIT'
                            ? 'bg-purple-600/95 text-white'
                            : att?.status === 'TERLAMBAT'
                            ? 'bg-amber-600/95 text-white'
                            : 'bg-slate-800/90 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            att?.status === 'HADIR' ? 'bg-white animate-pulse' : 'bg-white'
                          }`}
                        />
                        {att?.status === 'HADIR'
                          ? 'Hadir di Balai'
                          : att?.status === 'DINAS_LUAR'
                          ? 'Dinas Luar'
                          : att?.status === 'IZIN'
                          ? 'Izin Resmi'
                          : att?.status === 'SAKIT'
                          ? 'Sakit'
                          : att?.status === 'TERLAMBAT'
                          ? 'Terlambat'
                          : 'Belum Absen'}
                      </span>

                      {att?.checkInTime && (
                        <span className="text-[10px] font-mono font-medium text-slate-200 bg-slate-950/70 px-1.5 py-0.5 rounded-md">
                          {new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} {timezone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informasi Nama & Jabatan */}
                  <div className="p-4 flex-1 flex flex-col justify-center space-y-1">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition">
                      {ofc.name}
                    </h4>
                    <p className="text-xs text-emerald-700 font-bold line-clamp-1">
                      {ofc.position}
                    </p>
                    {ofc.nip && (
                      <p className="text-[10px] font-mono text-slate-400">
                        NIP. {ofc.nip}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tombol Ciutkan kembali ke 1 Baris */}
          <div className="text-center pt-2">
            <button
              onClick={() => setOfficialViewMode('slide')}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-5 py-2.5 rounded-lg border border-slate-200 shadow-sm transition hover:shadow"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ciutkan Kembali ke 1 Baris (Mode Slide)</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty Search Result */}
      {filteredOfficials.length === 0 && (
        <div className="p-10 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
          Tidak ditemukan aparatur yang cocok dengan kata kunci &ldquo;{officialSearch}&rdquo;.
        </div>
      )}
    </section>
  );
}
