'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Jam digital real-time. Sengaja dipisah ke komponen sendiri agar update tiap detik
 * hanya me-render ulang pill kecil ini, bukan seluruh halaman beranda.
 */
export default function LiveClock({ timezone = 'WIB' }: { timezone?: string }) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () =>
      setCurrentTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentTime) return null;

  return (
    <div className="inline-flex items-center gap-2 bg-slate-950/70 border border-emerald-500/30 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium backdrop-blur-md shadow-sm">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
      </span>
      <Clock className="w-3.5 h-3.5 text-emerald-400" />
      <span>
        {currentTime} {timezone} • Pelayanan Buka
      </span>
    </div>
  );
}
