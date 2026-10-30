'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  PieChart,
  RefreshCw,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface ApbdesItemData {
  id: string;
  year: number;
  category: string;
  accountCode: string;
  accountName: string;
  budget: number;
  realization: number;
}

export default function KeuanganPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ApbdesItemData[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025]);
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [stats, setStats] = useState({
    totalAnggaranPendapatan: 0,
    totalRealisasiPendapatan: 0,
    persenPendapatan: 0,
    totalAnggaranBelanja: 0,
    totalRealisasiBelanja: 0,
    persenBelanja: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ApbdesItemData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    year: 2025,
    category: 'Pendapatan',
    accountCode: '',
    accountName: '',
    budget: '',
    realization: '',
  });

  const fetchApbdes = async (year: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/apbdes?tenant=${currentTenantId}&year=${year}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        if (Array.isArray(data.availableYears) && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Gagal mengambil data APBDes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApbdes(selectedYear);
  }, [currentTenantId, selectedYear]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      year: selectedYear,
      category: 'Pendapatan',
      accountCode: '',
      accountName: '',
      budget: '',
      realization: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ApbdesItemData) => {
    setEditingItem(item);
    setFormData({
      year: item.year,
      category: item.category,
      accountCode: item.accountCode,
      accountName: item.accountName,
      budget: item.budget.toString(),
      realization: item.realization.toString(),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingItem) {
        // Update
        const res = await fetch('/api/apbdes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            year: Number(formData.year),
            category: formData.category,
            accountCode: formData.accountCode,
            accountName: formData.accountName,
            budget: Number(formData.budget) || 0,
            realization: Number(formData.realization) || 0,
          }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          await fetchApbdes(selectedYear);
        }
      } else {
        // Create
        const res = await fetch(`/api/apbdes?tenant=${currentTenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantSlug: currentTenantId,
            year: Number(formData.year),
            category: formData.category,
            accountCode: formData.accountCode,
            accountName: formData.accountName,
            budget: Number(formData.budget) || 0,
            realization: Number(formData.realization) || 0,
          }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          // Jika input tahun baru, ganti ke tahun tersebut
          if (formData.year !== selectedYear) {
            setSelectedYear(Number(formData.year));
          } else {
            await fetchApbdes(selectedYear);
          }
        }
      }
    } catch (err) {
      console.error('Error saving APBDes item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pos anggaran APBDes ini?')) return;
    setDeletingId(id);

    try {
      const res = await fetch(`/api/apbdes?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchApbdes(selectedYear);
      }
    } catch (err) {
      console.error('Error deleting APBDes item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const pendapatanList = items.filter((i) => i.category === 'Pendapatan');
  const belanjaList = items.filter((i) => i.category === 'Belanja');
  const pembiayaanList = items.filter((i) => i.category === 'Pembiayaan');

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header & Filter Tahun */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl dark:bg-emerald-950 dark:text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            Transparansi APBDes & Realisasi Anggaran
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data APBDes Desa {activeTenant.nama_desa} berdasarkan tahun anggaran
          </p>
        </div>

        {/* Kontrol Tahun & Tambah Pos */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Dropdown Tahun */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-500">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer dark:text-slate-100"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pos APBDes</span>
          </button>
        </div>
      </div>

      {/* KPI Ringkasan APBDes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Pendapatan */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Pendapatan Desa ({selectedYear})
            </span>
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(stats.totalRealisasiPendapatan)}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Anggaran: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(stats.totalAnggaranPendapatan)}</strong>
            </p>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Capaian Realisasi:</span>
              <span className="font-extrabold text-emerald-600">{stats.persenPendapatan}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, stats.persenPendapatan)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Belanja */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Belanja Desa ({selectedYear})
            </span>
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(stats.totalRealisasiBelanja)}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Plafon Anggaran: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(stats.totalAnggaranBelanja)}</strong>
            </p>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">Realisasi Penyerapan:</span>
              <span className="font-extrabold text-amber-600">{stats.persenBelanja}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, stats.persenBelanja)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. Rincian Sumber Pendapatan */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            1. Rincian Sumber Pendapatan Desa ({selectedYear})
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {pendapatanList.length} Pos Terdata
          </span>
        </div>

        {pendapatanList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada pos pendapatan untuk tahun {selectedYear}. Klik &ldquo;Tambah Pos APBDes&rdquo; untuk menginput.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Kode Rek</th>
                  <th className="px-4 py-2.5">Uraian Pendapatan</th>
                  <th className="px-4 py-2.5">Anggaran (Rp)</th>
                  <th className="px-4 py-2.5">Realisasi (Rp)</th>
                  <th className="px-4 py-2.5 text-center">Persentase</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendapatanList.map((item) => {
                  const pct = item.budget > 0 ? Math.round((item.realization / item.budget) * 100) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.accountCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {item.accountName}
                      </td>
                      <td className="px-4 py-3">{formatRupiah(item.budget)}</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(item.realization)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                            title="Edit Pos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Hapus Pos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Rincian Bidang Belanja */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            2. Rincian Bidang Belanja Desa ({selectedYear})
          </h2>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {belanjaList.length} Pos Terdata
          </span>
        </div>

        {belanjaList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada pos belanja untuk tahun {selectedYear}. Klik &ldquo;Tambah Pos APBDes&rdquo; untuk menginput.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Kode Rek</th>
                  <th className="px-4 py-2.5">Uraian Bidang Belanja</th>
                  <th className="px-4 py-2.5">Anggaran (Rp)</th>
                  <th className="px-4 py-2.5">Realisasi (Rp)</th>
                  <th className="px-4 py-2.5 text-center">Persentase</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {belanjaList.map((item) => {
                  const pct = item.budget > 0 ? Math.round((item.realization / item.budget) * 100) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {item.accountCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {item.accountName}
                      </td>
                      <td className="px-4 py-3">{formatRupiah(item.budget)}</td>
                      <td className="px-4 py-3 font-extrabold text-amber-600 dark:text-amber-400">
                        {formatRupiah(item.realization)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-extrabold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition"
                            title="Edit Pos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Hapus Pos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL INPUT / EDIT APBDES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                {editingItem ? 'Edit Pos Anggaran APBDes' : 'Tambah Pos Anggaran APBDes Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* Tahun */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Anggaran:
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    required
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer"
                  >
                    <option value="Pendapatan">Pendapatan</option>
                    <option value="Belanja">Belanja</option>
                    <option value="Pembiayaan">Pembiayaan</option>
                  </select>
                </div>
              </div>

              {/* Kode Rekening */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Rekening:
                </label>
                <input
                  type="text"
                  value={formData.accountCode}
                  onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                  placeholder="Contoh: 4.1 atau 4.2.1 atau 5.2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                />
              </div>

              {/* Uraian Pos */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Pos Anggaran:
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Contoh: Dana Desa (APBN) atau Bidang Pembangunan Fisik"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Target Anggaran */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Anggaran (Rp):
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Contoh: 750000000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    required
                  />
                </div>

                {/* Realisasi */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Realisasi Saat Ini (Rp):
                  </label>
                  <input
                    type="number"
                    value={formData.realization}
                    onChange={(e) => setFormData({ ...formData, realization: e.target.value })}
                    placeholder="Contoh: 690000000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pos Anggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
