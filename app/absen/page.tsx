'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Search,
  Key,
  X,
  Sparkles,
  Building2,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Lock,
  ChevronRight,
  Delete,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';
import { getTimezoneByProvince } from '@/components/themes/modern-government/shared';
import SafeImage from '@/components/SafeImage';

interface OfficialItem {
  id: string;
  name: string;
  position: string;
  nip: string | null;
  photoUrl: string | null;
  attendance: {
    id: string;
    date: string;
    status: 'HADIR' | 'TERLAMBAT' | 'IZIN' | 'SAKIT' | 'DINAS_LUAR' | 'ALFA';
    checkInTime: string | null;
    checkOutTime: string | null;
    notes: string | null;
  } | null;
}

export default function KioskAbsenPage() {
  const { currentTenantId, activeTenant, tenantList, switchTenant } = useOpenSIDStore();
  const timezone = getTimezoneByProvince(activeTenant?.provinsi || 'Sulawesi Barat');

  // Realtime Clock State
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Kiosk Device Security State
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isDeviceVerified, setIsDeviceVerified] = useState<boolean | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [pairingInput, setPairingInput] = useState('');
  const [pairingLoading, setPairingLoading] = useState(false);

  // Officials State
  const [officials, setOfficials] = useState<OfficialItem[]>([]);
  const [loadingOfficials, setLoadingOfficials] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PEMERINTAH' | 'DUSUN' | 'BPD'>('ALL');

  // PIN Pad Modal State
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialItem | null>(null);
  const [pinCode, setPinCode] = useState('');
  const [submittingPin, setSubmittingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [clockSuccess, setClockSuccess] = useState<string | null>(null);

  // Offline-First Kiosk State
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  // Sync Antrean Offline ke Server
  const syncOfflineQueue = async () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('desdig_offline_attendances');
      if (!raw) return;
      const queue: any[] = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining: any[] = [];
      for (const item of queue) {
        try {
          const res = await fetch('/api/attendance/kiosk/clock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          });
          if (!res.ok && res.status !== 401 && res.status !== 429) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem('desdig_offline_attendances', JSON.stringify(remaining));
        setPendingOfflineCount(remaining.length);
      } else {
        localStorage.removeItem('desdig_offline_attendances');
        setPendingOfflineCount(0);
        fetchOfficials();
      }
    } catch {}
  };

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    const raw = localStorage.getItem('desdig_offline_attendances');
    if (raw) {
      try {
        const queue = JSON.parse(raw);
        setPendingOfflineCount(Array.isArray(queue) ? queue.length : 0);
      } catch {}
    }
    syncOfflineQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentTenantId]);

  // Clock Ticker
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check Local Device Token
  useEffect(() => {
    const stored = localStorage.getItem(`desdig_kiosk_device_${currentTenantId}`) || localStorage.getItem(`opensid_kiosk_device_${currentTenantId}`);
    setDeviceToken(stored);

    if (!stored) {
      setIsDeviceVerified(false);
      setDeviceError('Komputer ini belum diotorisasi sebagai Perangkat Absensi Resmi Kantor Desa.');
    } else {
      // Verifikasi token ke backend
      verifyDeviceToken(stored);
    }
  }, [currentTenantId]);

  const verifyDeviceToken = async (token: string) => {
    try {
      const res = await fetch(`/api/attendance/kiosk/device?tenant=${currentTenantId}`);
      const data = await res.json();
      const valid = (data.devices || []).some((d: any) => d.deviceToken === token && d.isActive);

      if (valid) {
        setIsDeviceVerified(true);
        setDeviceError(null);
        fetchOfficials();
      } else {
        setIsDeviceVerified(false);
        setDeviceError('Kode otorisasi perangkat sudah tidak valid atau telah dicabut oleh Admin.');
      }
    } catch {
      setIsDeviceVerified(false);
      setDeviceError('Gagal memverifikasi status perangkat ke server.');
    }
  };

  // Manual Pairing
  const handlePairDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingInput.trim()) return;

    try {
      setPairingLoading(true);
      setDeviceError(null);

      const token = pairingInput.trim();
      const res = await fetch(`/api/attendance/kiosk/device?tenant=${currentTenantId}`);
      const data = await res.json();
      const matched = (data.devices || []).find((d: any) => d.deviceToken === token && d.isActive);

      if (matched) {
        localStorage.setItem(`desdig_kiosk_device_${currentTenantId}`, token);
        localStorage.setItem(`opensid_kiosk_device_${currentTenantId}`, token);
        setDeviceToken(token);
        setIsDeviceVerified(true);
        setPairingInput('');
        fetchOfficials();
      } else {
        setDeviceError('Kode Pairing tidak ditemukan atau tidak aktif untuk desa ini.');
      }
    } catch {
      setDeviceError('Terjadi kesalahan saat memverifikasi kode.');
    } finally {
      setPairingLoading(false);
    }
  };

  // Fetch Officials for Kiosk
  const fetchOfficials = async () => {
    try {
      setLoadingOfficials(true);
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?tenant=${currentTenantId}&date=${today}`);
      const data = await res.json();
      if (data.officials) {
        setOfficials(data.officials);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOfficials(false);
    }
  };

  // Open PIN Modal
  const handleOpenPinModal = (official: OfficialItem) => {
    setSelectedOfficial(official);
    setPinCode('');
    setPinError(null);
    setClockSuccess(null);
  };

  // Numeric Keypad Click
  const handleKeypadPress = (num: string) => {
    if (pinCode.length < 6) {
      const next = pinCode + num;
      setPinCode(next);
      setPinError(null);
    }
  };

  const handleKeypadDelete = () => {
    setPinCode(pinCode.slice(0, -1));
    setPinError(null);
  };

  const handleKeypadClear = () => {
    setPinCode('');
    setPinError(null);
  };

  // Submit PIN for Clock In
  const handleClockInWithPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedOfficial || !pinCode || !deviceToken) return;

    try {
      setSubmittingPin(true);
      setPinError(null);

      const res = await fetch('/api/attendance/kiosk/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: currentTenantId,
          deviceToken,
          officialId: selectedOfficial.id,
          pinCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses absensi.');
      }

      setClockSuccess(`Absensi ${data.official.name} Berhasil Tercatat!`);

      // Refresh list & auto close modal after 1.8 seconds
      fetchOfficials();
      setTimeout(() => {
        setSelectedOfficial(null);
        setPinCode('');
        setClockSuccess(null);
      }, 1800);
    } catch (err: any) {
      // Jika jaringan mati atau fetch gagal karena offline, simpan ke antrean lokal aman
      if (typeof navigator !== 'undefined' && (!navigator.onLine || err.name === 'TypeError')) {
        try {
          const raw = localStorage.getItem('desdig_offline_attendances');
          const queue = raw ? JSON.parse(raw) : [];
          queue.push({
            tenantSlug: currentTenantId,
            deviceToken,
            officialId: selectedOfficial.id,
            officialName: selectedOfficial.name,
            pinCode,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem('desdig_offline_attendances', JSON.stringify(queue));
          setPendingOfflineCount(queue.length);
          setClockSuccess(`(Mode Luar Jaringan) Absensi ${selectedOfficial.name} Disimpan di Perangkat!`);

          setTimeout(() => {
            setSelectedOfficial(null);
            setPinCode('');
            setClockSuccess(null);
          }, 2200);
        } catch {
          setPinError('Gagal menyimpan absensi offline.');
          setPinCode('');
        }
      } else {
        setPinError(err.message || 'PIN yang dimasukkan salah.');
        setPinCode('');
      }
    } finally {
      setSubmittingPin(false);
    }
  };

  // Categorize
  const getCategory = (position: string) => {
    const p = (position || '').toLowerCase();
    if (p.includes('dusun')) return 'DUSUN';
    if (p.includes('bpd')) return 'BPD';
    return 'PEMERINTAH';
  };

  const filteredOfficials = useMemo(() => {
    let list = officials;
    if (categoryFilter !== 'ALL') {
      list = list.filter((o) => getCategory(o.position) === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.position.toLowerCase().includes(q) ||
          (o.nip && o.nip.includes(q))
      );
    }
    return list;
  }, [officials, categoryFilter, search]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Kiosk Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 font-black">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                suppressHydrationWarning
                className="font-extrabold text-sm sm:text-base text-white tracking-tight"
              >
                Pemerintah Desa {activeTenant.nama_desa}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                Layar Absensi Mandiri
              </span>
            </div>
            <p suppressHydrationWarning className="text-[11px] text-slate-400">
              Kec. {activeTenant.kecamatan}, Kab. {activeTenant.kabupaten}
            </p>
          </div>
        </div>

        {/* Status Koneksi & Sinkronisasi Antrean Offline */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Offline (Luar Jaringan)</span>
            </div>
          )}
          {pendingOfflineCount > 0 && (
            <button
              type="button"
              onClick={syncOfflineQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-bold cursor-pointer hover:bg-amber-900/60 transition"
              title="Klik untuk sinkronisasi antrean ke server"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{pendingOfflineCount} Tersimpan Lokal</span>
            </button>
          )}
        </div>

        {/* Realtime Live Digital Clock */}
        <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-4 py-2 rounded-2xl shadow-inner">
          <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div className="text-right">
            <div
              suppressHydrationWarning
              className="text-lg sm:text-xl font-black font-mono tracking-wider text-emerald-400"
            >
              {currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'} {timezone}
            </div>
            <div suppressHydrationWarning className="text-[10px] text-slate-400 font-medium">
              {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </div>
          </div>
        </div>
      </header>

      {/* Main Kiosk Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Device Verification Screen if NOT authorized */}
        {!isDeviceVerified ? (
          <div className="max-w-md mx-auto my-12 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Komputer Ini Belum Diotorisasi
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Absensi pamong desa hanya dapat dilakukan dari <strong>Komputer Resmi Kantor Desa</strong> yang telah diverifikasi oleh Admin.
              </p>
            </div>

            {deviceError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}

            <form onSubmit={handlePairDevice} className="space-y-3 text-left">
              <label className="block text-xs font-bold text-slate-300">
                Masukkan Kode Pairing Otorisasi Komputer
              </label>
              <input
                type="text"
                required
                value={pairingInput}
                onChange={(e) => setPairingInput(e.target.value)}
                placeholder="Contoh: KIOSK-DESA-XXXXXX"
                className="w-full text-xs font-mono uppercase bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              <button
                type="submit"
                disabled={pairingLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {pairingLoading ? 'Memverifikasi...' : 'Otorisasi Komputer Ini'}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-xs text-slate-500">
              Belum punya kode? Masuk ke panel{' '}
              <Link
                href="/admin/perangkat"
                className="text-emerald-400 font-bold hover:underline"
              >
                Admin → Perangkat Absensi
              </Link>{' '}
              untuk mengotorisasi komputer ini.
            </div>
          </div>
        ) : (
          /* Authorized Kiosk Screen */
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    categoryFilter === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Semua Pamong ({officials.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('PEMERINTAH')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    categoryFilter === 'PEMERINTAH'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Pemerintah Desa
                </button>
                <button
                  onClick={() => setCategoryFilter('DUSUN')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    categoryFilter === 'DUSUN'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Kepala Dusun
                </button>
                <button
                  onClick={() => setCategoryFilter('BPD')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    categoryFilter === 'BPD'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  BPD
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau jabatan..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                />
              </div>
            </div>

            {/* Instruction Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4 flex-shrink-0 animate-spin" />
                <span>Silakan klik foto atau nama Anda di bawah, lalu masukkan 4 digit PIN Anda untuk absen.</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono hidden md:block">
                Komputer Kantor Terverifikasi ✅
              </div>
            </div>

            {/* Officials Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingOfficials ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                  Memuat data aparatur...
                </div>
              ) : filteredOfficials.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                  Tidak ada aparatur yang ditemukan.
                </div>
              ) : (
                filteredOfficials.map((ofc) => {
                  const att = ofc.attendance;
                  const isPresent = att && (att.status === 'HADIR' || att.status === 'TERLAMBAT' || att.status === 'DINAS_LUAR');

                  return (
                    <div
                      key={ofc.id}
                      onClick={() => handleOpenPinModal(ofc)}
                      className="group bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                    >
                      {/* Photo Box */}
                      <div className="h-44 sm:h-52 relative w-full bg-slate-950 overflow-hidden">
                        {ofc.photoUrl ? (
                          <SafeImage
                            src={ofc.photoUrl}
                            alt={ofc.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            fallbackSrc="/images/kades_portrait.jpg"
                            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-black text-slate-700">
                            {ofc.name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                        {/* Status Badge in Photo */}
                        <div className="absolute bottom-2 left-2 right-2">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600/95 text-white backdrop-blur-md shadow">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>{att?.status === 'TERLAMBAT' ? 'Terlambat' : 'Sudah Hadir'}</span>
                              {att?.checkInTime && (
                                <span className="font-mono text-[9px] opacity-90">
                                  ({new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800/90 text-slate-300 backdrop-blur-md">
                              Belum Absen
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Text */}
                      <div className="p-3 text-left space-y-0.5">
                        <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-1 group-hover:text-emerald-400 transition">
                          {ofc.name}
                        </h4>
                        <p className="text-[11px] text-emerald-400 font-semibold line-clamp-1">
                          {ofc.position}
                        </p>
                        {ofc.nip && (
                          <p className="text-[9px] font-mono text-slate-500">
                            NIP. {ofc.nip}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sleek PIN Pad Modal */}
      {selectedOfficial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setSelectedOfficial(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Info Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl mx-auto overflow-hidden border-2 border-emerald-500 shadow-md">
                {selectedOfficial.photoUrl ? (
                  <SafeImage
                    src={selectedOfficial.photoUrl}
                    alt={selectedOfficial.name}
                    width={64}
                    height={64}
                    fallbackSrc="/images/kades_portrait.jpg"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-800 flex items-center justify-center text-white font-bold text-xl">
                    {selectedOfficial.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  {selectedOfficial.name}
                </h3>
                <p className="text-xs text-emerald-400 font-bold">
                  {selectedOfficial.position}
                </p>
              </div>
            </div>

            {/* Status / Success / Error Message */}
            {clockSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-extrabold text-sm">{clockSuccess}</div>
                <div className="text-[11px] text-emerald-200/80">Semoga harimu menyenangkan dan berkah!</div>
              </div>
            ) : (
              <div className="space-y-4">
                {pinError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center flex items-center justify-center gap-1.5 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                {/* PIN Display Dots */}
                <div className="text-center space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Masukkan PIN Anda (4 Digit)
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    {[0, 1, 2, 3].map((index) => {
                      const isFilled = pinCode.length > index;
                      return (
                        <div
                          key={index}
                          className={`w-4 h-4 rounded-full transition-all duration-200 ${
                            isFilled
                              ? 'bg-emerald-400 scale-125 shadow-md shadow-emerald-400/50'
                              : 'bg-slate-800 border border-slate-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Keypad Buttons (1-9, C, 0, Backspace) */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-white font-extrabold text-lg transition shadow flex items-center justify-center cursor-pointer"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="h-12 rounded-xl bg-slate-800/60 hover:bg-rose-900/60 text-rose-400 font-bold text-sm transition flex items-center justify-center cursor-pointer"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-white font-extrabold text-lg transition shadow flex items-center justify-center cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadDelete}
                    className="h-12 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-bold transition flex items-center justify-center cursor-pointer"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="button"
                  onClick={() => handleClockInWithPin()}
                  disabled={pinCode.length < 4 || submittingPin}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submittingPin ? 'Memproses Absensi...' : 'Konfirmasi & Catat Absensi'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 px-4 py-3 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>
          Sistem Absensi Mandiri Terverifikasi · Pemerintah Desa {activeTenant.nama_desa}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="hover:text-emerald-400 transition">
            Dashboard Admin
          </Link>
          <span>·</span>
          <Link href="/" className="hover:text-emerald-400 transition">
            Website Desa
          </Link>
        </div>
      </footer>
    </div>
  );
}
