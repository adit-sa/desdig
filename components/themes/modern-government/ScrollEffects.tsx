'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Lenis smooth scroll, progress bar baca, parallax hero, scroll-reveal & tombol kembali ke atas.
 * Semua efek scroll ditulis langsung ke DOM (GPU transform) tanpa state React per frame.
 * Elemen parallax ditandai dengan atribut `data-parallax` di HeroSection.
 */
export default function ScrollEffects({ revealKey }: { revealKey: unknown }) {
  const readingProgressRef = useRef<HTMLDivElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const heroBg = document.querySelector<HTMLElement>('[data-parallax="hero-bg"]');
    const heroContent = document.querySelector<HTMLElement>('[data-parallax="hero-content"]');
    const heroPrompt = document.querySelector<HTMLElement>('[data-parallax="hero-prompt"]');

    const applyScroll = (y: number) => {
      // Update Reading Progress Bar langsung ke GPU tanpa re-render React
      if (readingProgressRef.current) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0;
        readingProgressRef.current.style.transform = `scaleX(${progress})`;
      }

      // Parallax halus & ringan di Hero Section (hanya jika dalam viewport hero)
      if (y <= 750) {
        if (heroBg) heroBg.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + y * 0.0002})`;
        if (heroContent) {
          heroContent.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
          heroContent.style.opacity = `${Math.max(0, 1 - y / 550)}`;
        }
        if (heroPrompt) heroPrompt.style.opacity = `${Math.max(0, 1 - y / 120)}`;
      }

      // Hanya ubah state ketika ambang batas 400px berubah
      const isOver = y > 400;
      setShowBackToTop((prev) => (prev !== isOver ? isOver : prev));
    };

    let lenis: any = null;
    let rafId = 0;
    let destroyed = false;

    const initLenis = async () => {
      try {
        const { default: LenisClass } = await import('lenis');
        if (destroyed) return;
        lenis = new LenisClass({
          duration: 0.85, // Ringan, responsif, dan lembut tanpa lag
          easing: (t: number) => 1 - Math.pow(1 - t, 3), // Cubic ease-out
          orientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1.0,
          touchMultiplier: 1.6,
        });

        const raf = (time: number) => {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        };
        rafId = requestAnimationFrame(raf);

        lenis.on('scroll', (e: any) => applyScroll(typeof e.scroll === 'number' ? e.scroll : window.scrollY));
      } catch (err) {
        console.warn('Lenis fallback to native scroll:', err);
      }
    };

    // Lenis hanya untuk desktop (mouse wheel). Di HP/tablet scroll native sudah halus,
    // dan loop RAF Lenis hanya membuang CPU/baterai.
    const skipLenis =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!skipLenis) initLenis();

    const handleNativeScroll = () => {
      if (!lenis) applyScroll(window.scrollY);
    };
    window.addEventListener('scroll', handleNativeScroll, { passive: true });

    return () => {
      destroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleNativeScroll);
      lenis?.destroy();
    };
  }, []);

  // Buttery-smooth Scroll-triggered Reveal Animations
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
    // Pindai ulang sekali untuk elemen yang muncul belakangan (mis. widget lapak setelah fetch)
    const timer = setTimeout(observeElements, 600);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [revealKey]);

  return (
    <>
      {/* Top Scroll Reading Progress Indicator (GPU accelerated scaleX) */}
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
