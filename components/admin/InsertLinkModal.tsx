'use client';

import React, { useState, useEffect } from 'react';
import { Link2, X, Globe, Check, AlertCircle } from 'lucide-react';

interface InsertLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onInsert: (text: string, url: string) => void;
}

export default function InsertLinkModal({
  isOpen,
  onClose,
  initialText = '',
  onInsert,
}: InsertLinkModalProps) {
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLinkText(initialText || '');
      setLinkUrl('');
      setError(null);
    }
  }, [isOpen, initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setError('Harap masukkan alamat URL web tujuan.');
      return;
    }

    let formattedUrl = linkUrl.trim();
    // Jika tidak diawali http://, https://, mailto:, atau tel:, otomatis tambahkan https://
    if (
      !formattedUrl.startsWith('http://') &&
      !formattedUrl.startsWith('https://') &&
      !formattedUrl.startsWith('mailto:') &&
      !formattedUrl.startsWith('tel:')
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const title = linkText.trim() || formattedUrl;
    onInsert(title, formattedUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              <Link2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                Sisipkan Link / Tautan Web
              </h3>
              <p className="text-xs text-slate-500">
                Mudah membuat tautan yang bisa diklik pembaca.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Teks yang Tampil di Artikel *
            </label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Contoh: Kunjungi Situs Resmi Kemendesa"
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Teks ini yang akan diklik oleh pembaca.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Web Tujuan (URL Link) *
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Contoh: https://kemendesa.go.id atau www.google.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Bisa langsung tempel (paste) link dari browser.
            </span>
          </div>

          {/* Tombol Pintas Contoh */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-semibold">Pintas:</span>
            <button
              type="button"
              onClick={() => setLinkUrl('https://')}
              className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono"
            >
              https://
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkText('Hubungi via WhatsApp');
                setLinkUrl('https://wa.me/628');
              }}
              className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 px-2 py-0.5 rounded font-medium"
            >
              + Link WhatsApp
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sisipkan Link</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
