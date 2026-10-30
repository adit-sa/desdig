'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit,
  Trash2,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Newspaper,
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  _count?: { articles: number };
}

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  onCategoriesChanged?: () => void;
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
  tenantSlug,
  onCategoriesChanged,
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/categories?tenant=${encodeURIComponent(tenantSlug)}`);
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setError('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      resetForm();
    }
  }, [isOpen, tenantSlug]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setError(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingId) {
      // Auto generate slug
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/categories/${editingId}` : `/api/categories`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          tenantSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Gagal menyimpan kategori');
        return;
      }

      resetForm();
      fetchCategories();
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!confirm(`Hapus kategori "${catName}"? Artikel di dalam kategori ini akan menjadi tanpa kategori.`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchCategories();
        if (onCategoriesChanged) onCategoriesChanged();
      } else {
        alert(data.error || 'Gagal menghapus kategori');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus kategori');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              <span>Kelola Kategori Berita Desa</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Atur pos-pos pengelompokan kabar dan artikel resmi desa.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Tambah / Edit Kategori */}
        <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>{editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}</span>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-slate-400 hover:underline"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Nama Kategori *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Kesehatan Warga"
                className="w-full text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Slug URL (Otomatis)
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="kesehatan-warga"
                className="w-full text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : editingId ? (
              'Simpan Perubahan Kategori'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Simpan Kategori Baru</span>
              </>
            )}
          </button>
        </form>

        {/* Daftar Kategori */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Daftar Kategori ({categories.length})
          </label>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Memuat kategori...</div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">Belum ada kategori tersimpan.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {cat._count?.articles ?? 0} Artikel
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                      /{cat.slug}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Edit Kategori"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
