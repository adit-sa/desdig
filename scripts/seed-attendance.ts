import { PrismaClient, AttendanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const tenants = await prisma.tenant.findMany({
    include: { officials: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const statuses: AttendanceStatus[] = [
    AttendanceStatus.HADIR,
    AttendanceStatus.HADIR,
    AttendanceStatus.DINAS_LUAR,
    AttendanceStatus.HADIR,
    AttendanceStatus.TERLAMBAT,
  ];

  const notesMap: Record<AttendanceStatus, string> = {
    [AttendanceStatus.HADIR]: 'Hadir di Balai Desa tepat waktu',
    [AttendanceStatus.TERLAMBAT]: 'Hadir terlambat karena jalan macet',
    [AttendanceStatus.DINAS_LUAR]: 'Rakor Pengentasan Kemiskinan di Kantor Kecamatan',
    [AttendanceStatus.IZIN]: 'Izin ada keperluan keluarga mendesak',
    [AttendanceStatus.SAKIT]: 'Sakit dengan surat keterangan dokter',
    [AttendanceStatus.ALFA]: 'Tanpa keterangan',
  };

  for (const t of tenants) {
    for (let i = 0; i < t.officials.length; i++) {
      const ofc = t.officials[i];
      const status = statuses[i % statuses.length];
      
      const checkIn = new Date();
      checkIn.setHours(7, 30 + (i * 12), 0, 0);

      await prisma.officialAttendance.upsert({
        where: {
          tenantId_officialId_date: {
            tenantId: t.id,
            officialId: ofc.id,
            date: today,
          },
        },
        update: {
          status,
          checkInTime: status === AttendanceStatus.HADIR || status === AttendanceStatus.TERLAMBAT ? checkIn : null,
          notes: notesMap[status],
        },
        create: {
          tenantId: t.id,
          officialId: ofc.id,
          date: today,
          status,
          checkInTime: status === AttendanceStatus.HADIR || status === AttendanceStatus.TERLAMBAT ? checkIn : null,
          notes: notesMap[status],
        },
      });
    }
  }

  console.log('✅ Presensi pamong hari ini berhasil digenerate untuk seluruh desa demo!');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
