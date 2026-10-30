import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const where: any = {
      tenantId: tenant.id,
      statusDasar: 'Hidup',
    };

    if (q) {
      where.OR = [
        { nama: { contains: q, mode: 'insensitive' } },
        { nik: { contains: q } },
        { dusun: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [residents, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        orderBy: { nama: 'asc' },
        take: limit > 0 ? Math.min(limit, 10000) : 5000,
        select: {
          id: true,
          nik: true,
          noKk: true,
          nama: true,
          jenisKelamin: true,
          tempatLahir: true,
          tanggalLahir: true,
          agama: true,
          pendidikan: true,
          pekerjaan: true,
          statusKawin: true,
          golonganDarah: true,
          hubunganKeluarga: true,
          dusun: true,
          rt: true,
          rw: true,
          alamat: true,
          telepon: true,
          fotoUrl: true,
          statusDasar: true,
        },
      }),
      prisma.resident.count({ where }),
    ]);

    return NextResponse.json({ residents, total });
  } catch (error: any) {
    console.error('Error fetching residents:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN', 'EDITOR']);
    if (!auth.authorized) return auth.response!;

    if (!body.nik || !body.nama) {
      return NextResponse.json({ error: 'NIK dan Nama penduduk wajib diisi' }, { status: 400 });
    }

    // Cek keunikan NIK dalam tenant
    const existing = await prisma.resident.findUnique({
      where: {
        tenantId_nik: {
          tenantId: tenant.id,
          nik: body.nik.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Penduduk dengan NIK ${body.nik} sudah terdaftar di desa ini (${existing.nama})` },
        { status: 400 }
      );
    }

    const resident = await prisma.resident.create({
      data: {
        tenantId: tenant.id,
        nik: body.nik.trim(),
        noKk: body.noKk?.trim() || body.no_kk?.trim() || `${body.nik.slice(0, 6)}0000000000`,
        nama: body.nama.trim(),
        jenisKelamin: body.jenisKelamin || body.jenis_kelamin || 'L',
        tempatLahir: body.tempatLahir || body.tempat_lahir || null,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : null,
        agama: body.agama || 'Islam',
        pendidikan: body.pendidikan || null,
        pekerjaan: body.pekerjaan || null,
        statusKawin: body.statusKawin || body.status_kawin || null,
        golonganDarah: body.golonganDarah || body.golongan_darah || null,
        hubunganKeluarga: body.hubunganKeluarga || body.hubungan_keluarga || 'Kepala Keluarga',
        alamat: body.alamat || null,
        dusun: body.dusun || null,
        rt: body.rt || '001',
        rw: body.rw || '001',
        telepon: body.telepon || null,
        fotoUrl: body.fotoUrl || null,
        statusDasar: 'Hidup',
      },
    });

    return NextResponse.json({ success: true, resident }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating resident:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan penduduk' }, { status: 500 });
  }
}
