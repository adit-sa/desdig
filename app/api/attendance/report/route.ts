import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || `${new Date().getMonth() + 1}`, 10);
    const year = parseInt(searchParams.get('year') || `${new Date().getFullYear()}`, 10);
    const format = searchParams.get('format'); // 'csv' or json

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    // Hitung range tanggal bulan yang diminta
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    // Hitung hari kerja (Senin - Jumat)
    let totalWorkDays = 0;
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const cur = new Date(year, month - 1, d);
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalWorkDays++;
      }
    }

    // Ambil seluruh aparatur pamong aktif
    const officials = await prisma.villageOfficial.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Ambil rekap kehadiran bulan ini via Raw SQL
    const attendances = await prisma.$queryRaw<any[]>`
      SELECT * FROM "OfficialAttendance"
      WHERE "tenantId" = ${tenant.id}
        AND "date" >= ${startDateStr}::date
        AND "date" <= ${endDateStr}::date
      ORDER BY "date" ASC
    `;

    // Grouping per official
    const attendanceByOfficial = new Map<string, any[]>();
    attendances.forEach((att: any) => {
      const list = attendanceByOfficial.get(att.officialId) || [];
      list.push(att);
      attendanceByOfficial.set(att.officialId, list);
    });

    const report = officials.map((ofc) => {
      const records = attendanceByOfficial.get(ofc.id) || [];
      let hadir = 0;
      let terlambat = 0;
      let izin = 0;
      let sakit = 0;
      let dinasLuar = 0;
      let alfa = 0;

      for (const att of records) {
        switch (att.status) {
          case 'HADIR':
            hadir++;
            break;
          case 'TERLAMBAT':
            terlambat++;
            break;
          case 'IZIN':
            izin++;
            break;
          case 'SAKIT':
            sakit++;
            break;
          case 'DINAS_LUAR':
            dinasLuar++;
            break;
          case 'ALFA':
            alfa++;
            break;
        }
      }

      const totalKehadiranEfektif = hadir + terlambat + dinasLuar;
      const persentase = totalWorkDays > 0 ? Math.round((totalKehadiranEfektif / totalWorkDays) * 100) : 0;

      return {
        officialId: ofc.id,
        name: ofc.name,
        position: ofc.position,
        nip: ofc.nip || '-',
        hadir,
        terlambat,
        izin,
        sakit,
        dinasLuar,
        alfa,
        totalHariKerja: totalWorkDays,
        totalKehadiranEfektif,
        persentase,
      };
    });

    // Jika format CSV diminta untuk penarikan data
    if (format === 'csv') {
      const namaBulan = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ][month - 1];

      let csv = `LAPORAN REKAPITULASI ABSENSI APARATUR PEMERINTAH DESA ${tenant.namaDesa.toUpperCase()}\n`;
      csv += `Periode: ${namaBulan} ${year}\n`;
      csv += `Total Hari Kerja: ${totalWorkDays} Hari\n\n`;
      csv += `No,Nama Aparatur,Jabatan,NIP,Hadir,Terlambat,Dinas Luar,Izin,Sakit,Alfa,Total Efektif,Persentase (%)\n`;

      report.forEach((item: any, idx: number) => {
        csv += `${idx + 1},"${item.name}","${item.position}","${item.nip}",${item.hadir},${item.terlambat},${item.dinasLuar},${item.izin},${item.sakit},${item.alfa},${item.totalKehadiranEfektif},${item.persentase}%\n`;
      });

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rekap-absensi-${tenant.slug}-${year}-${String(month).padStart(2, '0')}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        namaDesa: tenant.namaDesa,
      },
      period: {
        month,
        year,
        totalWorkDays,
      },
      report,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_') || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('Error generating attendance report:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses laporan' }, { status: 500 });
  }
}
