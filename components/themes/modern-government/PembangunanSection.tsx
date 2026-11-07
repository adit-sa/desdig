'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight, HardHat } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { formatProjectTitle } from '@/lib/formatters';
import { ThemeData, Setter, SectionOrderFn, formatRupiah, isProjectDone } from './shared';
import SafeImage from '@/components/SafeImage';

export default function PembangunanSection({
  tenant,
  data,
  getSectionOrder,
  setSelectedProjectModal,
  setActivePhotoDoc,
}: {
  tenant: ResolvedTenant;
  data: ThemeData;
  getSectionOrder: SectionOrderFn;
  setSelectedProjectModal: Setter<any | null>;
  setActivePhotoDoc: Setter<any | null>;
}) {
  const [pembangunanFilter, setPembangunanFilter] = useState<'ALL' | 'Selesai' | 'Proses'>('ALL');

  const projects = useMemo(() => data.pembangunan || [], [data.pembangunan]);
  const countPembangunanSelesai = projects.filter(isProjectDone).length;
  const countPembangunanProses = Math.max(0, projects.length - countPembangunanSelesai);

  const defaultProjectPhoto = tenant.heroImageUrl || tenant.logoUrl || '/images/balai_desa_gedung.jpg';

  const filteredPembangunan = useMemo(() => {
    if (pembangunanFilter === 'ALL') return projects;
    if (pembangunanFilter === 'Selesai') return projects.filter(isProjectDone);
    return projects.filter((p: any) => !isProjectDone(p));
  }, [projects, pembangunanFilter]);
  return (
    <section
      id="pembangunan"
      style={{ order: getSectionOrder('pembangunan') }}
      className="space-y-6 scroll-reveal"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold text-emerald-700 tracking-wider uppercase flex items-center gap-1.5">
            <HardHat className="w-4 h-4 text-emerald-600" />
            Transparansi Pembangunan Fisik
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Proyek & Realisasi Pembangunan Desa
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantauan berkala pembangunan sarana prasarana dan infrastruktur di Desa {tenant.namaDesa}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setPembangunanFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                pembangunanFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({(data.pembangunan || []).length})
            </button>
            <button
              type="button"
              onClick={() => setPembangunanFilter('Selesai')}
              className={`px-3 py-1.5 rounded-lg transition ${
                pembangunanFilter === 'Selesai'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selesai ({countPembangunanSelesai})
            </button>
            {countPembangunanProses > 0 && (
              <button
                type="button"
                onClick={() => setPembangunanFilter('Proses')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  pembangunanFilter === 'Proses'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Proses ({countPembangunanProses})
              </button>
            )}
          </div>

          <Link
            href={`/pembangunan?tenant=${tenant.slug}`}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-4 py-2 rounded-xl transition shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            <span>Seluruh Proyek</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {(!filteredPembangunan || filteredPembangunan.length === 0) ? (
        <div className="bg-white rounded-xl p-8 text-center border border-dashed border-slate-300 text-slate-400 text-xs">
          Tidak ada data proyek pembangunan untuk kategori yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredPembangunan.map((proj: any) => (
            <div
              key={proj.id}
              onClick={() => {
                setSelectedProjectModal(proj);
                setActivePhotoDoc(null);
              }}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer animate-in fade-in-50 duration-200"
            >
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <SafeImage
                  src={proj.foto}
                  fallbackSrc={defaultProjectPhoto}
                  alt={formatProjectTitle(proj.judul)}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow">
                    {proj.tahunAnggaran || '2026'}
                  </span>
                  <span className="bg-slate-900/80 backdrop-blur-md text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                    {proj.status || 'Selesai'}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-sm text-slate-800 group-hover:text-emerald-700 transition line-clamp-2 leading-snug">
                    {formatProjectTitle(proj.judul)}
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{proj.lokasi || `Desa ${tenant.namaDesa}`}</span>
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">Progres Fisik</span>
                    <span className="font-extrabold text-emerald-700">{proj.progressPersen || 100}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${proj.progressPersen || 100}%` }}
                    />
                  </div>
                  <div className="text-[11px] pt-0.5 flex justify-between items-center">
                    <span className="text-slate-400 text-[10px]">Anggaran:</span>
                    <span className="font-bold text-slate-900 text-xs">
                      {formatRupiah(proj.anggaran || 0)}
                    </span>
                  </div>
                  <div className="pt-1.5 flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800 border-t border-slate-50">
                    <span>Detail Proyek</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
