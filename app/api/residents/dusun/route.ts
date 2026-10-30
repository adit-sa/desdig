import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    // Ambil seluruh penduduk aktif di tenant ini
    const residents = await prisma.resident.findMany({
      where: {
        tenantId: tenant.id,
        statusDasar: 'Hidup',
      },
      select: {
        id: true,
        nama: true,
        noKk: true,
        jenisKelamin: true,
        dusun: true,
        rt: true,
        rw: true,
        hubunganKeluarga: true,
      },
    });

    // Ambil aparatur desa untuk mencocokkan kepala dusun jika ada
    const officials = await prisma.villageOfficial.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        position: true,
        photoUrl: true,
        resident: {
          select: { nama: true, dusun: true },
        },
      },
    });

    // Agregasi per dusun
    const dusunMap = new Map<string, {
      dusun: string;
      totalJiwa: number;
      laki: number;
      perempuan: number;
      totalKK: number;
      kkSet: Set<string>;
      rtList: Set<string>;
      rwList: Set<string>;
      kepalaDusun?: string | null;
    }>();

    for (const r of residents) {
      const dusunName = (r.dusun && r.dusun.trim()) || 'Belum Ditetapkan';
      if (!dusunMap.has(dusunName)) {
        dusunMap.set(dusunName, {
          dusun: dusunName,
          totalJiwa: 0,
          laki: 0,
          perempuan: 0,
          totalKK: 0,
          kkSet: new Set(),
          rtList: new Set(),
          rwList: new Set(),
          kepalaDusun: null,
        });
      }

      const item = dusunMap.get(dusunName)!;
      item.totalJiwa++;
      if (r.jenisKelamin === 'L') item.laki++;
      if (r.jenisKelamin === 'P') item.perempuan++;

      if (r.noKk && r.noKk.trim()) {
        item.kkSet.add(r.noKk.trim());
      }
      if (r.rt && r.rt.trim() && r.rt !== '-' && r.rt !== '0') {
        item.rtList.add(r.rt.trim());
      }
      if (r.rw && r.rw.trim() && r.rw !== '-' && r.rw !== '0') {
        item.rwList.add(r.rw.trim());
      }
    }

    // Cocokkan Kepala Dusun dari jabatan pamong
    officials.forEach((ofc) => {
      const posClean = ofc.position.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (posClean.includes('dusun') || posClean.includes('kadus')) {
        for (const [dusunName, data] of dusunMap.entries()) {
          const cleanDusun = dusunName.toLowerCase().replace('dusun', '').replace(/[^a-z0-9]/g, '');
          if (cleanDusun && posClean.includes(cleanDusun)) {
            data.kepalaDusun = ofc.resident?.nama || ofc.name;
          }
        }
      }
    });

    const dusunList = Array.from(dusunMap.values()).map((d) => ({
      dusun: d.dusun,
      totalJiwa: d.totalJiwa,
      laki: d.laki,
      perempuan: d.perempuan,
      totalKK: d.kkSet.size || d.totalJiwa,
      rtCount: d.rtList.size || 1,
      rwCount: d.rwList.size || 1,
      rtList: Array.from(d.rtList).sort(),
      rwList: Array.from(d.rwList).sort(),
      kepalaDusun: d.kepalaDusun || null,
    })).sort((a, b) => {
      if (a.dusun === 'Belum Ditetapkan') return 1;
      if (b.dusun === 'Belum Ditetapkan') return -1;
      return a.dusun.localeCompare(b.dusun);
    });

    return NextResponse.json({
      success: true,
      totalDusun: dusunList.filter(d => d.dusun !== 'Belum Ditetapkan').length,
      dusunList,
    });
  } catch (error: any) {
    console.error('Error fetching dusun statistics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const oldDusunName = (body.oldDusunName || '').trim();
    const newDusunName = (body.newDusunName || '').trim();

    if (!oldDusunName) {
      return NextResponse.json({ error: 'Nama dusun lama wajib disertakan' }, { status: 400 });
    }

    if (!newDusunName) {
      return NextResponse.json({ error: 'Nama dusun baru wajib diisi' }, { status: 400 });
    }

    if (oldDusunName === newDusunName) {
      return NextResponse.json({ error: 'Nama dusun baru sama dengan nama sebelumnya' }, { status: 400 });
    }

    // Update batch nama dusun pada seluruh penduduk di desa ini
    const result = await prisma.resident.updateMany({
      where: {
        tenantId: tenant.id,
        dusun: oldDusunName,
      },
      data: {
        dusun: newDusunName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Nama dusun "${oldDusunName}" berhasil diubah menjadi "${newDusunName}".`,
      updatedResidentsCount: result.count,
    });
  } catch (error: any) {
    console.error('Error renaming dusun:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengubah nama dusun' }, { status: 500 });
  }
}
