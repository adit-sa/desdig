'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  UserCheck,
  X,
  AlertCircle,
  Search,
  Filter,
  Camera,
  Upload,
  ArrowUpDown,
  Building2,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import ResidentPicker from '@/components/admin/ResidentPicker';
import SafeImage from '@/components/SafeImage';

interface OfficialItem {
  id: string;
  residentId?: string | null;
  resident?: {
    id: string;
    nik: string;
    nama: string;
    dusun?: string | null;
  } | null;
  name: string;
  position: string;
  nip: string | null;
  photoUrl: string | null;
  orderIndex: number;
  pinCode?: string | null;
  isActive: boolean;
}

export default function PamongAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [officials, setOfficials] = useState<OfficialItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search State
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'PEMERINTAH' | 'DUSUN' | 'BPD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [residentId, setResidentId] = useState<string | null>(null);
  const [residentName, setResidentName] = useState<string>('');
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [nip, setNip] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [pinCode, setPinCode] = useState('1234');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOfficials = async (isCancelled?: () => boolean) => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/officials?tenant=${slug}`);
      const data = await res.json();
      if (!isCancelled || !isCancelled()) {
        if (data.officials) setOfficials(data.officials);
      }
    } catch (e) {
      if (!isCancelled || !isCancelled()) {
        console.error(e);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;
    if (currentTenantId || activeTenant?.slug) {
      fetchOfficials(isCancelled);
    }
    return () => {
      cancelled = true;
    };
  }, [currentTenantId, activeTenant?.slug]);

  // Klasifikasi aparatur
  const getCategory = (pos: string) => {
    const p = pos.toLowerCase();
    if (p.includes('dusun')) return 'DUSUN';
    if (p.includes('bpd')) return 'BPD';
    return 'PEMERINTAH';
  };

  const getCategoryBadge = (pos: string) => {
    const cat = getCategory(pos);
    if (cat === 'DUSUN') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <Home className="w-3 h-3 text-amber-600" /> Kepala Dusun
        </span>
      );
    }
    if (cat === 'BPD') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          <ShieldCheck className="w-3 h-3 text-blue-600" /> BPD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
        <Building2 className="w-3 h-3 text-emerald-600" /> Pemerintah Desa
      </span>
    );
  };

  // Filtered & Searched Officials
  const filteredOfficials = useMemo(() => {
    let list = officials;

    if (filterCategory !== 'ALL') {
      list = list.filter((o) => getCategory(o.position) === filterCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          (o.nip && o.nip.toLowerCase().includes(q))
      );
    }

    return list;
  }, [officials, filterCategory, searchQuery]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: officials.length,
      pemerintah: officials.filter((o) => getCategory(o.position) === 'PEMERINTAH').length,
      dusun: officials.filter((o) => getCategory(o.position) === 'DUSUN').length,
      bpd: officials.filter((o) => getCategory(o.position) === 'BPD').length,
    };
  }, [officials]);

  const handleOpenModal = (item?: OfficialItem) => {
    if (item) {
      setEditingId(item.id);
      setResidentId(item.residentId || item.resident?.id || null);
      setResidentName(item.resident?.nama || item.name);
      setName(item.name);
      setPosition(item.position);
      setNip(item.nip || '');
      setPhotoUrl(item.photoUrl || '');
      setOrderIndex(item.orderIndex);
      setPinCode(item.pinCode || '1234');
    } else {
      setEditingId(null);
      setResidentId(null);
      setResidentName('');
      setName('');
      setPosition('');
      setNip('');
      setPhotoUrl('');
      setOrderIndex(officials.length + 1);
      setPinCode('1234');
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('folder', 'user_pict');
      const targetTenant = currentTenantId || activeTenant?.slug || '';
      if (targetTenant) {
        data.append('tenant', targetTenant);
      }
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success && result.url) {
        setPhotoUrl(result.url);
      } else {
        alert(result.error || 'Gagal mengunggah foto');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data pamong "${name}"?`)) return;
    try {
      const res = await fetch(`/api/officials/${id}`, { method: 'DELETE' });
      if (res.ok) fetchOfficials();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/officials/${editingId}` : `/api/officials?tenant=${currentTenantId}`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          residentId,
          name,
          position,
          nip: nip || null,
          photoUrl: photoUrl || null,
          pinCode: pinCode.trim() || '1234',
          orderIndex: Number(orderIndex),
          isActive: true,
          tenantSlug: currentTenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan');
        return;
      }

      setIsModalOpen(false);
      fetchOfficials();
    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Daftar Pamong & Aparatur Desa
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manajemen struktur aparatur pemerintah desa, kepala dusun, dan anggota BPD{' '}
            <strong className="text-emerald-600">Desa {activeTenant.nama_desa}</strong>.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Pamong Desa
        </button>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tombol Filter Kategori */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>Semua Aparatur</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{counts.all}</span>
          </button>
          <button
            onClick={() => setFilterCategory('PEMERINTAH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterCategory === 'PEMERINTAH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Pemerintah Desa</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{counts.pemerintah}</span>
          </button>
          <button
            onClick={() => setFilterCategory('DUSUN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterCategory === 'DUSUN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kepala Dusun</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{counts.dusun}</span>
          </button>
          <button
            onClick={() => setFilterCategory('BPD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterCategory === 'BPD'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>BPD</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">{counts.bpd}</span>
          </button>
        </div>

        {/* Kolom Pencarian */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, jabatan, NIP..."
            className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              title="Reset pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tabel Tampilan List Pamong */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Memuat data aparatur pamong...
        </div>
      ) : filteredOfficials.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Tidak ada data aparatur yang cocok dengan filter atau pencarian.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 w-14 text-center">Urutan</th>
                  <th className="py-3.5 px-4">Nama Lengkap & Foto</th>
                  <th className="py-3.5 px-4">Jabatan</th>
                  <th className="py-3.5 px-4">Kategori Struktur</th>
                  <th className="py-3.5 px-4">NIP</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOfficials.map((ofc, idx) => (
                  <tr
                    key={ofc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-center font-bold text-slate-500">
                      #{ofc.orderIndex || idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {ofc.photoUrl ? (
                          <SafeImage
                            src={ofc.photoUrl}
                            alt={ofc.name}
                            width={40}
                            height={40}
                            fallbackSrc="/images/kades_portrait.jpg"
                            className="w-10 h-10 rounded-full object-cover object-top border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center border border-emerald-300 flex-shrink-0">
                            {ofc.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                            <span>{ofc.name}</span>
                            {ofc.resident && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded" title="Terhubung ke Buku Induk Penduduk">
                                Warga
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {ofc.resident ? `NIK: ${ofc.resident.nik}` : `ID: ${ofc.id.slice(-6)}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {ofc.position}
                    </td>
                    <td className="py-3 px-4">
                      {getCategoryBadge(ofc.position)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {ofc.nip || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenModal(ofc)}
                          className="p-1.5 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition"
                          title="Sunting data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ofc.id, ofc.name)}
                          className="p-1.5 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition"
                          title="Hapus aparatur"
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
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between items-center px-4">
            <span>Menampilkan <strong>{filteredOfficials.length}</strong> dari <strong>{officials.length}</strong> aparatur</span>
            <span>Desa {activeTenant.nama_desa}</span>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {editingId ? 'Sunting Data Pamong' : 'Tambah Pamong Desa'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Data aparatur akan ditampilkan pada struktur bagan dan portal resmi desa.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pemilih Penduduk Resmi Desa */}
              <ResidentPicker
                tenantSlug={currentTenantId}
                selectedResidentId={residentId}
                selectedResidentName={residentName}
                label="Pilih Sumber dari Data Penduduk"
                placeholder="Cari nama atau NIK warga untuk diangkat menjadi pamong..."
                helperText="Nama dan identitas pamong ditautkan ke Buku Induk Kependudukan desa."
                onSelect={(res) => {
                  setResidentId(res.id);
                  setResidentName(res.nama);
                  setName(res.nama);
                  if (res.fotoUrl && !photoUrl) setPhotoUrl(res.fotoUrl);
                }}
                onClear={() => {
                  setResidentId(null);
                  setResidentName('');
                }}
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar Dinas *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: H. Ahmad Suryadi, S.Sos."
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Anda dapat menyesuaikan penulisan gelar kehormatan / akademik di atas nama penduduk yang dipilih.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan Aparatur *
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Contoh: Kepala Desa / Sekretaris Desa / Kepala Dusun"
                  className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Foto Aparatur */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Foto Aparatur (URL atau Unggah File)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <SafeImage
                        src={photoUrl}
                        alt="Preview"
                        width={56}
                        height={56}
                        fallbackSrc="/images/kades_portrait.jpg"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="/uploads/... atau tautan foto aparatur"
                      className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition">
                      <Upload className="w-3 h-3 text-emerald-600" />
                      <span>{uploading ? 'Mengunggah...' : 'Pilih Foto dari Komputer'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP (Opsional)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="19820512..."
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    PIN Absen (4-Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="1234"
                    className="w-full text-xs font-mono font-bold tracking-widest p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
