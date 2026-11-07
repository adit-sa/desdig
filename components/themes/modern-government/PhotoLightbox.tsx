'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Setter } from './shared';
import SafeImage from '@/components/SafeImage';

export default function PhotoLightbox({ activePhoto, setActivePhoto }: { activePhoto: any; setActivePhoto: Setter<any | null> }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
      onClick={() => setActivePhoto(null)}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video sm:aspect-[16/10] bg-black">
          <SafeImage
            src={activePhoto.imageUrl}
            alt={activePhoto.title}
            fill
            sizes="(max-width: 1024px) 100vw, 800px"
            className="object-contain"
          />
          <button
            onClick={() => setActivePhoto(null)}
            className="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-white p-2 rounded-full border border-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="absolute top-4 left-4 bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
            {activePhoto.category}
          </span>
        </div>
        <div className="p-6 space-y-2">
          <h3 className="text-xl font-black text-white">{activePhoto.title}</h3>
          {(activePhoto.caption || activePhoto.description) && (
            <p className="text-sm text-slate-300 leading-relaxed">{activePhoto.caption || activePhoto.description}</p>
          )}
          {activePhoto.takenAt && (
            <p className="text-xs text-slate-400 font-mono">
              Tanggal: {new Date(activePhoto.takenAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
