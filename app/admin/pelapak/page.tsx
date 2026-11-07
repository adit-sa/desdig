'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  ExternalLink,
  Phone,
  MapPin,
  Package,
  Store,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Loader2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import ResidentPicker from '@/components/admin/ResidentPicker';
import SafeImage from '@/components/SafeImage';

interface ProductItem {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

interface MerchantItem {
  id: string;
  residentId?: string | null;
  resident?: {
    id: string;
    nik: string;
    nama: string;
    dusun?: string | null;
  } | null;
  name: string;
  shopName: string;
  slug: string;
  phone: string;
  address: string | null;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
  products: ProductItem[];
}

const CATEGORIES = [
  'Makanan & Minuman',
  'Pertanian & Perkebunan',
  'Kerajinan Tangan',
  'Fashion & Tekstil',
  'Jasa & Lainnya',
];

const COMMON_UNITS = ['pcs', 'bungkus', 'kg', 'gram', 'porsi', 'botol', 'liter', 'ikat', 'kotak', 'set'];

export default function AdminPelapakPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();

  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pelapak' | 'produk'>('pelapak');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ACTIVE'); // Default Aktif

  // Helper check if expired
  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  // Modal Pelapak
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState(false);
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [merchantForm, setMerchantForm] = useState({
    residentId: '',
    residentName: '',
    name: '',
    shopName: '',
    phone: '',
    address: '',
    description: '',
    avatarUrl: '',
    isActive: true,
    expiresAt: '',
  });

  // Modal Produk
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [targetMerchantIdForProduct, setTargetMerchantIdForProduct] = useState<string>('');
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const productImageFileInputRef = useRef<HTMLInputElement>(null);
  const [productForm, setProductForm] = useState({
    merchantId: '',
    name: '',
    description: '',
    price: 0,
    unit: 'bungkus',
    category: 'Makanan & Minuman',
    imageUrl: '',
    isAvailable: true,
    expiresAt: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all merchants with products
  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/merchants?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.merchants) {
        setMerchants(data.merchants);
      }
    } catch (e) {
      console.error('Failed to fetch merchants:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [currentTenantId]);

  // Flattened all products
  const allProducts = React.useMemo(() => {
    const list: (ProductItem & { merchantName: string; shopName: string; merchantPhone: string })[] = [];
    merchants.forEach((m) => {
      m.products.forEach((p) => {
        list.push({
          ...p,
          merchantName: m.name,
          shopName: m.shopName,
          merchantPhone: m.phone,
        });
      });
    });
    return list;
  }, [merchants]);

  // Filtered Merchants
  const filteredMerchants = React.useMemo(() => {
    return merchants.filter((m) => {
      const expired = isExpired(m.expiresAt);
      if (statusFilter === 'ACTIVE' && expired) return false;
      if (statusFilter === 'EXPIRED' && !expired) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.shopName.toLowerCase().includes(q) ||
        (m.address && m.address.toLowerCase().includes(q))
      );
    });
  }, [merchants, searchQuery, statusFilter]);

  // Filtered Products
  const filteredProducts = React.useMemo(() => {
    return allProducts.filter((p) => {
      const expired = isExpired(p.expiresAt);
      if (statusFilter === 'ACTIVE' && expired) return false;
      if (statusFilter === 'EXPIRED' && !expired) return false;

      if (selectedMerchantFilter !== 'ALL' && p.merchantId !== selectedMerchantFilter) return false;
      if (selectedCategoryFilter !== 'ALL' && p.category !== selectedCategoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.shopName.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allProducts, selectedMerchantFilter, selectedCategoryFilter, searchQuery, statusFilter]);

  // Handle Open Modal Pelapak
  const handleOpenAddMerchant = () => {
    setEditingMerchantId(null);
    setMerchantForm({
      residentId: '',
      residentName: '',
      name: '',
      shopName: '',
      phone: '',
      address: '',
      description: '',
      avatarUrl: '',
      isActive: true,
      expiresAt: '',
    });
    setFormError(null);
    setIsMerchantModalOpen(true);
  };

  const handleOpenEditMerchant = (m: MerchantItem) => {
    setEditingMerchantId(m.id);
    setMerchantForm({
      residentId: m.residentId || m.resident?.id || '',
      residentName: m.resident?.nama || m.name,
      name: m.name,
      shopName: m.shopName,
      phone: m.phone,
      address: m.address || '',
      description: m.description || '',
      avatarUrl: m.avatarUrl || '',
      isActive: m.isActive,
      expiresAt: m.expiresAt ? new Date(m.expiresAt).toISOString().split('T')[0] : '',
    });
    setFormError(null);
    setIsMerchantModalOpen(true);
  };

  // Upload Merchant Avatar
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'pelapak');
      if (activeTenant?.slug) {
        fd.append('tenant', activeTenant.slug);
      }
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setMerchantForm((prev) => ({ ...prev, avatarUrl: data.url }));
      } else {
        alert('Gagal mengupload foto lapak: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploadingAvatar(false);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  // Submit Pelapak Form
  const handleSubmitMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingMerchantId
        ? `/api/merchants/${editingMerchantId}`
        : `/api/merchants?tenant=${currentTenantId}`;
      const method = editingMerchantId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...merchantForm,
          tenantSlug: currentTenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan data pelapak');
        return;
      }

      setIsMerchantModalOpen(false);
      fetchMerchants();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Pelapak
  const handleDeleteMerchant = async (id: string, name: string) => {
    if (!confirm(`Hapus pelapak "${name}" beserta seluruh produknya?`)) return;

    try {
      const res = await fetch(`/api/merchants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMerchants();
      } else {
        alert('Gagal menghapus pelapak');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Open Add Product
  const handleOpenAddProduct = (presetMerchantId?: string) => {
    const defaultMerchant = presetMerchantId || merchants[0]?.id || '';
    setEditingProductId(null);
    setProductForm({
      merchantId: defaultMerchant,
      name: '',
      description: '',
      price: 15000,
      unit: 'bungkus',
      category: 'Makanan & Minuman',
      imageUrl: '',
      isAvailable: true,
      expiresAt: '',
    });
    setFormError(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: ProductItem) => {
    setEditingProductId(p.id);
    setProductForm({
      merchantId: p.merchantId,
      name: p.name,
      description: p.description || '',
      price: p.price,
      unit: p.unit,
      category: p.category,
      imageUrl: p.imageUrl || '',
      isAvailable: p.isAvailable,
      expiresAt: p.expiresAt ? new Date(p.expiresAt).toISOString().split('T')[0] : '',
    });
    setFormError(null);
    setIsProductModalOpen(true);
  };

  // Upload Product Image
  const handleUploadProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProductImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'pelapak');
      if (activeTenant?.slug) {
        fd.append('tenant', activeTenant.slug);
      }
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        alert('Gagal mengupload foto produk: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat upload');
    } finally {
      setUploadingProductImage(false);
      if (productImageFileInputRef.current) productImageFileInputRef.current.value = '';
    }
  };

  // Submit Product Form
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingProductId
        ? `/api/merchants/products/${editingProductId}`
        : `/api/merchants/${productForm.merchantId}/products`;
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan produk');
        return;
      }

      setIsProductModalOpen(false);
      fetchMerchants();
    } catch (err: any) {
      setFormError(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;

    try {
      const res = await fetch(`/api/merchants/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMerchants();
      } else {
        alert('Gagal menghapus produk');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Pasar & Pelapak Desa (UMKM)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data pedagang, etalase lapak warga, dan katalog produk lokal untuk{' '}
            <strong className="text-emerald-600">Desa {activeTenant.nama_desa}</strong>. Satu pelapak bisa menjual banyak item barang!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            suppressHydrationWarning
            href={mounted && currentTenantId ? `/lapak?tenant=${currentTenantId}` : '/lapak'}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Lihat Toko Publik</span>
          </a>

          <button
            onClick={handleOpenAddMerchant}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelapak Baru</span>
          </button>
        </div>
      </div>

      {/* Tab Navigasi: Pelapak vs Produk */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('pelapak');
                setSelectedMerchantFilter('ALL');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'pelapak'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Daftar Pelapak ({merchants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('produk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'produk'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Semua Produk ({allProducts.length})</span>
            </button>
          </div>

          {/* Filter Status: Aktif (Default) / Semua / Kedaluwarsa */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              <span>Aktif</span>
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                statusFilter === 'EXPIRED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-rose-300" />
              <span>Kedaluwarsa</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'pelapak'
                ? 'Cari nama pelapak, toko, dusun...'
                : 'Cari produk, penjual, kategori...'
            }
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DAFTAR PELAPAK */}
      {activeTab === 'pelapak' && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Memuat data pelapak desa...
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {merchants.length === 0
                ? 'Belum ada data pelapak. Klik "Tambah Pelapak Baru" untuk mendaftarkan pedagang/UMKM warga.'
                : 'Tidak ada pelapak yang cocok dengan kata kunci pencarian.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMerchants.map((m) => (
                <div
                  key={m.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header Card Pelapak */}
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {m.avatarUrl ? (
                          <SafeImage
                            src={m.avatarUrl}
                            alt={m.shopName}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-emerald-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              m.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {m.isActive ? 'Aktif Berjualan' : 'Tutup Sementara'}
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                            {m.products.length} Produk
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate mt-1">
                          {m.shopName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                          <span>Pemilik: <strong>{m.name}</strong></span>
                          {m.resident && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded" title="Warga Terverifikasi">
                              Warga Desa
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Alamat & Kontak WA */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                      {m.address && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span className="truncate">{m.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <a
                          href={`https://wa.me/${m.phone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline font-mono"
                        >
                          +{m.phone}
                        </a>
                      </div>
                      {m.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 italic pt-1">
                          &ldquo;{m.description}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Pratinjau Produk Pelapak */}
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Katalog Produk:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {m.products.slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md truncate max-w-[140px]"
                            title={p.name}
                          >
                            • {p.name}
                          </span>
                        ))}
                        {m.products.length > 3 && (
                          <span className="text-[10px] text-emerald-600 font-bold self-center">
                            +{m.products.length - 3} lainnya
                          </span>
                        )}
                        {m.products.length === 0 && (
                          <span className="text-[10px] text-slate-400 italic">Belum ada item produk</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddProduct(m.id)}
                      className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Item</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMerchantFilter(m.id);
                          setActiveTab('produk');
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Lihat Semua Produk Pelapak Ini"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditMerchant(m)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Profil Pelapak"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMerchant(m.id, m.shopName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Hapus Pelapak"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: KATALOG SEMUA PRODUK */}
      {activeTab === 'produk' && (
        <div className="space-y-4">
          {/* Filter Bar Produk */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                <Filter className="w-3.5 h-3.5 text-emerald-500" />
                <span>Pelapak:</span>
              </div>
              <select
                value={selectedMerchantFilter}
                onChange={(e) => setSelectedMerchantFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">Semua Pelapak ({merchants.length})</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.shopName} ({m.name})
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 ml-2">
                <span>Kategori:</span>
              </div>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="ALL">Semua Kategori</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenAddProduct(selectedMerchantFilter !== 'ALL' ? selectedMerchantFilter : undefined)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>

          {/* Tabel / List Produk */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Memuat data produk...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Tidak ada produk ditemukan. Klik &quot;Tambah Produk Baru&quot; untuk menambahkan item jualan pelapak.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Produk</th>
                      <th className="px-5 py-3 font-semibold">Pelapak / Toko</th>
                      <th className="px-5 py-3 font-semibold">Kategori</th>
                      <th className="px-5 py-3 font-semibold">Harga & Satuan</th>
                      <th className="px-5 py-3 font-semibold">Status Stok</th>
                      <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {p.imageUrl ? (
                                <SafeImage
                                  src={p.imageUrl}
                                  alt={p.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {p.name}
                              </h4>
                              {p.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {p.shopName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.merchantName}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                            {p.category}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                            Rp {p.price.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            per {p.unit}
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap space-y-1">
                          <div>
                            {p.isAvailable ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                <CheckCircle2 className="w-3 h-3" />
                                Tersedia
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                <XCircle className="w-3 h-3" />
                                Stok Habis
                              </span>
                            )}
                          </div>

                          {isExpired(p.expiresAt) ? (
                            <div className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Kedaluwarsa ({new Date(p.expiresAt!).toLocaleDateString('id-ID')})
                            </div>
                          ) : p.expiresAt ? (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Batas: {new Date(p.expiresAt).toLocaleDateString('id-ID')}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium">Aktif Permanen</div>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit Produk"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Hapus Produk"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PELAPAK BARU / EDIT */}
      {isMerchantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <button
              onClick={() => setIsMerchantModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {editingMerchantId ? 'Sunting Data Pelapak' : 'Daftarkan Pelapak Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Pelapak adalah warga yang memiliki usaha/warung dan dapat menjual banyak barang di pasar desa.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitMerchant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Toko / Usaha *
                </label>
                <input
                  type="text"
                  required
                  value={merchantForm.shopName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, shopName: e.target.value })}
                  placeholder="Contoh: Lapak Berkah / Warung Bu Maryam"
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Pilih Penduduk Resmi Sebagai Pemilik Lapak */}
              <ResidentPicker
                tenantSlug={currentTenantId}
                selectedResidentId={merchantForm.residentId}
                selectedResidentName={merchantForm.residentName}
                label="Pilih Pemilik dari Data Penduduk"
                placeholder="Cari nama warga atau NIK pemilik usaha/warung..."
                helperText="Wajib memilih warga yang terdaftar pada Buku Induk Penduduk desa."
                onSelect={(res) => {
                  setMerchantForm((prev) => ({
                    ...prev,
                    residentId: res.id,
                    residentName: res.nama,
                    name: res.nama,
                    phone: res.telepon ? res.telepon : prev.phone,
                    address: res.dusun ? `${res.dusun}${res.rt ? `, RT ${res.rt}` : ''}` : prev.address,
                  }));
                }}
                onClear={() => {
                  setMerchantForm((prev) => ({
                    ...prev,
                    residentId: '',
                    residentName: '',
                  }));
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Pemilik Lapak *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantForm.name}
                    onChange={(e) => setMerchantForm({ ...merchantForm, name: e.target.value })}
                    placeholder="Nama warga pemilik usaha"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={merchantForm.phone}
                    onChange={(e) => setMerchantForm({ ...merchantForm, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alamat / Dusun
                </label>
                <input
                  type="text"
                  value={merchantForm.address}
                  onChange={(e) => setMerchantForm({ ...merchantForm, address: e.target.value })}
                  placeholder="Contoh: Dusun Krajan RT 02, RW 01"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi Singkat Usaha
                </label>
                <textarea
                  rows={2}
                  value={merchantForm.description}
                  onChange={(e) => setMerchantForm({ ...merchantForm, description: e.target.value })}
                  placeholder="Menjual makanan tradisional, hasil kebun, dan rempah..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Upload Foto Profil / Toko */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Foto Logo / Lapak
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {merchantForm.avatarUrl ? (
                      <SafeImage
                        src={merchantForm.avatarUrl}
                        alt="Preview"
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Store className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadAvatar}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingAvatar ? 'Mengupload...' : 'Pilih Foto dari Komputer'}</span>
                    </button>
                    <input
                      type="text"
                      value={merchantForm.avatarUrl}
                      onChange={(e) => setMerchantForm({ ...merchantForm, avatarUrl: e.target.value })}
                      placeholder="atau URL foto (/images/...)"
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* FITUR EXPIRED POST PELAPAK */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    Masa Berlaku / Batas Kedaluwarsa Pelapak
                  </label>
                  {merchantForm.expiresAt && (
                    <button
                      type="button"
                      onClick={() => setMerchantForm({ ...merchantForm, expiresAt: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Hapus Batas (Permanen)
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={merchantForm.expiresAt}
                  onChange={(e) => setMerchantForm({ ...merchantForm, expiresAt: e.target.value })}
                  className="w-full text-xs p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-500">
                  {merchantForm.expiresAt
                    ? `Pelapak otomatis kedaluwarsa setelah tanggal ${new Date(merchantForm.expiresAt).toLocaleDateString('id-ID')}.`
                    : 'Kosongkan jika pelapak ini terdaftar aktif permanen.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={merchantForm.isActive}
                  onChange={(e) => setMerchantForm({ ...merchantForm, isActive: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Status Aktif Berjualan (Tampil di website publik)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMerchantModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingMerchantId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Daftarkan Pelapak'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRODUK BARU / EDIT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {editingProductId ? 'Sunting Item Produk' : 'Tambah Produk Jualan'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              1 pelapak dapat memiliki banyak item barang jualan dengan harga dan foto masing-masing.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              {/* Pilih Pelapak */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Pelapak Pemilik Produk *
                </label>
                <select
                  required
                  value={productForm.merchantId}
                  onChange={(e) => setProductForm({ ...productForm, merchantId: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="">Pilih Pelapak...</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.shopName} ({m.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Keripik Pisang Renyah Aneka Rasa (250g)"
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="bungkus, kg, pcs..."
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi / Keterangan Produk
                </label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Keterangan rasa, komposisi, atau manfaat produk..."
                  className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Upload Foto Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Foto Produk
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {productForm.imageUrl ? (
                      <SafeImage
                        src={productForm.imageUrl}
                        alt="Preview"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={productImageFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadProductImage}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingProductImage}
                      onClick={() => productImageFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {uploadingProductImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{uploadingProductImage ? 'Mengupload...' : 'Pilih Foto dari Komputer'}</span>
                    </button>
                    <input
                      type="text"
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      placeholder="atau URL foto (/images/...)"
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* FITUR EXPIRED POST PRODUK */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    Batas Tayang / Kedaluwarsa Produk (Expired Post)
                  </label>
                  {productForm.expiresAt && (
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, expiresAt: '' })}
                      className="text-[11px] text-rose-600 hover:underline font-bold cursor-pointer"
                    >
                      Hapus Batas (Permanen)
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={productForm.expiresAt}
                  onChange={(e) => setProductForm({ ...productForm, expiresAt: e.target.value })}
                  className="w-full text-xs p-2 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 text-slate-900 dark:text-white"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-slate-400 font-semibold mr-1">Preset:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setProductForm({ ...productForm, expiresAt: d.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 cursor-pointer"
                  >
                    +30 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 60);
                      setProductForm({ ...productForm, expiresAt: d.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 cursor-pointer"
                  >
                    +60 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 90);
                      setProductForm({ ...productForm, expiresAt: d.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 cursor-pointer"
                  >
                    +90 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const end = new Date(d.getFullYear(), 11, 31);
                      setProductForm({ ...productForm, expiresAt: end.toISOString().split('T')[0] });
                    }}
                    className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 text-slate-700 dark:text-slate-300 hover:bg-amber-100 cursor-pointer"
                  >
                    Akhir Tahun
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {productForm.expiresAt
                    ? `Produk otomatis ditandai kedaluwarsa setelah tanggal ${new Date(productForm.expiresAt).toLocaleDateString('id-ID')}.`
                    : 'Kosongkan jika produk ini ingin selalu aktif di lapak.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAvailableCheck"
                  checked={productForm.isAvailable}
                  onChange={(e) => setProductForm({ ...productForm, isAvailable: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isAvailableCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Produk Tersedia (Stok Siap Jual)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingProductId ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambahkan Produk'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
