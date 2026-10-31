import React from 'react';
import Link from 'next/link';
import { ResolvedTenant } from '@/lib/tenant/resolver';
import {
  Newspaper,
  Calendar,
  Eye,
  TrendingUp,
  ArrowRight,
  BookOpen,
  MapPin,
  ChevronRight,
  Megaphone,
  Landmark,
  FileText,
  Clock,
  Award,
} from 'lucide-react';
import { formatAnnouncementDateTime } from '@/lib/timezone';
import { formatKodeKemendagri } from '@/lib/formatters';

interface ThemeProps {
  tenant: ResolvedTenant;
  data: {
    articles: any[];
    announcements: any[];
    officials: any[];
    apbdes: any[];
  };
}

export default function ModernEditorialTheme({ tenant, data }: ThemeProps) {
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const featuredArticle = data.articles[0];
  const sideArticles = data.articles.slice(1);

  const totalPendapatan = data.apbdes
    .filter((i) => i.category === 'Pendapatan')
    .reduce((sum, curr) => sum + curr.realization, 0);

  const totalBelanja = data.apbdes
    .filter((i) => i.category === 'Belanja')
    .reduce((sum, curr) => sum + curr.realization, 0);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 font-sans antialiased selection:bg-stone-900 selection:text-white">
      {/* 1. Official Press Bar */}
      <div className="border-b border-stone-200 bg-white py-2.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center text-xs text-stone-500 font-medium gap-3">
          <div className="flex items-center gap-3">
            <span className="font-black text-stone-950 uppercase tracking-widest text-[11px] bg-stone-100 px-2.5 py-0.5 rounded border border-stone-300">
              PUBLIKASI RESMI
            </span>
            <span>•</span>
            <span className="font-semibold text-stone-800">
              Kec. {tenant.kecamatan}, Kab. {tenant.kabupaten}, Prov. {tenant.provinsi}
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hidden sm:inline">Edisi Digital Tahun Anggaran 2026</span>
            <span className="bg-stone-900 text-stone-100 px-2.5 py-0.5 rounded font-mono text-[10px] font-bold">
              Kode Desa: {formatKodeKemendagri(tenant.kodeDesa)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Prestigious Editorial Masthead */}
      <header className="border-b-4 border-stone-950 py-10 px-4 sm:px-8 bg-white text-center">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-stone-700 text-xs font-black uppercase tracking-[0.3em]">
            <span>Warta Publik</span>
            <span>•</span>
            <span>Transparansi Anggaran</span>
            <span>•</span>
            <span>Layanan Mandiri</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-stone-950 uppercase">
            WARTA DESA {tenant.namaDesa}
          </h1>

          <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto italic font-serif leading-relaxed">
            &ldquo;{tenant.visi || 'Mewujudkan transparansi informasi publik dan pelayanan prima bagi seluruh warga.'}&rdquo;
          </p>
        </div>

        {/* Editorial Subnav */}
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-700 gap-4">
          <nav className="flex items-center gap-6">
            <Link href="#laporan-utama" className="hover:text-stone-950 transition">Laporan Utama</Link>
            <Link href="#kabar-warga" className="hover:text-stone-950 transition">Kabar Warga</Link>
            <Link href="#pamong" className="hover:text-stone-950 transition">Pamong Desa</Link>
            <Link href="#anggaran" className="hover:text-stone-950 transition">Infografis APBDes</Link>
          </nav>

          <Link
            href="/admin"
            className="bg-stone-950 hover:bg-stone-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition"
          >
            Ruang Redaksi / Admin
          </Link>
        </div>
      </header>

      {/* 3. Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-16">
        
        {/* Featured Story & Side Column */}
        <section id="laporan-utama" className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-b border-stone-300 pb-14">
          {featuredArticle ? (
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center gap-2">
                <span className="bg-stone-950 text-white text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded">
                  Laporan Utama
                </span>
                <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">
                  {featuredArticle.category?.name || 'Pembangunan'}
                </span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-serif font-black text-stone-950 leading-tight hover:text-stone-700 transition">
                <Link href={`/berita/${featuredArticle.slug}?tenant=${tenant.slug}`}>
                  {featuredArticle.title}
                </Link>
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pb-2 border-b border-stone-200">
                <span className="font-bold text-stone-900">Penulis: {featuredArticle.authorName || featuredArticle.author?.name || 'Redaksi Desa'}</span>
                <span>•</span>
                <span>{new Date(featuredArticle.publishedAt || featuredArticle.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                <span>•</span>
                <span>{featuredArticle.viewCount} Pembaca</span>
              </div>

              {/* Real Photo Covering Full Width */}
              <div className="relative h-80 sm:h-[420px] rounded-2xl overflow-hidden shadow-lg border border-stone-200 group">
                <img
                  loading="lazy"
                  decoding="async"
                  src={featuredArticle.coverImageUrl || tenant.heroImageUrl || '/images/desa_irigasi_pertanian.jpg'}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950/90 via-stone-950/50 to-transparent p-5 text-white">
                  <p className="text-xs text-stone-300 font-mono">
                    Dokumentasi Lapangan • Pemerintah Desa {tenant.namaDesa}
                  </p>
                </div>
              </div>

              <p className="text-base sm:text-lg text-stone-700 leading-relaxed font-serif pt-2 first-letter:text-5xl first-letter:font-black first-letter:float-left first-letter:mr-3 first-letter:text-stone-950">
                {featuredArticle.summary}
              </p>

              <div className="pt-2">
                <Link
                  href={`/berita/${featuredArticle.slug}?tenant=${tenant.slug}`}
                  className="inline-flex items-center gap-2 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold px-5 py-3 rounded-xl transition"
                >
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center bg-white border border-stone-300 rounded-2xl text-stone-500">
              Belum ada artikel utama.
            </div>
          )}

          {/* Kolom Berita Sampingan & Maklumat */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="text-xs font-black tracking-widest uppercase border-b-2 border-stone-950 pb-2 text-stone-950">
                Warta Terkini
              </h3>
              <div className="divide-y divide-stone-200 mt-4">
                {sideArticles.map((art) => (
                  <article key={art.id} className="py-4 space-y-2 group">
                    <div className="flex gap-3 items-start">
                      {art.coverImageUrl && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={art.coverImageUrl}
                          alt={art.title}
                          className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-stone-200"
                        />
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-stone-600 block uppercase tracking-wider">
                          {art.category?.name || 'Kabar Desa'}
                        </span>
                        <h4 className="font-serif font-black text-sm text-stone-950 group-hover:text-stone-700 transition leading-snug">
                          <Link href={`/berita/${art.slug}?tenant=${tenant.slug}`}>
                            {art.title}
                          </Link>
                        </h4>
                        <span className="text-[10px] text-stone-400 mt-1 block">
                          {new Date(art.publishedAt || art.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}

                {sideArticles.length === 0 && (
                  <p className="text-xs text-stone-400 italic py-4">Belum ada warta tambahan.</p>
                )}
              </div>
            </div>

            {/* Papan Pengumuman Redaksi */}
            <div className="bg-white p-6 rounded-2xl border border-stone-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-950 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-stone-950" />
                  Maklumat Resmi
                </h4>
                <span className="text-[10px] font-bold bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-300">
                  {data.announcements.length} Edaran
                </span>
              </div>

              <div className="space-y-3.5">
                {data.announcements.map((ann) => (
                  <div key={ann.id} className="text-xs space-y-1.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <span className="font-bold text-stone-950 block">{ann.title}</span>
                    <p className="text-stone-600 leading-relaxed text-[11px]">{ann.content}</p>
                    <span className="text-[10px] text-stone-500 font-medium flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      {formatAnnouncementDateTime(ann.createdAt, tenant?.provinsi)}
                    </span>
                  </div>
                ))}
                {data.announcements.length === 0 && (
                  <p className="text-xs text-stone-400 italic text-center py-4">Tidak ada maklumat baru.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Struktur Pamong & Transparansi Anggaran */}
        <section id="pamong" className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Pamong Desa dengan Foto */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-black tracking-widest uppercase border-b-2 border-stone-950 pb-2 text-stone-950">
              Aparatur Pelayan Masyarakat
            </h3>
            <div className="space-y-3">
              {data.officials.map((ofc) => (
                <div key={ofc.id} className="flex items-center gap-3.5 p-3.5 bg-white border border-stone-200 rounded-2xl shadow-sm">
                  {ofc.photoUrl ? (
                    <img
                      loading="lazy"
                      decoding="async"
                      src={ofc.photoUrl}
                      alt={ofc.name}
                      className="w-12 h-12 rounded-xl object-cover object-top border border-stone-300 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-stone-900 text-white font-bold flex items-center justify-center flex-shrink-0">
                      {ofc.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-sm text-stone-950 truncate">{ofc.name}</h5>
                    <span className="text-xs text-stone-600 block">{ofc.position}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-stone-100 text-stone-800 px-2 py-0.5 rounded border border-stone-300">
                    Aktif
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparansi APBDes */}
          <div id="anggaran" className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-stone-950 pb-2">
              <h3 className="text-xs font-black tracking-widest uppercase text-stone-950">
                Infografis APBDes 2026
              </h3>
              <span className="text-xs font-bold text-stone-700">
                Total Realisasi: {formatRupiah(totalPendapatan)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {data.apbdes.map((item) => {
                const pct = item.budget > 0 ? Math.min(100, Math.round((item.realization / item.budget) * 100)) : 0;
                return (
                  <div key={item.id} className="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-stone-900 truncate pr-2">{item.accountName}</span>
                      <span className="text-stone-950 font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                      <div className="bg-stone-900 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500 pt-1">
                      <span>Target: {formatRupiah(item.budget)}</span>
                      <span className="font-bold text-stone-900">{formatRupiah(item.realization)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* 4. Editorial Footer */}
      <footer className="border-t-4 border-stone-950 bg-white py-12 px-4 sm:px-8 text-center text-xs text-stone-600">
        <div className="max-w-4xl mx-auto space-y-3">
          <p className="font-serif font-black text-lg text-stone-950 uppercase tracking-wider">
            PEMERINTAH DESA {tenant.namaDesa.toUpperCase()}
          </p>
          <p className="text-stone-500">
            Kecamatan {tenant.kecamatan}, Kabupaten {tenant.kabupaten}, Provinsi {tenant.provinsi}
          </p>
          <div className="pt-4 border-t border-stone-200 text-stone-400 text-[11px] flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© 2026 Seluruh Hak Cipta Dilindungi Undang-Undang Republik Indonesia.</span>
            <span className="font-mono">Tema: Modern Editorial • Multi-Tenant Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
