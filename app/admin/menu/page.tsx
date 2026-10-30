'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu as MenuIcon,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Globe,
  CornerDownRight,
  Sparkles,
  Search,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  FolderTree,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface NavMenuItem {
  id: string;
  tenantId: string;
  title: string;
  url: string;
  parentId: string | null;
  orderIndex: number;
  isVisible: boolean;
  isExternal: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TreeMenuItem {
  item: NavMenuItem;
  level: number;
  parentTitle?: string;
  hasChildren: boolean;
  childCount: number;
}

const PRESET_URLS = [
  { label: 'Beranda (#beranda)', url: '#beranda' },
  { label: 'Profil Desa (#profil)', url: '#profil' },
  { label: 'Aparatur (#pamong)', url: '#pamong' },
  { label: 'Warta Desa (#berita)', url: '#berita' },
  { label: 'Artikel & Warta (/artikel)', url: '/artikel' },
  { label: 'Pengumuman (#pengumuman)', url: '#pengumuman' },
  { label: 'Galeri Foto (/galeri)', url: '/galeri' },
  { label: 'Transparansi APBDes (#apbdes)', url: '#apbdes' },
  { label: 'Lapak UMKM (/lapak)', url: '/lapak' },
  { label: 'Pembangunan (/pembangunan)', url: '/pembangunan' },
];

export default function MenuAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [mounted, setMounted] = useState(false);
  const [menus, setMenus] = useState<NavMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Collapsible parents state
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'root' | 'sub1' | 'sub2'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    parentId: 'NONE',
    orderIndex: 1,
    isVisible: true,
    isExternal: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch menus from API
  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/menus?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.menus) {
        setMenus(data.menus);
      }
    } catch (e) {
      console.error('Gagal mengambil daftar menu:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [currentTenantId]);

  // Map item by ID for instant lookup
  const itemMap = useMemo(() => {
    const map = new Map<string, NavMenuItem>();
    menus.forEach((m) => map.set(m.id, m));
    return map;
  }, [menus]);

  // Map of parent ID -> sorted child items
  const childrenMap = useMemo(() => {
    const map = new Map<string, NavMenuItem[]>();
    menus.forEach((m) => {
      const pId = m.parentId || 'ROOT';
      const list = map.get(pId) || [];
      list.push(m);
      map.set(pId, list);
    });
    // Sort each group by orderIndex
    map.forEach((list) => {
      list.sort((a, b) => a.orderIndex - b.orderIndex);
    });
    return map;
  }, [menus]);

  // Recursive tree flattening to support arbitrary depth (Root -> Sub -> Sub-sub -> ...)
  const flatTree = useMemo(() => {
    const result: TreeMenuItem[] = [];
    const visited = new Set<string>();

    const traverse = (parentId: string | null, level: number, parentTitle?: string) => {
      const key = parentId || 'ROOT';
      const siblings = childrenMap.get(key) || [];

      siblings.forEach((item) => {
        if (visited.has(item.id)) return;
        visited.add(item.id);

        const kids = childrenMap.get(item.id) || [];
        result.push({
          item,
          level,
          parentTitle,
          hasChildren: kids.length > 0,
          childCount: kids.length,
        });

        // Traverse into children
        if (kids.length > 0) {
          traverse(item.id, level + 1, item.title);
        }
      });
    };

    traverse(null, 0);

    // Safeguard for orphaned items (items whose parentId doesn't exist)
    menus.forEach((m) => {
      if (!visited.has(m.id)) {
        visited.add(m.id);
        const parentObj = m.parentId ? itemMap.get(m.parentId) : undefined;
        const kids = childrenMap.get(m.id) || [];
        result.push({
          item: m,
          level: m.parentId ? 1 : 0,
          parentTitle: parentObj?.title || (m.parentId ? 'Menu Lain' : undefined),
          hasChildren: kids.length > 0,
          childCount: kids.length,
        });
      }
    });

    return result;
  }, [menus, childrenMap, itemMap]);

  // Helper to check if any ancestor of an item is collapsed
  const isAncestorCollapsed = (item: NavMenuItem): boolean => {
    let currParentId = item.parentId;
    while (currParentId) {
      if (collapsedParents.has(currParentId)) return true;
      const parentObj = itemMap.get(currParentId);
      currParentId = parentObj?.parentId || null;
    }
    return false;
  };

  // Collapse / Expand handlers
  const toggleCollapse = (id: string) => {
    setCollapsedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const collapseAll = () => {
    const parentIdsWithKids = flatTree.filter((t) => t.hasChildren).map((t) => t.item.id);
    setCollapsedParents(new Set(parentIdsWithKids));
  };

  const expandAll = () => {
    setCollapsedParents(new Set());
  };

  // Filtered flat list
  const filteredList = useMemo(() => {
    return flatTree.filter(({ item, level }) => {
      // 1. Collapse check (hide if an ancestor is collapsed, unless user is searching)
      if (!searchQuery.trim() && isAncestorCollapsed(item)) {
        return false;
      }

      // 2. Status Filter
      if (statusFilter === 'visible' && !item.isVisible) return false;
      if (statusFilter === 'hidden' && item.isVisible) return false;

      // 3. Level Filter
      if (levelFilter === 'root' && level !== 0) return false;
      if (levelFilter === 'sub1' && level !== 1) return false;
      if (levelFilter === 'sub2' && level < 2) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchUrl = item.url.toLowerCase().includes(q);
        return matchTitle || matchUrl;
      }

      return true;
    });
  }, [flatTree, statusFilter, levelFilter, searchQuery, collapsedParents]);

  // Counts
  const visibleCount = menus.filter((m) => m.isVisible).length;
  const hiddenCount = menus.length - visibleCount;
  const rootCount = menus.filter((m) => !m.parentId).length;
  const subCount = menus.length - rootCount;
  const totalParentWithKids = flatTree.filter((t) => t.hasChildren).length;

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Open modal with preselected parent (supporting creating sub-menus of sub-menus!)
  const handleOpenAdd = (presetParentId?: string) => {
    setEditingId(null);
    const siblings = presetParentId
      ? childrenMap.get(presetParentId) || []
      : childrenMap.get('ROOT') || [];

    setFormData({
      title: '',
      url: '#',
      parentId: presetParentId || 'NONE',
      orderIndex: siblings.length + 1,
      isVisible: true,
      isExternal: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: NavMenuItem) => {
    setEditingId(m.id);
    setFormData({
      title: m.title,
      url: m.url,
      parentId: m.parentId || 'NONE',
      orderIndex: m.orderIndex,
      isVisible: m.isVisible,
      isExternal: m.isExternal,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus menu "${title}"? Seluruh sub-menu di dalamnya juga akan ikut terhapus.`)) return;

    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification(`Menu "${title}" berhasil dihapus.`);
        fetchMenus();
      } else {
        alert('Gagal menghapus menu');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVisible = async (menu: NavMenuItem) => {
    try {
      const newStatus = !menu.isVisible;
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menu,
          isVisible: newStatus,
        }),
      });
      if (res.ok) {
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, isVisible: newStatus } : m))
        );
        showNotification(`Menu "${menu.title}" ${newStatus ? 'ditampilkan' : 'disembunyikan'}.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reorder Item: Move Up or Down within same parent siblings
  const handleMoveOrder = async (targetItem: NavMenuItem, direction: 'up' | 'down') => {
    const parentKey = targetItem.parentId || 'ROOT';
    const siblings = childrenMap.get(parentKey) || [];

    const currentIndex = siblings.findIndex((s) => s.id === targetItem.id);
    if (currentIndex === -1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return;

    const neighbor = siblings[swapIndex];
    setMovingId(targetItem.id);

    try {
      const currentOrder = targetItem.orderIndex;
      const neighborOrder = neighbor.orderIndex === currentOrder
        ? (direction === 'up' ? currentOrder - 1 : currentOrder + 1)
        : neighbor.orderIndex;

      await Promise.all([
        fetch(`/api/menus/${targetItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...targetItem, orderIndex: neighborOrder }),
        }),
        fetch(`/api/menus/${neighbor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...neighbor, orderIndex: currentOrder }),
        }),
      ]);

      await fetchMenus();
      showNotification(`Urutan "${targetItem.title}" diperbarui.`);
    } catch (e) {
      console.error('Gagal memperbarui urutan menu:', e);
    } finally {
      setMovingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      alert('Nama menu dan tautan URL wajib diisi!');
      return;
    }

    try {
      setSubmitting(true);
      const url = editingId ? `/api/menus/${editingId}` : '/api/menus';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderIndex: Number(formData.orderIndex),
          tenantSlug: currentTenantId,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        showNotification(editingId ? `Menu "${formData.title}" disimpan.` : `Menu "${formData.title}" ditambahkan.`);
        fetchMenus();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan menu');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Seed Menu Standar
  const handleSeedDefaults = async () => {
    if (!confirm('Terapkan set menu navigasi standar rekomendasi desa?')) return;
    const defaults = [
      { title: 'Beranda', url: '#beranda', orderIndex: 1 },
      { title: 'Profil', url: '#profil', orderIndex: 2 },
      { title: 'Aparatur', url: '#pamong', orderIndex: 3 },
      { title: 'Warta Desa', url: '#berita', orderIndex: 4 },
      { title: 'Pengumuman', url: '#pengumuman', orderIndex: 5 },
      { title: 'Galeri Foto', url: '/galeri', orderIndex: 6 },
      { title: 'Transparansi APBDes', url: '#apbdes', orderIndex: 7 },
    ];

    try {
      setLoading(true);
      for (const d of defaults) {
        await fetch('/api/menus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...d, tenantSlug: currentTenantId, isVisible: true, isExternal: false }),
        });
      }
      showNotification('Menu standar rekomendasi berhasil diterapkan.');
      await fetchMenus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Prevent cycle selection in Parent Dropdown: An item cannot be its own child
  const invalidParentIds = useMemo(() => {
    if (!editingId) return new Set<string>();
    const forbidden = new Set<string>([editingId]);
    const queue = [editingId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const kids = childrenMap.get(current) || [];
      kids.forEach((k) => {
        forbidden.add(k.id);
        queue.push(k.id);
      });
    }
    return forbidden;
  }, [editingId, childrenMap]);

  return (
    <div className="space-y-3">
      {/* Header Banner - Ultra Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white dark:bg-slate-900 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            <MenuIcon className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">
                Menu Navigasi Website
              </h1>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" suppressHydrationWarning>
                {activeTenant?.nama_desa ? `Desa ${activeTenant.nama_desa}` : ''}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {menus.length} Item ({rootCount} Utama, {subCount} Sub)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0">
          <a
            suppressHydrationWarning
            href={mounted && currentTenantId ? `/?tenant=${currentTenantId}` : '/'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold transition shadow-2xs"
          >
            <Globe className="w-3 h-3 text-emerald-500" />
            <span>Lihat Web</span>
          </a>

          {menus.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg text-[11px] font-bold transition"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Bawaan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>+ Menu Utama</span>
          </button>

          <button
            type="button"
            onClick={fetchMenus}
            disabled={loading}
            className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            title="Muat ulang data menu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in-50 duration-200 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter & Pencarian Bar - Ultra Compact */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Kolom Pencarian */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari label menu atau link..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-7 pr-6 py-1 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Status, Tingkat & Tombol Ciutkan */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Ciutkan / Bentangkan Semua */}
          {totalParentWithKids > 0 && (
            <button
              type="button"
              onClick={collapsedParents.size > 0 ? expandAll : collapseAll}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[10px] font-bold transition cursor-pointer"
              title={collapsedParents.size > 0 ? 'Bentangkan Semua Sub-menu' : 'Ciutkan Semua Sub-menu'}
            >
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${collapsedParents.size > 0 ? '-rotate-90' : ''}`} />
              <span>{collapsedParents.size > 0 ? 'Bentangkan' : 'Ciutkan'}</span>
            </button>
          )}

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 rounded transition ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Semua ({menus.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('visible')}
              className={`px-2 py-0.5 rounded transition ${
                statusFilter === 'visible'
                  ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Aktif ({visibleCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('hidden')}
              className={`px-2 py-0.5 rounded transition ${
                statusFilter === 'hidden'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sembunyi ({hiddenCount})
            </button>
          </div>

          {/* Filter Tingkat Hirarki */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Semua Level</option>
            <option value="root">Level 1 (Utama)</option>
            <option value="sub1">Level 2 (Sub-menu)</option>
            <option value="sub2">Level 3+ (Sub-sub)</option>
          </select>
        </div>
      </div>

      {/* Tabel List Tampilan Menu - Ultra Compact & Nested Multi-Level */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Memuat struktur menu navigasi...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-bold space-y-2">
            <MenuIcon className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {menus.length === 0
                ? 'Belum ada menu navigasi yang dibuat.'
                : 'Tidak ada menu yang sesuai kriteria pencarian/filter.'}
            </p>
            {menus.length === 0 ? (
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1 rounded-md transition"
                >
                  Terapkan Standar
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAdd()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1 rounded-md transition"
                >
                  + Tambah Menu
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setLevelFilter('all');
                  setCollapsedParents(new Set());
                }}
                className="text-[11px] text-indigo-600 hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[9px] font-black">
                  <th className="py-2 px-2.5 text-center w-8">No</th>
                  <th className="py-2 px-2.5 min-w-[260px]">Label Menu & Tautan Target</th>
                  <th className="py-2 px-2 min-w-[110px]">Tingkat</th>
                  <th className="py-2 px-2 text-center min-w-[85px]">Urutan</th>
                  <th className="py-2 px-2 min-w-[85px]">Target</th>
                  <th className="py-2 px-2 min-w-[100px]">Status</th>
                  <th className="py-2 px-3 text-right min-w-[145px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredList.map(({ item, level, parentTitle, hasChildren, childCount: kidsCount }, idx) => {
                  const isMoving = movingId === item.id;
                  const isCollapsed = collapsedParents.has(item.id);

                  // Indent padding style based on level
                  const indentPadding = level === 0 ? 'pl-0' : level === 1 ? 'pl-4' : level === 2 ? 'pl-8' : 'pl-12';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        !item.isVisible ? 'opacity-65 bg-slate-50/30 dark:bg-slate-900/30' : ''
                      } ${
                        level === 0
                          ? 'bg-white dark:bg-slate-900 font-semibold'
                          : level === 1
                          ? 'bg-slate-50/40 dark:bg-slate-850/20'
                          : 'bg-indigo-50/20 dark:bg-indigo-950/15'
                      }`}
                    >
                      {/* Nomor Baris */}
                      <td className="py-1.5 px-2.5 text-center font-bold text-slate-400 text-[10px]">
                        {idx + 1}
                      </td>

                      {/* Label Menu & Tautan (Indented by level) */}
                      <td className="py-1.5 px-2.5">
                        <div className={`flex items-center gap-1.5 ${indentPadding}`}>
                          {/* Indent connector / Chevron toggle */}
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleCollapse(item.id)}
                              className="p-0.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded transition cursor-pointer flex-shrink-0"
                              title={isCollapsed ? `Bentangkan ${kidsCount} sub-menu` : `Ciutkan ${kidsCount} sub-menu`}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                  !isCollapsed ? 'rotate-90 text-indigo-600 dark:text-indigo-400' : ''
                                }`}
                              />
                            </button>
                          ) : level > 0 ? (
                            <CornerDownRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 flex-shrink-0 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight truncate">
                                {item.title}
                              </span>

                              {/* Interactive Child Count Badge */}
                              {hasChildren && (
                                <button
                                  type="button"
                                  onClick={() => toggleCollapse(item.id)}
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition cursor-pointer"
                                  title="Klik untuk ciutkan/bentangkan sub-menu"
                                >
                                  {kidsCount} Sub {isCollapsed ? '▾' : '▴'}
                                </button>
                              )}

                              {item.isExternal && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded font-mono font-bold">
                                  <ExternalLink className="w-2.5 h-2.5" /> Tab Baru
                                </span>
                              )}
                            </div>

                            <div className="mt-0.5">
                              <code className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate block max-w-xs">
                                {item.url}
                              </code>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tingkat / Level */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        {level === 0 ? (
                          <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Utama
                          </span>
                        ) : level === 1 ? (
                          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700" title={`Sub dari: ${parentTitle || ''}`}>
                            Sub L1
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800" title={`Sub dari: ${parentTitle || ''}`}>
                            Sub L{level + 1}
                          </span>
                        )}
                      </td>

                      {/* Nomor Urut & Tombol Naik/Turun - Mini Compact */}
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-[10px] px-0.5">
                            {item.orderIndex}
                          </span>
                          <button
                            type="button"
                            disabled={isMoving}
                            onClick={() => handleMoveOrder(item, 'up')}
                            className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
                            title="Geser ke atas"
                          >
                            <ArrowUp className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isMoving}
                            onClick={() => handleMoveOrder(item, 'down')}
                            className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer"
                            title="Geser ke bawah"
                          >
                            <ArrowDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* Target Link */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.isExternal ? '_blank' : '_self'}
                        </span>
                      </td>

                      {/* Status & Saklar */}
                      <td className="py-1.5 px-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(item)}
                          className="inline-flex items-center gap-1 cursor-pointer group"
                          title={item.isVisible ? 'Klik untuk sembunyikan' : 'Klik untuk tampilkan'}
                        >
                          {item.isVisible ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Aktif
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Sembunyi
                            </span>
                          )}
                          <span className="text-slate-400 group-hover:text-slate-600">
                            {item.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </span>
                        </button>
                      </td>

                      {/* Aksi Multi-level: + Sub bisa untuk semua menu! */}
                      <td className="py-1.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Tombol Buat Sub-menu (bisa untuk menu utama maupun sub-menu!) */}
                          <button
                            type="button"
                            onClick={() => handleOpenAdd(item.id)}
                            className="inline-flex items-center gap-0.5 p-0.5 px-1.5 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[10px] font-bold transition cursor-pointer"
                            title={`Tambah Sub-menu ke "${item.title}"`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Sub</span>
                          </button>

                          {/* Tombol Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition cursor-pointer"
                            title="Edit Menu"
                          >
                            <Edit className="w-3 h-3" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition cursor-pointer"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3 h-3" />
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

      {/* Modal Tambah / Edit Menu - Mendukung Multi-Level Hierarchy */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {editingId ? 'Edit Menu Navigasi' : 'Tambah Menu Navigasi'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tentukan judul, link URL, dan menu induk (mendukung sub-menu bertingkat).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Nama / Label Menu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Regulasi Desa, Profil, Visi Misi..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  Tautan URL / Halaman Tujuan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="#profil, /galeri, atau https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-white font-mono text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />

                {/* Preset Link */}
                <div className="mt-1 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-normal">
                    Pilihan Cepat Target Bagian Halaman:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_URLS.map((p) => (
                      <button
                        key={p.url}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            url: p.url,
                            title: formData.title || p.label.split(' ')[0],
                          });
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition cursor-pointer ${
                          formData.url === p.url
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Hirarki / Menu Induk Dropdown (Mendukung Multi-Level) */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Hirarki / Menu Induk
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="NONE">-- Menu Utama (Baris Teratas) --</option>
                    {flatTree
                      .filter(({ item }) => !invalidParentIds.has(item.id))
                      .map(({ item, level }) => {
                        const indent = level === 0 ? '' : level === 1 ? '↳ ' : '  ↳↳ ';
                        return (
                          <option key={item.id} value={item.id}>
                            {indent}{item.title} ({level === 0 ? 'Utama' : `Sub L${level}`})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Urut Tampil
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-1.5 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-bold text-xs">
                    Tampilkan menu ini di website publik
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isExternal}
                    onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-normal text-xs">
                    Buka tautan di tab baru (dokumen/tautan luar)
                  </span>
                </label>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
