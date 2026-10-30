import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const menus = await prisma.$queryRaw<any[]>`
      SELECT id, "tenantId", title, url, "parentId", "orderIndex", "isVisible", "isExternal", "createdAt", "updatedAt"
      FROM "NavMenu"
      WHERE "tenantId" = ${tenant.id}
      ORDER BY "orderIndex" ASC
    `;

    return NextResponse.json({
      success: true,
      menus,
    });
  } catch (error: any) {
    console.error('Error fetching menus:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat menu navigasi' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, title, url, parentId, orderIndex, isVisible, isExternal } = body;

    if (!title || !url) {
      return NextResponse.json({ error: 'Nama menu dan tautan URL wajib diisi' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const id = `menu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const order = typeof orderIndex === 'number' ? orderIndex : 0;
    const visible = typeof isVisible === 'boolean' ? isVisible : true;
    const external = typeof isExternal === 'boolean' ? isExternal : false;
    const parent = parentId && parentId !== 'NONE' ? parentId : null;

    await prisma.$executeRaw`
      INSERT INTO "NavMenu" ("id", "tenantId", "title", "url", "parentId", "orderIndex", "isVisible", "isExternal", "createdAt", "updatedAt")
      VALUES (${id}, ${tenant.id}, ${title}, ${url}, ${parent}, ${order}, ${visible}, ${external}, NOW(), NOW())
    `;

    return NextResponse.json({
      success: true,
      menu: {
        id,
        tenantId: tenant.id,
        title,
        url,
        parentId: parent,
        orderIndex: order,
        isVisible: visible,
        isExternal: external,
      },
    });
  } catch (error: any) {
    console.error('Error creating menu:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan menu' }, { status: 500 });
  }
}
