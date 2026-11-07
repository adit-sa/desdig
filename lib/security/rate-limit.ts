import { NextRequest } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Bersihkan rekaman kedaluwarsa secara periodik setiap 5 menit
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Dapatkan alamat IP klien dari header umum proxy/CDN
 */
export function getClientIp(request: Request | NextRequest): string {
  try {
    const forwardedFor = request.headers?.get?.('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIp = request.headers?.get?.('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }

    const cfConnectingIp = request.headers?.get?.('cf-connecting-ip');
    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }
  } catch {}

  return '127.0.0.1';
}

/**
 * Periksa pembatas frekuensi request (Rate Limit)
 * @param key Identifier unik (misal: "login:192.168.1.1")
 * @param maxRequests Jumlah maksimal request yang diizinkan dalam rentang waktu
 * @param windowMs Rentang waktu dalam milidetik (misal: 60_000 untuk 1 menit)
 */
export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    memoryStore.set(key, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const isAllowed = record.count <= maxRequests;

  return {
    success: isAllowed,
    limit: maxRequests,
    remaining,
    resetTime: record.resetTime,
  };
}
