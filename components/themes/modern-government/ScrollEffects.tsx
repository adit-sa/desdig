'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Native smooth scroll, progress bar baca, parallax hero, scroll-reveal & tombol kembali ke atas.
 * Menggunakan browser native scroll-behavior tanpa library eksternal (0 KB extra bundle).
 * Semua efek scroll ditulis langsung ke DOM (GPU transform) tanpa state React per frame.
 */
export default function ScrollEffects({ revealKey }: { revealKey: unknown }) {
  const readingProgressRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const heroBg = document.querySelector<HTMLElement>('[data-parallax="hero-bg"]');
    const heroContent = document.querySelector<HTMLElement>('[data-parallax="hero-content"]');
    const heroPrompt = document.querySelector<HTMLElement>('[data-parallax="hero-prompt"]');

    let ticking = false;

    const applyScroll = (y: number) => {
      // Update Reading Progress Bar langsung ke GPU
      if (readingProgressRef.current) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0;
        readingProgressRef.current.style.transform = `scaleX(${progress})`;
      }

      // Parallax halus di Hero Section
      if (y <= 750) {
        if (heroBg) heroBg.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + y * 0.0002})`;
        if (heroContent) {
          heroContent.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
          heroContent.style.opacity = `${Math.max(0, 1 - y / 550)}`;
        }
        if (heroPrompt) heroPrompt.style.opacity = `${Math.max(0, 1 - y / 120)}`;
      }

      // Tampilkan tombol back-to-top jika lewat 400px
      const isOver = y > 400;
      setShowBackToTop((prev) => (prev !== isOver ? isOver : prev));
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => applyScroll(window.scrollY));
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Scroll-triggered Reveal Animations
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -30px 0px', threshold: 0.06 }
    );

    const observeElements = () => {
      document.querySelectorAll('.scroll-reveal:not(.is-visible)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight - 30) {
          el.classList.add('is-visible');
        } else {
          observer.observe(el);
        }
      });
    };

    observeElements();
    const timer = setTimeout(observeElements, 600);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [revealKey]);

  return (
    <>
      {/* Top Scroll Reading Progress Indicator */}
      <div
        ref={readingProgressRef}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 z-50 origin-left pointer-events-none will-change-transform"
        style={{ transform: 'scaleX(0)' }}
      />

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 ring-4 ring-white/50 flex items-center justify-center cursor-pointer animate-in fade-in zoom-in-75 duration-200"
          title="Kembali ke atas"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </>
  );
}
