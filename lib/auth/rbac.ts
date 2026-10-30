import { NextRequest, NextResponse } from 'next/server';

export interface AuthSession {
  id: string;
  name: string;
  email: string;
  globalRole: 'SUPER_ADMIN' | 'USER';
  role: 'VILLAGE_ADMIN' | 'EDITOR' | 'AUTHOR' | 'APARATUR' | 'AUDITOR';
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

/**
 * Ekstrak sesi autentikasi dari request (Cookie desdig_auth_session atau opensid_auth_session).
 */
export function getAuthSession(request: Request | NextRequest): AuthSession | null {
  try {
    if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
      const cookie = (request as any).cookies.get('desdig_auth_session') || (request as any).cookies.get('opensid_auth_session');
      if (cookie?.value) {
        return JSON.parse(decodeURIComponent(cookie.value));
      }
    }
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:desdig_auth_session|opensid_auth_session)=([^;]+)/);
    if (match) {
      return JSON.parse(decodeURIComponent(match[1]));
    }
  } catch {
    // ignore parse error
  }
  return null;
}

/**
 * Validasi apakah sesi adalah Super Admin SaaS Platform.
 */
export function isSuperAdmin(session: AuthSession | null): boolean {
  return session?.globalRole === 'SUPER_ADMIN';
}

/**
 * Validasi apakah sesi memiliki hak akses ke tenant tertentu.
 * - Super Admin: berhak mengakses seluruh tenant desa manapun.
 * - Non-Super Admin: hanya berhak mengakses tenant miliknya sendiri (sesuai session.tenantSlug / session.tenantId).
 */
export function canAccessTenant(
  session: AuthSession | null,
  targetTenantIdOrSlug?: string | null
): boolean {
  if (!session) return false;
  if (session.globalRole === 'SUPER_ADMIN') return true;

  if (!targetTenantIdOrSlug) {
    return !!session.tenantSlug || !!session.tenantId;
  }

  const cleanTarget = targetTenantIdOrSlug.trim().toLowerCase();
  const cleanSessionSlug = (session.tenantSlug || '').trim().toLowerCase();
  const cleanSessionId = (session.tenantId || '').trim().toLowerCase();

  return cleanTarget === cleanSessionSlug || cleanTarget === cleanSessionId;
}

/**
 * Helper guard untuk API Routes:
 * Memastikan request dilakukan oleh Super Admin SaaS Platform.
 */
export function requireSuperAdminApi(request: Request | NextRequest): {
  authorized: boolean;
  response?: NextResponse;
  session?: AuthSession;
} {
  const session = getAuthSession(request);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Autentikasi diperlukan. Silakan login sebagai Super Admin.' },
        { status: 401 }
      ),
    };
  }

  if (session.globalRole !== 'SUPER_ADMIN') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Akses ditolak: Operasi ini hanya boleh dilakukan oleh Super Admin SaaS Platform.' },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Helper guard untuk API Routes:
 * Memastikan request dilakukan oleh user yang sah untuk mengelola tenant tersebut.
 * Mencegah Manager Desa A membaca atau memodifikasi data Desa B.
 * Mendukung filter peran internal desa (VILLAGE_ADMIN, EDITOR, AUTHOR, APARATUR, AUDITOR).
 */
export function requireTenantManagerApi(
  request: Request | NextRequest,
  targetTenantIdOrSlug?: string | null,
  allowedRoles?: Array<'VILLAGE_ADMIN' | 'EDITOR' | 'AUTHOR' | 'APARATUR' | 'AUDITOR'>
): {
  authorized: boolean;
  response?: NextResponse;
  session?: AuthSession;
} {
  const session = getAuthSession(request);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' },
        { status: 401 }
      ),
    };
  }

  // Super Admin SaaS memiliki hak akses global ke seluruh tenant
  if (session.globalRole === 'SUPER_ADMIN') {
    return { authorized: true, session };
  }

  // Cek batas isolasi tenant
  if (!canAccessTenant(session, targetTenantIdOrSlug)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            'Akses ditolak: Anda tidak memiliki wewenang untuk melihat atau memodifikasi data desa lain.',
        },
        { status: 403 }
      ),
    };
  }

  // Cek hak akses role internal desa jika ditentukan
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.role)) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            error: `Akses ditolak: Peran akun Anda (${session.role}) tidak memiliki izin untuk fitur ini.`,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true, session };
}
