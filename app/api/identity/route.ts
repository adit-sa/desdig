import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { formatKodeKemendagri } from '@/lib/formatters';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const activeConfig =
      tenant.themeConfigs.find((c) => c.themeId === tenant.activeThemeId && c.isPublished) ||
      tenant.themeConfigs.find((c) => c.isPublished) ||
      tenant.themeConfigs[0] ||
      null;

    const rawSettings = (activeConfig?.settings as Record<string, any>) || {};
    const socialMedia = rawSettings.socialMedia || {
      facebook: rawSettings.facebook || '',
      instagram: rawSettings.instagram || '',
      youtube: rawSettings.youtube || '',
      whatsapp: rawSettings.whatsapp || tenant.telepon || '',
      tiktok: rawSettings.tiktok || '',
      twitter: rawSettings.twitter || '',
    };

    return NextResponse.json({
      success: true,
      data: {
        id: tenant.id,
        slug: tenant.slug,
        namaDesa: tenant.namaDesa,
        kecamatan: tenant.kecamatan,
        kabupaten: tenant.kabupaten,
        provinsi: tenant.provinsi,
        kodeDesa: tenant.kodeDesa || '',
        kodePos: tenant.kodePos || '',
        alamatKantor: tenant.alamatKantor || '',
        telepon: tenant.telepon || '',
        email: tenant.email || '',
        logoUrl: tenant.logoUrl || '',
        socialMedia,
        visi: tenant.visi || '',
        misi: Array.isArray(tenant.misi)
          ? tenant.misi
          : typeof tenant.misi === 'string'
          ? JSON.parse(tenant.misi)
          : [],
        visiPeriode: rawSettings.visiPeriode || '2026-2031',
      },
    });
  } catch (error: any) {
    console.error('Error fetching identity:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const {
      logoUrl,
      telepon,
      email,
      alamatKantor,
      kodePos,
      kodeDesa,
      socialMedia,
      visi,
      misi,
      visiPeriode,
    } = body;

    // 1. Update data profil utama Tenant (termasuk Visi & Misi)
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        ...(logoUrl !== undefined && { logoUrl }),
        ...(telepon !== undefined && { telepon }),
        ...(email !== undefined && { email }),
        ...(alamatKantor !== undefined && { alamatKantor }),
        ...(kodePos !== undefined && { kodePos }),
        ...(kodeDesa !== undefined && { kodeDesa: kodeDesa ? formatKodeKemendagri(kodeDesa) : null }),
        ...(visi !== undefined && { visi }),
        ...(misi !== undefined && { misi: Array.isArray(misi) ? misi.filter(Boolean) : [] }),
      },
    });

    // 2. Simpan media sosial & periode visi ke dalam konfigurasi tema aktif
    if (socialMedia || visiPeriode) {
      const activeThemeId = tenant.activeThemeId || 'modern-government';
      const existingConfig = tenant.themeConfigs.find((c) => c.themeId === activeThemeId);
      const existingSettings = (existingConfig?.settings as Record<string, any>) || {};

      const newSettings = {
        ...existingSettings,
        ...(visiPeriode && { visiPeriode }),
        ...(socialMedia && {
          socialMedia: {
            facebook: socialMedia.facebook || '',
            instagram: socialMedia.instagram || '',
            youtube: socialMedia.youtube || '',
            whatsapp: socialMedia.whatsapp || '',
            tiktok: socialMedia.tiktok || '',
            twitter: socialMedia.twitter || '',
          },
        }),
      };

      await prisma.tenantThemeConfig.upsert({
        where: {
          tenantId_themeId: {
            tenantId: tenant.id,
            themeId: activeThemeId,
          },
        },
        update: {
          settings: newSettings,
          isPublished: true,
        },
        create: {
          tenantId: tenant.id,
          themeId: activeThemeId,
          settings: newSettings,
          isPublished: true,
        },
      });
    }

    // 3. Catat ke Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'UPDATE_IDENTITY',
        resource: `Identitas & Kontak Desa Diperbarui`,
        details: { logoUrl, telepon, email, alamatKantor, socialMedia },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Identitas, logo, kontak, dan media sosial desa berhasil diperbarui',
      data: updatedTenant,
    });
  } catch (error: any) {
    console.error('Error saving identity:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
