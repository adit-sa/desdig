'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Globe, Shield, Building2, ChevronDown, Plus, Sparkles, Menu, Search, Check, X, LogOut, User, ExternalLink } from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const isPortal = pathname.startsWith('/portal');
  const isSaas = pathname.startsWith('/saas');

  const { tenantList, currentTenantId, activeTenant, switchTenant } = useOpenSIDStore();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchKode, setSearchKode] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('desdig_current_user') || localStorage.getItem('opensid_current_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        // HANYA untuk Admin Desa biasa: paksa tenant ke desa miliknya.
        // Untuk SUPER_ADMIN: JANGAN paksa, karena Super Admin bebas inspeksi desa mana saja!
        if (u.globalRole !== 'SUPER_ADMIN' && u.tenantSlug && u.tenantSlug !== currentTenantId) {
          switchTenant(u.tenantSlug);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      // ignore
    }
  }, [pathname, currentTenantId]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('desdig_current_user');
    localStorage.removeItem('opensid_current_user');
    setCurrentUser(null);
    window.location.href = '/admin/login';
  };

  // Filter tenant berdasarkan input Kode Desa atau Nama Desa
  const filteredTenants = useMemo(() => {
    if (!searchKode.trim()) return tenantList;
    const q = searchKode.trim().toLowerCase();
    const qNumbers = q.replace(/[^0-9]/g, '');

    return tenantList.filter((t) => {
      const matchName = t.nama_desa.toLowerCase().includes(q) || t.kabupaten.toLowerCase().includes(q);
      const matchKode = t.kode_desa && t.kode_desa.toLowerCase().includes(q);
      const tNumbers = (t.kode_desa || '').replace(/[^0-9]/g, '');
      const matchNumbers = qNumbers && tNumbers.includes(qNumbers);
      return matchName || matchKode || matchNumbers;
    });
  }, [tenantList, searchKode]);

  const isSuperAdminUser = currentUser?.globalRole === 'SUPER_ADMIN';
  const displayNamaDesa = isSuperAdminUser ? activeTenant.nama_desa : (currentUser?.tenantName || activeTenant.nama_desa);
  const displayKodeDesa = activeTenant.kode_desa;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Brand & Multi-Tenant Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Sidebar Toggle (Bisa sembunyikan/tampilkan Menu Sidebar di Desktop & Mobile) */}
        {!isPortal && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-admin-sidebar'))}
            className="flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition cursor-pointer"
            title="Sembunyikan / Tampilkan Menu Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link href={isSaas ? "/saas" : "/admin"} className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight">
                {isSaas ? 'desDig SaaS' : 'desDig'}
              </span>
              {isSaas && (
                <span suppressHydrationWarning className="rounded-full px-1.5 py-0.2 text-[9px] font-bold border bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  Master Platform
                </span>
              )}
            </div>
            <p suppressHydrationWarning className="text-[10px] text-slate-400">
              {isSaas ? 'Dashboard Pengelola Multi-Tenant' : 'desa Digital'}
            </p>
          </div>
        </Link>

        {/* IDENTITAS DESA DI DASHBOARD (TERKUNCI UNTUK ADMIN DESA; MODE INSPEKSI UNTUK SUPER ADMIN) */}
        {/* IDENTITAS DESA DI DASHBOARD & MASTER SAAS */}
        {isSuperAdminUser ? (
          /* Khusus Super Admin: Switcher Desa aktif di seluruh halaman (SaaS maupun Inspeksi Desa) */
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 relative">
            <button
              type="button"
              onClick={() => setIsSelectorOpen(!isSelectorOpen)}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition cursor-pointer ${
                isSaas
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 hover:bg-purple-100'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
              }`}
              title="Ganti Desa yang Sedang Diinspeksi (Super Admin)"
            >
              <Building2 className={`h-3.5 w-3.5 ${isSaas ? 'text-purple-600' : 'text-amber-600'}`} />
              <div className="flex items-center gap-1.5 text-left">
                {!isSaas && (
                  <span suppressHydrationWarning className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                    Inspeksi:
                  </span>
                )}
                <span suppressHydrationWarning className="font-bold">Desa {activeTenant.nama_desa}</span>
                {activeTenant.kode_desa && (
                  <span suppressHydrationWarning className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {activeTenant.kode_desa}
                  </span>
                )}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Dropdown Pencarian / Input Kode Desa (Khusus Super Admin) */}
            {isSelectorOpen && (
              <div className="absolute left-3 top-full mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    Pilih Tenant Desa (Super Admin)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSelectorOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs p-0.5 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ketik Kode Desa atau Nama..."
                    value={searchKode}
                    onChange={(e) => setSearchKode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredTenants.length > 0) {
                        switchTenant(filteredTenants[0].id);
                        setIsSelectorOpen(false);
                        setSearchKode('');
                      }
                    }}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filteredTenants.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      Tidak ada desa dengan kode/nama &quot;{searchKode}&quot;
                    </div>
                  ) : (
                    filteredTenants.map((t) => {
                      const isSelected = t.id === currentTenantId || t.slug === currentTenantId;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            switchTenant(t.slug || t.id);
                            setIsSelectorOpen(false);
                            setSearchKode('');
                          }}
                          className={`w-full p-2 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>Desa {t.nama_desa}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Kec. {t.kecamatan}, Kab. {t.kabupaten}
                            </div>
                          </div>

                          {t.kode_desa && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {t.kode_desa}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  Tekan <strong>Enter</strong> setelah mengetik kode untuk memilih langsung.
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Akun Admin Desa biasa: Terkunci pada desanya sendiri */
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
            <div suppressHydrationWarning className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-100/80 dark:bg-slate-800/80 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              <div className="flex items-center gap-1.5 text-left">
                <span suppressHydrationWarning className="font-bold">Desa {displayNamaDesa}</span>
                {displayKodeDesa && (
                  <span suppressHydrationWarning className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {displayKodeDesa}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tombol Lihat Website Publik Desa */}
        {!isSaas && (
          <Link
            href={activeTenant?.slug ? `/?tenant=${activeTenant.slug}` : '/'}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-2xs"
            title="Buka Website Publik Desa di Tab Baru"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Lihat Website</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </Link>
        )}

        {/* Master SaaS HANYA untuk Super Admin Pemilik Platform */}
        {currentUser?.globalRole === 'SUPER_ADMIN' && !isSaas && (
          <Link
            href="/saas"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 px-2.5 py-1.5 text-xs font-bold transition shadow-2xs"
            title="Masuk ke Panel Pengelolaan SaaS Multi-Tenant"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">Master SaaS</span>
          </Link>
        )}

        {/* User Account & Logout Control */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase shadow-2xs">
                {(currentUser.name || currentUser.email || 'A').charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {currentUser.name || currentUser.email}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">
                  {currentUser.globalRole === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : currentUser.role === 'VILLAGE_ADMIN'
                    ? 'Admin Desa'
                    : currentUser.role === 'EDITOR'
                    ? 'Operator'
                    : currentUser.role === 'AUTHOR'
                    ? 'Penulis'
                    : currentUser.role === 'APARATUR'
                    ? 'Pamong'
                    : currentUser.role === 'AUDITOR'
                    ? 'Auditor'
                    : 'Pengelola'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Keluar (Logout)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <Link
            href="/admin/login"
            title="Masuk ke Akun Admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
          >
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Login Admin</span>
          </Link>
        )}
      </div>
    </header>
  );
}
