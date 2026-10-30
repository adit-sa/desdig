import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const targetDateStr = dateParam || new Date().toISOString().split('T')[0];

    // Ambil seluruh aparatur aktif
    const officials = await prisma.villageOfficial.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Ambil data presensi hari target via Raw SQL
    const attendances = await prisma.$queryRaw<any[]>`
      SELECT * FROM "OfficialAttendance"
      WHERE "tenantId" = ${tenant.id}
        AND "date"::date = ${targetDateStr}::date
    `;

    const attendanceMap = new Map();
    attendances.forEach((att: any) => {
      attendanceMap.set(att.officialId, att);
    });

    const result = officials.map((ofc) => {
      const att = attendanceMap.get(ofc.id);
      return {
        id: ofc.id,
        name: ofc.name,
        position: ofc.position,
        nip: ofc.nip,
        photoUrl: ofc.photoUrl,
        attendance: att
          ? {
              id: att.id,
              date: att.date,
              status: att.status,
              checkInTime: att.checkInTime,
              checkOutTime: att.checkOutTime,
              notes: att.notes,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      date: targetDateStr,
      officials: result,
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat absensi' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantSlug, officialId, status, notes, checkInTime } = body;

    if (!officialId || !status) {
      return NextResponse.json({ error: 'Official ID dan status wajib diisi' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) return auth.response!;

    const targetDateStr = body.date || new Date().toISOString().split('T')[0];
    const parsedCheckIn = checkInTime ? new Date(checkInTime) : new Date();
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Upsert presensi harian via Raw SQL
    await prisma.$executeRaw`
      INSERT INTO "OfficialAttendance" ("id", "tenantId", "officialId", "date", "status", "notes", "checkInTime", "createdAt", "updatedAt")
      VALUES (${id}, ${tenant.id}, ${officialId}, ${targetDateStr}::date, ${status}::"AttendanceStatus", ${notes || null}, ${parsedCheckIn}, NOW(), NOW())
      ON CONFLICT ("tenantId", "officialId", "date")
      DO UPDATE SET
        "status" = ${status}::"AttendanceStatus",
        "notes" = ${notes || null},
        "checkInTime" = ${parsedCheckIn},
        "updatedAt" = NOW()
    `;

    return NextResponse.json({ success: true, message: 'Absensi berhasil disimpan' });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan absensi' }, { status: 500 });
  }
}
