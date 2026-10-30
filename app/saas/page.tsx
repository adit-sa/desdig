'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Users,
  CheckCircle2,
  TrendingUp,
  Globe,
  Shield,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  FileText,
  Layers,
  Search,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import { formatKodeKemendagri, maskKodeKemendagriInput } from '@/lib/formatters';
import Link from 'next/link';

interface DbDomain {
  id: string;
  tenantId: string;
  domain: string;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface DbTenant {
  id: string;
  slug: string;
  kodeDesa: string | null;
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string | null;
  alamatKantor: string | null;
  email: string | null;
  telepon: string | null;
  kepalaDesa: string | null;
  visi: string | null;
  subscriptionStatus: string;
  createdAt: string;
  plan: {
    code: string;
    name: string;
    priceMonthly: number;
  } | null;
  domains: DbDomain[];
  _count?: {
    articles: number;
    officials: number;
    modules: number;
  };
}

interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
}

export default function SaasMasterPage() {
  const { currentTenantId, switchTenant } = useOpenSIDStore();

  const [tenants, setTenants] = useState<DbTenant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    namaDesa: '',
    slug: '',
    kodeDesa: '',
    kecamatan: '',
    kabupaten: '',
    provinsi: 'Jawa Barat',
    kodePos: '',
    alamatKantor: '',
    email: '',
    telepon: '',
    kepalaDesa: '',
    visi: 'Mewujudkan tata kelola desa yang transparan, mandiri, dan akuntabel berbasis teknologi.',
    planCode: 'PROFESSIONAL',
  });

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/saas/tenants');
      const data = await res.json();
      if (data.tenants) {
        setTenants(data.tenants);
      }
      if (data.plans) {
        setPlans(data.plans);
      }
    } catch (err) {
      console.error('Gagal mengambil data tenant PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const totalDesa = tenants.length;
  const mrr = tenants.reduce((acc, curr) => acc + (curr.plan?.priceMonthly || 0), 0);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleRegisterDesa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaDesa || !formData.kecamatan || !formData.kabupaten) {
      alert('Nama desa, kecamatan, dan kabupaten wajib diisi!');
      return;
    }

    const slug = formData.slug.trim() || formData.namaDesa.toLowerCase().replace(/[^a-z0-9]/g, '-');

    try {
      setSaving(true);
      const res = await fetch('/api/saas/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal mendaftarkan desa');
        return;
      }

      alert(`Pemerintah Desa ${formData.namaDesa} berhasil didaftarkan ke PostgreSQL!`);
      setIsModalOpen(false);
      setFormData({
        namaDesa: '',
        slug: '',
        kodeDesa: '',
        kecamatan: '',
        kabupaten: '',
        provinsi: 'Jawa Barat',
        kodePos: '',
        alamatKantor: '',
        email: '',
        telepon: '',
        kepalaDesa: '',
        visi: 'Mewujudkan tata kelola desa yang transparan, mandiri, dan akuntabel berbasis teknologi.',
        planCode: 'PROFESSIONAL',
      });
      await fetchTenants();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim data');
    } finally {
      setSaving(false);
    }
  };

  // Domain Management State
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [selectedTenantForDomain, setSelectedTenantForDomain] = useState<DbTenant | null>(null);
  const [tenantDomains, setTenantDomains] = useState<DbDomain[]>([]);
  const [domainLoading, setDomainLoading] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [newDomainIsPrimary, setNewDomainIsPrimary] = useState(false);
  const [domainActionLoading, setDomainActionLoading] = useState(false);
  const [domainMessage, setDomainMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedDns, setCopiedDns] = useState(false);

  const fetchTenantDomains = async (tenantId: string) => {
    try {
      setDomainLoading(true);
      const res = await fetch(`/api/saas/domains?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.domains) {
        setTenantDomains(data.domains);
      }
    } catch (err) {
      console.error('Gagal mengambil domain tenant:', err);
    } finally {
      setDomainLoading(false);
    }
  };

  const handleOpenDomainModal = (tenant: DbTenant) => {
    setSelectedTenantForDomain(tenant);
    setIsDomainModalOpen(true);
    setNewDomainInput('');
    setNewDomainIsPrimary(false);
    setDomainMessage(null);
    fetchTenantDomains(tenant.id);
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantForDomain || !newDomainInput.trim()) return;

    try {
      setDomainActionLoading(true);
      setDomainMessage(null);
      const res = await fetch('/api/saas/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenantForDomain.id,
          domain: newDomainInput.trim(),
          isPrimary: newDomainIsPrimary,
          isVerified: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDomainMessage({ type: 'error', text: data.error || 'Gagal mendaftarkan domain' });
        return;
      }

      setDomainMessage({ type: 'success', text: data.message || 'Domain berhasil didaftarkan!' });
      setNewDomainInput('');
      setNewDomainIsPrimary(false);
      await Promise.all([fetchTenantDomains(selectedTenantForDomain.id), fetchTenants()]);
    } catch (err: any) {
      setDomainMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem' });
    } finally {
      setDomainActionLoading(false);
    }
  };

  const handleSetPrimaryDomain = async (domainId: string) => {
    if (!selectedTenantForDomain) return;
    try {
      setDomainActionLoading(true);
      setDomainMessage(null);
      const res = await fetch('/api/saas/domains', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: domainId, isPrimary: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDomainMessage({ type: 'error', text: data.error || 'Gagal mengubah domain utama' });
        return;
      }
      setDomainMessage({ type: 'success', text: 'Domain utama berhasil diperbarui.' });
      await Promise.all([fetchTenantDomains(selectedTenantForDomain.id), fetchTenants()]);
    } catch (err: any) {
      setDomainMessage({ type: 'error', text: err.message || 'Gagal memperbarui domain' });
    } finally {
      setDomainActionLoading(false);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (!selectedTenantForDomain) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus domain "${domainName}" dari Desa ${selectedTenantForDomain.namaDesa}?`)) {
      return;
    }

    try {
      setDomainActionLoading(true);
      setDomainMessage(null);
      const res = await fetch(`/api/saas/domains?id=${domainId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setDomainMessage({ type: 'error', text: data.error || 'Gagal menghapus domain' });
        return;
      }
      setDomainMessage({ type: 'success', text: data.message || 'Domain berhasil dihapus.' });
      await Promise.all([fetchTenantDomains(selectedTenantForDomain.id), fetchTenants()]);
    } catch (err: any) {
      setDomainMessage({ type: 'error', text: err.message || 'Gagal menghapus domain' });
    } finally {
      setDomainActionLoading(false);
    }
  };

  const handleCopyDnsGuide = (targetDomain?: string) => {
    const domainText = targetDomain || tenantDomains.find((d) => d.isPrimary)?.domain || `${selectedTenantForDomain?.slug}.desa.id`;
    const guideText = `*PANDUAN SETTING DNS RESMI DESA (desDig SaaS)*
Kepada Yth. Pengelola Domain Pemerintah Desa ${selectedTenantForDomain?.namaDesa || ''}

Untuk mengaktifkan website resmi desa pada domain: *${domainText}*
Silakan tambahkan 2 record DNS berikut pada panel pengelola domain desa (.desa.id):

1. Tipe Record: A
   Host / Name: @
   Target IP: 76.76.21.21

2. Tipe Record: CNAME
   Host / Name: www
   Target: cname.vercel-dns.com

Setelah disimpan, website desa akan otomatis aktif dengan sertifikat keamanan SSL HTTPS (gembok hijau) dalam 5 - 15 menit.`;

    navigator.clipboard.writeText(guideText);
    setCopiedDns(true);
    setTimeout(() => setCopiedDns(false), 2500);
  };

  const filteredTenants = tenants.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.namaDesa.toLowerCase().includes(q) ||
      t.kecamatan.toLowerCase().includes(q) ||
      t.kabupaten.toLowerCase().includes(q) ||
      (t.kodeDesa && t.kodeDesa.toLowerCase().includes(q)) ||
      t.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Sparkles className="h-3 w-3" />
            SaaS Platform Master Dashboard (PostgreSQL)
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            Pengelolaan Multi-Tenant Desa (desDig SaaS)
          </h1>
          <p className="text-xs text-slate-500">
            Data riil langsung dari database PostgreSQL. Kelola tenant desa, hak akses, dan aktivasi desa baru di seluruh Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTenants}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Daftarkan Desa Baru</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Desa Terdaftar (DB)</span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalDesa}</span>
            <span className="text-xs text-slate-400">Desa PostgreSQL</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 font-medium">100% database terisolasi aman</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pendapatan SaaS (MRR)</span>
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatRupiah(mrr)}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Berdasarkan paket langganan aktif</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Arsitektur Multi-Tenancy</span>
            <div className="rounded-lg bg-purple-100 p-2 text-purple-700 dark:bg-purple-950 dark:text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base font-bold text-slate-900 dark:text-white">Tenant ID Isolation</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Multi-desa terhubung satu instance DB</p>
        </div>
      </div>

      {/* Tabel Desa Terdaftar */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Tenant Desa Aktif (PostgreSQL)</h2>
            <span className="text-xs text-slate-400">Menampilkan {filteredTenants.length} dari {tenants.length} desa</span>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / kode desa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <span className="text-xs">Memuat data tenant dari PostgreSQL...</span>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <p className="text-xs">Tidak ada desa yang sesuai pencarian.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Desa & Wilayah</th>
                  <th className="px-4 py-3">Kode Kemendagri</th>
                  <th className="px-4 py-3">Kepala Desa</th>
                  <th className="px-4 py-3">Statistik Data</th>
                  <th className="px-4 py-3">Paket SaaS</th>
                  <th className="px-4 py-3">Biaya / Bln</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTenants.map((tenant) => {
                  const isActive = tenant.slug === currentTenantId || tenant.id === currentTenantId;
                  return (
                    <tr
                      key={tenant.id}
                      className={`transition ${
                        isActive
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Desa {tenant.namaDesa}</span>
                          {isActive && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                              Aktif Dipilih
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Kec. {tenant.kecamatan}, Kab. {tenant.kabupaten}, {tenant.provinsi}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {tenant.domains?.map((d: DbDomain, idx: number) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-mono ${
                                d.isPrimary
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                              title={d.isPrimary ? 'Domain Utama' : 'Domain Sekunder'}
                            >
                              <Globe className="h-2.5 w-2.5 text-blue-500" />
                              {d.domain}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                        {formatKodeKemendagri(tenant.kodeDesa)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                        {tenant.kepalaDesa || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1" title="Jumlah Berita">
                            <FileText className="h-3 w-3 text-slate-400" />
                            {tenant._count?.articles ?? 0}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1" title="Jumlah Pamong">
                            <Users className="h-3 w-3 text-slate-400" />
                            {tenant._count?.officials ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-purple-50 px-2 py-0.5 font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          {tenant.plan?.name || tenant.plan?.code || 'Pro'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {formatRupiah(tenant.plan?.priceMonthly || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tenant.subscriptionStatus === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {tenant.subscriptionStatus === 'ACTIVE' ? 'Aktif' : tenant.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDomainModal(tenant)}
                            title="Kelola Domain & Subdomain Desa"
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs"
                          >
                            <Globe className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span>Domain ({tenant.domains?.length || 0})</span>
                          </button>
                          <Link
                            href={`/admin?tenant=${tenant.slug}`}
                            onClick={() => switchTenant(tenant.slug)}
                            title="Masuk ke Panel Desa Ini (Mode Bantuan / Inspeksi)"
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer shadow-2xs"
                          >
                            <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            <span>Inspeksi Desa</span>
                          </Link>
                          <Link
                            href={`/?tenant=${tenant.slug}`}
                            onClick={() => switchTenant(tenant.slug)}
                            title="Buka Web Publik Desa Ini"
                            target="_blank"
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Manajemen Domain Desa */}
      {isDomainModalOpen && selectedTenantForDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Kelola Domain Desa {selectedTenantForDomain.namaDesa}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Atur domain resmi (.desa.id) atau subdomain platform untuk desa ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDomainModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert Notifikasi */}
            {domainMessage && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  domainMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                }`}
              >
                {domainMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{domainMessage.text}</span>
              </div>
            )}

            {/* Form Tambah Domain Baru */}
            <form
              onSubmit={handleAddDomain}
              className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
                  Tambah Domain Baru
                </label>
                <span className="text-[10px] text-slate-400">Contoh: salupangkang.desa.id</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={newDomainInput}
                    onChange={(e) => setNewDomainInput(e.target.value)}
                    placeholder="contoh: namadesa.desa.id atau namadesa.desaku.id"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    disabled={domainActionLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={domainActionLoading || !newDomainInput.trim()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition shrink-0"
                >
                  {domainActionLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Daftarkan Domain</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimaryCheck"
                  checked={newDomainIsPrimary}
                  onChange={(e) => setNewDomainIsPrimary(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrimaryCheck" className="text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  Jadikan sebagai Domain Utama (Primary) desa ini
                </label>
              </div>
            </form>

            {/* Daftar Domain Terdaftar */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daftar Domain Terdaftar ({tenantDomains.length})
                </h3>
                {domainLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {tenantDomains.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">Belum ada domain terdaftar.</p>
                ) : (
                  tenantDomains.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className={`h-4 w-4 ${d.isPrimary ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {d.domain}
                        </span>
                        <div className="flex items-center gap-1">
                          {d.isPrimary ? (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Utama
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryDomain(d.id)}
                              disabled={domainActionLoading}
                              className="rounded border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                              title="Jadikan sebagai domain utama desa ini"
                            >
                              Set Utama
                            </button>
                          )}
                          {d.isVerified ? (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" />
                              Aktif
                            </span>
                          ) : (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <a
                          href={`https://${d.domain}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Kunjungi Domain"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDeleteDomain(d.id, d.domain)}
                          disabled={domainActionLoading || tenantDomains.length <= 1}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title={tenantDomains.length <= 1 ? 'Minimal 1 domain wajib dipertahankan' : 'Hapus domain'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Panduan DNS untuk Pengurus Desa */}
            <div className="mt-5 p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    Panduan Konfigurasi DNS Desa (Vercel & PANDI/Kominfo)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyDnsGuide()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition"
                >
                  {copiedDns ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin Format WhatsApp</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Kirimkan 2 baris konfigurasi DNS ini kepada pihak desa (atau masukkan di panel registrar Kominfo/PANDI):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">1. A Record (Apex)</div>
                  <div className="text-slate-900 dark:text-white font-semibold mt-0.5">Host: @</div>
                  <div className="text-blue-600 dark:text-blue-400 text-[11px]">IP Target: 76.76.21.21</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">2. CNAME Record</div>
                  <div className="text-slate-900 dark:text-white font-semibold mt-0.5">Host: www</div>
                  <div className="text-blue-600 dark:text-blue-400 text-[11px]">Target: cname.vercel-dns.com</div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-5 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDomainModalOpen(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Onboarding Desa Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Registrasi Desa Baru (Onboarding Tenant PostgreSQL)
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDesa} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Desa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.namaDesa}
                    onChange={(e) => setFormData({ ...formData, namaDesa: e.target.value })}
                    placeholder="Contoh: Cibadak, Bojonggede"
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Kode Desa Kemendagri
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">PP.KK.CC.2XXX</span>
                  </div>
                  <input
                    type="text"
                    value={formData.kodeDesa}
                    onChange={(e) => setFormData({ ...formData, kodeDesa: maskKodeKemendagriInput(e.target.value) })}
                    placeholder="Contoh: 32.02.11.2001"
                    maxLength={13}
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                    placeholder="Nama Kecamatan"
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kabupaten / Kota *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.kabupaten}
                    onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                    placeholder="Nama Kabupaten"
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provinsi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.provinsi}
                    onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Kepala Desa
                  </label>
                  <input
                    type="text"
                    value={formData.kepalaDesa}
                    onChange={(e) => setFormData({ ...formData, kepalaDesa: e.target.value })}
                    placeholder="Nama lengkap Kades"
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Paket Langganan SaaS
                  </label>
                  <select
                    value={formData.planCode}
                    onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.name} ({formatRupiah(p.priceMonthly)} / bln)
                      </option>
                    ))}
                    {plans.length === 0 && (
                      <>
                        <option value="BASIC">Paket Starter (Rp 150.000 / bln)</option>
                        <option value="PROFESSIONAL">Paket Pro Desa Mandiri (Rp 350.000 / bln)</option>
                        <option value="ENTERPRISE">Paket Enterprise Smart Village (Rp 750.000 / bln)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Resmi Desa
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="desa@domain.desa.id"
                    className="w-full rounded-lg border border-slate-200 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{saving ? 'Menyimpan...' : 'Aktifkan Desa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
