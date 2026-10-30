'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Edit2,
  Trash2,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  Lock,
  Building2,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface UserItem {
  membershipId: string;
  id: string;
  name: string;
  email: string;
  role: 'VILLAGE_ADMIN' | 'EDITOR' | 'AUTHOR' | 'APARATUR' | 'AUDITOR';
  createdAt: string;
}

export default function UsersAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modal State for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EDITOR' as UserItem['role'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch Users
  const fetchUsers = async (isCancelled?: () => boolean) => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/users?tenant=${slug}`);
      const data = await res.json();
      if (!isCancelled || !isCancelled()) {
        if (!res.ok) {
          setErrorMsg(data.error || 'Gagal memuat pengguna');
          return;
        }
        setUsers(data.users || []);
      }
    } catch (err: any) {
      if (!isCancelled || !isCancelled()) {
        console.error(err);
        setErrorMsg(err.message || 'Terjadi kesalahan sistem');
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
      fetchUsers(isCancelled);
    }
    return () => {
      cancelled = true;
    };
  }, [currentTenantId, activeTenant?.slug]);

  // Role Badge Helper
  const getRoleBadge = (role: UserItem['role']) => {
    switch (role) {
      case 'VILLAGE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Shield className="w-3 h-3 text-emerald-600" />
            Admin Utama Desa
          </span>
        );
      case 'EDITOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Settings className="w-3 h-3 text-blue-600" />
            Operator Desa
          </span>
        );
      case 'AUTHOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            <FileText className="w-3 h-3 text-purple-600" />
            Penulis Berita
          </span>
        );
      case 'APARATUR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Aparatur (Absensi)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300">
            {role}
          </span>
        );
    }
  };

  const getRoleDescription = (role: UserItem['role']) => {
    switch (role) {
      case 'VILLAGE_ADMIN':
        return 'Akses penuh ke semua menu, kelola pengguna desa, pengaturan, SOTK, dan absensi.';
      case 'EDITOR':
        return 'Dapat posting berita, kelola kependudukan, pembangunan, lapak warga, dan absensi.';
      case 'AUTHOR':
        return 'Khusus membuat & mengedit artikel/berita desa, melihat galeri, dan melakukan absensi.';
      case 'APARATUR':
        return 'Khusus mengakses menu absensi pamong dan melihat rekap kehadiran pribadinya.';
      default:
        return '';
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === '' ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === 'ALL' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'EDITOR',
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // kosongkan jika tidak ingin ganti password
      role: user.role,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      if (editingUser) {
        // Edit User
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantSlug: currentTenantId,
            name: formData.name,
            role: formData.role,
            password: formData.password || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui pengguna');

        setSuccessMsg(`Data pengguna ${formData.name} berhasil diperbarui.`);
      } else {
        // Create User
        if (!formData.password) {
          throw new Error('Kata sandi wajib diisi untuk pengguna baru.');
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantSlug: currentTenantId,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menambahkan pengguna');

        setSuccessMsg(`Pengguna baru ${formData.name} berhasil ditambahkan.`);
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akses ${user.name} (${user.email}) dari desa ini?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}?tenant=${currentTenantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna');

      setSuccessMsg(`Pengguna ${user.name} berhasil dihapus.`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengguna');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Hak Akses & Pengguna
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Manajemen Pengguna Admin Web
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelola akun pengguna, peran otorisasi, dan hak akses admin web untuk Pemerintah Desa {activeTenant.nama_desa}.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition self-start md:self-auto cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Role Explanation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Admin Utama Desa</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Akses penuh ke semua modul, kelola akun pengguna lain, SOTK, identitas desa, dan absensi.
          </p>
        </div>

        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900 dark:text-blue-300">
            <Settings className="w-4 h-4 text-blue-600" />
            <span>Operator Desa</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Mengelola berita, data kependudukan, modul UMKM lapak warga, pembangunan, dan absensi.
          </p>
        </div>

        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-purple-900 dark:text-purple-300">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Penulis Berita</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Fokus membuat & mempublikasikan artikel berita desa, melihat galeri kegiatan, dan absensi.
          </p>
        </div>

        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Aparatur (Absensi)</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Khusus melakukan absensi harian dan melihat rekap kehadiran pamong di komputer kantor.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Semua Peran (Role)</option>
              <option value="VILLAGE_ADMIN">Admin Utama Desa</option>
              <option value="EDITOR">Operator Desa</option>
              <option value="AUTHOR">Penulis Berita</option>
              <option value="APARATUR">Aparatur (Absensi)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Hak Akses & Cakupan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat daftar pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Terdaftar {new Date(u.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs">
                      {getRoleDescription(u.role)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          title="Edit Pengguna & Peran"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          title="Hapus Akses Pengguna"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                {editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Misal: Ahmad Zaki"
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={`nama@${activeTenant.slug}.desa.id`}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                />
                {editingUser && (
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Email akun tidak dapat diubah setelah dibuat.</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Peran (Role) Hak Akses
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="VILLAGE_ADMIN">Admin Utama Desa (Akses Penuh)</option>
                  <option value="EDITOR">Operator Desa (Kelola Web & Warga)</option>
                  <option value="AUTHOR">Penulis Berita (Khusus Berita & Artikel)</option>
                  <option value="APARATUR">Aparatur (Khusus Absensi Saja)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {getRoleDescription(formData.role)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kata Sandi (Password)
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah sandi' : 'Minimal 6 karakter'}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : editingUser ? 'Perbarui Pengguna' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
