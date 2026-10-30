'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Landmark,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Hash,
  Zap,
  Save,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  Building2,
  Shield,
  User,
  ExternalLink,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

const SAVED_LOGIN_STORAGE_KEY = 'desdig_saved_login_credentials';
const OLD_SAVED_LOGIN_STORAGE_KEY = 'opensid_saved_login_credentials';

interface TestAccount {
  id: string;
  title: string;
  category: 'saas' | 'salupangkang' | 'sukamaju';
  categoryLabel: string;
  roleName: string;
  roleBadgeClass: string;
  kodeDesa: string;
  email: string;
  password: string;
  description: string;
  targetRedirect: string;
}

const TEST_ACCOUNTS: TestAccount[] = [
  // 1. Super Admin SaaS
  {
    id: 'saas-superadmin',
    title: 'Super Admin Master Platform',
    category: 'saas',
    categoryLabel: 'Aplikasi Master SaaS',
    roleName: 'SUPER_ADMIN',
    roleBadgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    kodeDesa: '',
    email: 'superadmin@platform.desa.id',
    password: 'superadmin123',
    description: 'Akses penuh ke Master SaaS (/saas), pemantauan MRR, & manajemen seluruh tenant desa',
    targetRedirect: '/saas',
  },
  // 2. Salupangkang
  {
    id: 'salu-admin',
    title: 'Admin Utama Salupangkang',
    category: 'salupangkang',
    categoryLabel: 'Desa Salupangkang',
    roleName: 'VILLAGE_ADMIN',
    roleBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    kodeDesa: '76.06.04.2009',
    email: 'admin@salupangkang.desa.id',
    password: 'salupangkang123',
    description: 'Hak penuh administrasi Desa Salupangkang, absensi, konfigurasi, & pamong',
    targetRedirect: '/admin',
  },
  {
    id: 'salu-operator',
    title: 'Operator Desa Salupangkang',
    category: 'salupangkang',
    categoryLabel: 'Desa Salupangkang',
    roleName: 'EDITOR',
    roleBadgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    kodeDesa: '76.06.04.2009',
    email: 'operator@salupangkang.desa.id',
    password: 'salupangkang123',
    description: 'Pengelolaan data penduduk, administrasi persuratan, & bansos',
    targetRedirect: '/admin',
  },
  {
    id: 'salu-penulis',
    title: 'Penulis Berita Salupangkang',
    category: 'salupangkang',
    categoryLabel: 'Desa Salupangkang',
    roleName: 'AUTHOR',
    roleBadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    kodeDesa: '76.06.04.2009',
    email: 'penulis@salupangkang.desa.id',
    password: 'salupangkang123',
    description: 'Penulisan artikel dan rilis berita publik Desa Salupangkang',
    targetRedirect: '/admin',
  },
  // 3. Sukamaju
  {
    id: 'suka-admin',
    title: 'Admin Utama Sukamaju',
    category: 'sukamaju',
    categoryLabel: 'Desa Sukamaju',
    roleName: 'VILLAGE_ADMIN',
    roleBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    kodeDesa: '32.04.11.2001',
    email: 'admin@sukamaju.desa.id',
    password: 'sukamaju123',
    description: 'Hak penuh administrasi Desa Sukamaju, konfigurasi sistem, & data desa',
    targetRedirect: '/admin',
  },
  {
    id: 'suka-operator',
    title: 'Operator Desa Sukamaju',
    category: 'sukamaju',
    categoryLabel: 'Desa Sukamaju',
    roleName: 'EDITOR',
    roleBadgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    kodeDesa: '32.04.11.2001',
    email: 'operator@sukamaju.desa.id',
    password: 'sukamaju123',
    description: 'Pengelolaan administrasi & layanan warga Desa Sukamaju',
    targetRedirect: '/admin',
  },
  {
    id: 'suka-penulis',
    title: 'Penulis Berita Sukamaju',
    category: 'sukamaju',
    categoryLabel: 'Desa Sukamaju',
    roleName: 'AUTHOR',
    roleBadgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    kodeDesa: '32.04.11.2001',
    email: 'penulis@sukamaju.desa.id',
    password: 'sukamaju123',
    description: 'Pembuatan artikel dan publikasi kegiatan Desa Sukamaju',
    targetRedirect: '/admin',
  },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const { currentTenantId, activeTenant, switchTenant } = useOpenSIDStore();

  const [kodeDesa, setKodeDesa] = useState(activeTenant?.kode_desa || '');
  const [email, setEmail] = useState(activeTenant ? `admin@${activeTenant.slug}.desa.id` : '');
  const [password, setPassword] = useState(activeTenant ? `${activeTenant.slug}123` : '');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const availableCategories = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    TEST_ACCOUNTS.forEach((acc) => {
      const existing = map.get(acc.category);
      if (existing) {
        existing.count++;
      } else {
        map.set(acc.category, { label: acc.categoryLabel, count: 1 });
      }
    });
    return Array.from(map.entries()).map(([key, val]) => ({
      key,
      label: val.label,
      count: val.count,
    }));
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Muat data login tersimpan saat halaman dibuka
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_LOGIN_STORAGE_KEY) || localStorage.getItem(OLD_SAVED_LOGIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.kodeDesa !== undefined) setKodeDesa(parsed.kodeDesa);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        setRememberMe(true);
        return;
      }
    } catch (e) {
      console.warn('Gagal membaca data login tersimpan', e);
    }

    // Default awal dinamis sesuai tenant aktif
    if (activeTenant && activeTenant.kode_desa) {
      setKodeDesa(activeTenant.kode_desa);
      setEmail(`admin@${activeTenant.slug}.desa.id`);
      setPassword(`${activeTenant.slug}123`);
    }
  }, [activeTenant]);

  const executeLogin = async (targetKode: string, targetEmail: string, targetPass: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const k = targetKode.trim();
    const em = targetEmail.trim();
    const pw = targetPass;

    const isSuperAdminEmail = em.toLowerCase() === 'superadmin@platform.desa.id';

    if (!k && !isSuperAdminEmail) {
      setErrorMsg('Kode Desa wajib diisi untuk akun desa');
      return;
    }

    if (!em || !pw) {
      setErrorMsg('Email dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);

    try {
      // Sinkronkan tenant aktif di client store jika ada kode desa
      if (k) {
        switchTenant(k);
      }

      // Simpan kredensial jika opsi "Ingat Saya" aktif
      if (rememberMe) {
        const payload = JSON.stringify({ kodeDesa: k, email: em, password: pw });
        localStorage.setItem(SAVED_LOGIN_STORAGE_KEY, payload);
        localStorage.setItem(OLD_SAVED_LOGIN_STORAGE_KEY, payload);
      } else {
        localStorage.removeItem(SAVED_LOGIN_STORAGE_KEY);
        localStorage.removeItem(OLD_SAVED_LOGIN_STORAGE_KEY);
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kodeDesa: k,
          email: em,
          password: pw,
          tenantSlug: currentTenantId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      const isSuper = data.user?.globalRole === 'SUPER_ADMIN';
      setSuccessMsg(`Login berhasil. Mengalihkan ke ${isSuper ? 'Master SaaS (/saas)' : 'Dashboard Admin Desa (/admin)'}...`);

      // Simpan session info di localStorage untuk UI client-side (standar desDig & fallback)
      localStorage.setItem('desdig_current_user', JSON.stringify(data.user));
      localStorage.setItem('opensid_current_user', JSON.stringify(data.user));

      // SINKRONKAN TENANT AKTIF KE DESA USER YANG LOGIN
      if (data.user?.tenantSlug) {
        localStorage.setItem('desdig_saas_current_tenant_id', data.user.tenantSlug);
        localStorage.setItem('opensid_saas_current_tenant_id', data.user.tenantSlug);
        switchTenant(data.user.tenantSlug);
      }

      setTimeout(() => {
        // Force refresh atau navigasi agar seluruh konteks store tersinkronisasi penuh
        window.location.href = isSuper ? '/saas' : '/admin';
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(kodeDesa, email, password);
  };

  const handleUseAccount = (acc: TestAccount) => {
    setKodeDesa(acc.kodeDesa);
    setEmail(acc.email);
    setPassword(acc.password);
    executeLogin(acc.kodeDesa, acc.email, acc.password);
  };

  const filteredAccounts = TEST_ACCOUNTS.filter((acc) => {
    if (activeTab === 'all') return true;
    return acc.category === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 mb-2">
            <Landmark className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portal Administrasi Desa & Master SaaS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sistem Informasi Desa Resmi Multi-Tenant & Platform SaaS Terpadu
          </p>
        </div>

        {/* Card Form Utama */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Tombol Masuk Sekali Klik (Instant 1-Click Login) */}
          <button
            type="button"
            onClick={() => executeLogin(kodeDesa, email, password)}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer border border-emerald-400/30 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-300 animate-bounce" />
            <span>{loading ? 'Memverifikasi...' : '⚡ Masuk Sekali Klik (Sesuai Kredensial Terpilih)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-700 w-full" />
            <span className="bg-slate-800 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10">
              Formulir Autentikasi
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* 1. Field Kode Desa */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Kode Desa
                </label>
                <span className="text-[10px] text-slate-400">
                  Kosongkan jika login sebagai Super Admin SaaS
                </span>
              </div>
              <div className="relative">
                <Hash className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={kodeDesa}
                  onChange={(e) => {
                    setKodeDesa(e.target.value);
                    if (e.target.value) switchTenant(e.target.value);
                  }}
                  placeholder="Contoh: 76.06.04.2009 (atau kosongkan untuk Super Admin)"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition tracking-wide placeholder:font-sans placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 2. Field Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Email / ID Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@desa.id atau superadmin@platform.desa.id"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* 3. Field Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                />
                <span>Simpan data login (Ingat Saya)</span>
              </label>

              <span className="text-[10px] text-emerald-400/80 font-mono">
                Tersimpan di Browser
              </span>
            </div>

            {/* Tombol Simpan & Masuk Manual */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs border border-slate-600/60 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Memverifikasi...' : 'Simpan & Masuk'}</span>
            </button>
          </form>
        </div>

        {/* ============================================================== */}
        {/* PANEL DAFTAR AKUN PENGUJIAN DEPLOYMENT (SUPER ADMIN & SEMUA DESA) */}
        {/* ============================================================== */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/80">
            <div className="flex items-center gap-2 text-white">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold">Daftar Akun Pengujian (Testing Deployment)</h2>
                <p className="text-[11px] text-slate-400">
                  Klik <strong>&quot;Gunakan & Masuk&quot;</strong> pada salah satu akun di bawah untuk login instan 1-klik.
                </p>
              </div>
            </div>
          </div>

          {/* Tab Filter Kategori */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua Akun ({TEST_ACCOUNTS.length})
            </button>

            {availableCategories.map((cat: { key: string; label: string; count: number }) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === cat.key
                    ? cat.key === 'saas'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.key === 'saas' ? (
                  <Sparkles className="w-3 h-3 text-amber-300" />
                ) : (
                  <Building2 className="w-3 h-3 text-emerald-400" />
                )}
                <span>
                  {cat.label} ({cat.count})
                </span>
              </button>
            ))}
          </div>

          {/* List Kartu Akun */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-3.5 space-y-2.5 hover:border-slate-600 transition"
              >
                {/* Header Akun */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{acc.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${acc.roleBadgeClass}`}
                    >
                      {acc.roleName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUseAccount(acc)}
                    disabled={loading}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Gunakan & Masuk</span>
                  </button>
                </div>

                {/* Deskripsi */}
                <p className="text-[11px] text-slate-400">{acc.description}</p>

                {/* Kredensial Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs font-mono">
                  {/* Kode Desa */}
                  <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-slate-700/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-sans">Kode Desa:</span>
                      <span className="text-emerald-400 font-bold truncate">
                        {acc.kodeDesa || '(Tidak Perlu)'}
                      </span>
                    </div>
                    {acc.kodeDesa && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.kodeDesa, `${acc.id}-kode`)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        title="Salin Kode Desa"
                      >
                        {copiedKey === `${acc.id}-kode` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Email */}
                  <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-slate-700/50">
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="text-[9px] text-slate-400 font-sans">Email:</span>
                      <span className="text-slate-200 truncate" title={acc.email}>
                        {acc.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.email, `${acc.id}-email`)}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition shrink-0"
                      title="Salin Email"
                    >
                      {copiedKey === `${acc.id}-email` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between border border-slate-700/50">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 font-sans">Password:</span>
                      <span className="text-amber-300 font-semibold">{acc.password}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.password, `${acc.id}-pass`)}
                      className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition shrink-0"
                      title="Salin Password"
                    >
                      {copiedKey === `${acc.id}-pass` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Link Kembali ke Website */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-emerald-400 transition inline-flex items-center gap-1"
          >
            ← Kembali ke Website Publik Desa
          </Link>
        </div>
      </div>
    </div>
  );
}
