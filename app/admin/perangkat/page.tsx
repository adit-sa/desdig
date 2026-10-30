'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  Key,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Copy,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface DeviceItem {
  id: string;
  deviceName: string;
  deviceToken: string;
  isActive: boolean;
  pairedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function PerangkatAdminPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [mounted, setMounted] = useState(false);

  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const [isCurrentAuthorized, setIsCurrentAuthorized] = useState(false);
  const [currentDeviceName, setCurrentDeviceName] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Device Form
  const [newDeviceName, setNewDeviceName] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  // Manual Pairing
  const [manualCode, setManualCode] = useState('');

  const fetchDevices = async () => {
    const slug = currentTenantId || activeTenant?.slug || '';
    if (!slug) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/attendance/kiosk/device?tenant=${slug}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat perangkat');

      const devList: DeviceItem[] = data.devices || [];
      setDevices(devList);

      // Cek apakah browser / komputer ini sudah terdaftar
      const stored = localStorage.getItem(`desdig_kiosk_device_${slug}`) || localStorage.getItem(`opensid_kiosk_device_${slug}`);
      setLocalToken(stored);

      if (stored) {
        const matched = devList.find((d) => d.deviceToken === stored && d.isActive);
        if (matched) {
          setIsCurrentAuthorized(true);
          setCurrentDeviceName(matched.deviceName);
        } else {
          setIsCurrentAuthorized(false);
        }
      } else {
        setIsCurrentAuthorized(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal memuat daftar komputer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentTenantId || activeTenant?.slug) {
      fetchDevices();
    }
  }, [currentTenantId, activeTenant?.slug]);

  // 1-Klik Otorisasi Komputer Ini
  const handleAuthorizeThisComputer = async () => {
    try {
      setAuthorizing(true);
      setErrorMsg(null);

      const name = newDeviceName.trim() || `Komputer Pelayanan Kantor Desa ${activeTenant.nama_desa}`;

      const res = await fetch('/api/attendance/kiosk/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentTenantId,
          deviceName: name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengotorisasi komputer');

      // Simpan deviceToken di browser localStorage (desDig standar & fallback)
      localStorage.setItem(`desdig_kiosk_device_${currentTenantId}`, data.device.deviceToken);
      localStorage.setItem(`opensid_kiosk_device_${currentTenantId}`, data.device.deviceToken);
      setLocalToken(data.device.deviceToken);
      setIsCurrentAuthorized(true);
      setCurrentDeviceName(data.device.deviceName);
      setNewDeviceName('');
      setSuccessMsg(`Komputer ini berhasil diotorisasi sebagai "${data.device.deviceName}"!`);

      fetchDevices();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengotorisasi');
    } finally {
      setAuthorizing(false);
    }
  };

  // Cabut Otorisasi Komputer Lokal
  const handleUnpairThisComputer = () => {
    localStorage.removeItem(`desdig_kiosk_device_${currentTenantId}`);
    localStorage.removeItem(`opensid_kiosk_device_${currentTenantId}`);
    setLocalToken(null);
    setIsCurrentAuthorized(false);
    setSuccessMsg('Otorisasi pada browser/komputer ini telah dicopot.');
  };

  // Hapus Perangkat dari Database
  const handleDeleteDevice = async (device: DeviceItem) => {
    if (!confirm(`Hapus dan cabut otorisasi untuk "${device.deviceName}"? Komputer tersebut tidak akan bisa dipakai absen lagi.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/attendance/kiosk/device?id=${device.id}&tenant=${currentTenantId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus perangkat');

      // Jika yang dihapus adalah token komputer ini
      if (localToken === device.deviceToken) {
        localStorage.removeItem(`desdig_kiosk_device_${currentTenantId}`);
        localStorage.removeItem(`opensid_kiosk_device_${currentTenantId}`);
        setIsCurrentAuthorized(false);
        setLocalToken(null);
      }

      setSuccessMsg(`Perangkat "${device.deviceName}" berhasil dihapus.`);
      fetchDevices();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus perangkat');
    }
  };

  // Copy Token Helper
  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    alert('Kode Otorisasi (Pairing Key) berhasil disalin ke clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Monitor className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Keamanan Absensi Kantor
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            Komputer & Perangkat Absensi Kantor Desa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Pastikan absensi pamong <strong>hanya dapat dilakukan dari komputer resmi kantor desa</strong>. Kunci akses perangkat dengan pairing token agar tidak bisa dimanipulasi dari luar kantor.
          </p>
        </div>

        <Link
          suppressHydrationWarning
          href={mounted && currentTenantId ? `/absen?tenant=${currentTenantId}` : '/absen'}
          target="_blank"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition self-start md:self-auto cursor-pointer"
        >
          <span>Buka Layar Kiosk Absensi</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">
            ×
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Current Device Status Card */}
      <div className={`rounded-2xl p-6 border shadow-sm transition ${isCurrentAuthorized
        ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200 dark:border-emerald-800'
        : 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-amber-200 dark:border-amber-800'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl ${isCurrentAuthorized
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              }`}>
              {isCurrentAuthorized ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Status Komputer Ini:
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isCurrentAuthorized
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                  {isCurrentAuthorized ? 'Terotorisasi Resmi ✅' : 'Belum Terotorisasi ⚠️'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
                {isCurrentAuthorized
                  ? `Komputer ini telah didaftarkan sebagai "${currentDeviceName}". Pamong desa dapat langsung absen di komputer ini menggunakan PIN masing-masing.`
                  : 'Komputer ini belum didaftarkan sebagai perangkat resmi. Klik tombol di bawah untuk mengotorisasi komputer ini 1x saja.'}
              </p>
              {isCurrentAuthorized && localToken && (
                <div className="mt-2 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                  <span>Pairing Token: {localToken}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isCurrentAuthorized ? (
              <div className="flex items-center gap-2">
                <Link
                  suppressHydrationWarning
                  href={mounted && currentTenantId ? `/absen?tenant=${currentTenantId}` : '/absen'}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <span>Mulai Kiosk Absen</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleUnpairThisComputer}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 transition"
                >
                  Copot Otorisasi
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Nama Komputer (misal: PC Pelayanan)"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  onClick={handleAuthorizeThisComputer}
                  disabled={authorizing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {authorizing ? 'Mendaftarkan...' : 'Otorisasi Komputer Ini Sekarang'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table of Registered Office Computers */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-emerald-600" />
              Daftar Komputer Kantor yang Diotorisasi ({devices.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hanya komputer-komputer di bawah ini yang berhak membuka halaman absensi mandiri.
            </p>
          </div>

          <button
            onClick={fetchDevices}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
            title="Muat Ulang"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama Komputer / Perangkat</th>
                <th className="py-3 px-4">Kode Otorisasi (Pairing Key)</th>
                <th className="py-3 px-4">Tanggal Diotorisasi</th>
                <th className="py-3 px-4">Terakhir Digunakan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat daftar komputer terdaftar...
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada komputer yang diotorisasi. Klik &quot;Otorisasi Komputer Ini Sekarang&quot; di atas untuk mendaftarkan komputer balai desa.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        <span>{d.deviceName}</span>
                        {localToken === d.deviceToken && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            (Komputer Ini)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {d.deviceToken}
                        </span>
                        <button
                          onClick={() => handleCopy(d.deviceToken)}
                          title="Salin Kode Pairing"
                          className="text-slate-400 hover:text-emerald-600 transition"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleString('id-ID') : 'Belum Pernah'}
                    </td>
                    <td className="py-3 px-4">
                      {d.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteDevice(d)}
                        title="Cabut Otorisasi Komputer Ini"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
