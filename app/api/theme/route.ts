import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { themeSwitchSchema } from '@/lib/validations/cms';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const themes = await prisma.theme.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      activeThemeId: tenant.activeThemeId,
      themeConfigs: tenant.themeConfigs,
      availableThemes: themes,
    });
  } catch (error: any) {
    console.error('Error fetching themes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = themeSwitchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validasi tema gagal', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { themeId, settings } = validationResult.data;
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) {
      return auth.response!;
    }

    // Update activeThemeId pada Tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        activeThemeId: themeId,
      },
    });

    // Simpan konfigurasi tema atau update jika sudah ada
    if (settings) {
      await prisma.tenantThemeConfig.upsert({
        where: {
          tenantId_themeId: {
            tenantId: tenant.id,
            themeId,
          },
        },
        update: {
          settings: settings as any,
          isPublished: true,
        },
        create: {
          tenantId: tenant.id,
          themeId,
          settings: settings as any,
          isPublished: true,
        },
      });
    }

    // Catat ke Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'THEME_SWITCH',
        resource: `Theme switched to ${themeId}`,
        details: { previousTheme: tenant.activeThemeId, newTheme: themeId },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Tema berhasil diganti menjadi ${themeId}`,
      activeThemeId: updatedTenant.activeThemeId,
    });
  } catch (error: any) {
    console.error('Error switching theme:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengubah tema' }, { status: 500 });
  }
}
