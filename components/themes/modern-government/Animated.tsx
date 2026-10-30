'use client';

import React, { useState, useRef, useEffect } from 'react';

export function AnimatedCounter({
  target,
  duration = 1800,
  prefix = '',
  suffix = '',
  formatNumber = true,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatNumber?: boolean;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkVisibility = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    if (checkVisibility()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let animId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easeOutCubic easing curve for natural, satisfying counting
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeOut * target);

      setCount(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isVisible, target, duration]);

  const formatted = formatNumber
    ? new Intl.NumberFormat('id-ID').format(count)
    : count.toString();

  return (
    <span ref={ref} className="tabular-nums inline-block font-black transition-transform duration-300">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function AnimatedProgressBar({
  percentage,
  category,
}: {
  percentage: number;
  category: string;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Reset to 0 briefly on prop change then smoothly animate to target percentage
    setWidth(0);
    const timer = setTimeout(() => {
      setWidth(Math.min(100, Math.max(3, percentage)));
    }, 60);
    return () => clearTimeout(timer);
  }, [percentage]);

  const gradientClass =
    category === 'Pendapatan'
      ? 'from-emerald-500 via-teal-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.45)]'
      : category === 'Belanja'
      ? 'from-amber-500 via-orange-400 to-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
      : 'from-blue-500 via-cyan-400 to-blue-600 shadow-[0_0_12px_rgba(59,130,246,0.45)]';

  return (
    <div className="w-full bg-slate-200/90 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-300/70 shadow-inner relative">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${gradientClass} transition-all duration-1000 ease-out relative overflow-hidden`}
        style={{ width: `${width}%` }}
      >
        {/* Animated moving stripes */}
        <div className="absolute inset-0 progress-stripes opacity-40 pointer-events-none" />
        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 shimmer-progress opacity-60 pointer-events-none" />
        {/* Leading glow pulse beam */}
        <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/95 rounded-full blur-[0.5px] animate-pulse" />
      </div>
    </div>
  );
}
