import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const resident = await prisma.resident.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!resident) {
      return NextResponse.json({ error: 'Data penduduk tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ resident });
  } catch (error: any) {
    console.error('Error fetching resident detail:', error);
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
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN', 'EDITOR']);
    if (!auth.authorized) return auth.response!;

    // Pastikan penduduk ada dan milik tenant ini
    const existing = await prisma.resident.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data penduduk tidak ditemukan' }, { status: 404 });
    }

    // Cek jika NIK diubah dan sudah dipakai penduduk lain di tenant ini
    if (body.nik && body.nik.trim() !== existing.nik) {
      const duplicate = await prisma.resident.findUnique({
        where: {
          tenantId_nik: {
            tenantId: tenant.id,
            nik: body.nik.trim(),
          },
        },
      });

      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { error: `NIK ${body.nik} sudah digunakan oleh penduduk lain (${duplicate.nama})` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.resident.update({
      where: { id },
      data: {
        nik: body.nik ? body.nik.trim() : existing.nik,
        noKk: body.noKk?.trim() || body.no_kk?.trim() || existing.noKk,
        nama: body.nama ? body.nama.trim() : existing.nama,
        jenisKelamin: body.jenisKelamin || body.jenis_kelamin || existing.jenisKelamin,
        tempatLahir: body.tempatLahir !== undefined ? body.tempatLahir : existing.tempatLahir,
        tanggalLahir: body.tanggalLahir ? new Date(body.tanggalLahir) : existing.tanggalLahir,
        agama: body.agama || existing.agama,
        pendidikan: body.pendidikan !== undefined ? body.pendidikan : existing.pendidikan,
        pekerjaan: body.pekerjaan !== undefined ? body.pekerjaan : existing.pekerjaan,
        statusKawin: body.statusKawin || body.status_kawin || existing.statusKawin,
        golonganDarah: body.golonganDarah || body.golongan_darah || existing.golonganDarah,
        hubunganKeluarga: body.hubunganKeluarga || body.hubungan_keluarga || existing.hubunganKeluarga,
        alamat: body.alamat !== undefined ? body.alamat : existing.alamat,
        dusun: body.dusun !== undefined ? body.dusun : existing.dusun,
        rt: body.rt !== undefined ? body.rt : existing.rt,
        rw: body.rw !== undefined ? body.rw : existing.rw,
        telepon: body.telepon !== undefined ? body.telepon : existing.telepon,
        fotoUrl: body.fotoUrl !== undefined ? body.fotoUrl : existing.fotoUrl,
        statusDasar: body.statusDasar || body.status_dasar || existing.statusDasar,
      },
    });

    return NextResponse.json({ success: true, resident: updated });
  } catch (error: any) {
    console.error('Error updating resident:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui data penduduk' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN', 'EDITOR']);
    if (!auth.authorized) return auth.response!;

    const existing = await prisma.resident.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data penduduk tidak ditemukan' }, { status: 404 });
    }

    // Putuskan relasi ke villageOfficial, merchant, dan article jika ada sebelum menghapus
    await prisma.$transaction([
      prisma.villageOfficial.updateMany({
        where: { residentId: id },
        data: { residentId: null },
      }),
      prisma.merchant.updateMany({
        where: { residentId: id },
        data: { residentId: null },
      }),
      prisma.article.updateMany({
        where: { authorResidentId: id },
        data: { authorResidentId: null },
      }),
      prisma.resident.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Data penduduk berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting resident:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus data penduduk' }, { status: 500 });
  }
}
