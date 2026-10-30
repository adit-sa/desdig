import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SYSTEM_MODULES } from '@/lib/modules/registry';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const tenantWithPlan = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        plan: true,
        modules: true,
      },
    });

    if (!tenantWithPlan) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const tenantModulesMap = new Map<string, boolean>();
    tenantWithPlan.modules.forEach((tm) => {
      tenantModulesMap.set(tm.moduleKey, tm.isEnabled);
    });

    // Petakan ke 15 modul sistem dengan status per tenant
    const result = SYSTEM_MODULES.map((mod) => {
      const isAllowedByPlan = tenantWithPlan.plan
        ? tenantWithPlan.plan.allowedModules.includes(mod.key)
        : true;

      // Default jika belum ada record: core modules true, non-core true jika ada di plan
      const isEnabled = tenantModulesMap.has(mod.key)
        ? tenantModulesMap.get(mod.key) && isAllowedByPlan
        : isAllowedByPlan;

      return {
        ...mod,
        isEnabled: !!isEnabled,
        isAllowedByPlan,
        planName: tenantWithPlan.plan?.name || 'Paket Pro',
      };
    });

    return NextResponse.json({
      tenantSlug: tenant.slug,
      namaDesa: tenant.namaDesa,
      plan: tenantWithPlan.plan,
      modules: result,
    });
  } catch (error: any) {
    console.error('Error fetching modules:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { moduleKey, isEnabled, tenantSlug } = body;

    if (!moduleKey) {
      return NextResponse.json({ error: 'moduleKey wajib diisi' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const tenantWithPlan = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { plan: true },
    });

    if (!tenantWithPlan) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // Periksa apakah modul dibatasi oleh paket langganan
    if (isEnabled && tenantWithPlan.plan && !tenantWithPlan.plan.allowedModules.includes(moduleKey)) {
      return NextResponse.json(
        {
          error: `Modul ini tidak tercakup dalam ${tenantWithPlan.plan.name}. Silakan upgrade paket langganan untuk mengaktifkan.`,
          restricted: true,
        },
        { status: 403 }
      );
    }

    // Upsert status modul tenant di PostgreSQL
    const updated = await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId: tenant.id,
          moduleKey,
        },
      },
      update: {
        isEnabled: !!isEnabled,
      },
      create: {
        tenantId: tenant.id,
        moduleKey,
        isEnabled: !!isEnabled,
      },
    });

    // Catat ke Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'MODULE_TOGGLE',
        resource: `Module ${moduleKey} set to ${isEnabled ? 'ENABLED' : 'DISABLED'}`,
        details: { moduleKey, isEnabled },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Modul ${moduleKey} berhasil ${isEnabled ? 'diaktifkan' : 'dinonaktifkan'}`,
      tenantModule: updated,
    });
  } catch (error: any) {
    console.error('Error toggling module:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengubah status modul' }, { status: 500 });
  }
}
