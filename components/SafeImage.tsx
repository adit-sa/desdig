'use client';

import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

export interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
}

export default function SafeImage({
  src,
  fallbackSrc = '/images/balai_desa_gedung.jpg',
  alt = '',
  className,
  unoptimized,
  ...props
}: SafeImageProps) {
  const validSrc = (src && typeof src === 'string' && src.trim()) ? src.trim() : fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState<string>(validSrc);

  useEffect(() => {
    setCurrentSrc(validSrc);
  }, [validSrc]);

  const isDataOrBlob = currentSrc.startsWith('data:') || currentSrc.startsWith('blob:');

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt || 'Foto'}
      className={className}
      unoptimized={unoptimized || isDataOrBlob}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
}

