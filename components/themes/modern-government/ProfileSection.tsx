'use client';

import React from 'react';
import { Award } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';

export default function ProfileSection({ tenant, themeConfig }: { tenant: ResolvedTenant; themeConfig: any }) {
  return (
    <section id="profil" style={{ order: -1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
      <div className="scroll-reveal md:col-span-1 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-xl p-8 text-white shadow-lg flex flex-col justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-emerald-300 uppercase block">
            Visi Desa {themeConfig.visiPeriode || '2026-2031'}
          </span>
          <h3 className="text-2xl font-black mt-2 mb-4 leading-snug">Visi Pembangunan</h3>
          <p className="text-emerald-100/90 text-sm leading-relaxed italic">
            &ldquo;{tenant.visi || 'Mewujudkan Desa Mandiri, Berbudaya, dan Sejahtera Berbasis Partisipasi Masyarakat.'}&rdquo;
          </p>
        </div>
        <div className="pt-6 mt-6 border-t border-emerald-700/50 flex items-center gap-2 text-xs text-emerald-300">
          <Award className="w-4 h-4" />
          <span>Rencana Kerja Pemerintah Desa (RKPDes)</span>
        </div>
      </div>

      <div className="scroll-reveal stagger-1 md:col-span-2 bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <span className="text-xs font-extrabold tracking-widest text-emerald-700 uppercase block">
            Agenda Strategis
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-2 mb-4">Misi Kerja Pemerintah Desa</h3>
          <div className="space-y-3.5">
            {tenant.misi && tenant.misi.length > 0 ? (
              tenant.misi.map((m, idx) => (
                <div key={idx} className="flex items-start gap-3.5 text-sm text-slate-600">
                  <span className="w-6 h-6 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center flex-shrink-0 text-xs mt-0.5 border border-emerald-200">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{m}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Misi kerja desa belum dikonfigurasi.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
