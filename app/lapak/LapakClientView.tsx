'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import TopBar from '@/components/themes/modern-government/TopBar';
import SiteHeader from '@/components/themes/modern-government/SiteHeader';
import SiteFooter from '@/components/themes/modern-government/SiteFooter';
import { buildTenantHref } from '@/components/themes/modern-government/shared';
import {
  ShoppingBag,
  Store,
  Phone,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Package,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  X,
  MessageCircle,
  Tag,
  Star,
  Sparkles,
  Loader2,
} from 'lucide-react';

export interface ProductItem {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
}

export interface MerchantItem {
  id: string;
  name: string;
  shopName: string;
  slug: string;
  phone: string;
  address: string | null;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  createdAt: string;
  products: ProductItem[];
}

const CATEGORIES = [
  'Semua Kategori',
  'Makanan & Minuman',
  'Pertanian & Perkebunan',
  'Kerajinan Tangan',
  'Fashion & Tekstil',
  'Jasa & Lainnya',
];

interface LapakClientViewProps {
  tenant: ResolvedTenant;
  menus?: any[];
}

export default function LapakClientView({ tenant, menus }: LapakClientViewProps) {
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('ALL');

  // Selected Merchant Detail Modal
  const [activeMerchantModal, setActiveMerchantModal] = useState<MerchantItem | null>(null);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/merchants?tenant=${tenant.slug}`);
      const data = await res.json();
      if (data.merchants) {
        const now = Date.now();
        const activeMerchants = data.merchants
          .filter((m: any) => {
            if (!m.isActive) return false;
            if (m.expiresAt && new Date(m.expiresAt).getTime() < now) return false;
            return true;
          })
          .map((m: any) => ({
            ...m,
            products: (m.products || []).filter((p: any) => {
              if (!p.isAvailable) return false;
              if (p.expiresAt && new Date(p.expiresAt).getTime() < now) return false;
              return true;
            }),
          }));

        for (let i = activeMerchants.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [activeMerchants[i], activeMerchants[j]] = [activeMerchants[j], activeMerchants[i]];
        }
        setMerchants(activeMerchants);
      }
    } catch (e) {
      console.error('Failed to fetch merchants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, [tenant.slug]);

  // Flattened active products
  const allProducts = React.useMemo(() => {
    const list: (ProductItem & { merchant: MerchantItem })[] = [];
    merchants.forEach((m) => {
      if (!m.isActive) return;
      m.products.forEach((p) => {
        list.push({
          ...p,
          merchant: m,
        });
      });
    });
    return list;
  }, [merchants]);

  // Filtered Products
  const filteredProducts = React.useMemo(() => {
    return allProducts.filter((p) => {
      if (selectedMerchantId !== 'ALL' && p.merchantId !== selectedMerchantId) return false;
      if (selectedCategory !== 'Semua Kategori' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.merchant.shopName.toLowerCase().includes(q) ||
          p.merchant.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allProducts, selectedMerchantId, selectedCategory, searchQuery]);

  // WhatsApp order link generator
  const getWhatsAppOrderLink = (product: ProductItem, merchant: MerchantItem) => {
    const phone = merchant.phone.replace(/^0/, '62').replace(/[^\d]/g, '');
    const text = encodeURIComponent(
      `Halo ${merchant.shopName} (${merchant.name}), saya melihat produk "${product.name}" (Rp ${product.price.toLocaleString('id-ID')}/${product.unit}) di website resmi Desa ${tenant.namaDesa}. Apakah stoknya masih tersedia?`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const layoutMode = (tenant.themeConfig?.settings?.layout_mode as 'fixed' | 'fluid') || 'fixed';

  return (
    <div
      data-theme="modern-government"
      data-layout={layoutMode}
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white ${
        layoutMode === 'fluid' ? 'layout-fluid' : 'layout-fixed'
      }`}
    >
      <div>
        {/* 1. Official Government Top Bar Konsisten dengan Beranda */}
        <TopBar tenant={tenant} />

        {/* 2. Main Navigation Header Konsisten dengan Beranda */}
        <SiteHeader tenant={tenant} menus={menus} />

        {/* 3. Hero Section */}
        <section className="bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            {/* Breadcrumb & Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                <Link href={buildTenantHref('/', tenant.slug)} className="hover:underline">
                  Beranda
                </Link>
                <span>/</span>
                <span className="text-white">Lapak Desa & UMKM</span>
              </div>

              <BackButton
                fallbackUrl={buildTenantHref('/', tenant.slug)}
                label="Kembali ke Beranda"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 px-3.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
                iconClassName="w-3.5 h-3.5 text-emerald-400"
              />
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Pemberdayaan Ekonomi & UMKM Warga</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Lapak Desa & Produk Unggulan Warga
              </h1>

              <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl mx-auto leading-relaxed">
                Dukung langsung usaha tetangga dan pedagang lokal Desa{' '}
                <strong className="text-amber-300">{tenant.namaDesa}</strong>. Belanja aneka makanan olahan, sayur segar, hasil kebun, dan kerajinan tangan langsung via WhatsApp!
              </p>

              {/* Quick Stats Ticker */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-bold">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <Store className="w-4 h-4 text-amber-300" />
                  <span>{merchants.length} Pelapak Terdaftar</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <Package className="w-4 h-4 text-emerald-300" />
                  <span>{allProducts.length} Produk Siap Pesan</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Order Langsung via WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Filter & Search Controls */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari produk desa, jajanan, kerajinan, nama toko..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Toko/Pelapak */}
              <div className="min-w-[220px]">
                <select
                  value={selectedMerchantId}
                  onChange={(e) => setSelectedMerchantId(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-200"
                >
                  <option value="ALL">Semua Pelapak Warga ({merchants.length})</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.shopName} ({m.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
              <span className="text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                <Tag className="w-3.5 h-3.5" />
                Kategori:
              </span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Main Catalog Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs">Menyiapkan etalase produk warga...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                Tidak ada produk yang cocok
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Coba gunakan kata kunci lain atau pilih kategori Semua Kategori untuk melihat seluruh produk warga.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Semua Kategori');
                  setSelectedMerchantId('ALL');
                }}
                className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
              >
                Reset Filter Pencarian
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Image Box */}
                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                          <Package className="w-10 h-10 mb-1" />
                          <span className="text-[10px]">Foto Produk Warga</span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-extrabold uppercase tracking-wide bg-slate-900/80 backdrop-blur-md text-emerald-300 px-2.5 py-0.5 rounded-lg border border-white/10">
                        {p.category}
                      </span>
                    </div>

                    {/* Product Info */}
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 transition">
                        {p.name}
                      </h4>
                      {p.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-3">
                    {/* Price & Unit */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Harga</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                          Rp {p.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium"> / {p.unit}</span>
                      </div>
                    </div>

                    {/* Merchant Pill / Button */}
                    <button
                      onClick={() => setActiveMerchantModal(p.merchant)}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 transition text-left group/m"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                          {p.merchant.shopName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block truncate group-hover/m:text-emerald-700">
                            {p.merchant.shopName}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            {p.merchant.name}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/m:text-emerald-600 flex-shrink-0" />
                    </button>

                    {/* Order via WA button */}
                    <a
                      href={getWhatsAppOrderLink(p, p.merchant)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-emerald-700/20"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Beli via WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Merchant Detail Modal */}
      {activeMerchantModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveMerchantModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-800 to-teal-800 text-white relative">
              <button
                onClick={() => setActiveMerchantModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-800 flex items-center justify-center font-black text-lg shadow-md">
                  {activeMerchantModal.shopName.charAt(0)}
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-200 block">
                    Pelapak Resmi Desa
                  </span>
                  <h3 className="text-xl font-black">{activeMerchantModal.shopName}</h3>
                  <p className="text-xs text-emerald-100 font-medium">{activeMerchantModal.name}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {activeMerchantModal.description && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {activeMerchantModal.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>WhatsApp: {activeMerchantModal.phone}</span>
                </div>
                {activeMerchantModal.address && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Alamat: {activeMerchantModal.address}</span>
                  </div>
                )}
              </div>

              {/* Products by this merchant */}
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Produk dari Toko Ini ({activeMerchantModal.products?.length || 0})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {activeMerchantModal.products?.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-black">
                          Rp {prod.price.toLocaleString('id-ID')} / {prod.unit}
                        </span>
                      </div>
                      <a
                        href={getWhatsAppOrderLink(prod, activeMerchantModal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]"
                      >
                        Pesan
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveMerchantModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Footer Konsisten dengan Beranda */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
