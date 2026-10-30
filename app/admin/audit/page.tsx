'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useOpenSIDStore } from '@/lib/store';

interface AuditItem {
  id: string;
  action: string;
  resource: string;
  details: any;
  ipAddress: string | null;
  createdAt: string;
  tenant: { namaDesa: string; slug: string } | null;
  user: { name: string; email: string } | null;
}

export default function AuditLogPage() {
  const { currentTenantId, activeTenant } = useOpenSIDStore();
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/audit?tenant=${currentTenantId}`);
      const data = await res.json();
      if (data.auditLogs) setLogs(data.auditLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentTenantId]);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Log Audit & Rekam Aktivitas Keamanan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekam jejak setiap aksi administratif kritis (perubahan tema, aktivasi modul, publikasi berita) untuk{' '}
            <strong className="text-emerald-600">Desa {activeTenant.nama_desa}</strong>.
          </p>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm">Memuat rekam audit...</div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">Belum ada rekam audit untuk desa ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Waktu Kejadian</th>
                  <th className="px-5 py-3 font-semibold">Tipe Aksi</th>
                  <th className="px-5 py-3 font-semibold">Deskripsi / Resource</th>
                  <th className="px-5 py-3 font-semibold">Pengguna / Eksekutor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 max-w-md">
                      <p className="font-medium text-slate-900 dark:text-white">{log.resource}</p>
                      {log.details && (
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          {JSON.stringify(log.details)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {log.user ? `${log.user.name} (${log.user.email})` : 'Sistem / Operator'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
