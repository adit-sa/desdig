import crypto from 'crypto';
import { AuthSession } from './rbac';

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'desdig-secret-production-token-salt-2026-multi-tenant-indonesia';

/**
 * Encode payload objek menjadi Base64URL string
 */
function base64UrlEncode(data: string): string {
  return Buffer.from(data, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Decode Base64URL string kembali ke string utf-8
 */
function base64UrlDecode(data: string): string {
  let str = data.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Tanda tangani payload AuthSession secara kriptografis menggunakan HMAC-SHA256
 */
export function signSessionToken(payload: AuthSession, expiresInSeconds = 7 * 24 * 60 * 60): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresInSeconds;

  const dataWithMeta = {
    ...payload,
    iat: issuedAt,
    exp: expiresAt,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(dataWithMeta));
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(encodedPayload);
  const signature = base64UrlEncode(hmac.digest('base64'));

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifikasi token sesi:
 * Memeriksa kecocokan signature HMAC-SHA256 dan waktu kedaluwarsa (exp).
 * Mengembalikan null jika token dipalsukan atau kedaluwarsa.
 */
export function verifySessionToken(token: string | null | undefined): AuthSession | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length === 2) {
    const [encodedPayload, signature] = parts;
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(encodedPayload);
    const expectedSig = base64UrlEncode(hmac.digest('base64'));

    // Gunakan timing-safe comparison untuk mencegah timing attack
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }

    try {
      const decodedJson = base64UrlDecode(encodedPayload);
      const parsed = JSON.parse(decodedJson);

      // Cek expiry
      if (parsed.exp && Math.floor(Date.now() / 1000) > parsed.exp) {
        return null;
      }

      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        globalRole: parsed.globalRole,
        role: parsed.role,
        tenantId: parsed.tenantId,
        tenantSlug: parsed.tenantSlug,
        tenantName: parsed.tenantName,
      };
    } catch {
      return null;
    }
  }

  // Fallback sementara untuk transisi sesi legacy (hanya jika JSON valid dan bukan Super Admin)
  try {
    const raw = JSON.parse(decodeURIComponent(token));
    if (raw && raw.id && raw.email && raw.globalRole !== 'SUPER_ADMIN') {
      return raw as AuthSession;
    }
  } catch {
    // Abaikan parse error
  }

  return null;
}

