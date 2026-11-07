import { cache } from 'react';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/auth/session';

export interface SocialMediaLinks {
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  whatsapp?: string | null;
  tiktok?: string | null;
  twitter?: string | null;
}

export interface ResolvedTenant {
  id: string;
  slug: string;
  namaDesa: string;
  kodeDesa: string | null;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string | null;
  alamatKantor: string | null;
  email: string | null;
  telepon: string | null;
  kepalaDesa: string | null;
  visi: string | null;
  misi: string[];
  logoUrl: string | null;
  heroImageUrl?: string | null;
  activeThemeId: string;
  plan: {
    code: string;
    name: string;
    customDomain: boolean;
  } | null;
  themeConfig: {
    settings: Record<string, any>;
  } | null;
  socialMedia?: SocialMediaLinks;
  enabledModules: string[];
}

/**
 * Resolve tenant dari Hostname (Subdomain / Custom Domain) atau fallback slug.
 * Dibungkus React `cache` agar generateMetadata + page hanya query DB sekali per request.
 */
export const resolveTenant = cache(resolveTenantUncached);

async function resolveTenantUncached(hostOrSlug: string): Promise<ResolvedTenant | null> {
  const cleanHost = hostOrSlug.toLowerCase().split(':')[0]; // buang port jika ada

  // 1. Coba cari berdasarkan Custom Domain atau Verified Subdomain
  let domainRecord = await prisma.domain.findFirst({
    where: {
      domain: {
        equals: cleanHost,
        mode: 'insensitive',
      },
      isVerified: true,
    },
    include: {
      tenant: {
        include: {
          plan: true,
          themeConfigs: true,
          modules: {
            where: { isEnabled: true },
          },
        },
      },
    },
  });

  // 2. Jika tidak ada, coba cek format subdomain (cth: sukamaju.platform.id atau sukamaju.localhost)
  let tenant = domainRecord?.tenant ?? null;
  if (!tenant) {
    const parts = cleanHost.split('.');
    let potentialSlug = parts[0];

    // Jika host adalah slug langsung (cth 'sukamaju') atau subdomain pertama
    tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: potentialSlug },
          { slug: hostOrSlug.toLowerCase() },
        ],
      },
      include: {
        plan: true,
        themeConfigs: true,
        modules: {
          where: { isEnabled: true },
        },
      },
    });
  }

  // 3. Fallback: DEFAULT_TENANT_SLUG (env) atau, khusus dev, tenant terlama.
  //    Di production tanpa env, host tak dikenal → null (halaman "Tenant tidak ditemukan").
  if (!tenant) {
    const defaultSlug = process.env.DEFAULT_TENANT_SLUG?.trim().toLowerCase();
    if (defaultSlug || process.env.NODE_ENV !== 'production') {
      tenant = await prisma.tenant.findFirst({
        where: defaultSlug ? { slug: defaultSlug } : undefined,
        orderBy: { createdAt: 'asc' },
        include: {
          plan: true,
          themeConfigs: true,
          modules: {
            where: { isEnabled: true },
          },
        },
      });
    }
  }

  if (!tenant) return null;

  // Konversi misi JSON
  let misiList: string[] = [];
  if (Array.isArray(tenant.misi)) {
    misiList = tenant.misi as string[];
  }

  // Ambil config tema yang aktif atau fallback pertama
  const activeConfig =
    tenant.themeConfigs.find(
      (c) => c.themeId === tenant?.activeThemeId && c.isPublished
    ) ||
    tenant.themeConfigs.find((c) => c.isPublished) ||
    tenant.themeConfigs[0] ||
    null;

  const rawSettings = (activeConfig?.settings as Record<string, any>) || {};
  const socialMedia: SocialMediaLinks = {
    facebook: rawSettings.socialMedia?.facebook || rawSettings.facebook || null,
    instagram: rawSettings.socialMedia?.instagram || rawSettings.instagram || null,
    youtube: rawSettings.socialMedia?.youtube || rawSettings.youtube || null,
    whatsapp: rawSettings.socialMedia?.whatsapp || rawSettings.whatsapp || tenant.telepon || null,
    tiktok: rawSettings.socialMedia?.tiktok || rawSettings.tiktok || null,
    twitter: rawSettings.socialMedia?.twitter || rawSettings.twitter || null,
  };

  return {
    id: tenant.id,
    slug: tenant.slug,
    namaDesa: tenant.namaDesa,
    kodeDesa: tenant.kodeDesa,
    kecamatan: tenant.kecamatan,
    kabupaten: tenant.kabupaten,
    provinsi: tenant.provinsi,
    kodePos: tenant.kodePos,
    alamatKantor: tenant.alamatKantor,
    email: tenant.email,
    telepon: tenant.telepon,
    kepalaDesa: tenant.kepalaDesa,
    visi: tenant.visi,
    misi: misiList,
    logoUrl: tenant.logoUrl,
    heroImageUrl: tenant.heroImageUrl,
    activeThemeId: tenant.activeThemeId,
    plan: tenant.plan
      ? {
          code: tenant.plan.code,
          name: tenant.plan.name,
          customDomain: tenant.plan.customDomain,
        }
      : null,
    themeConfig: activeConfig ? { settings: (activeConfig.settings as Record<string, any>) || {} } : null,
    socialMedia,
    enabledModules: tenant.modules.map((m) => m.moduleKey),
  };
}

/**
 * Fetch all available tenants untuk tenant switcher / navigasi
 */
export const getAllTenantsSummary = cache(async function getAllTenantsSummary() {
  return prisma.tenant.findMany({
    select: {
      id: true,
      slug: true,
      namaDesa: true,
      kecamatan: true,
      kabupaten: true,
      activeThemeId: true,
      plan: {
        select: { name: true },
      },
    },
    orderBy: { namaDesa: 'asc' },
  });
});

/**
 * Resolver Tenant serbaguna untuk seluruh API Route:
 * 1. Baca query ?tenant=... (bisa berupa slug, ID, atau Kode Desa)
 * 2. Jika tidak ada, baca otomatis dari session cookie `opensid_auth_session`
 * 3. Jika tidak ada, baca dari host header (subdomain)
 */
export async function getTenantFromRequest(
  request: Request | NextRequest,
  explicitIdentifier?: string | null
) {
  const url = new URL(request.url);
  let tenantIdentifier = explicitIdentifier || url.searchParams.get('tenant') || '';

  // 1. Coba dari custom header jika ada
  if (!tenantIdentifier) {
    tenantIdentifier =
      request.headers.get('x-tenant-slug') ||
      request.headers.get('x-tenant-id') ||
      '';
  }

  // 2. Jika tidak ada di query/header, ambil dari Cookie Session Auth
  if (!tenantIdentifier) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:desdig_auth_session|opensid_auth_session)=([^;]+)/);
    if (match) {
      try {
        const session = verifySessionToken(match[1]);
        if (session) {
          tenantIdentifier = session.tenantSlug || session.tenantId || '';
        }
      } catch {}
    }
  }

  // 3. Jika masih kosong, coba ekstrak dari host header (jika subdomain)
  if (!tenantIdentifier) {
    const host = request.headers.get('x-tenant-host') || request.headers.get('host') || '';
    const cleanHost = host.toLowerCase().split(':')[0];
    if (cleanHost && !cleanHost.includes('localhost') && !cleanHost.includes('127.0.0.1')) {
      const parts = cleanHost.split('.');
      if (parts.length > 2 && parts[0] !== 'admin' && parts[0] !== 'api') {
        tenantIdentifier = parts[0];
      }
    }
  }

  if (!tenantIdentifier || !tenantIdentifier.trim()) {
    return null;
  }

  const clean = tenantIdentifier.trim();
  const cleanNumbers = clean.replace(/[^0-9]/g, '');

  return prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: { equals: clean, mode: 'insensitive' } },
        { id: clean },
        { kodeDesa: clean },
        ...(cleanNumbers ? [{ kodeDesa: cleanNumbers }] : []),
      ],
    },
    include: {
      themeConfigs: true,
      modules: true,
    },
  });
}
