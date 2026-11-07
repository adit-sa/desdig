import React from 'react';
import { Metadata } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { resolveTenant } from '@/lib/tenant/resolver';
import { getTenantNavMenus } from '@/lib/tenant/data';
import LapakClientView from './LapakClientView';

export const instant = false;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);
  if (!tenant) {
    return {
      title: 'Lapak Desa & UMKM Warga',
      description: 'Pasar online dan produk unggulan warga desa.',
    };
  }

  return {
    title: `Lapak Desa & Produk Unggulan Warga - Pemerintah Desa ${tenant.namaDesa}`,
    description: `Dukung usaha warga dan UMKM lokal Desa ${tenant.namaDesa}, Kec. ${tenant.kecamatan}, Kab. ${tenant.kabupaten}.`,
    openGraph: {
      title: `Lapak Desa ${tenant.namaDesa}`,
      description: `Etalase produk UMKM dan komoditas unggulan warga Desa ${tenant.namaDesa}.`,
    },
  };
}

export default async function LapakPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  const tenant = await resolveTenant(tenantSlug || host);

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

  const [menus, rawMerchants] = await Promise.all([
    getTenantNavMenus(tenant.id),
    prisma.merchant.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      include: {
        resident: {
          select: {
            id: true,
            nama: true,
            dusun: true,
            alamat: true,
            telepon: true,
          },
        },
        products: {
          where: { isAvailable: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 24,
    }),
  ]);

  const initialMerchants = rawMerchants.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    expiresAt: m.expiresAt ? m.expiresAt.toISOString() : null,
    products: m.products.map((p) => ({
      ...p,
      price: Number(p.price),
      createdAt: p.createdAt.toISOString(),
      expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    })),
  }));

  return (
    <LapakClientView
      tenant={tenant}
      menus={menus}
      initialMerchants={initialMerchants as any}
    />
  );
}
