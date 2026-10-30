import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.$queryRaw<any[]>`
      SELECT nm."id", nm."tenantId", t."slug" as "tenantSlug"
      FROM "NavMenu" nm
      JOIN "Tenant" t ON nm."tenantId" = t."id"
      WHERE nm."id" = ${id}
    `;

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing[0].tenantSlug);
    if (!auth.authorized) {
      return auth.response!;
    }

    // Hapus juga sub-menu anak jika ada
    await prisma.$executeRaw`DELETE FROM "NavMenu" WHERE "parentId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "NavMenu" WHERE "id" = ${id}`;
    return NextResponse.json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus menu' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.$queryRaw<any[]>`
      SELECT nm."id", nm."tenantId", t."slug" as "tenantSlug"
      FROM "NavMenu" nm
      JOIN "Tenant" t ON nm."tenantId" = t."id"
      WHERE nm."id" = ${id}
    `;

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing[0].tenantSlug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();

    const parent = body.parentId && body.parentId !== 'NONE' ? body.parentId : null;
    const visible = typeof body.isVisible === 'boolean' ? body.isVisible : true;
    const external = typeof body.isExternal === 'boolean' ? body.isExternal : false;
    const order = typeof body.orderIndex === 'number' ? body.orderIndex : 0;

    await prisma.$executeRaw`
      UPDATE "NavMenu"
      SET "title" = ${body.title},
          "url" = ${body.url},
          "parentId" = ${parent},
          "orderIndex" = ${order},
          "isVisible" = ${visible},
          "isExternal" = ${external},
          "updatedAt" = NOW()
      WHERE "id" = ${id}
    `;

    return NextResponse.json({ success: true, message: 'Menu berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui menu' }, { status: 500 });
  }
}
