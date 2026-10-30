import React from 'react';
import { headers } from 'next/headers';
import { resolveTenant, getAllTenantsSummary } from '@/lib/tenant/resolver';
import { getTenantPublicHomeData } from '@/lib/tenant/data';
import ThemeRenderer from '@/components/themes/ThemeRenderer';
import type { Metadata } from 'next';

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
      title: 'Website Desa Multi-Tenant SaaS',
      description: 'Platform pembuatan website desa modern berlisensi.',
    };
  }

  return {
    title: `Pemerintah Desa ${tenant.namaDesa} - Portal Informasi & Pelayanan Publik`,
    description: tenant.visi || `Website resmi Pemerintah Desa ${tenant.namaDesa}, Kec. ${tenant.kecamatan}, Kab. ${tenant.kabupaten}.`,
    openGraph: {
      title: `Desa ${tenant.namaDesa} - Portal Resmi`,
      description: `Kecamatan ${tenant.kecamatan}, Kabupaten ${tenant.kabupaten}, Provinsi ${tenant.provinsi}`,
    },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const tenantSlug = typeof resolvedSearchParams.tenant === 'string' ? resolvedSearchParams.tenant : null;
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';

  // Resolusi tenant dari Host header atau query params
  const tenant = await resolveTenant(tenantSlug || host);

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800">Tenant Desa Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-2">
            Domain atau subdomain &ldquo;{host}&rdquo; belum terdaftar pada platform SaaS.
          </p>
          <a
            href="/saas"
            className="inline-block mt-4 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-xs"
          >
            Buka Master SaaS
          </a>
        </div>
      </div>
    );
  }

  // Fetch data terisolasi server-side
  const [homeData, allTenants] = await Promise.all([
    getTenantPublicHomeData(tenant.id),
    getAllTenantsSummary(),
  ]);

  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat website desa...</div>}>
      <ThemeRenderer
        tenant={tenant}
        data={homeData}
        allTenants={allTenants}
      />
    </React.Suspense>
  );
}
