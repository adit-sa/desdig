'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import SafeImage from '@/components/SafeImage';

interface DynamicQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  alt?: string;
}

export default function DynamicQrCode({
  value,
  size = 120,
  className = '',
  alt = 'QR Code Verifikasi Resmi',
}: DynamicQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;
    if (!value) return;

    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!isCancelled) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-slate-100 flex items-center justify-center border border-slate-200 animate-pulse text-[10px] text-slate-400 font-mono ${className}`}
      >
        QR
      </div>
    );
  }

  return (
    <SafeImage
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain block ${className}`}
      unoptimized
    />
  );
}
