'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  TrendingUp,
  ShieldCheck,
  Megaphone,
  Camera,
  Globe,
  ShoppingBag,
  MapPin,
  Heart,
  BookOpen,
  Phone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { handleScrollToSection, getPpidUrl, getPengaduanUrl } from './shared';

export interface QuickLinkItem {
  id?: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
  color?: string;
  target?: '_self' | '_blank';
}

const COLOR_MAP: Record<
  string,
  { bg: string; text: string; hoverBg: string; hoverBorder: string; hoverText: string }
> = {
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    hoverBg: 'group-hover:bg-emerald-600',
    hoverBorder: 'hover:border-emerald-500',
    hoverText: 'group-hover:text-emerald-700',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    hoverBg: 'group-hover:bg-teal-600',
    hoverBorder: 'hover:border-teal-500',
    hoverText: 'group-hover:text-teal-700',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    hoverBg: 'group-hover:bg-rose-600',
    hoverBorder: 'hover:border-rose-500',
    hoverText: 'group-hover:text-rose-700',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hoverBg: 'group-hover:bg-amber-600',
    hoverBorder: 'hover:border-amber-500',
    hoverText: 'group-hover:text-amber-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    hoverBg: 'group-hover:bg-cyan-600',
    hoverBorder: 'hover:border-cyan-500',
    hoverText: 'group-hover:text-cyan-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    hoverBg: 'group-hover:bg-indigo-600',
    hoverBorder: 'hover:border-indigo-500',
    hoverText: 'group-hover:text-indigo-700',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    hoverBg: 'group-hover:bg-blue-600',
    hoverBorder: 'hover:border-blue-500',
    hoverText: 'group-hover:text-blue-700',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    hoverBg: 'group-hover:bg-purple-600',
    hoverBorder: 'hover:border-purple-500',
    hoverText: 'group-hover:text-purple-700',
  },
  slate: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    hoverBg: 'group-hover:bg-slate-700',
    hoverBorder: 'hover:border-slate-500',
    hoverText: 'group-hover:text-slate-900',
  },
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-text': FileText,
  'shield': ShieldCheck,
  'megaphone': Megaphone,
  'trending-up': TrendingUp,
  'camera': Camera,
  'users': Users,
  'globe': Globe,
  'shopping-bag': ShoppingBag,
  'map-pin': MapPin,
  'heart': Heart,
  'book': BookOpen,
  'phone': Phone,
  'external-link': ExternalLink,
  'sparkles': Sparkles,
};

export default function QuickLinksSection({
  tenant,
  themeConfig,
}: {
  tenant: ResolvedTenant;
  themeConfig?: any;
}) {
  const ql = themeConfig?.quick_links || {};
  const badgeText = ql.badge?.trim() || 'Layanan Terpadu Mandiri';
  const titleText = ql.title?.trim() || 'Pusat Pelayanan & Informasi Publik Desa';
  const descText =
    ql.description?.trim() ||
    'Akses langsung seluruh administrasi surat, permohonan informasi PPID, saluran aduan, dan transparansi anggaran desa.';
  const ppidUrl = ql.ppidUrl?.trim() || getPpidUrl(tenant, themeConfig);
  const pengaduanUrl = ql.pengaduanUrl?.trim() || getPengaduanUrl(tenant, themeConfig);

  const defaultItems: QuickLinkItem[] = [
    {
      id: 'surat',
      title: 'Administrasi Surat',
      description: 'Layanan surat keterangan mandiri',
      url: `/layanan?tenant=${tenant.slug}`,
      icon: 'file-text',
      color: 'emerald',
      target: '_self',
    },
    {
      id: 'ppid',
      title: 'PPID Informasi',
      description: 'Permohonan data publik resmi',
      url: ppidUrl,
      icon: 'shield',
      color: 'teal',
      target: ppidUrl.startsWith('http') ? '_blank' : '_self',
    },
    {
      id: 'pengaduan',
      title: 'Lapor & Aspirasi',
      description: 'Saluran aduan langsung warga',
      url: pengaduanUrl,
      icon: 'megaphone',
      color: 'rose',
      target: pengaduanUrl.startsWith('http') ? '_blank' : '_self',
    },
    {
      id: 'apbdes',
      title: 'Dana Desa APBDes',
      description: 'Realisasi belanja transparan',
      url: '#apbdes',
      icon: 'trending-up',
      color: 'amber',
      target: '_self',
    },
    {
      id: 'galeri',
      title: 'Galeri Foto',
      description: 'Potret kegiatan pembangunan',
      url: `/galeri?tenant=${tenant.slug}`,
      icon: 'camera',
      color: 'cyan',
      target: '_self',
    },
    {
      id: 'pamong',
      title: 'Aparatur Desa',
      description: 'Status absensi hari ini',
      url: '#pamong',
      icon: 'users',
      color: 'indigo',
      target: '_self',
    },
  ];

  const items: QuickLinkItem[] =
    Array.isArray(ql.items) && ql.items.length > 0
      ? ql.items.map((it: QuickLinkItem) => {
          let resolvedUrl = (it.url || '').trim();
          if (!resolvedUrl && it.id === 'pengaduan') {
            resolvedUrl = pengaduanUrl;
          } else if (!resolvedUrl && it.id === 'ppid') {
            resolvedUrl = ppidUrl;
          }
          return {
            ...it,
            url: resolvedUrl,
          };
        })
      : defaultItems;

  return (
    <section className="w-full pt-4 sm:pt-6 scroll-reveal">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-black text-emerald-700 tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          {badgeText}
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
          {titleText}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {descText}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.map((item, index) => {
          const rawUrl = item.url || '';
          const resolvedUrl = rawUrl.replace(/\{tenant\}/g, tenant.slug);
          const isAnchor = resolvedUrl.startsWith('#');
          const isHttp = resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://');
          const target = item.target || (isHttp ? '_blank' : '_self');
          const rel = target === '_blank' ? 'noopener noreferrer' : undefined;

          const colorKey = item.color || 'emerald';
          const colorConfig = COLOR_MAP[colorKey] || COLOR_MAP.emerald;
          const iconKey = item.icon || 'globe';
          const IconComponent = ICON_MAP[iconKey] || Globe;

          return (
            <Link
              key={item.id || index}
              href={resolvedUrl || '#'}
              target={target}
              rel={rel}
              onClick={isAnchor ? (e) => handleScrollToSection(e, resolvedUrl) : undefined}
              className={`scroll-reveal stagger-${(index % 6) + 1} group bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm hover:shadow-xl ${colorConfig.hoverBorder} transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1`}
            >
              <div
                className={`w-12 h-12 rounded-xl ${colorConfig.bg} ${colorConfig.text} flex items-center justify-center group-hover:scale-110 ${colorConfig.hoverBg} group-hover:text-white transition-all duration-300 mb-3 shadow-sm`}
              >
                <IconComponent className="w-6 h-6" />
              </div>
              <h4
                className={`font-extrabold text-xs text-slate-900 ${colorConfig.hoverText} transition-colors line-clamp-1`}
              >
                {item.title}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
