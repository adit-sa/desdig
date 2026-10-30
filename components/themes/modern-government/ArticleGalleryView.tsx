'use client';

import React, { useState } from 'react';
import { Images, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export interface AlbumPhoto {
  url: string;
  caption?: string;
}

interface ArticleGalleryViewProps {
  photos: AlbumPhoto[];
  articleTitle: string;
}

export default function ArticleGalleryView({ photos, articleTitle }: ArticleGalleryViewProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) return null;

  const currentPhoto = activePhotoIndex !== null ? photos[activePhotoIndex] : null;

  return (
    <div className="my-8 p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
      {/* Header Album */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400">
            <Images className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
              Album Dokumentasi Foto Kegiatan
            </h4>
            <p className="text-[11px] text-slate-500">
              Klik pada salah satu foto untuk memperbesar tampilan (Lightbox).
            </p>
          </div>
        </div>

        <span className="text-xs font-bold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
          {photos.length} Foto
        </span>
      </div>

      {/* Grid Foto Album */}
      <div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1' : photos.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {photos.map((item, idx) => (
          <div
            key={idx}
            onClick={() => setActivePhotoIndex(idx)}
            className="group relative aspect-4/3 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            <img
              src={item.url}
              alt={item.caption || `Foto dokumentasi ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 text-white backdrop-blur-xs">
                <ZoomIn className="w-4 h-4" />
              </span>
            </div>
            {item.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white text-[11px] truncate">
                {item.caption}
              </div>
            )}
            <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded font-bold">
              {idx + 1} / {photos.length}
            </span>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {currentPhoto && activePhotoIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in-50">
          <button
            onClick={() => setActivePhotoIndex(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-10 cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigasi Kiri / Kanan */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((activePhotoIndex - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition z-10 cursor-pointer"
                title="Foto Sebelumnya"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIndex((activePhotoIndex + 1) % photos.length);
                }}
                className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition z-10 cursor-pointer"
                title="Foto Berikutnya"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Konten Foto */}
          <div className="max-w-4xl w-full flex flex-col items-center justify-center p-2">
            <img
              loading="lazy"
              decoding="async"
              src={currentPhoto.url}
              alt={currentPhoto.caption || articleTitle}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
            />
            {currentPhoto.caption && (
              <p className="text-white text-xs sm:text-sm text-center mt-3 max-w-2xl px-4 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm">
                {currentPhoto.caption}
              </p>
            )}
            <span className="text-white/60 text-[11px] font-mono mt-2">
              Foto {activePhotoIndex + 1} dari {photos.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
