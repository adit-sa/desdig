import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
      include: {
        products: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Pelapak tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, merchant });
  } catch (error: any) {
    console.error('Error fetching merchant:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.merchant.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pelapak tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const { name, shopName, phone, address, description, avatarUrl, bannerUrl, isActive, expiresAt, residentId } = body;

    const updated = await prisma.merchant.update({
      where: { id },
      data: {
        residentId: residentId !== undefined ? (residentId || null) : existing.residentId,
        name: name ?? existing.name,
        shopName: shopName ?? existing.shopName,
        phone: phone ? phone.replace(/^0/, '62').replace(/[^\d]/g, '') : existing.phone,
        address: address !== undefined ? address : existing.address,
        description: description !== undefined ? description : existing.description,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : existing.bannerUrl,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
      },
      include: {
        resident: true,
        products: true,
      },
    });

    return NextResponse.json({ success: true, merchant: updated });
  } catch (error: any) {
    console.error('Error updating merchant:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui pelapak' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.merchant.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Pelapak tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing.tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.merchant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Pelapak berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting merchant:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus pelapak' }, { status: 500 });
  }
}
