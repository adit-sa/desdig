import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { resolveTenant } from '@/lib/tenant/resolver';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const tenant = await resolveTenant(host);

  if (!tenant) {
    return [];
  }

  const baseUrl = `http://${host}`;

  // Ambil artikel terbit
  const articles = await prisma.article.findMany({
    where: {
      tenantId: tenant.id,
      status: 'PUBLISHED',
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  const articleUrls = articles.map((art) => ({
    url: `${baseUrl}/berita/${art.slug}?tenant=${tenant.slug}`,
    lastModified: art.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: `${baseUrl}/?tenant=${tenant.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    ...articleUrls,
  ];
}
