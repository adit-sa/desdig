'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, ChevronRight, ChevronLeft, ShoppingBag, Store, Package } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import SafeImage from '@/components/SafeImage';

export default function LapakWidget({ tenant, order }: { tenant: ResolvedTenant; order: number }) {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [currentMerchantSlide, setCurrentMerchantSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/merchants?tenant=${encodeURIComponent(tenant.slug)}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.merchants) {
          const now = Date.now();
          const active = json.merchants
            .filter((m: any) => {
              if (!m.isActive) return false;
              if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
              return true;
            })
            .map((m: any) => {
              const activeProducts = (m.products || []).filter((p: any) => {
                if (!p.isAvailable) return false;
                if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return false;
                return true;
              });

              if (activeProducts.length > 1) {
                const shuffled = [...activeProducts];
                for (let i = shuffled.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                return { ...m, products: shuffled };
              }
              return { ...m, products: activeProducts };
            })
            .filter((m: any) => m.products.length > 0);

          // Fisher-Yates shuffle: tampilan acak/random agar semua UMKM mendapat eksposur berkeadilan
          for (let i = active.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [active[i], active[j]] = [active[j], active[i]];
          }
          setMerchants(active);
        }
      })
      .catch((e) => {
        if (e.name !== 'AbortError') console.error('Error fetching merchants for widget:', e);
      });
    return () => controller.abort();
  }, [tenant.slug]);

  // Auto-scroll lembut bergantian setiap 4.5 detik (jeda saat disentuh/di-hover mouse)
  useEffect(() => {
    if (merchants.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentMerchantSlide((prev) => (prev < merchants.length - 1 ? prev + 1 : 0));
    }, 4500);
    return () => clearInterval(timer);
  }, [merchants.length, isHovered]);

  if (merchants.length === 0) return null;

  return (
    <div
      style={{ order }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4"
    >
      {/* Header Modul */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
          <ShoppingBag className="w-5 h-5 text-emerald-600" />
          <span>Lapak & UMKM Desa</span>
        </div>

        {/* Tombol Slide jika lapak banyak */}
        {merchants.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 mr-1 font-mono">
              {currentMerchantSlide + 1}/{merchants.length}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentMerchantSlide((prev) => (prev > 0 ? prev - 1 : merchants.length - 1))
              }
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Lapak Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentMerchantSlide((prev) => (prev < merchants.length - 1 ? prev + 1 : 0))
              }
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              title="Lapak Selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Card Slide Pelapak */}
      {merchants[currentMerchantSlide] && (
        <div key={merchants[currentMerchantSlide].id || currentMerchantSlide} className="space-y-3.5 animate-in fade-in duration-300">
          {/* Header Toko Pelapak */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-emerald-700 font-extrabold text-sm relative">
              {merchants[currentMerchantSlide].avatarUrl ? (
                <SafeImage
                  src={merchants[currentMerchantSlide].avatarUrl}
                  alt={merchants[currentMerchantSlide].shopName}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <Store className="w-6 h-6 text-emerald-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h5 className="font-extrabold text-sm text-slate-900 truncate">
                {merchants[currentMerchantSlide].shopName}
              </h5>
              <p className="text-[11px] text-slate-500 truncate">
                Pemilik: <strong>{merchants[currentMerchantSlide].name}</strong>
              </p>
              {merchants[currentMerchantSlide].address && (
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-rose-500 flex-shrink-0" />
                  <span className="truncate">{merchants[currentMerchantSlide].address}</span>
                </p>
              )}
            </div>
          </div>

          {/* List Produk Milik Pelapak Ini */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Produk ({merchants[currentMerchantSlide].products?.length || 0} item)</span>
              <span className="text-emerald-700 font-extrabold">Siap Pesan WA</span>
            </div>

            {merchants[currentMerchantSlide].products?.slice(0, 2).map((prod: any) => (
              <div
                key={prod.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center relative">
                    {prod.imageUrl ? (
                      <SafeImage
                        src={prod.imageUrl}
                        alt={prod.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-800 truncate">{prod.name}</p>
                    <p className="text-[11px] font-extrabold text-emerald-600">
                      Rp {prod.price.toLocaleString('id-ID')}{' '}
                      <span className="font-normal text-slate-400 text-[10px]">/{prod.unit}</span>
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${merchants[currentMerchantSlide].phone.replace(/^0/, '62').replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Halo ${merchants[currentMerchantSlide].shopName}, saya tertarik membeli "${prod.name}" seharga Rp ${prod.price.toLocaleString('id-ID')}/${prod.unit} yang ada di website Desa.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 flex-shrink-0 shadow-sm"
                >
                  <span>Beli</span>
                </a>
              </div>
            ))}

            {merchants[currentMerchantSlide].products?.length > 2 && (
              <p className="text-[10px] text-center text-slate-400 italic">
                +{merchants[currentMerchantSlide].products.length - 2} produk lainnya dari lapak ini
              </p>
            )}
          </div>

          {/* Indikator Titik (Dots) Slide */}
          {merchants.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 pt-1">
              {merchants.map((_: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentMerchantSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentMerchantSlide ? 'w-5 bg-emerald-600' : 'w-1.5 bg-slate-200'
                  }`}
                  title={`Lapak ke-${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Tombol Lihat Semua Lapak */}
          <div className="pt-2 border-t border-slate-100">
            <Link
              href={`/lapak?tenant=${tenant.slug}`}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 px-3 rounded-xl transition"
            >
              <span>Kunjungi Pasar Desa ({merchants.length} Lapak)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
