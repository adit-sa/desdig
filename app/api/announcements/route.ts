import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { announcementSchema } from '@/lib/validations/cms';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const announcements = await prisma.announcement.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ announcements });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const validation = announcementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.format() },
        { status: 400 }
      );
    }

    const newAnnouncement = await prisma.announcement.create({
      data: {
        tenantId: tenant.id,
        title: validation.data.title,
        content: validation.data.content,
        isPinned: validation.data.isPinned,
        status: validation.data.status,
        expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : null,
      },
    });

    // Catat ke Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'ANNOUNCEMENT_CREATE',
        resource: `Announcement: ${newAnnouncement.title}`,
        details: { id: newAnnouncement.id },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, announcement: newAnnouncement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat pengumuman' }, { status: 500 });
  }
}
