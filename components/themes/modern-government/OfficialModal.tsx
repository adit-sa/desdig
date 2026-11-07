'use client';

import React from 'react';
import { Clock, X } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { Setter, getTimezoneByProvince } from './shared';
import SafeImage from '@/components/SafeImage';

export default function OfficialModal({
  tenant,
  selectedOfficialModal,
  setSelectedOfficialModal,
}: {
  tenant: ResolvedTenant;
  selectedOfficialModal: any;
  setSelectedOfficialModal: Setter<any | null>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => setSelectedOfficialModal(null)}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative text-slate-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={() => setSelectedOfficialModal(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-black tracking-widest uppercase text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-2">
            Dossier Aparatur Desa
          </span>
          <h3 className="text-xl font-black leading-snug">{selectedOfficialModal.name}</h3>
          <p className="text-xs text-emerald-100/90 mt-0.5">{selectedOfficialModal.position}</p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            {selectedOfficialModal.photoUrl ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-emerald-600/30 flex-shrink-0">
                <SafeImage
                  src={selectedOfficialModal.photoUrl}
                  fallbackSrc="/images/kades_portrait.jpg"
                  alt={selectedOfficialModal.name}
                  fill
                  sizes="80px"
                  className="object-cover object-top"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-700 to-slate-800 text-white font-black text-2xl flex items-center justify-center shadow-md flex-shrink-0">
                {selectedOfficialModal.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-extrabold text-emerald-800">{selectedOfficialModal.position}</p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                {selectedOfficialModal.nip ? `NIP. ${selectedOfficialModal.nip}` : 'Aparatur Aktif Terdaftar'}
              </p>
              <p className="text-[11px] text-slate-500">Pemerintah Desa {tenant.namaDesa}</p>
            </div>
          </div>

          {/* Status Absensi Hari Ini Box */}
          {(() => {
            const att = selectedOfficialModal.attendances && selectedOfficialModal.attendances[0];
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Status Absensi Hari Ini
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {att?.date ? new Date(att.date).toLocaleDateString('id-ID', { dateStyle: 'full' }) : 'Hari Ini'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <div>
                    {att?.status === 'HADIR' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Hadir di Balai Desa
                      </span>
                    )}
                    {att?.status === 'DINAS_LUAR' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Tugas Dinas Luar
                      </span>
                    )}
                    {(att?.status === 'IZIN' || att?.status === 'SAKIT') && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full border border-purple-300">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        {att.status === 'IZIN' ? 'Izin Resmi' : 'Sakit'}
                      </span>
                    )}
                    {att?.status === 'TERLAMBAT' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Hadir (Terlambat)
                      </span>
                    )}
                    {(!att || att?.status === 'ALFA') && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
                        Belum Melakukan Absensi
                      </span>
                    )}
                  </div>

                  {att?.checkInTime && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Jam Masuk:</span>
                      <strong className="text-xs text-slate-800 font-mono">
                        {new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} {getTimezoneByProvince(tenant.provinsi)}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center justify-end pt-2 border-t border-slate-100">
            <button
              onClick={() => setSelectedOfficialModal(null)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
