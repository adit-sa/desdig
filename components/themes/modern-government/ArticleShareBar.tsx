'use client';

import React, { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';

interface ArticleShareBarProps {
  title: string;
  desaName: string;
}

export default function ArticleShareBar({ title, desaName }: ArticleShareBarProps) {
  const [copied, setCopied] = useState(false);

  const handleShareWa = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const text = encodeURIComponent(`*${title}*\nBerita Resmi Pemerintah Desa ${desaName}\n\nBaca selengkapnya di:\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareFb = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
        <Share2 className="w-4 h-4 text-emerald-600" />
        <span>Bagikan Berita Ini ke Warga:</span>
      </div>

      <div className="flex items-center gap-2">
        {/* WhatsApp Share */}
        <button
          onClick={handleShareWa}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          title="Bagikan ke WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </button>

        {/* Facebook Share */}
        <button
          onClick={handleShareFb}
          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          title="Bagikan ke Facebook"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline">Facebook</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition flex items-center gap-1.5 cursor-pointer ${
            copied
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 hover:bg-slate-100'
          }`}
          title="Salin Tautan Berita"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
