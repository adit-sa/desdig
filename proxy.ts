import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // 1. Lewati static files, favicon, dan image optimization
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Proteksi API Master SaaS: Hanya untuk akun SUPER_ADMIN
  if (pathname.startsWith('/api/saas')) {
    const authSession = (request.cookies.get('desdig_auth_session') || request.cookies.get('opensid_auth_session'))?.value;
    const parsed = verifySessionToken(authSession);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan. Silakan login sebagai Super Admin SaaS.' },
        { status: 401 }
      );
    }
    if (parsed.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin SaaS Platform yang berhak mengakses API ini.' },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Lewati API route umum (akan divalidasi oleh route handler masing-masing)
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 3. Proteksi Akses UI Master SaaS (/saas): Hanya untuk akun SUPER_ADMIN
  if (pathname.startsWith('/saas')) {
    const authSession = (request.cookies.get('desdig_auth_session') || request.cookies.get('opensid_auth_session'))?.value;
    const parsed = verifySessionToken(authSession);
    if (!parsed) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (parsed.globalRole !== 'SUPER_ADMIN') {
      // Manager desa dilarang keras masuk ke Master SaaS, kembalikan ke dashboard desanya
      const targetUrl = parsed.tenantSlug ? `/admin?tenant=${parsed.tenantSlug}` : '/admin';
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
  }

  // 4. Proteksi Akses UI Admin Desa: Wajib login untuk masuk ke area manajemen operasional desa
  const isAdminProtected =
    (pathname.startsWith('/admin') && pathname !== '/admin/login') ||
    pathname.startsWith('/kependudukan') ||
    pathname.startsWith('/surat') ||
    pathname.startsWith('/bansos') ||
    pathname.startsWith('/keuangan') ||
    pathname.startsWith('/statistik');

  if (isAdminProtected) {
    const authSession = (request.cookies.get('desdig_auth_session') || request.cookies.get('opensid_auth_session'))?.value;
    const parsed = verifySessionToken(authSession);
    if (!parsed) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // STRICT TENANT ISOLATION:
      // Jika pengguna adalah Manager/Admin Desa biasa (bukan SUPER_ADMIN),
      // kunci akses hanya pada tenant miliknya sendiri.
      if (parsed.globalRole !== 'SUPER_ADMIN' && parsed.tenantSlug) {
        const queryTenant = request.nextUrl.searchParams.get('tenant');
        if (!queryTenant || queryTenant.toLowerCase() !== parsed.tenantSlug.toLowerCase()) {
          // Paksa redirect selalu berada pada tenant resmi miliknya
          const cleanUrl = new URL(request.url);
          cleanUrl.searchParams.set('tenant', parsed.tenantSlug);
          return NextResponse.redirect(cleanUrl);
        }

        // ROLE-BASED ROUTE ACCESS CONTROL FOR VILLAGE ROLES:
        const role = parsed.role; // VILLAGE_ADMIN | EDITOR | AUTHOR | APARATUR | AUDITOR
        const fallbackUrl = new URL(`/admin?tenant=${parsed.tenantSlug}`, request.url);

        // 1. Pengguna & Pengaturan Sistem: Hanya untuk VILLAGE_ADMIN
        const isVillageAdminOnlyRoute =
          pathname.startsWith('/admin/users') ||
          pathname.startsWith('/admin/identitas') ||
          pathname.startsWith('/admin/tampilan') ||
          pathname.startsWith('/admin/modul') ||
          pathname.startsWith('/admin/menu') ||
          pathname.startsWith('/admin/perangkat');

        if (isVillageAdminOnlyRoute && role !== 'VILLAGE_ADMIN') {
          return NextResponse.redirect(fallbackUrl);
        }

        // 2. Keuangan APBDes & Audit Log: Hanya untuk VILLAGE_ADMIN dan AUDITOR
        const isFinanceOrAuditRoute =
          pathname.startsWith('/keuangan') ||
          pathname.startsWith('/admin/audit');

        if (isFinanceOrAuditRoute && role !== 'VILLAGE_ADMIN' && role !== 'AUDITOR') {
          return NextResponse.redirect(fallbackUrl);
        }

        // 3. Kependudukan, Surat, Bansos: Hanya untuk VILLAGE_ADMIN dan EDITOR
        const isCitizenServiceRoute =
          pathname.startsWith('/kependudukan') ||
          pathname.startsWith('/surat') ||
          pathname.startsWith('/bansos');

        if (isCitizenServiceRoute && role !== 'VILLAGE_ADMIN' && role !== 'EDITOR') {
          return NextResponse.redirect(fallbackUrl);
        }
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-tenant-host', host);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
