import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Menata ulang urutan aparatur & menyinkronkan presensi hari ini...');

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });

  if (!tenant) {
    console.error('Tenant Salupangkang tidak ditemukan');
    return;
  }

  const officials = await prisma.villageOfficial.findMany({
    where: { tenantId: tenant.id },
  });

  // Urutan hierarki baku SOTK Desa
  const priorityOrder = [
    'Kepala Desa',
    'Sekretaris Desa',
    'Kasi Pemerintahan',
    'Kasi Kesejahteraan',
    'Kasi Pelayanan',
    'Kaur Tata Usaha & Umum',
    'Staff Kaur Tata Usaha & Umum',
    'Kaur Keuangan',
    'Kaur Perencanaan',
    'Operator SID',
    'Staff Kasi Pelayanan',
    'Kepala Dusun Sumberjo',
    'Kepala Dusun Bangun Rejo',
    'Kepala Dusun Wanasari',
    'Kepala Dusun Krajan',
    'Kepala Dusun Sukadamai',
    'Kepala Dusun Sukamaju',
    'Ketua BPD',
    'Wakil Ketua BPD',
    'Sekretaris BPD',
    'Anggota BPD',
    'Perangkat Desa',
  ];

  function getPriority(pos: string) {
    const idx = priorityOrder.findIndex((p) => pos.toLowerCase().includes(p.toLowerCase()));
    return idx !== -1 ? idx : 99;
  }

  // Sort officials
  officials.sort((a: any, b: any) => {
    const pa = getPriority(a.position);
    const pb = getPriority(b.position);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  // Update orderIndex
  for (let i = 0; i < officials.length; i++) {
    await prisma.villageOfficial.update({
      where: { id: officials[i].id },
      data: { orderIndex: i + 1 },
    });
  }
  console.log(`✅ ${officials.length} Aparatur berhasil ditata ulang sesuai tata urutan kepemerintahan.`);

  // Sinkronisasi Presensi Hari Ini (2026-10-22)
  const todayStr = '2026-10-22';
  console.log(`📅 Membuat data presensi resmi hari ini: ${todayStr}`);

  for (let i = 0; i < officials.length; i++) {
    const ofc = officials[i];
    let status = 'HADIR';
    let checkInTime = '07:45:00';
    let notes = 'Hadir bertugas melayani warga di Balai Desa';

    const pos = ofc.position.toLowerCase();
    if (pos.includes('kepala desa')) {
      status = 'HADIR';
      checkInTime = '07:30:00';
      notes = 'Memimpin koordinasi pelayanan terpadu & administrasi desa';
    } else if (pos.includes('sekretaris')) {
      status = 'HADIR';
      checkInTime = '07:40:00';
      notes = 'Verifikasi berkas administrasi & pengarsipan surat';
    } else if (pos.includes('kesejahteraan')) {
      status = 'DINAS_LUAR';
      checkInTime = '08:00:00';
      notes = 'Monitoring pelaksanaan kegiatan padat karya tunai desa';
    } else if (pos.includes('sukamaju')) {
      status = 'DINAS_LUAR';
      checkInTime = '08:15:00';
      notes = 'Pendampingan verifikasi data penerima bansos di Dusun Sukamaju';
    } else if (pos.includes('krajan')) {
      status = 'HADIR';
      checkInTime = '07:55:00';
      notes = 'Piket pelayanan masyarakat kewilayahan';
    } else if (pos.includes('perencanaan')) {
      status = 'HADIR';
      checkInTime = '07:48:00';
      notes = 'Penyusunan sinkronisasi dokumen RKPDes 2027';
    } else if (pos.includes('operator')) {
      status = 'HADIR';
      checkInTime = '07:35:00';
      notes = 'Operasional server SID & input layanan surat warga';
    } else if (i === 18) {
      status = 'IZIN';
      checkInTime = '08:00:00';
      notes = 'Izin keperluan dinas keluarga';
    } else {
      status = i % 6 === 0 ? 'DINAS_LUAR' : 'HADIR';
      checkInTime = `07:${Math.floor(35 + (i % 20)).toString().padStart(2, '0')}:00`;
      notes = status === 'DINAS_LUAR' ? 'Tugas koordinasi lapangan kewilayahan' : 'Bertugas di Balai Desa';
    }

    const checkInDateTime = new Date(`${todayStr}T${checkInTime}+08:00`).toISOString();
    const id = `att_${todayStr}_${ofc.id}`;

    await prisma.$executeRaw`
      INSERT INTO "OfficialAttendance" ("id", "tenantId", "officialId", "date", "status", "notes", "checkInTime", "createdAt", "updatedAt")
      VALUES (${id}, ${tenant.id}, ${ofc.id}, ${todayStr}::date, ${status}::"AttendanceStatus", ${notes}, ${checkInDateTime}::timestamptz, NOW(), NOW())
      ON CONFLICT ("tenantId", "officialId", "date")
      DO UPDATE SET
        "status" = ${status}::"AttendanceStatus",
        "notes" = ${notes},
        "checkInTime" = ${checkInDateTime}::timestamptz,
        "updatedAt" = NOW()
    `;
  }

  console.log(`✅ Presensi lengkap untuk seluruh aparatur desa hari ini (${todayStr}) berhasil disimpan!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
