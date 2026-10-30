import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/attendance/kiosk/clock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, deviceToken, officialId, pinCode, status, notes } = body;

    if (!tenantSlug || !deviceToken || !officialId || !pinCode) {
      return NextResponse.json(
        { error: 'Tenant, token perangkat, ID aparatur, dan PIN wajib disertakan' },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ slug: tenantSlug }, { id: tenantSlug }],
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // 1. Verifikasi Keamanan Komputer Kantor (Kiosk Device Token)
    const device = await prisma.kioskDevice.findFirst({
      where: {
        tenantId: tenant.id,
        deviceToken: deviceToken.trim(),
        isActive: true,
      },
    });

    if (!device) {
      return NextResponse.json(
        {
          error:
            'Akses Ditolak: Komputer/perangkat ini belum diotorisasi sebagai Komputer Resmi Kantor Desa untuk absensi.',
          unauthorizedDevice: true,
        },
        { status: 403 }
      );
    }

    // 2. Verifikasi Aparatur & PIN
    const official = await prisma.villageOfficial.findFirst({
      where: {
        id: officialId,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!official) {
      return NextResponse.json({ error: 'Data aparatur tidak ditemukan' }, { status: 404 });
    }

    const expectedPin = official.pinCode || '1234';
    if (pinCode.trim() !== expectedPin.trim()) {
      return NextResponse.json(
        { error: 'PIN yang Anda masukkan salah. Silakan coba kembali.' },
        { status: 401 }
      );
    }

    // 3. Catat Absensi Hari Ini
    const now = new Date();
    // Hitung tanggal format YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0];
    const todayDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Tentukan status default jika tidak dikirim (HADIR, atau TERLAMBAT jika > 08:30)
    let attendanceStatus = status || 'HADIR';
    if (!status) {
      const hours = now.getHours();
      const minutes = now.getMinutes();
      if (hours > 8 || (hours === 8 && minutes > 30)) {
        attendanceStatus = 'TERLAMBAT';
      }
    }

    const attendance = await prisma.officialAttendance.upsert({
      where: {
        tenantId_officialId_date: {
          tenantId: tenant.id,
          officialId: official.id,
          date: todayDate,
        },
      },
      update: {
        status: attendanceStatus,
        checkInTime: now,
        notes: notes ? notes.trim() : `Absen via ${device.deviceName}`,
      },
      create: {
        tenantId: tenant.id,
        officialId: official.id,
        date: todayDate,
        status: attendanceStatus,
        checkInTime: now,
        notes: notes ? notes.trim() : `Absen via ${device.deviceName}`,
      },
    });

    // Update lastUsedAt pada KioskDevice
    await prisma.kioskDevice.update({
      where: { id: device.id },
      data: { lastUsedAt: now },
    });

    return NextResponse.json({
      success: true,
      message: `Absensi berhasil dicatat! Status: ${attendanceStatus}`,
      official: {
        id: official.id,
        name: official.name,
        position: official.position,
        photoUrl: official.photoUrl,
      },
      attendance,
    });
  } catch (error: any) {
    console.error('Error clocking in via kiosk:', error);
    return NextResponse.json({ error: error.message || 'Gagal mencatat absensi' }, { status: 500 });
  }
}
