import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

// PUT /api/users/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tenantSlug, name, role, password } = body;

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) return auth.response!;

    // Update data profil user & password jika ada
    const updateUserData: any = {};
    if (name) updateUserData.name = name.trim();
    if (password && password.trim()) {
      updateUserData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: updateUserData,
      });
    }

    // Update role pada membership tenant ini
    if (role) {
      await prisma.tenantMembership.update({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: id,
          },
        },
        data: { role },
      });
    }

    return NextResponse.json({ success: true, message: 'Data pengguna berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui user' }, { status: 500 });
  }
}

// DELETE /api/users/[id]?tenant=...
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) return auth.response!;

    // Cek apakah user yang dihapus adalah satu-satunya VILLAGE_ADMIN di tenant
    const adminCount = await prisma.tenantMembership.count({
      where: {
        tenantId: tenant.id,
        role: 'VILLAGE_ADMIN',
      },
    });

    const targetMembership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: id,
        },
      },
    });

    if (targetMembership?.role === 'VILLAGE_ADMIN' && adminCount <= 1) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus satu-satunya Admin Utama Desa.' },
        { status: 400 }
      );
    }

    // Hapus keanggotaan dari tenant ini
    await prisma.tenantMembership.delete({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: id,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus dari desa ini' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus user' }, { status: 500 });
  }
}
