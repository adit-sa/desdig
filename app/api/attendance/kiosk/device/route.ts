import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

// GET /api/attendance/kiosk/device?tenant=...
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const devices = await prisma.kioskDevice.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error('Error fetching kiosk devices:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/attendance/kiosk/device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, deviceName, customToken } = body;

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // Generate unique pairing device token (atau gunakan custom token jika admin pairing)
    const deviceToken = customToken && customToken.trim()
      ? customToken.trim()
      : `KIOSK-${tenant.slug.toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Cek apakah token sudah ada
    const existing = await prisma.kioskDevice.findUnique({
      where: { deviceToken },
    });

    if (existing) {
      // Re-aktifkan jika sudah ada
      const updated = await prisma.kioskDevice.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          deviceName: deviceName || existing.deviceName,
          pairedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, device: updated });
    }

    const device = await prisma.kioskDevice.create({
      data: {
        tenantId: tenant.id,
        deviceName: deviceName || `Komputer Kantor Desa ${tenant.namaDesa}`,
        deviceToken,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, device }, { status: 201 });
  } catch (error: any) {
    console.error('Error registering kiosk device:', error);
    return NextResponse.json({ error: error.message || 'Gagal mendaftarkan perangkat' }, { status: 500 });
  }
}

// DELETE /api/attendance/kiosk/device?id=...&tenant=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || '';
    const tenantSlug = searchParams.get('tenant') || '';

    if (!id) {
      return NextResponse.json({ error: 'ID perangkat wajib disertakan' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    await prisma.kioskDevice.delete({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Otorisasi komputer berhasil dicabut' });
  } catch (error: any) {
    console.error('Error deleting kiosk device:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus perangkat' }, { status: 500 });
  }
}
