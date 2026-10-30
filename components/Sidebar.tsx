'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  PanelLeftClose,
  Sparkles,
  Building2,
  ArrowLeft,
} from 'lucide-react';
import { ADMIN_MENU_GROUPS, SAAS_ADMIN_MENU_GROUPS } from '@/lib/admin-menu';
import { useOpenSIDStore } from '@/lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { activeTenant, currentTenantId } = useOpenSIDStore();
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopHidden, setIsDesktopHidden] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSuperAdmin = currentUser?.globalRole === 'SUPER_ADMIN';
  const isSaasRoute = pathname.startsWith('/saas');

  // Jika sedang di portal publik, halaman login admin, atau kiosk absen, sembunyikan sidebar admin sepenuhnya
  if (
    pathname.startsWith('/portal') ||
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login') ||
    pathname === '/absen'
  ) {
    return null;
  }

  // Load preferensi sembunyikan sidebar desktop dan currentUser dari localStorage
  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem('desdig_sidebar_desktop_hidden') || localStorage.getItem('opensid_sidebar_desktop_hidden');
      if (savedHidden === 'true') {
        setIsDesktopHidden(true);
      }
      const savedUser = localStorage.getItem('desdig_current_user') || localStorage.getItem('opensid_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
    } catch (e) {
      // ignore
    }
  }, [pathname]);

  // Listener untuk toggle sidebar (baik Mobile Drawer maupun Desktop Collapse/Hide)
  useEffect(() => {
    const handleToggle = () => {
      if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
        setIsDesktopHidden((prev) => {
          const next = !prev;
          localStorage.setItem('desdig_sidebar_desktop_hidden', String(next));
          localStorage.setItem('opensid_sidebar_desktop_hidden', String(next));
          return next;
        });
      } else {
        setIsMobileOpen((prev) => !prev);
      }
    };

    const handleClose = () => setIsMobileOpen(false);

    window.addEventListener('toggle-admin-sidebar', handleToggle);
    window.addEventListener('toggle-admin-mobile-sidebar', handleToggle);
    window.addEventListener('close-admin-mobile-sidebar', handleClose);

    return () => {
      window.removeEventListener('toggle-admin-sidebar', handleToggle);
      window.removeEventListener('toggle-admin-mobile-sidebar', handleToggle);
      window.removeEventListener('close-admin-mobile-sidebar', handleClose);
    };
  }, []);

  // Tutup drawer mobile saat berpindah rute
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Sumber menu: Jika Super Admin di /saas -> SAAS_ADMIN_MENU_GROUPS; selain itu ADMIN_MENU_GROUPS
  const currentMenuGroups = isSuperAdmin && isSaasRoute ? SAAS_ADMIN_MENU_GROUPS : ADMIN_MENU_GROUPS;

  // Buka grup otomatis jika ada menu aktif di dalamnya
  useEffect(() => {
    currentMenuGroups.forEach((group) => {
      const hasActive = group.items.some(
        (item) =>
          pathname === item.href ||
          (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href))
      );
      if (hasActive) {
        setCollapsedGroups((prev) => ({ ...prev, [group.id]: false }));
      }
    });
  }, [pathname, currentMenuGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Filter pencarian dan hak akses menu berdasarkan role akun yang login
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const userRole = currentUser?.role;

    return currentMenuGroups.map((group) => {
      const matchedItems = group.items.filter((item) => {
        // Cek izin peran (RBAC): jika bukan SUPER_ADMIN dan menu dibatasi peran tertentu
        if (!isSuperAdmin && item.allowedRoles && userRole) {
          if (!item.allowedRoles.includes(userRole as any)) {
            return false;
          }
        }

        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          (item.badge && item.badge.toLowerCase().includes(q)) ||
          group.title.toLowerCase().includes(q)
        );
      });

      return {
        ...group,
        items: matchedItems,
      };
    }).filter((group) => group.items.length > 0);
  }, [searchQuery, currentMenuGroups, isSuperAdmin, currentUser?.role]);

  const renderNavContent = () => (
    <div className="flex h-full flex-col">
      {/* 1. Header Banner Super Admin saat di Master SaaS */}
      {isSuperAdmin && isSaasRoute && (
        <div className="mx-2.5 mt-2.5 p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[11px] flex items-center gap-1.5 text-purple-800 dark:text-purple-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              Master SaaS Cloud
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
              Owner
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan Multi-Tenant Desa se-Indonesia
          </p>
        </div>
      )}

      {/* 2. Banner Mode Inspeksi Desa (Jika Super Admin sedang masuk ke salah satu desa) */}
      {isSuperAdmin && !isSaasRoute && (
        <div className="mx-2.5 mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[11px] flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Mode Bantuan Teknis
            </span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
              Inspeksi
            </span>
          </div>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">
            Sedang memeriksa: <strong suppressHydrationWarning className="text-slate-900 dark:text-slate-200">Desa {activeTenant?.nama_desa}</strong>
          </p>
          <Link
            href="/saas"
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Kembali ke Master SaaS</span>
          </Link>
        </div>
      )}

      {/* Search Bar Ramping & Tombol Sembunyikan Sidebar */}
      <div className="p-2.5 pb-1.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isSaasRoute ? "Cari menu SaaS..." : "Cari menu desa..."}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setIsDesktopHidden(true);
            localStorage.setItem('opensid_sidebar_desktop_hidden', 'true');
          }}
          className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Sembunyikan Menu Sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Nav List Padat & Rapi */}
      <nav className="flex-1 space-y-2.5 overflow-y-auto px-2.5 py-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {filteredGroups.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <p>Menu &quot;{searchQuery}&quot; tidak ada</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-1.5 text-emerald-600 hover:underline font-semibold text-[11px]"
            >
              Reset
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isCollapsed = !searchQuery && !!collapsedGroups[group.id];
            const hasActiveItem = group.items.some(
              (item) =>
                pathname === item.href ||
                (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href))
            );

            return (
              <div key={group.id} className="space-y-0.5">
                {/* Header Group Singkat */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-2 py-0.5 text-left group transition rounded hover:bg-slate-200/50 dark:hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        hasActiveItem ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group.title}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    {isCollapsed ? (
                      <ChevronRight className="h-2.5 w-2.5" />
                    ) : (
                      <ChevronDown className="h-2.5 w-2.5" />
                    )}
                  </div>
                </button>

                {/* Items */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/admin' && item.href !== '/' && pathname.startsWith(item.href));

                      const targetTenant = isMounted ? (currentTenantId || activeTenant?.slug || '') : '';
                      const resolvedHref = targetTenant && !item.isExternal && !item.href.startsWith('/saas')
                        ? `${item.href}${item.href.includes('?') ? '&' : '?'}tenant=${targetTenant}`
                        : item.href;

                      return (
                        <Link
                          key={`${item.href}-${item.label}`}
                          href={resolvedHref}
                          suppressHydrationWarning
                          className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-600/20'
                              : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {item.badge && (
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                  isActive
                                    ? 'bg-emerald-700/80 text-emerald-100'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {item.isExternal && <ExternalLink className="h-2.5 w-2.5 opacity-60" />}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Footer Status Ramping (1 Baris) */}
      <div className="border-t border-slate-200 px-3 py-2.5 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isSaasRoute ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {isSaasRoute ? 'SaaS Platform' : 'SID Aktif'}
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">v2026.1</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar */}
      {!isDesktopHidden && (
        <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60 min-h-[calc(100vh-4rem)] transition-all">
          {renderNavContent()}
        </aside>
      )}

      {/* 2. Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 max-w-[85vw] bg-white shadow-2xl dark:bg-slate-900 flex flex-col z-10 border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider">
                Navigasi Admin
              </span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">{renderNavContent()}</div>
          </div>
        </div>
      )}
    </>
  );
}
