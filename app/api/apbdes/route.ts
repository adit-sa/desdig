import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // 1. Ambil seluruh tahun yang tersedia untuk desa ini
    const distinctYears = await prisma.apbdesItem.findMany({
      where: { tenantId: tenant.id },
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    let availableYears = distinctYears.map((y) => y.year);
    if (availableYears.length === 0) {
      availableYears = [2025];
    }
    availableYears = Array.from(new Set(availableYears)).sort((a, b) => b - a);

    // Tentukan tahun aktif
    const activeYear = yearParam ? parseInt(yearParam, 10) : availableYears[0] || 2025;

    // 2. Ambil data APBDes untuk tahun aktif
    const items = await prisma.apbdesItem.findMany({
      where: {
        tenantId: tenant.id,
        year: activeYear,
      },
      orderBy: { accountCode: 'asc' },
    });

    // Serialisasi BigInt ke Number
    const serializedItems = items.map((item) => ({
      id: item.id,
      tenantId: item.tenantId,
      year: item.year,
      category: item.category,
      accountCode: item.accountCode,
      accountName: item.accountName,
      budget: Number(item.budget),
      realization: Number(item.realization),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    // Hitung statistik
    const pendapatan = serializedItems.filter((i) => i.category === 'Pendapatan');
    const belanja = serializedItems.filter((i) => i.category === 'Belanja');
    const pembiayaan = serializedItems.filter((i) => i.category === 'Pembiayaan');

    const totalAnggaranPendapatan = pendapatan.reduce((acc, curr) => acc + curr.budget, 0);
    const totalRealisasiPendapatan = pendapatan.reduce((acc, curr) => acc + curr.realization, 0);

    const totalAnggaranBelanja = belanja.reduce((acc, curr) => acc + curr.budget, 0);
    const totalRealisasiBelanja = belanja.reduce((acc, curr) => acc + curr.realization, 0);

    return NextResponse.json({
      success: true,
      tenant,
      year: activeYear,
      availableYears,
      items: serializedItems,
      stats: {
        totalAnggaranPendapatan,
        totalRealisasiPendapatan,
        persenPendapatan:
          totalAnggaranPendapatan > 0
            ? Math.round((totalRealisasiPendapatan / totalAnggaranPendapatan) * 100)
            : 0,
        totalAnggaranBelanja,
        totalRealisasiBelanja,
        persenBelanja:
          totalAnggaranBelanja > 0
            ? Math.round((totalRealisasiBelanja / totalAnggaranBelanja) * 100)
            : 0,
      },
    });
  } catch (error: any) {
    console.error('Error fetching APBDes:', error);
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

    const { year, category, accountCode, accountName, budget, realization } = body;

    if (!category || !accountCode || !accountName) {
      return NextResponse.json(
        { error: 'Kategori, Kode Rekening, dan Uraian wajib diisi' },
        { status: 400 }
      );
    }

    const newItem = await prisma.apbdesItem.create({
      data: {
        tenantId: tenant.id,
        year: year ? parseInt(year, 10) : 2026,
        category,
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        budget: BigInt(Math.max(0, Math.round(Number(budget) || 0))),
        realization: BigInt(Math.max(0, Math.round(Number(realization) || 0))),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newItem.id,
        year: newItem.year,
        category: newItem.category,
        accountCode: newItem.accountCode,
        accountName: newItem.accountName,
        budget: Number(newItem.budget),
        realization: Number(newItem.realization),
      },
    });
  } catch (error: any) {
    console.error('Error creating APBDes item:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan data APBDes' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, year, category, accountCode, accountName, budget, realization } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID pos APBDes wajib disertakan' }, { status: 400 });
    }

    const existing = await prisma.apbdesItem.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pos APBDes tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const updated = await prisma.apbdesItem.update({
      where: { id },
      data: {
        ...(year !== undefined && { year: parseInt(year, 10) }),
        ...(category !== undefined && { category }),
        ...(accountCode !== undefined && { accountCode: accountCode.trim() }),
        ...(accountName !== undefined && { accountName: accountName.trim() }),
        ...(budget !== undefined && { budget: BigInt(Math.max(0, Math.round(Number(budget) || 0))) }),
        ...(realization !== undefined && {
          realization: BigInt(Math.max(0, Math.round(Number(realization) || 0))),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        year: updated.year,
        category: updated.category,
        accountCode: updated.accountCode,
        accountName: updated.accountName,
        budget: Number(updated.budget),
        realization: Number(updated.realization),
      },
    });
  } catch (error: any) {
    console.error('Error updating APBDes item:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data APBDes' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pos APBDes wajib disertakan' }, { status: 400 });
    }

    const existing = await prisma.apbdesItem.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pos APBDes tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenant.slug, ['VILLAGE_ADMIN']);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.apbdesItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting APBDes item:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus data APBDes' }, { status: 500 });
  }
}
