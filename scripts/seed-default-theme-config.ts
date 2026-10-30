import { prisma } from '../lib/prisma';

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'salupangkang' } });
  if (!tenant) return;

  const currentConfig = await prisma.tenantThemeConfig.findUnique({
    where: {
      tenantId_themeId: {
        tenantId: tenant.id,
        themeId: 'modern-government'
      }
    }
  });

  console.log('Current config exists:', !!currentConfig);
  const existingSettings = (currentConfig?.settings as any) || {};
  const mergedSettings = {
    ...existingSettings,
    homepage_article_count: existingSettings.homepage_article_count || 3,
    homepage_sections_order: existingSettings.homepage_sections_order || [
      'stats',
      'quick_links',
      'pamong',
      'berita',
      'apbdes',
      'pembangunan',
      'galeri',
      'pengumuman'
    ],
    sections_visibility: existingSettings.sections_visibility || {
      stats: true,
      quick_links: true,
      pamong: true,
      berita: true,
      apbdes: true,
      pembangunan: true,
      galeri: true,
      pengumuman: true
    },
    hero_background: existingSettings.hero_background || {
      type: 'image',
      url: '/images/salupangkang_heritage.jpg'
    },
    kades_highlight: existingSettings.kades_highlight || {
      enabled: true,
      name: 'H. Sapiil, S.IP',
      position: 'Kepala Desa',
      kodeWilayah: tenant.kodeDesa || '7606042009',
      quote: 'Selamat datang di Portal Resmi Pemerintah Desa Salupangkang. Seluruh layanan kependudukan dan transparansi APBDes kini dapat diakses terbuka oleh seluruh warga secara akuntabel.',
      photoUrl: '/images/kades_portrait.jpg'
    }
  };

  await prisma.tenantThemeConfig.update({
    where: {
      tenantId_themeId: {
        tenantId: tenant.id,
        themeId: 'modern-government'
      }
    },
    data: { settings: mergedSettings }
  });
  console.log('✅ Settings merged successfully:', mergedSettings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
