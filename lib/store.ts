'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  TenantDesa,
  Penduduk,
  Keluarga,
  SuratPermohonan,
  ProgramBansos,
  PenerimaBansos,
  APBDesItem,
  BeritaDesa,
  AparaturDesa
} from './types';
import {
  DAFTAR_TENANT,
  DAFTAR_PENDUDUK,
  DAFTAR_KELUARGA,
  DAFTAR_SURAT,
  DAFTAR_BANSOS,
  PENERIMA_BANSOS,
  APBDES_ITEMS,
  BERITA_DESA,
  APARATUR_DESA
} from './mock-data';

const STORAGE_KEYS = {
  CURRENT_TENANT: 'desdig_saas_current_tenant_id',
  OLD_CURRENT_TENANT: 'opensid_saas_current_tenant_id',
  TENANTS: 'desdig_saas_tenants_v1',
  OLD_TENANTS: 'opensid_saas_tenants_v1',
  PENDUDUK: 'desdig_saas_penduduk_v1',
  OLD_PENDUDUK: 'opensid_saas_penduduk_v1',
  KELUARGA: 'desdig_saas_keluarga_v1',
  OLD_KELUARGA: 'opensid_saas_keluarga_v1',
  SURAT: 'desdig_saas_surat_v1',
  OLD_SURAT: 'opensid_saas_surat_v1',
};

// Module-level cache untuk mencegah desynchronization antar navigasi halaman di client
let globalTenantId: string = '';

function getInitialTenantId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const sp = new URLSearchParams(window.location.search);
    const tQuery = sp.get('tenant');
    if (tQuery && tQuery.trim()) {
      return tQuery.trim();
    }

    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT) || localStorage.getItem(STORAGE_KEYS.OLD_CURRENT_TENANT);
    if (stored && stored.trim()) {
      return stored.trim();
    }

    const currentUserStr = localStorage.getItem('desdig_current_user') || localStorage.getItem('opensid_current_user');
    if (currentUserStr) {
      const u = JSON.parse(currentUserStr);
      if (u.tenantSlug) return u.tenantSlug;
    }
  } catch {}
  return '';
}

export function useDesDigStore() {
  const [tenantList, setTenantList] = useState<TenantDesa[]>(DAFTAR_TENANT);
  const [currentTenantId, setCurrentTenantId] = useState<string>(() => {
    return globalTenantId || (typeof window !== 'undefined' ? getInitialTenantId() : '');
  });
  const [rawPendudukList, setRawPendudukList] = useState<Penduduk[]>(DAFTAR_PENDUDUK);
  const [rawKeluargaList, setRawKeluargaList] = useState<Keluarga[]>(DAFTAR_KELUARGA);
  const [rawSuratList, setRawSuratList] = useState<SuratPermohonan[]>(DAFTAR_SURAT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      // 0. Prioritas Utama: Baca parameter URL ?tenant=... (jika ada navigasi langsung atau link inspeksi)
      let targetTenantSlug = '';
      if (typeof window !== 'undefined') {
        try {
          const sp = new URLSearchParams(window.location.search);
          const tQuery = sp.get('tenant');
          if (tQuery && tQuery.trim()) {
            targetTenantSlug = tQuery.trim();
          }
        } catch {}
      }

      // 1. Jika tidak ada di URL, baca dari sesi akun pengguna yang sedang login
      if (!targetTenantSlug) {
        const currentUserStr = localStorage.getItem('desdig_current_user') || localStorage.getItem('opensid_current_user');
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr);
            // Super Admin tidak terikat statis pada satu desa, biarkan bebas berpindah
            if (user.globalRole !== 'SUPER_ADMIN' && user.tenantSlug) {
              targetTenantSlug = user.tenantSlug;
            }
          } catch {}
        }
      }

      // 2. Fallback ke cookie autentikasi (hanya untuk non-Super Admin)
      if (!targetTenantSlug) {
        const match = document.cookie.match(/(?:desdig_auth_session|opensid_auth_session)=([^;]+)/);
        if (match) {
          try {
            const session = JSON.parse(decodeURIComponent(match[1]));
            if (session.globalRole !== 'SUPER_ADMIN' && session.tenantSlug) {
              targetTenantSlug = session.tenantSlug;
            }
          } catch {}
        }
      }

      const storedTenantId = targetTenantSlug || globalTenantId || localStorage.getItem(STORAGE_KEYS.CURRENT_TENANT) || localStorage.getItem(STORAGE_KEYS.OLD_CURRENT_TENANT);
      const storedTenants = localStorage.getItem(STORAGE_KEYS.TENANTS) || localStorage.getItem(STORAGE_KEYS.OLD_TENANTS);
      const storedPenduduk = localStorage.getItem(STORAGE_KEYS.PENDUDUK) || localStorage.getItem(STORAGE_KEYS.OLD_PENDUDUK);
      const storedKeluarga = localStorage.getItem(STORAGE_KEYS.KELUARGA) || localStorage.getItem(STORAGE_KEYS.OLD_KELUARGA);
      const storedSurat = localStorage.getItem(STORAGE_KEYS.SURAT) || localStorage.getItem(STORAGE_KEYS.OLD_SURAT);

      if (storedTenantId) {
        globalTenantId = storedTenantId;
        setCurrentTenantId(storedTenantId);
      }
      
      // Sinkronkan DAFTAR_TENANT agar kode desa terbaru selalu valid
      if (storedTenants) {
        try {
          const parsed = JSON.parse(storedTenants);
          const merged = DAFTAR_TENANT.map(base => {
            const found = parsed.find((p: any) => p.id === base.id || p.slug === base.slug);
            return found ? { ...base, ...found, kode_desa: base.kode_desa } : base;
          });
          setTenantList(merged);
        } catch {
          setTenantList(DAFTAR_TENANT);
        }
      } else {
        setTenantList(DAFTAR_TENANT);
      }

      if (storedPenduduk) setRawPendudukList(JSON.parse(storedPenduduk));
      if (storedKeluarga) setRawKeluargaList(JSON.parse(storedKeluarga));
      if (storedSurat) setRawSuratList(JSON.parse(storedSurat));
    } catch (e) {
      console.warn('Gagal membaca storage, menggunakan default mock', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sinkronisasi instan antar komponen dalam satu halaman saat switchTenant dipanggil
  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail && typeof e.detail === 'string') {
        globalTenantId = e.detail;
        setCurrentTenantId(e.detail);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('desdig-tenant-switched', handleSwitch);
      window.addEventListener('opensid-tenant-switched', handleSwitch);
      return () => {
        window.removeEventListener('desdig-tenant-switched', handleSwitch);
        window.removeEventListener('opensid-tenant-switched', handleSwitch);
      };
    }
  }, []);

  const switchTenant = (identifier: string) => {
    // RBAC: Hanya Super Admin yang berhak mengganti tenant desa secara bebas.
    // Akun Manager/Admin Desa biasa terkunci secara permanen pada desanya sendiri.
    if (typeof window !== 'undefined') {
      try {
        const currentUserStr = localStorage.getItem('opensid_current_user');
        if (currentUserStr) {
          const u = JSON.parse(currentUserStr);
          if (u.globalRole !== 'SUPER_ADMIN') {
            return;
          }
        }
      } catch {}
    }

    const clean = (identifier || '').trim();
    const cleanNumbers = clean.replace(/[^0-9]/g, '');

    // Cari berdasarkan id, slug, atau kode_desa
    const found = tenantList.find((t) => {
      if (t.id.toLowerCase() === clean.toLowerCase() || t.slug.toLowerCase() === clean.toLowerCase()) return true;
      if (t.kode_desa && t.kode_desa.toLowerCase() === clean.toLowerCase()) return true;
      const tNumbers = (t.kode_desa || '').replace(/[^0-9]/g, '');
      if (cleanNumbers && tNumbers === cleanNumbers) return true;
      return false;
    });

    const targetId = found ? (found.slug || found.id) : clean;
    globalTenantId = targetId;
    setCurrentTenantId(targetId);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_TENANT, targetId);
      localStorage.setItem(STORAGE_KEYS.OLD_CURRENT_TENANT, targetId);

      // Sinkronkan juga pada desdig_current_user & opensid_current_user jika akun adalah SUPER_ADMIN
      const currentUserStr = localStorage.getItem('desdig_current_user') || localStorage.getItem('opensid_current_user');
      if (currentUserStr) {
        try {
          const u = JSON.parse(currentUserStr);
          if (u.globalRole === 'SUPER_ADMIN') {
            u.tenantSlug = targetId;
            if (found) u.tenantName = found.nama_desa;
            localStorage.setItem('desdig_current_user', JSON.stringify(u));
            localStorage.setItem('opensid_current_user', JSON.stringify(u));
          }
        } catch {}
      }

      // Update URL query & broadcast event agar seluruh komponen (Kependudukan, Pamong, dll.) langsung refresh
      if (typeof window !== 'undefined') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('tenant', targetId);
          window.history.replaceState({}, '', url.toString());
        } catch {}
        window.dispatchEvent(new CustomEvent('desdig-tenant-switched', { detail: targetId }));
        window.dispatchEvent(new CustomEvent('opensid-tenant-switched', { detail: targetId }));
      }
    } catch (e) {
      console.error(e);
    }
    return found;
  };

  const tambahTenant = (data: Omit<TenantDesa, 'id' | 'tgl_bergabung'>) => {
    const newId = data.slug.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newTenant: TenantDesa = {
      ...data,
      id: newId,
      tgl_bergabung: '2026-10-21',
    };
    const updated = [...tenantList, newTenant];
    setTenantList(updated);
    switchTenant(newId);
    try {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    return newTenant;
  };

  const savePenduduk = (items: Penduduk[]) => {
    setRawPendudukList(items);
    try {
      localStorage.setItem(STORAGE_KEYS.PENDUDUK, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSurat = (items: SuratPermohonan[]) => {
    setRawSuratList(items);
    try {
      localStorage.setItem(STORAGE_KEYS.SURAT, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  };

  const tambahPenduduk = (item: Omit<Penduduk, 'id' | 'tenant_id'>) => {
    const newItem: Penduduk = {
      ...item,
      id: `p-${Date.now()}`,
      tenant_id: currentTenantId,
    };
    const updated = [newItem, ...rawPendudukList];
    savePenduduk(updated);
    return newItem;
  };

  const hapusPenduduk = (id: string) => {
    const updated = rawPendudukList.filter((p) => p.id !== id);
    savePenduduk(updated);
  };

  const buatSurat = (data: {
    nik_pemohon: string;
    nama_pemohon: string;
    jenis_surat: string;
    kode_surat: string;
    keperluan: string;
    keterangan_tambahan?: string;
  }) => {
    const desaSurat = rawSuratList.filter((s) => s.tenant_id === currentTenantId);
    const nextNum = (desaSurat.length + 1).toString().padStart(3, '0');
    const bulanRomawi = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
    const tahun = 2026;
    const kodeDesaSingkat = activeTenant.nama_desa.substring(0, 3).toUpperCase();
    const nomorSurat = `470/${nextNum}/${data.kode_surat}/D${kodeDesaSingkat}/${bulanRomawi}/${tahun}`;

    const newSurat: SuratPermohonan = {
      id: `SRT-${Date.now()}`,
      tenant_id: currentTenantId,
      nomor_surat: nomorSurat,
      jenis_surat: data.jenis_surat,
      kode_surat: data.kode_surat,
      nik_pemohon: data.nik_pemohon,
      nama_pemohon: data.nama_pemohon,
      tanggal_permohonan: '2026-10-21',
      keperluan: data.keperluan,
      status: 'Menunggu',
      keterangan_tambahan: data.keterangan_tambahan,
    };

    const updated = [newSurat, ...rawSuratList];
    saveSurat(updated);
    return newSurat;
  };

  const updateStatusSurat = (id: string, status: 'Menunggu' | 'Disetujui' | 'Dicetak' | 'Ditolak') => {
    const updated = rawSuratList.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status,
          tanggal_cetak: status === 'Dicetak' ? '2026-10-21' : s.tanggal_cetak,
        };
      }
      return s;
    });
    saveSurat(updated);
  };

  // Active Tenant: cari berdasarkan id, slug, atau kode_desa
  const cleanId = (currentTenantId || globalTenantId || '').trim().toLowerCase();
  const cleanNumbers = cleanId.replace(/[^0-9]/g, '');

  const activeTenant = useMemo(() => {
    return (
      tenantList.find((t) => {
        if (t.id.toLowerCase() === cleanId || t.slug.toLowerCase() === cleanId) return true;
        if (t.kode_desa && t.kode_desa.toLowerCase() === cleanId) return true;
        const tNumbers = (t.kode_desa || '').replace(/[^0-9]/g, '');
        if (cleanNumbers && tNumbers === cleanNumbers) return true;
        return false;
      }) || tenantList[0]
    );
  }, [tenantList, cleanId, cleanNumbers]);

  // Filtered Data isolated strictly by Active Tenant
  const targetTenantSlug = activeTenant.slug || activeTenant.id;
  const targetTenantId = activeTenant.id;

  const pendudukList = useMemo(() => {
    return rawPendudukList.filter((p) => p.tenant_id === targetTenantSlug || p.tenant_id === targetTenantId);
  }, [rawPendudukList, targetTenantSlug, targetTenantId]);

  const keluargaList = useMemo(() => {
    return rawKeluargaList.filter((k) => k.tenant_id === targetTenantSlug || k.tenant_id === targetTenantId);
  }, [rawKeluargaList, targetTenantSlug, targetTenantId]);

  const suratList = useMemo(() => {
    return rawSuratList.filter((s) => s.tenant_id === targetTenantSlug || s.tenant_id === targetTenantId);
  }, [rawSuratList, targetTenantSlug, targetTenantId]);

  const bansosList = useMemo(() => {
    return DAFTAR_BANSOS.filter((b) => b.tenant_id === targetTenantSlug || b.tenant_id === targetTenantId);
  }, [targetTenantSlug, targetTenantId]);

  const penerimaBansosList = useMemo(() => {
    return PENERIMA_BANSOS.filter((p) => p.tenant_id === targetTenantSlug || p.tenant_id === targetTenantId);
  }, [targetTenantSlug, targetTenantId]);

  const apbdesList = useMemo(() => {
    return APBDES_ITEMS.filter((a) => a.tenant_id === targetTenantSlug || a.tenant_id === targetTenantId);
  }, [targetTenantSlug, targetTenantId]);

  const beritaList = useMemo(() => {
    return BERITA_DESA.filter((b) => b.tenant_id === targetTenantSlug || b.tenant_id === targetTenantId);
  }, [targetTenantSlug, targetTenantId]);

  const aparaturList = useMemo(() => {
    return APARATUR_DESA.filter((ap) => ap.tenant_id === targetTenantSlug || ap.tenant_id === targetTenantId);
  }, [targetTenantSlug, targetTenantId]);

  return {
    isLoaded,
    tenantList,
    currentTenantId,
    activeTenant,
    switchTenant,
    tambahTenant,
    pendudukList,
    keluargaList,
    suratList,
    bansosList,
    penerimaBansosList,
    apbdesList,
    beritaList,
    aparaturList,
    tambahPenduduk,
    hapusPenduduk,
    buatSurat,
    updateStatusSurat,
  };
}

// Alias untuk kompatibilitas mundur
export const useOpenSIDStore = useDesDigStore;
