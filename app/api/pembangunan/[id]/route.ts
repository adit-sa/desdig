import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectRaw = await prisma.$queryRaw<any[]>`
      SELECT p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', d.id,
              'persentase', d.persentase,
              'keterangan', d.keterangan,
              'gambar', d.gambar,
              'createdAt', d."createdAt"
            ) ORDER BY d."createdAt" ASC
          ) FILTER (WHERE d.id IS NOT NULL),
          '[]'
        ) as documentations
      FROM "DevelopmentProject" p
      LEFT JOIN "DevelopmentDocumentation" d ON d."projectId" = p.id
      WHERE p.id = ${id} OR p.slug = ${id}
      GROUP BY p.id
      LIMIT 1
    `;

    if (projectRaw.length === 0) {
      return NextResponse.json({ error: 'Proyek pembangunan tidak ditemukan' }, { status: 404 });
    }

    const project = {
      ...projectRaw[0],
      anggaran: projectRaw[0].anggaran ? Number(projectRaw[0].anggaran) : 0,
      documentations: projectRaw[0].documentations || [],
    };

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error('Error fetching single pembangunan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.$queryRaw<any[]>`
      SELECT dp.id, dp."tenantId", t.slug as "tenantSlug"
      FROM "DevelopmentProject" dp
      JOIN "Tenant" t ON dp."tenantId" = t.id
      WHERE dp.id = ${id} OR dp.slug = ${id}
    `;

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Proyek pembangunan tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing[0].tenantSlug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();
    const {
      judul,
      keterangan,
      lokasi,
      tahunAnggaran,
      anggaran,
      volume,
      pelaksanaKegiatan,
      sumberDana,
      manfaat,
      waktu,
      sifatProyek,
      status,
      progressPersen,
      foto,
      newDocumentation, // optional: { persentase: "50%", keterangan: "...", gambar: "..." }
    } = body;

    const tahun = parseInt(tahunAnggaran, 10);
    const anggaranBig = BigInt(anggaran || 0);

    await prisma.$executeRaw`
      UPDATE "DevelopmentProject"
      SET "judul" = COALESCE(${judul}, "judul"),
          "keterangan" = COALESCE(${keterangan}, "keterangan"),
          "lokasi" = COALESCE(${lokasi}, "lokasi"),
          "tahunAnggaran" = COALESCE(${isNaN(tahun) ? null : tahun}, "tahunAnggaran"),
          "anggaran" = COALESCE(${anggaranBig}, "anggaran"),
          "volume" = COALESCE(${volume}, "volume"),
          "pelaksanaKegiatan" = COALESCE(${pelaksanaKegiatan}, "pelaksanaKegiatan"),
          "sumberDana" = COALESCE(${sumberDana}, "sumberDana"),
          "manfaat" = COALESCE(${manfaat}, "manfaat"),
          "waktu" = COALESCE(${waktu}, "waktu"),
          "sifatProyek" = COALESCE(${sifatProyek}, "sifatProyek"),
          "status" = COALESCE(${status}, "status"),
          "progressPersen" = COALESCE(${typeof progressPersen === 'number' ? progressPersen : null}, "progressPersen"),
          "foto" = COALESCE(${foto}, "foto"),
          "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // Jika admin menginput dokumentasi progress baru
    if (newDocumentation && newDocumentation.persentase) {
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await prisma.$executeRaw`
        INSERT INTO "DevelopmentDocumentation" ("id", "projectId", "persentase", "keterangan", "gambar", "createdAt", "updatedAt")
        VALUES (${docId}, ${id}, ${newDocumentation.persentase}, ${newDocumentation.keterangan || null}, ${newDocumentation.gambar || null}, NOW(), NOW())
      `;
    }

    return NextResponse.json({ success: true, message: 'Proyek pembangunan berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating pembangunan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.$queryRaw<any[]>`
      SELECT dp.id, dp."tenantId", t.slug as "tenantSlug"
      FROM "DevelopmentProject" dp
      JOIN "Tenant" t ON dp."tenantId" = t.id
      WHERE dp.id = ${id} OR dp.slug = ${id}
    `;

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Proyek pembangunan tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing[0].tenantSlug);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.$executeRaw`DELETE FROM "DevelopmentDocumentation" WHERE "projectId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "DevelopmentProject" WHERE id = ${id}`;
    return NextResponse.json({ success: true, message: 'Proyek pembangunan berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting pembangunan:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
