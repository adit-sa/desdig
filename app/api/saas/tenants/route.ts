import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { requireSuperAdminApi } from '@/lib/auth/rbac';
import { formatKodeKemendagri } from '@/lib/formatters';

export async function GET(request: NextRequest) {
  const auth = requireSuperAdminApi(request);
  if (!auth.authorized) return auth.response!;

  try {
    const [tenants, plans] = await Promise.all([
      prisma.tenant.findMany({
        include: {
          plan: true,
          domains: true,
          _count: {
            select: {
              articles: true,
              officials: true,
              modules: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscriptionPlan.findMany(),
    ]);

    const mrr = tenants.reduce((acc, t) => acc + (t.plan?.priceMonthly || 0), 0);

    return NextResponse.json({
      tenants,
      plans,
      totalTenants: tenants.length,
      mrr,
    });
  } catch (error: any) {
    console.error('Error fetching SaaS tenants:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireSuperAdminApi(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await request.json();
    const {
      namaDesa,
      slug,
      kodeDesa,
      kecamatan,
      kabupaten,
      provinsi = 'Jawa Barat',
      kodePos,
      alamatKantor,
      email,
      telepon,
      kepalaDesa,
      visi,
      planCode = 'PROFESSIONAL',
    } = body;

    if (!namaDesa || !kecamatan || !kabupaten) {
      return NextResponse.json(
        { error: 'Nama desa, kecamatan, dan kabupaten wajib diisi' },
        { status: 400 }
      );
    }

    const cleanSlug = (slug || namaDesa)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Cek apakah slug sudah ada
    const existing = await prisma.tenant.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${cleanSlug}" sudah digunakan oleh desa lain.` },
        { status: 400 }
      );
    }

    // Cari paket langganan
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { code: planCode as any },
    });

    // Buat tenant baru di PostgreSQL
    const newTenant = await prisma.tenant.create({
      data: {
        namaDesa,
        slug: cleanSlug,
        kodeDesa: kodeDesa ? formatKodeKemendagri(kodeDesa) : null,
        kecamatan,
        kabupaten,
        provinsi,
        kodePos: kodePos || null,
        alamatKantor: alamatKantor || null,
        email: email || null,
        telepon: telepon || null,
        kepalaDesa: kepalaDesa || null,
        visi: visi || 'Mewujudkan Desa Mandiri dan Sejahtera.',
        misi: ['Meningkatkan pelayanan publik', 'Memajukan perekonomian desa'],
        planId: plan?.id || null,
        activeThemeId: 'modern-government',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });

    // Buat domain default
    await prisma.domain.create({
      data: {
        tenantId: newTenant.id,
        domain: `${cleanSlug}.localhost:3000`,
        isPrimary: true,
        isVerified: true,
      },
    });

    // Buat konfigurasi tema awal
    await prisma.tenantThemeConfig.create({
      data: {
        tenantId: newTenant.id,
        themeId: 'modern-government',
        isPublished: true,
        settings: {
          showStats: true,
          showApbdes: true,
        },
      },
    });

    // Aktifkan modul-modul awal yang diizinkan plan
    const modulesToEnable = plan?.allowedModules || ['profile', 'news', 'announcements', 'ppid'];
    for (const modKey of modulesToEnable) {
      await prisma.tenantModule.create({
        data: {
          tenantId: newTenant.id,
          moduleKey: modKey,
          isEnabled: true,
        },
      });
    }

    // Catat ke Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: newTenant.id,
        action: 'TENANT_REGISTER',
        resource: `New tenant created: ${newTenant.namaDesa} (${newTenant.slug})`,
        details: { planCode, cleanSlug },
      },
    });

    return NextResponse.json({ success: true, tenant: newTenant }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    return NextResponse.json({ error: error.message || 'Gagal mendaftarkan desa' }, { status: 500 });
  }
}
