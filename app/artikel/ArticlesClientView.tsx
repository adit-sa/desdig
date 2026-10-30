'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import TopBar from '@/components/themes/modern-government/TopBar';
import SiteHeader from '@/components/themes/modern-government/SiteHeader';
import SiteFooter from '@/components/themes/modern-government/SiteFooter';
import { buildTenantHref } from '@/components/themes/modern-government/shared';
import {
  Search,
  Calendar,
  Eye,
  User,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Filter,
  BookOpen,
  Landmark,
  SlidersHorizontal,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export interface ArticleItem {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  coverImageUrl: string | null;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
  category: {
    id?: string;
    name: string;
    slug?: string;
  } | null;
  author: {
    name: string;
  } | null;
}

interface ArticlesClientViewProps {
  tenant: ResolvedTenant;
  initialArticles: ArticleItem[];
  categories: Array<{ id: string; name: string; slug: string }>;
  initialCategory?: string;
  menus?: any[];
}

const ITEMS_PER_PAGE = 9;

export default function ArticlesClientView({
  tenant,
  initialArticles,
  categories,
  initialCategory,
  menus,
}: ArticlesClientViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Sort Articles
  const filteredArticles = useMemo(() => {
    let result = [...initialArticles];

    // Filter Kategori
    if (selectedCategory !== 'ALL') {
      const targetCat = selectedCategory.toLowerCase();
      result = result.filter(
        (a) =>
          a.category?.name?.toLowerCase() === targetCat ||
          a.category?.slug?.toLowerCase() === targetCat ||
          a.category?.name?.toLowerCase().includes(targetCat)
      );
    }

    // Filter Pencarian Teks
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.summary && a.summary.toLowerCase().includes(q)) ||
          a.content.toLowerCase().includes(q) ||
          (a.author?.name && a.author.name.toLowerCase().includes(q))
      );
    }

    // Pengurutan (Sorting)
    if (sortBy === 'newest') {
      result.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.createdAt).getTime();
        const dateB = new Date(b.publishedAt || b.createdAt).getTime();
        return dateA - dateB;
      });
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    return result;
  }, [initialArticles, selectedCategory, searchQuery, sortBy]);

  // Hitung Paginasi
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE) || 1;
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredArticles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredArticles, currentPage]);

  // Reset page saat filter/search berubah
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const fallbackImage = tenant.heroImageUrl || '/images/desa_irigasi_pertanian.jpg';
  const layoutMode = (tenant.themeConfig?.settings?.layout_mode as 'fixed' | 'fluid') || 'fixed';

  return (
    <div
      data-theme="modern-government"
      data-layout={layoutMode}
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans ${
        layoutMode === 'fluid' ? 'layout-fluid' : 'layout-fixed'
      }`}
    >
      {/* 1. Official Government Top Bar Konsisten dengan Beranda */}
      <TopBar tenant={tenant} />

      {/* 2. Main Navigation Header Konsisten dengan Beranda */}
      <SiteHeader tenant={tenant} menus={menus} />

      {/* 2. Hero Header Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="max-w-7xl mx-auto relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Link href={buildTenantHref('/', tenant.slug)} className="hover:underline">
                Beranda
              </Link>
              <span>/</span>
              <span className="text-slate-300">Warta & Kabar Desa</span>
            </div>

            <BackButton
              fallbackUrl={buildTenantHref('/', tenant.slug)}
              label="Kembali ke Beranda"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer"
              iconClassName="w-3.5 h-3.5 text-emerald-400"
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Arsip Publikasi & Warta Desa</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                Kabar & Warta Desa {tenant.namaDesa}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                Pusat informasi resmi pembangunan, kegiatan kemasyarakatan, pengumuman, dan transparansi tata kelola Pemerintah Desa {tenant.namaDesa}.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3 rounded-2xl">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Total Publikasi
                </span>
                <span className="text-2xl font-black text-white">{initialArticles.length}</span>
                <span className="text-xs text-slate-300 ml-1">Artikel</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Kategori
                </span>
                <span className="text-2xl font-black text-white">{categories.length || '3+'}</span>
                <span className="text-xs text-slate-300 ml-1">Kanal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Controls & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 w-full">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul artikel, topik pembangunan, atau kata kunci..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Reset
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="newest">Terbaru Terbit</option>
              <option value="popular">Paling Banyak Dibaca</option>
              <option value="oldest">Arsip Terlama</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategoryChange('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white shadow-emerald-700/20'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Semua Artikel ({initialArticles.length})
          </button>

          {categories.map((cat) => {
            const count = initialArticles.filter(
              (a) => a.category?.name?.toLowerCase() === cat.name.toLowerCase()
            ).length;

            return (
              <button
                key={cat.id || cat.name}
                onClick={() => handleCategoryChange(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-emerald-600 text-white shadow-emerald-700/20'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.name} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Article Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-6">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-900 dark:text-white font-bold">
              {filteredArticles.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)}
            </strong>{' '}
            dari <strong className="text-slate-900 dark:text-white">{filteredArticles.length}</strong> artikel terbit
          </span>
          {selectedCategory !== 'ALL' && (
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Kategori: {selectedCategory}
            </span>
          )}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tidak Ada Artikel Ditemukan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Tidak ditemukan artikel yang sesuai dengan pencarian &ldquo;{searchQuery}&rdquo; pada kategori yang dipilih.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
            >
              Reset Filter & Pencarian
            </button>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedArticles.map((art) => (
            <article
              key={art.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Image Cover */}
                <div className="h-48 relative overflow-hidden bg-slate-900">
                  <img
                    src={art.coverImageUrl || fallbackImage}
                    alt={art.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImage;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  {/* Category Pill Tag */}
                  <span className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow">
                    {art.category?.name || 'Warta Desa'}
                  </span>

                  {/* Date & Views */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span className="flex items-center gap-1 font-medium text-[11px] text-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {new Date(art.publishedAt || art.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-300">
                      <Eye className="w-3.5 h-3.5" />
                      {art.viewCount} kali dibaca
                    </span>
                  </div>
                </div>

                {/* Article Content Preview */}
                <div className="p-5 space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {art.summary || art.content.replace(/<[^>]*>?/gm, '').slice(0, 160) + '...'}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{art.author?.name || 'Redaksi SID'}</span>
                  </span>
                  <Link
                    href={`/berita/${art.slug}?tenant=${tenant.slug}`}
                    className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition text-xs"
                  >
                    <span>Baca Lengkap</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 5. Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-6">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Halaman <strong className="text-slate-900 dark:text-white font-bold">{currentPage}</strong> dari{' '}
              <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              {/* Page Number Buttons */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && page - prev > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                            currentPage === page
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tombol Navigasi Kembali di Bagian Bawah */}
        <div className="pt-12 pb-4 flex justify-center">
          <BackButton
            fallbackUrl={`/?tenant=${tenant.slug}`}
            label="Kembali ke Halaman Sebelumnya"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 px-6 py-3 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
            iconClassName="w-4 h-4 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </main>

      {/* 4. Footer Konsisten dengan Beranda */}
      <SiteFooter tenant={tenant} />
    </div>
  );
}
