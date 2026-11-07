import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signSessionToken } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`login:${ip}`, 8, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login dari perangkat ini. Silakan tunggu 1 menit sebelum mencoba lagi.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, tenantSlug, kodeDesa } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        memberships: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Email atau password tidak valid' }, { status: 401 });
    }

    // 2. Verifikasi password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Email atau password tidak valid' }, { status: 401 });
    }

    const isSuperAdmin = user.globalRole === 'SUPER_ADMIN';

    // Jika bukan Super Admin, Kode Desa wajib diisi
    if (!isSuperAdmin && !kodeDesa && !tenantSlug) {
      return NextResponse.json({ error: 'Kode Desa wajib diisi' }, { status: 400 });
    }

    // 3. Tentukan Tenant & Role berdasarkan Kode Desa atau Slug
    let activeMembership = null;
    const lookupKey = (kodeDesa || tenantSlug || '').trim();
    const lookupNumbers = lookupKey.replace(/[^0-9]/g, '');

    activeMembership = user.memberships.find((m) => {
      if (m.tenant.slug.toLowerCase() === lookupKey.toLowerCase() || m.tenant.id === lookupKey) return true;
      if (m.tenant.kodeDesa && m.tenant.kodeDesa.toLowerCase() === lookupKey.toLowerCase()) return true;
      const tNumbers = (m.tenant.kodeDesa || '').replace(/[^0-9]/g, '');
      if (lookupNumbers && tNumbers === lookupNumbers) return true;
      return false;
    });

    // Jika user bukan super admin dan tidak cocok dengan kode desa yang dimasukkan
    if (!activeMembership && user.globalRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Kode Desa tidak sesuai atau akun Anda tidak terdaftar pada desa ini' },
        { status: 403 }
      );
    }

    // Jika tidak spesifik, ambil membership pertama
    if (!activeMembership && user.memberships.length > 0) {
      activeMembership = user.memberships[0];
    }

    if (!activeMembership && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Pengguna tidak memiliki hak akses pada desa ini' },
        { status: 403 }
      );
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      globalRole: user.globalRole,
      role: activeMembership ? activeMembership.role : (isSuperAdmin ? 'VILLAGE_ADMIN' : 'APARATUR'),
      tenantId: activeMembership ? activeMembership.tenant.id : (tenantSlug || ''),
      tenantSlug: activeMembership ? activeMembership.tenant.slug : (tenantSlug || ''),
      tenantName: activeMembership ? activeMembership.tenant.namaDesa : '',
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: sessionData,
    });

    // Simpan token sesi bertanda tangan kriptografis HMAC-SHA256 (HttpOnly)
    const signedToken = signSessionToken(sessionData as any);
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      sameSite: 'lax' as const,
    };
    response.cookies.set('desdig_auth_session', signedToken, cookieOptions);
    response.cookies.set('opensid_auth_session', signedToken, cookieOptions);

    // Cookie non-sensitif untuk profil client-side UI
    const profileOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax' as const,
    };
    response.cookies.set(
      'desdig_user_profile',
      JSON.stringify({
        name: user.name,
        email: user.email,
        globalRole: user.globalRole,
        tenantSlug: sessionData.tenantSlug,
      }),
      profileOptions
    );

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
