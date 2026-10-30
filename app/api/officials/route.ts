import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { officialSchema } from '@/lib/validations/cms';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const officials = await prisma.villageOfficial.findMany({
      where: { tenantId: tenant.id },
      include: {
        resident: {
          select: {
            id: true,
            nik: true,
            nama: true,
            dusun: true,
            alamat: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return NextResponse.json({ officials });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
    if (!auth.authorized) return auth.response!;

    const validation = officialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.format() },
        { status: 400 }
      );
    }

    const official = await prisma.villageOfficial.create({
      data: {
        tenantId: tenant.id,
        residentId: validation.data.residentId || null,
        name: validation.data.name,
        position: validation.data.position,
        nip: validation.data.nip || null,
        photoUrl: validation.data.photoUrl || null,
        pinCode: validation.data.pinCode || '1234',
        orderIndex: validation.data.orderIndex,
        isActive: validation.data.isActive,
      },
      include: {
        resident: true,
      },
    });

    return NextResponse.json({ success: true, official }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menyimpan pamong' }, { status: 500 });
  }
}
