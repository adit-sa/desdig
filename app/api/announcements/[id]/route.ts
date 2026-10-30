import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { announcementSchema } from '@/lib/validations/cms';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.announcement.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Pengumuman dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menghapus' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.announcement.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pengumuman tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();

    const validation = announcementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validasi gagal' }, { status: 400 });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        title: validation.data.title,
        content: validation.data.content,
        isPinned: validation.data.isPinned,
        status: validation.data.status,
        expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, announcement: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memperbarui' }, { status: 500 });
  }
}
