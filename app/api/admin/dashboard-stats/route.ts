import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // Eksekusi query terisolasi penuh berdasarkan tenant.id
    const [
      totalPenduduk,
      totalLaki,
      totalPerempuan,
      uniqueKK,
      officials,
      apbdesItems,
      recentArticles,
      dusunGrouping,
    ] = await Promise.all([
      // 1. Total Penduduk Real
      prisma.resident.count({
        where: { tenantId: tenant.id },
      }),
      // 2. Gender Laki-laki
      prisma.resident.count({
        where: { tenantId: tenant.id, jenisKelamin: 'L' },
      }),
      // 3. Gender Perempuan
      prisma.resident.count({
        where: { tenantId: tenant.id, jenisKelamin: 'P' },
      }),
      // 4. Total Kepala Keluarga (Unique No KK)
      prisma.resident.groupBy({
        by: ['noKk'],
        where: { tenantId: tenant.id, noKk: { not: '' } },
      }),
      // 5. Pamong / Aparatur Desa Real
      prisma.villageOfficial.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          name: true,
          position: true,
          nip: true,
          photoUrl: true,
          orderIndex: true,
          isActive: true,
        },
      }),
      // 6. APBDes Real
      prisma.apbdesItem.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          year: true,
          category: true,
          accountName: true,
          budget: true,
          realization: true,
        },
      }),
      // 7. Berita / Artikel Terbaru Real
      prisma.article.findMany({
        where: { tenantId: tenant.id, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          publishedAt: true,
          viewCount: true,
        },
      }),
      // 8. Sebaran Penduduk per Dusun
      prisma.resident.groupBy({
        by: ['dusun'],
        where: { tenantId: tenant.id, dusun: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { dusun: 'desc' } },
        take: 6,
      }),
    ]);

    const totalKeluarga = uniqueKK.length;
    const avgJiwaPerKK = totalKeluarga > 0 ? (totalPenduduk / totalKeluarga).toFixed(1) : '0';

    // Kalkulasi APBDes (konversi BigInt ke Number)
    const totalPendapatanAnggaran = Number(
      apbdesItems
        .filter((i) => i.category.toLowerCase() === 'pendapatan')
        .reduce((acc, curr) => acc + curr.budget, BigInt(0))
    );

    const totalBelanjaRealisasi = Number(
      apbdesItems
        .filter((i) => i.category.toLowerCase() === 'belanja')
        .reduce((acc, curr) => acc + curr.realization, BigInt(0))
    );

    const totalBelanjaAnggaran = Number(
      apbdesItems
        .filter((i) => i.category.toLowerCase() === 'belanja')
        .reduce((acc, curr) => acc + curr.budget, BigInt(0))
    );

    const realisasiBelanjaPersen =
      totalBelanjaAnggaran > 0
        ? Math.round((totalBelanjaRealisasi / totalBelanjaAnggaran) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        namaDesa: tenant.namaDesa,
        kecamatan: tenant.kecamatan,
        kabupaten: tenant.kabupaten,
        provinsi: tenant.provinsi,
        kodeDesa: tenant.kodeDesa,
        logoUrl: tenant.logoUrl,
      },
      stats: {
        totalPenduduk,
        totalLaki,
        totalPerempuan,
        totalKeluarga,
        avgJiwaPerKK,
        apbdes: {
          totalPendapatanAnggaran,
          totalBelanjaRealisasi,
          totalBelanjaAnggaran,
          realisasiBelanjaPersen,
        },
        dusunStats: dusunGrouping.map((d) => ({
          dusun: d.dusun || 'Tidak Diketahui',
          count: d._count._all,
        })),
      },
      officials: officials.map((o) => ({
        id: o.id,
        nama: o.name,
        jabatan: o.position,
        nip: o.nip,
        photoUrl: o.photoUrl,
        status: o.isActive ? 'Aktif' : 'Non-Aktif',
      })),
      recentArticles,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_') || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
