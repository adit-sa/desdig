import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tahunParam = searchParams.get('tahun');
    const statusParam = searchParams.get('status');

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    let query = `
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
      WHERE p."tenantId" = '${tenant.id}'
    `;

    if (tahunParam && tahunParam !== 'ALL') {
      const thn = parseInt(tahunParam, 10);
      if (!isNaN(thn)) {
        query += ` AND p."tahunAnggaran" = ${thn}`;
      }
    }

    if (statusParam && statusParam !== 'ALL') {
      query += ` AND p."status" = '${statusParam}'`;
    }

    query += ` GROUP BY p.id ORDER BY p."tahunAnggaran" DESC, p."createdAt" DESC`;

    const projectsRaw = await prisma.$queryRawUnsafe<any[]>(query);

    // Format BigInt anggaran to Number
    const projects = projectsRaw.map((p) => ({
      ...p,
      anggaran: p.anggaran ? Number(p.anggaran) : 0,
      documentations: p.documentations || [],
    }));

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error: any) {
    console.error('Error fetching pembangunan:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat data pembangunan' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantSlug,
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
    } = body;

    if (!judul) {
      return NextResponse.json({ error: 'Judul kegiatan pembangunan wajib diisi' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request, tenantSlug);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const id = `dev_proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const slugBase = judul
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const tahun = parseInt(tahunAnggaran, 10) || new Date().getFullYear();
    const anggaranBig = BigInt(anggaran || 0);
    const progress = typeof progressPersen === 'number' ? progressPersen : 0;

    await prisma.$executeRaw`
      INSERT INTO "DevelopmentProject" (
        "id", "tenantId", "judul", "slug", "keterangan", "lokasi", "tahunAnggaran", "anggaran",
        "volume", "pelaksanaKegiatan", "sumberDana", "manfaat", "waktu", "sifatProyek", "status",
        "progressPersen", "foto", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${tenant.id}, ${judul}, ${slug}, ${keterangan || null}, ${lokasi || null}, ${tahun}, ${anggaranBig},
        ${volume || null}, ${pelaksanaKegiatan || null}, ${sumberDana || 'Dana Desa'}, ${manfaat || null},
        ${waktu || null}, ${sifatProyek || 'BARU'}, ${status || 'Proses'}, ${progress}, ${foto || null}, NOW(), NOW()
      )
    `;

    return NextResponse.json({
      success: true,
      project: {
        id,
        judul,
        slug,
        tahunAnggaran: tahun,
        anggaran: Number(anggaranBig),
      },
    });
  } catch (error: any) {
    console.error('Error creating pembangunan:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan proyek pembangunan' }, { status: 500 });
  }
}
