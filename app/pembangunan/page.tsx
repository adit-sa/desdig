import React from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveTenant } from '@/lib/tenant/resolver';
import { getTenantNavMenus } from '@/lib/tenant/data';
import PembangunanClientView from './PembangunanClientView';

export const instant = false;

export const metadata: Metadata = {
  title: 'Pembangunan & Transparansi Infrastruktur Desa',
  description: 'Transparansi realisasi proyek pembangunan fisik dan infrastruktur desa tahun berjalan beserta dokumentasi tahapan progres lapangan.',
};

export default async function PembangunanPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; tahun?: string }>;
}) {
  const { tenant: tenantParam, tahun: tahunParam } = await searchParams;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantParam || host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
        <div className="text-center bg-white p-8 rounded-xl border border-slate-200 shadow-sm max-w-md">
          <h2 className="text-xl font-bold">Desa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-2">Periksa kembali slug desa pada URL.</p>
        </div>
      </div>
    );
  }

  // Filter tahun (opsional)
  const thn = tahunParam && tahunParam !== 'ALL' ? parseInt(tahunParam, 10) : NaN;
  const tahunFilter = Number.isNaN(thn) ? Prisma.empty : Prisma.sql`AND p."tahunAnggaran" = ${thn}`;

  // Proyek pembangunan + menu navigasi diambil paralel
  const [projectsRaw, menus] = await Promise.all([
    prisma.$queryRaw<any[]>`
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
      WHERE p."tenantId" = ${tenant.id} ${tahunFilter}
      GROUP BY p.id
      ORDER BY p."tahunAnggaran" DESC, p."createdAt" DESC
      LIMIT 30
    `.catch(() => []),
    getTenantNavMenus(tenant.id),
  ]);

  const projects = projectsRaw.map((p) => ({
    ...p,
    anggaran: p.anggaran ? Number(p.anggaran) : 0,
    documentations: p.documentations || [],
  }));

  return (
    <PembangunanClientView
      initialProjects={projects}
      tenant={tenant}
      menus={menus}
    />
  );
}
