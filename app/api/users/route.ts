import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

// GET /api/users?tenant=...
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant desa tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN', 'AUDITOR']);
    if (!auth.authorized) return auth.response!;

    // Ambil seluruh membership untuk tenant ini
    const memberships = await prisma.tenantMembership.findMany({
      where: {
        tenantId: tenant.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const users = memberships.map((m) => ({
      membershipId: m.id,
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      createdAt: m.user.createdAt,
    }));

    return NextResponse.json({ users, total: users.length });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, name, email, password, role } = body;

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant desa tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) return auth.response!;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nama, email, password, dan role wajib diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Cek apakah user sudah ada
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { memberships: true },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Periksa apakah sudah terdaftar di tenant ini
      const alreadyInTenant = user.memberships.some((m) => m.tenantId === tenant.id);
      if (alreadyInTenant) {
        return NextResponse.json(
          { error: `User dengan email ${cleanEmail} sudah terdaftar di desa ini.` },
          { status: 400 }
        );
      }

      // Hubungkan user ke tenant ini
      await prisma.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role,
        },
      });
    } else {
      // Buat user baru
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: cleanEmail,
          passwordHash: hashedPassword,
          memberships: {
            create: {
              tenantId: tenant.id,
              role,
            },
          },
        },
        include: { memberships: true },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Pengguna berhasil ditambahkan',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat user' }, { status: 500 });
  }
}
