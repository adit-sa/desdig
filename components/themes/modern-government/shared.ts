import type React from 'react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';

export interface ThemeData {
  articles: any[];
  announcements: any[];
  officials: any[];
  apbdes: any[];
  gallery?: any[];
  menus?: any[];
  pembangunan?: any[];
  themeConfig?: any;
}

export interface ThemeProps {
  tenant: ResolvedTenant;
  data: ThemeData;
}

export type Setter<T> = React.Dispatch<React.SetStateAction<T>>;
export type SectionOrderFn = (sectionId: string) => number;

export const formatRupiah = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);

/** Tautan internal selalu membawa ?tenant= agar navigasi tetap terisolasi per tenant. */
export const buildTenantHref = (url: string, tenantSlug: string) => {
  if (!url || url === '#') return '#';
  if (/^(https?:|mailto:|tel:)/.test(url) || url.startsWith('#')) return url;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  if (cleanUrl.includes('?tenant=') || cleanUrl.includes('&tenant=')) return cleanUrl;
  const sep = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${sep}tenant=${tenantSlug}`;
};

export const handleScrollToSection = (e: React.MouseEvent, targetHash: string) => {
  if (!targetHash || !targetHash.startsWith('#')) return;
  const id = targetHash.replace(/^#/, '');
  if (typeof window !== 'undefined') {
    const el = id && id !== 'beranda' ? document.getElementById(id) : null;
    if (window.location.pathname !== '/' && !el) {
      // Sedang di halaman sub (seperti /galeri, /pembangunan) dan section tidak ada di halaman ini.
      // Jangan preventDefault, biarkan Link mengarahkan ke beranda.
      return;
    }
  }
  e.preventDefault();
  if (!id || id === 'beranda') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
};

/** Label Kategori Jabatan SOTK */
export const getRoleTag = (position: string) => {
  const p = position.toLowerCase();
  if (p.includes('kepala desa') || p.includes('kades')) {
    return { label: 'Kepala Desa', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  }
  if (p.includes('sekretaris')) {
    return { label: 'Sekretariat Desa', bg: 'bg-teal-100 text-teal-800 border-teal-300' };
  }
  if (p.includes('kasi')) {
    return { label: 'Kepala Seksi', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
  }
  if (p.includes('kaur')) {
    return { label: 'Kepala Urusan', bg: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
  }
  if (p.includes('dusun')) {
    return { label: 'Kepala Dusun', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
  }
  if (p.includes('bpd')) {
    return { label: 'Badan Permusyawaratan', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  return { label: 'Perangkat Desa', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
};

const sumBy = (items: any[], category: string, field: 'realization' | 'budget') =>
  items.filter((i) => i.category === category).reduce((sum, curr) => sum + (curr[field] || 0), 0);

const pct = (part: number, whole: number) => (whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0);

/** Ringkasan APBDes dipakai bersama oleh StatsSection & ApbdesSection. */
export const summarizeApbdes = (apbdes: any[]) => {
  const totalPendapatan = sumBy(apbdes, 'Pendapatan', 'realization');
  const totalAnggaranPendapatan = sumBy(apbdes, 'Pendapatan', 'budget');
  const totalBelanja = sumBy(apbdes, 'Belanja', 'realization');
  const totalAnggaranBelanja = sumBy(apbdes, 'Belanja', 'budget');
  return {
    totalPendapatan,
    totalAnggaranPendapatan,
    persenTotalPendapatan: pct(totalPendapatan, totalAnggaranPendapatan),
    totalBelanja,
    totalAnggaranBelanja,
    persenTotalBelanja: pct(totalBelanja, totalAnggaranBelanja),
    apbdesYear: apbdes.length > 0 ? apbdes[0].year : 2025,
    countPendapatan: apbdes.filter((i) => i.category === 'Pendapatan').length,
    countBelanja: apbdes.filter((i) => i.category === 'Belanja').length,
    countPembiayaan: apbdes.filter((i) => i.category === 'Pembiayaan').length,
  };
};

export const isProjectDone = (p: any) =>
  (p.status || '').toLowerCase().includes('selesai') || (p.progressPersen || 0) >= 100;

/** Deteksi zona waktu otomatis di Indonesia berdasarkan nama provinsi */
export function getTimezoneByProvince(provinsi?: string | null): 'WIB' | 'WITA' | 'WIT' {
  if (!provinsi) return 'WIB';
  const p = provinsi.toLowerCase();
  if (p.includes('papua') || p.includes('maluku')) return 'WIT';
  if (
    p.includes('sulawesi') ||
    p.includes('gorontalo') ||
    p.includes('bali') ||
    p.includes('nusa tenggara') ||
    p.includes('ntb') ||
    p.includes('ntt') ||
    p.includes('kalimantan selatan') ||
    p.includes('kalsel') ||
    p.includes('kalimantan timur') ||
    p.includes('kaltim') ||
    p.includes('kalimantan utara') ||
    p.includes('kaltra')
  ) {
    return 'WITA';
  }
  return 'WIB';
}

/** Tautan kanal pengaduan warga dinamis per tenant */
export function getPengaduanUrl(tenant: ResolvedTenant, themeConfig?: any): string {
  if (themeConfig?.pengaduan_url) return themeConfig.pengaduan_url;
  if (tenant.socialMedia?.whatsapp) {
    const wa = tenant.socialMedia.whatsapp.replace(/[^0-9]/g, '');
    if (wa) {
      return `https://wa.me/${wa}?text=Halo%20Admin%20Desa%20${encodeURIComponent(tenant.namaDesa)}%2C%20saya%20ingin%20menyampaikan%20aspirasi%20atau%20pengaduan`;
    }
  }
  if (tenant.telepon) return `tel:${tenant.telepon}`;
  if (tenant.email) return `mailto:${tenant.email}?subject=Pengaduan%20Warga%20Desa%20${encodeURIComponent(tenant.namaDesa)}`;
  return `/layanan?tenant=${encodeURIComponent(tenant.slug)}#aduan`;
}

/** Tautan PPID / Dokumen Keterbukaan Informasi Publik per tenant */
export function getPpidUrl(tenant: ResolvedTenant, themeConfig?: any): string {
  if (themeConfig?.ppid_url) return themeConfig.ppid_url;
  return `/layanan?tenant=${encodeURIComponent(tenant.slug)}#ppid`;
}

