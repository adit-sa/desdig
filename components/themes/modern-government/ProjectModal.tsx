'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight, Camera, X } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { formatProjectTitle } from '@/lib/formatters';
import { Setter, formatRupiah } from './shared';
import SafeImage from '@/components/SafeImage';

export default function ProjectModal({
  tenant,
  selectedProjectModal,
  setSelectedProjectModal,
  activePhotoDoc,
  setActivePhotoDoc,
}: {
  tenant: ResolvedTenant;
  selectedProjectModal: any;
  setSelectedProjectModal: Setter<any | null>;
  activePhotoDoc: any;
  setActivePhotoDoc: Setter<any | null>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => {
        setSelectedProjectModal(null);
        setActivePhotoDoc(null);
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative text-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div className="space-y-1 pr-4">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Detail Proyek Fisik Desa
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {formatProjectTitle(selectedProjectModal.judul)}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{selectedProjectModal.lokasi || `Desa ${tenant.namaDesa}`}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedProjectModal(null);
              setActivePhotoDoc(null);
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Konten Scrollable */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Foto Utama / Foto Dokumentasi Tahapan yang Dipilih */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shadow-sm">
            <SafeImage
              src={
                activePhotoDoc?.gambar ||
                selectedProjectModal.foto
              }
              fallbackSrc="/images/desa_irigasi_pertanian.jpg"
              alt={selectedProjectModal.judul}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent pointer-events-none" />

            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow">
                Tahun {selectedProjectModal.tahunAnggaran || '2026'}
              </span>
              <span className="bg-slate-900/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-md border border-emerald-500/30">
                {selectedProjectModal.status || 'Selesai'}
              </span>
              {selectedProjectModal.sifatProyek && (
                <span className="bg-blue-900/80 backdrop-blur-md text-blue-200 text-[11px] font-bold px-2.5 py-1 rounded-md border border-blue-500/30">
                  {selectedProjectModal.sifatProyek}
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
              {activePhotoDoc ? (
                <div className="bg-slate-950/85 text-white px-3 py-1 rounded-md text-xs font-bold backdrop-blur-md border border-white/20">
                  Dokumentasi {activePhotoDoc.persentase}: {activePhotoDoc.keterangan || 'Kondisi Lapangan'}
                </div>
              ) : (
                <div className="text-xs font-medium text-slate-300">
                  Foto Utama Pembangunan
                </div>
              )}
              <span className="text-xs font-mono font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/20">
                Progres {selectedProjectModal.progressPersen || 100}%
              </span>
            </div>
          </div>

          {/* Slider Thumbnail Tahapan Dokumentasi Progres */}
          {selectedProjectModal.documentations && selectedProjectModal.documentations.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                Pilih Tahapan Dokumentasi Progres:
              </h4>
              <div className="grid grid-cols-4 gap-2.5">
                {selectedProjectModal.documentations.map((d: any) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActivePhotoDoc(d)}
                    className={`p-1.5 rounded-lg border text-left transition flex flex-col items-center gap-1 ${
                      activePhotoDoc?.id === d.id
                        ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-full h-16 rounded overflow-hidden bg-slate-200 relative">
                      <SafeImage
                        src={d.gambar}
                        fallbackSrc="/images/desa_irigasi_pertanian.jpg"
                        alt={d.persentase}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800">{d.persentase}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-semibold">Realisasi Fisik Lapangan</span>
              <span className="font-extrabold text-emerald-700">
                {selectedProjectModal.progressPersen || 100}% Selesai
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${selectedProjectModal.progressPersen || 100}%` }}
              />
            </div>
          </div>

          {/* Data Rincian Teknis & Anggaran */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Anggaran Proyek</span>
              <strong className="text-emerald-700 font-mono font-bold text-sm mt-0.5 block">
                {formatRupiah(selectedProjectModal.anggaran || 0)}
              </strong>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Sumber Pendanaan</span>
              <strong className="text-slate-800 font-bold text-xs mt-0.5 block">
                {selectedProjectModal.sumberDana || 'Dana Desa (APBDes)'}
              </strong>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Volume Fisik</span>
              <strong className="text-slate-800 font-bold text-xs mt-0.5 block">
                {selectedProjectModal.volume || '-'}
              </strong>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pelaksana Kegiatan</span>
              <strong className="text-slate-800 font-bold text-xs mt-0.5 block">
                {selectedProjectModal.pelaksanaKegiatan || '-'}
              </strong>
            </div>

            {selectedProjectModal.waktu && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Pelaksanaan</span>
                <strong className="text-slate-800 font-bold text-xs mt-0.5 block">
                  {selectedProjectModal.waktu}
                </strong>
              </div>
            )}

            {selectedProjectModal.sifatProyek && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Sifat Proyek</span>
                <strong className="text-slate-800 font-bold text-xs mt-0.5 block">
                  {selectedProjectModal.sifatProyek}
                </strong>
              </div>
            )}
          </div>

          {/* Deskripsi & Keterangan Proyek */}
          {selectedProjectModal.keterangan && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-1.5">Deskripsi & Keterangan Proyek:</h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {selectedProjectModal.keterangan}
              </p>
            </div>
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Link
            href={`/pembangunan?tenant=${tenant.slug}`}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Buka Seluruh Halaman Pembangunan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSelectedProjectModal(null);
              setActivePhotoDoc(null);
            }}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
