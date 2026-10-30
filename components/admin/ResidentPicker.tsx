'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, X, Check, Loader2, Users, AlertCircle, Plus } from 'lucide-react';

export interface SelectedResident {
  id: string;
  nik: string;
  noKk?: string;
  nama: string;
  jenisKelamin?: string;
  dusun?: string | null;
  rt?: string | null;
  rw?: string | null;
  alamat?: string | null;
  pekerjaan?: string | null;
  telepon?: string | null;
  fotoUrl?: string | null;
}

interface ResidentPickerProps {
  tenantSlug: string;
  selectedResidentId?: string | null;
  selectedResidentName?: string | null;
  onSelect: (resident: SelectedResident) => void;
  onClear: () => void;
  label?: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
}

export default function ResidentPicker({
  tenantSlug,
  selectedResidentId,
  selectedResidentName,
  onSelect,
  onClear,
  label = 'Sumber Nama Penduduk (Wajib dari Data Kependudukan)',
  required = true,
  helperText = 'Ketik Nama atau NIK untuk memilih warga dari data kependudukan resmi desa.',
  placeholder = 'Ketik nama warga atau 16 digit NIK...',
}: ResidentPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SelectedResident[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeResident, setActiveResident] = useState<SelectedResident | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Jika ada selectedResidentId saat awal / edit mode, load data penduduk bersangkutan
  useEffect(() => {
    if (!selectedResidentId) {
      setActiveResident(null);
      return;
    }

    if (activeResident && activeResident.id === selectedResidentId) return;

    let isMounted = true;
    const fetchSelected = async () => {
      try {
        const res = await fetch(`/api/residents?tenant=${tenantSlug}&q=${encodeURIComponent(selectedResidentName || selectedResidentId)}`);
        const data = await res.json();
        if (isMounted && data.residents) {
          const found = data.residents.find((r: SelectedResident) => r.id === selectedResidentId);
          if (found) {
            setActiveResident(found);
          } else if (selectedResidentName) {
            setActiveResident({
              id: selectedResidentId,
              nik: 'Terdata',
              nama: selectedResidentName,
            });
          }
        }
      } catch (e) {
        console.error('Error fetching resident detail:', e);
      }
    };

    fetchSelected();
    return () => {
      isMounted = false;
    };
  }, [selectedResidentId, selectedResidentName, tenantSlug]);

  // Debounced search
  useEffect(() => {
    if (!isOpen || query.trim().length === 0) {
      if (query.trim().length === 0) setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/residents?tenant=${tenantSlug}&q=${encodeURIComponent(query.trim())}&limit=15`);
        const data = await res.json();
        setResults(data.residents || []);
      } catch (err) {
        console.error('Gagal mencari data penduduk:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen, tenantSlug]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (r: SelectedResident) => {
    setActiveResident(r);
    onSelect(r);
    setIsOpen(false);
    setQuery('');
  };

  const handleRemove = () => {
    setActiveResident(null);
    onClear();
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {/* Kartu Penduduk Terpilih */}
      {activeResident ? (
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-xs shadow">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {activeResident.nama}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full flex-shrink-0">
                  Data Warga Valid
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-2">
                <span>NIK: <strong>{activeResident.nik}</strong></span>
                {activeResident.dusun && <span>&bull; Dusun: {activeResident.dusun}</span>}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex-shrink-0"
            title="Ganti / Hapus Penduduk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Input Pencarian Penduduk */
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full text-xs p-3 pl-9 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            {loading && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-3.5" />
            )}
          </div>

          {/* Dropdown Hasil Pencarian */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {results.length > 0 ? (
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelect(r)}
                    className="w-full text-left p-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {r.nama}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        NIK: {r.nik} {r.dusun ? `• ${r.dusun}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                      Pilih
                    </span>
                  </button>
                ))
              ) : query.trim().length > 0 && !loading ? (
                <div className="p-4 text-center text-xs text-slate-500 space-y-1">
                  <p>Tidak ada warga ditemukan dengan kata kunci &ldquo;{query}&rdquo;.</p>
                  <p className="text-[11px] text-slate-400">Pastikan NIK atau nama sudah terdaftar di Buku Induk Kependudukan.</p>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Ketik minimal 1 huruf/angka untuk mencari penduduk desa</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
}
