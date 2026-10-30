import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { officialSchema } from '@/lib/validations/cms';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.villageOfficial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pamong tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenantId);
    if (!auth.authorized) return auth.response!;

    await prisma.villageOfficial.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Pamong desa berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus pamong' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.villageOfficial.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Pamong tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenantId);
    if (!auth.authorized) return auth.response!;

    const body = await request.json();
    const validation = officialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validasi gagal', details: validation.error.format() }, { status: 400 });
    }

    const updated = await prisma.villageOfficial.update({
      where: { id },
      data: {
        residentId: validation.data.residentId !== undefined ? (validation.data.residentId || null) : undefined,
        name: validation.data.name,
        position: validation.data.position,
        nip: validation.data.nip || null,
        photoUrl: validation.data.photoUrl !== undefined ? (validation.data.photoUrl || null) : undefined,
        pinCode: validation.data.pinCode !== undefined ? (validation.data.pinCode || '1234') : undefined,
        orderIndex: validation.data.orderIndex,
        isActive: validation.data.isActive,
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json({ success: true, official: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui' }, { status: 500 });
  }
}
