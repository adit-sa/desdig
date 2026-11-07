'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Users, ChevronRight, Landmark, ExternalLink, X, ChevronDown, Menu as MenuBurger } from 'lucide-react';
import type { ResolvedTenant } from '@/lib/tenant/resolver';
import { buildTenantHref, handleScrollToSection } from './shared';
import { ThemeColorStyle } from './themeColors';
import SafeImage from '@/components/SafeImage';

export default function SiteHeader({ tenant, menus }: { tenant: ResolvedTenant; menus?: any[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Olah struktur hierarki menu navigasi website (hingga 3 level: Root -> Child -> Sub-child)
  const dynamicMenuTree = useMemo(() => {
    if (!menus || menus.length === 0) return null;
    const roots = menus.filter((m: any) => !m.parentId);
    return roots.map((root: any) => ({
      ...root,
      children: menus
        .filter((m: any) => m.parentId === root.id)
        .map((child: any) => ({
          ...child,
          children: menus.filter((sub: any) => sub.parentId === child.id),
        })),
    }));
  }, [menus]);

  // Pisahkan menu utama (6 teratas) dan menu overflow (Lainnya) untuk desktop
  const primaryMenus = dynamicMenuTree ? dynamicMenuTree.slice(0, 6) : [];
  const overflowMenus = dynamicMenuTree ? dynamicMenuTree.slice(6) : [];

  // Helper navigasi internal tenant aman (mendukung cross-page anchor routing)
  const buildMenuHref = (url: string) => {
    if (!url || url === '#') return '#';
    if (url.startsWith('#')) {
      return buildTenantHref(`/${url}`, tenant.slug);
    }
    return buildTenantHref(url, tenant.slug);
  };
  const rawNamaDesa = tenant.namaDesa || '';
  const cleanNamaDesa = rawNamaDesa.replace(/^(desa|kelurahan)\s+/i, '');
  const prefixWilayah = /kelurahan/i.test(rawNamaDesa) ? 'Kelurahan' : 'Desa';

  return (
    <>
      <ThemeColorStyle tenant={tenant} />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link href={`/?tenant=${tenant.slug}`} className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0 mr-3 sm:mr-6">
          {/* Logo Desa Bebas Kotak Luar (Frameless) */}
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300 relative">
            {tenant.logoUrl ? (
              tenant.logoUrl.endsWith('.webm') ||
              tenant.logoUrl.endsWith('.mp4') ||
              tenant.logoUrl.includes('webm') ||
              tenant.logoUrl.includes('mp4') ? (
                <video
                  src={tenant.logoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              ) : (
                <SafeImage
                  src={tenant.logoUrl}
                  alt={`Logo ${tenant.namaDesa}`}
                  fill
                  priority
                  sizes="(max-width: 640px) 40px, 48px"
                  className="object-contain filter drop-shadow-sm"
                />
              )
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-md">
                <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 leading-tight">
              Website Resmi
            </span>
            <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition leading-tight">
              {prefixWilayah} {cleanNamaDesa}
            </span>
            {(tenant.kecamatan || tenant.kabupaten) && (
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5 truncate">
                {tenant.kecamatan && `Kec. ${tenant.kecamatan}`}
                {tenant.kecamatan && tenant.kabupaten && ', '}
                {tenant.kabupaten && `Kab. ${tenant.kabupaten}`}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Link
            href={buildTenantHref('/', tenant.slug)}
            onClick={(e) => handleScrollToSection(e, '#beranda')}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150 whitespace-nowrap"
          >
            Beranda
          </Link>

          {primaryMenus.length > 0 ? (
            primaryMenus.map((item: any) => {
              if (item.children && item.children.length > 0) {
                return (
                  <div key={item.id} className="relative group py-1">
                    <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 group-hover:bg-emerald-100/80 group-hover:text-emerald-900 transition-all duration-150 cursor-pointer whitespace-nowrap">
                      {item.url && item.url !== '#' ? (
                        <Link
                          href={buildMenuHref(item.url)}
                          onClick={item.url.startsWith('#') ? (e) => handleScrollToSection(e, item.url) : undefined}
                          target={item.isExternal ? '_blank' : undefined}
                          rel={item.isExternal ? 'noopener noreferrer' : undefined}
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span>{item.title}</span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 group-hover:text-emerald-800 transition-transform duration-200" />
                    </div>

                    {/* Dropdown Level 2 */}
                    <div className="absolute top-full left-0 hidden group-hover:flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-xl p-1.5 min-w-[230px] max-w-xs z-50 animate-in fade-in-50 duration-150">
                      {item.children.map((sub: any) => {
                        if (sub.children && sub.children.length > 0) {
                          return (
                            <div key={sub.id} className="relative group/sub">
                              <div className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug cursor-pointer group/item">
                                <Link
                                  href={buildMenuHref(sub.url)}
                                  onClick={sub.url.startsWith('#') ? (e) => handleScrollToSection(e, sub.url) : undefined}
                                  target={sub.isExternal ? '_blank' : undefined}
                                  rel={sub.isExternal ? 'noopener noreferrer' : undefined}
                                  className="truncate flex-1 group-hover/item:text-white"
                                >
                                  {sub.title}
                                </Link>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-white transition flex-shrink-0" />
                              </div>

                              {/* Flyout Dropdown Level 3 (Sub-tree) */}
                              <div className="absolute top-0 left-full hidden group-hover/sub:flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1.5 min-w-[280px] max-w-sm z-50 animate-in fade-in-50 duration-150 ml-1">
                                {sub.children.map((subItem: any) => (
                                  <Link
                                    key={subItem.id}
                                    href={buildMenuHref(subItem.url)}
                                    onClick={subItem.url.startsWith('#') ? (e) => handleScrollToSection(e, subItem.url) : undefined}
                                    target={subItem.isExternal ? '_blank' : undefined}
                                    rel={subItem.isExternal ? 'noopener noreferrer' : undefined}
                                    className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug group/flyout"
                                  >
                                    <span className="truncate group-hover/flyout:text-white">{subItem.title}</span>
                                    {subItem.isExternal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/flyout:text-white flex-shrink-0" />}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={sub.id}
                            href={buildMenuHref(sub.url)}
                            onClick={sub.url.startsWith('#') ? (e) => handleScrollToSection(e, sub.url) : undefined}
                            target={sub.isExternal ? '_blank' : undefined}
                            rel={sub.isExternal ? 'noopener noreferrer' : undefined}
                            className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug group/leaf"
                          >
                            <span className="truncate group-hover/leaf:text-white">{sub.title}</span>
                            {sub.isExternal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/leaf:text-white flex-shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={item.id}
                  href={buildMenuHref(item.url)}
                  onClick={item.url.startsWith('#') ? (e) => handleScrollToSection(e, item.url) : undefined}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150 whitespace-nowrap"
                >
                  {item.title}
                </Link>
              );
            })
          ) : (
            <>
              <Link href={buildMenuHref('#profil')} onClick={(e) => handleScrollToSection(e, '#profil')} className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150">Profil</Link>
              <Link href={buildMenuHref('#pamong')} onClick={(e) => handleScrollToSection(e, '#pamong')} className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150">Aparatur</Link>
              <Link href={buildMenuHref('#berita')} onClick={(e) => handleScrollToSection(e, '#berita')} className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150">Warta Desa</Link>
              <Link href={buildMenuHref('#pengumuman')} onClick={(e) => handleScrollToSection(e, '#pengumuman')} className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150">Pengumuman</Link>
              <Link href={buildMenuHref('/galeri')} className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150">Galeri Foto</Link>
              <Link href={buildMenuHref('#apbdes')} onClick={(e) => handleScrollToSection(e, '#apbdes')} className="px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 transition-all duration-150">Transparansi APBDes</Link>
            </>
          )}

          {/* Overflow Dropdown 'Lainnya' jika menu lebih dari 6 */}
          {overflowMenus.length > 0 && (
            <div className="relative group/main py-1">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 hover:text-emerald-900 hover:bg-emerald-100/80 group-hover/main:bg-emerald-100/80 group-hover/main:text-emerald-900 transition-all duration-150 uppercase tracking-wider text-xs font-bold cursor-pointer">
                <span>Lainnya</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/main:rotate-180 group-hover/main:text-emerald-800 transition-transform duration-200" />
              </button>

              {/* Level 1 Overflow Dropdown Menu */}
              <div className="absolute top-full right-0 hidden group-hover/main:flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1.5 min-w-[240px] max-w-sm z-50 animate-in fade-in-50 duration-150">
                {overflowMenus.map((item: any) => {
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren) {
                    return (
                      <div key={item.id} className="relative group/level2">
                        <div className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug cursor-pointer group/overflowitem">
                          <span className="truncate flex-1 group-hover/overflowitem:text-white">{item.title}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/overflowitem:text-white rotate-180 transition flex-shrink-0" />
                        </div>

                        {/* Level 2 Flyout Dropdown (Membuka ke arah kiri agar tidak overflow viewport) */}
                        <div className="absolute top-0 right-full hidden group-hover/level2:flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1.5 min-w-[260px] max-w-xs z-50 animate-in fade-in-50 duration-150 mr-1">
                          {item.children.map((sub: any) => {
                            const hasSubChildren = sub.children && sub.children.length > 0;

                            if (hasSubChildren) {
                              return (
                                <div key={sub.id} className="relative group/level3">
                                  <div className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug cursor-pointer group/overflowsub">
                                    <span className="truncate flex-1 group-hover/overflowsub:text-white">{sub.title}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/overflowsub:text-white rotate-180 transition flex-shrink-0" />
                                  </div>

                                  {/* Level 3 Flyout Dropdown */}
                                  <div className="absolute top-0 right-full hidden group-hover/level3:flex flex-col bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl rounded-xl p-1.5 min-w-[260px] max-w-sm z-50 animate-in fade-in-50 duration-150 mr-1 max-h-[80vh] overflow-y-auto">
                                    {sub.children.map((subItem: any) => (
                                      <Link
                                        key={subItem.id}
                                        href={buildMenuHref(subItem.url)}
                                        onClick={subItem.url.startsWith('#') ? (e) => handleScrollToSection(e, subItem.url) : undefined}
                                        target={subItem.isExternal ? '_blank' : undefined}
                                        rel={subItem.isExternal ? 'noopener noreferrer' : undefined}
                                        className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug group/overflowflyout"
                                      >
                                        <span className="truncate group-hover/overflowflyout:text-white">{subItem.title}</span>
                                        {subItem.isExternal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/overflowflyout:text-white flex-shrink-0" />}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <Link
                                key={sub.id}
                                href={buildMenuHref(sub.url)}
                                onClick={sub.url.startsWith('#') ? (e) => handleScrollToSection(e, sub.url) : undefined}
                                target={sub.isExternal ? '_blank' : undefined}
                                rel={sub.isExternal ? 'noopener noreferrer' : undefined}
                                className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug group/overflowleaf"
                              >
                                <span className="truncate group-hover/overflowleaf:text-white">{sub.title}</span>
                                {sub.isExternal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/overflowleaf:text-white flex-shrink-0" />}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      href={buildMenuHref(item.url)}
                      onClick={item.url.startsWith('#') ? (e) => handleScrollToSection(e, item.url) : undefined}
                      target={item.isExternal ? '_blank' : undefined}
                      rel={item.isExternal ? 'noopener noreferrer' : undefined}
                      className="px-3.5 py-2.5 rounded-lg text-[13px] font-medium tracking-normal normal-case text-slate-700 hover:bg-emerald-600 hover:text-white transition-all duration-150 flex items-center justify-between gap-2.5 leading-snug group/overflowsingle"
                    >
                      <span className="truncate group-hover/overflowsingle:text-white">{item.title}</span>
                      {item.isExternal && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/overflowsingle:text-white flex-shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          <Link
            href="/admin"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 hover:shadow-lg"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Login Pamong</span>
            <span className="sm:hidden text-[11px]">Pamong</span>
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition active:scale-95"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-600" /> : <MenuBurger className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer with Backdrop */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 top-[60px] bg-black/40 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="lg:hidden relative z-40 border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 py-5 space-y-3 shadow-xl max-h-[calc(100vh-70px)] overflow-y-auto">
          <Link
            href={buildTenantHref('/', tenant.slug)}
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleScrollToSection(e, '#beranda');
            }}
            className="block font-bold text-xs uppercase tracking-wider text-slate-800 hover:text-emerald-900 hover:bg-emerald-100/70 px-3 py-1.5 rounded-lg transition"
          >
            Beranda
          </Link>
          {dynamicMenuTree && dynamicMenuTree.length > 0 ? (
            dynamicMenuTree.map((item: any) => (
              <div key={item.id} className="space-y-1">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {item.url && item.url !== '#' ? (
                    <Link
                      href={buildMenuHref(item.url)}
                      onClick={(e) => {
                        setMobileMenuOpen(false);
                        if (item.url?.startsWith('#')) handleScrollToSection(e, item.url);
                      }}
                      className="block px-3 py-1.5 rounded-lg text-slate-800 hover:text-emerald-900 hover:bg-emerald-100/70 transition"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    <span className="block px-3 py-1.5 text-slate-900 font-extrabold">{item.title}</span>
                  )}
                </div>
                {item.children && item.children.length > 0 && (
                  <div className="pl-3 border-l-2 border-emerald-500 space-y-1 ml-2">
                    {item.children.map((sub: any) => (
                      <div key={sub.id}>
                        <Link
                          href={buildMenuHref(sub.url)}
                          onClick={(e) => {
                            setMobileMenuOpen(false);
                            if (sub.url?.startsWith('#')) handleScrollToSection(e, sub.url);
                          }}
                          target={sub.isExternal ? '_blank' : undefined}
                          rel={sub.isExternal ? 'noopener noreferrer' : undefined}
                          className="block text-[13px] tracking-normal font-medium text-slate-800 hover:text-emerald-900 hover:bg-emerald-100/70 px-2.5 py-1.5 rounded-lg transition leading-snug"
                        >
                          {sub.title}
                        </Link>
                        {sub.children && sub.children.length > 0 && (
                          <div className="pl-3 border-l border-emerald-300/80 space-y-1 my-1 ml-2">
                            {sub.children.map((subItem: any) => (
                              <Link
                                key={subItem.id}
                                href={buildMenuHref(subItem.url)}
                                onClick={(e) => {
                                  setMobileMenuOpen(false);
                                  if (subItem.url?.startsWith('#')) handleScrollToSection(e, subItem.url);
                                }}
                                target={subItem.isExternal ? '_blank' : undefined}
                                rel={subItem.isExternal ? 'noopener noreferrer' : undefined}
                                className="block text-xs tracking-normal font-normal text-slate-600 hover:text-emerald-900 hover:bg-emerald-100/70 px-2 py-1 rounded-md transition leading-snug"
                              >
                                • {subItem.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
              <Link href={buildMenuHref('#profil')} onClick={(e) => { setMobileMenuOpen(false); handleScrollToSection(e, '#profil'); }} className="px-3 py-2 rounded-lg hover:bg-emerald-100/70 hover:text-emerald-900 transition">Profil</Link>
              <Link href={buildMenuHref('#pamong')} onClick={(e) => { setMobileMenuOpen(false); handleScrollToSection(e, '#pamong'); }} className="px-3 py-2 rounded-lg hover:bg-emerald-100/70 hover:text-emerald-900 transition">Aparatur</Link>
              <Link href={buildMenuHref('#berita')} onClick={(e) => { setMobileMenuOpen(false); handleScrollToSection(e, '#berita'); }} className="px-3 py-2 rounded-lg hover:bg-emerald-100/70 hover:text-emerald-900 transition">Warta Desa</Link>
              <Link href={buildMenuHref('#pengumuman')} onClick={(e) => { setMobileMenuOpen(false); handleScrollToSection(e, '#pengumuman'); }} className="px-3 py-2 rounded-lg hover:bg-emerald-100/70 hover:text-emerald-900 transition">Pengumuman</Link>
              <Link href={buildMenuHref('/galeri')} onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-emerald-100/70 hover:text-emerald-900 transition">Galeri Foto</Link>
              <Link href={buildMenuHref('#apbdes')} onClick={(e) => { setMobileMenuOpen(false); handleScrollToSection(e, '#apbdes'); }} className="px-3 py-2 rounded-lg hover:bg-emerald-100/70 hover:text-emerald-900 transition">Transparansi APBDes</Link>
            </div>
          )}
        </div>
        </>
      )}
    </header>
    </>
  );
}
