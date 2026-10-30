'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export default function BackButton({
  fallbackUrl = '/',
  label = 'Kembali ke Halaman Sebelumnya',
  className = 'inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer',
  iconClassName = 'w-4 h-4 text-emerald-600 dark:text-emerald-400',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      // Check if there is history in the current session
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
    }
    router.push(fallbackUrl);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className}
      aria-label={label}
    >
      <ArrowLeft className={iconClassName} />
      <span>{label}</span>
    </button>
  );
}
