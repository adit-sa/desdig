import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { announcementSchema } from '@/lib/validations/cms';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';
import { revalidateTenantCache } from '@/lib/tenant/cache-revalidate';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const [announcements, themeConfig] = await Promise.all([
      prisma.announcement.findMany({
        where: { tenantId: tenant.id },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.tenantThemeConfig.findFirst({
        where: { tenantId: tenant.id, isPublished: true },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => null),
    ]);

    const settings = (themeConfig?.settings as any) || {};
    const homepageAnnouncementCount =
      typeof settings.homepage_announcement_count === 'number' && settings.homepage_announcement_count > 0
        ? settings.homepage_announcement_count
        : 8;
    const announcementPerSlide =
      typeof settings.announcement_per_slide === 'number' && settings.announcement_per_slide > 0
        ? settings.announcement_per_slide
        : 2;

    return NextResponse.json({
      announcements,
      homepageAnnouncementCount,
      announcementPerSlide,
    });
  } catch (error: any) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const perSlide = body.announcementPerSlide !== undefined ? Number(body.announcementPerSlide) : undefined;
    const count = body.homepageAnnouncementCount !== undefined ? Number(body.homepageAnnouncementCount) : undefined;

    if (perSlide === undefined && count === undefined) {
      return NextResponse.json(
        { error: 'Parameter announcementPerSlide atau homepageAnnouncementCount wajib disertakan' },
        { status: 400 }
      );
    }

    if (perSlide !== undefined && (isNaN(perSlide) || perSlide < 1 || perSlide > 6)) {
      return NextResponse.json(
        { error: 'Jumlah pengumuman per slide harus berupa angka antara 1 dan 6' },
        { status: 400 }
      );
    }

    if (count !== undefined && (isNaN(count) || count < 1 || count > 20)) {
      return NextResponse.json(
        { error: 'Jumlah total pengumuman harus berupa angka antara 1 dan 20' },
        { status: 400 }
      );
    }

    // Ambil themeConfig aktif atau buat jika belum ada
    const existingConfig = await prisma.tenantThemeConfig.findFirst({
      where: { tenantId: tenant.id, isPublished: true },
      orderBy: { updatedAt: 'desc' },
    });

    const currentThemeId = existingConfig?.themeId || tenant.activeThemeId || 'modern-government';
    const currentSettings = (existingConfig?.settings as Record<string, any>) || {};

    const updatedSettings = {
      ...currentSettings,
    };
    if (perSlide !== undefined) {
      updatedSettings.announcement_per_slide = perSlide;
    }
    if (count !== undefined) {
      updatedSettings.homepage_announcement_count = count;
    }

    await prisma.tenantThemeConfig.upsert({
      where: {
        tenantId_themeId: {
          tenantId: tenant.id,
          themeId: currentThemeId,
        },
      },
      update: {
        settings: updatedSettings,
        isPublished: true,
      },
      create: {
        tenantId: tenant.id,
        themeId: currentThemeId,
        settings: updatedSettings,
        isPublished: true,
      },
    });

    // Catat ke Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'ANNOUNCEMENT_SETTING_UPDATE',
        resource: `Announcement Settings: ${perSlide !== undefined ? `${perSlide} per slide` : ''} ${count !== undefined ? `${count} total` : ''}`.trim(),
        details: { announcementPerSlide: perSlide, homepageAnnouncementCount: count },
      },
    }).catch(() => {});

    // Revalidate cache agar beranda langsung update tanpa jeda
    revalidateTenantCache(tenant.id);

    return NextResponse.json({
      success: true,
      announcementPerSlide: updatedSettings.announcement_per_slide ?? 2,
      homepageAnnouncementCount: updatedSettings.homepage_announcement_count ?? 8,
      message: `Pengaturan pengumuman berhasil disimpan.`,
    });
  } catch (error: any) {
    console.error('Error updating announcement settings:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan pengaturan' }, { status: 500 });
  }
}

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
        expiresAt: validation.data.expiresAt
          ? new Date(validation.data.expiresAt)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 1 bulan jika tidak diatur
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

    revalidateTenantCache(tenant.id);
    return NextResponse.json({ success: true, announcement: newAnnouncement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat pengumuman' }, { status: 500 });
  }
}
