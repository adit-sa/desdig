import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { ContentStatus } from '@prisma/client';
import { formatProjectTitle } from '@/lib/formatters';

/** Menu navigasi header tenant (di-cache per request). */
export const getTenantNavMenus = cache(async (tenantId: string): Promise<any[]> =>
  prisma.$queryRaw<any[]>`
    SELECT id, title, url, "parentId", "orderIndex", "isVisible", "isExternal"
    FROM "NavMenu"
    WHERE "tenantId" = ${tenantId} AND "isVisible" = true
    ORDER BY "orderIndex" ASC
  `.catch(() => [])
);

// Absensi hari ini, fallback ke tanggal absensi terakhir yang tersedia
async function getLatestAttendances(tenantId: string): Promise<any[]> {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = await prisma.$queryRaw<any[]>`
    SELECT * FROM "OfficialAttendance"
    WHERE "tenantId" = ${tenantId}
      AND "date"::date = ${todayStr}::date
  `.catch(() => []);
  if (today.length > 0) return today;

  // Satu query: semua baris pada tanggal absensi terbaru
  return prisma.$queryRaw<any[]>`
    SELECT * FROM "OfficialAttendance"
    WHERE "tenantId" = ${tenantId}
      AND "date"::date = (
        SELECT MAX("date"::date) FROM "OfficialAttendance" WHERE "tenantId" = ${tenantId}
      )
  `.catch(() => []);
}

export async function getTenantPublicHomeData(tenantId: string) {
  // Semua query terisolasi ketat berdasarkan tenantId & dijalankan paralel
  const [
    articles,
    announcements,
    officials,
    apbdes,
    todayAttendances,
    galleryItems,
    navMenus,
    activeThemeConfig,
    rawPembangunan,
  ] = await Promise.all([
    // 1. Artikel terkini yang sudah PUBLISHED
    prisma.article.findMany({
      where: {
        tenantId,
        status: ContentStatus.PUBLISHED,
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        author: {
          select: { name: true },
        },
        authorResident: {
          select: { nama: true },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 8,
    }),

    // 2. Pengumuman terkini (hanya yang aktif / belum kedaluwarsa)
    prisma.announcement.findMany({
      where: {
        tenantId,
        status: ContentStatus.PUBLISHED,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 5,
    }),

    // 3. Aparatur Pamong Desa
    prisma.villageOfficial.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        resident: {
          select: { nama: true, fotoUrl: true },
        },
      },
      orderBy: { orderIndex: 'asc' },
    }),

    // 4. Data Transparansi APBDes
    prisma.apbdesItem.findMany({
      where: { tenantId },
      orderBy: { accountCode: 'asc' },
    }),

    // 5. Absensi aparatur hari ini (fallback tanggal terakhir)
    getLatestAttendances(tenantId),

    // 6. Galeri Foto Desa Terkini
    prisma.$queryRaw<any[]>`
      SELECT id, title, caption, "imageUrl", category, "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt"
      FROM "GalleryItem"
      WHERE "tenantId" = ${tenantId}
      ORDER BY "createdAt" DESC
      LIMIT 16
    `.catch(() => []),

    // 7. Menu Navigasi Header Website
    getTenantNavMenus(tenantId),

    // 8. Pengaturan Konfigurasi Tema & Tampilan Aktif
    prisma.tenantThemeConfig.findFirst({
      where: { tenantId, isPublished: true },
      orderBy: { updatedAt: 'desc' },
    }).catch(() => null),

    // 9. Proyek Pembangunan Fisik Desa Terkini
    prisma.$queryRaw<any[]>`
      SELECT p.id, p.judul, p.slug, p.lokasi, p."tahunAnggaran", p.anggaran, p."progressPersen", p.status, p.foto,
             p.volume, p."pelaksanaKegiatan", p."sumberDana", p.waktu, p."sifatProyek", p.keterangan,
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
      WHERE p."tenantId" = ${tenantId}
      GROUP BY p.id
      ORDER BY p."tahunAnggaran" DESC, p."createdAt" DESC
      LIMIT 4
    `.catch(() => []),
  ]);

  const attMap = new Map();
  todayAttendances.forEach((a: any) => {
    attMap.set(a.officialId, a);
  });

  const officialsWithAttendance = officials.map((ofc) => {
    const att = attMap.get(ofc.id);
    return {
      ...ofc,
      name: ofc.resident?.nama || ofc.name,
      photoUrl: ofc.photoUrl || ofc.resident?.fotoUrl || null,
      attendances: att ? [att] : [],
    };
  });

  const mappedArticles = articles.map((art) => ({
    ...art,
    author: {
      name: art.authorResident?.nama || art.author?.name || 'Pemerintah Desa',
    },
  }));

  // Serialisasi data BigInt untuk React Server Components
  const serializedApbdes = apbdes.map((item) => ({
    id: item.id,
    year: item.year,
    category: item.category,
    accountCode: item.accountCode,
    accountName: item.accountName,
    budget: Number(item.budget),
    realization: Number(item.realization),
  }));

  const pembangunan = rawPembangunan.map((p) => ({
    ...p,
    judul: formatProjectTitle(p.judul),
    anggaran: p.anggaran ? Number(p.anggaran) : 0,
    documentations: p.documentations || [],
  }));

  return {
    articles: mappedArticles,
    announcements,
    officials: officialsWithAttendance,
    apbdes: serializedApbdes,
    gallery: galleryItems,
    menus: navMenus,
    pembangunan,
    themeConfig: activeThemeConfig?.settings ? (activeThemeConfig.settings as any) : null,
  };
}

export async function getTenantArticleBySlug(tenantId: string, slug: string) {
  const article = await prisma.article.findFirst({
    where: {
      tenantId,
      slug,
      status: ContentStatus.PUBLISHED,
    },
    include: {
      category: true,
      author: {
        select: { name: true },
      },
      authorResident: {
        select: { nama: true },
      },
    },
  });

  if (!article) return null;
  return {
    ...article,
    author: {
      name: article.authorResident?.nama || article.author?.name || 'Pemerintah Desa',
    },
  };
}

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>?/gm, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Data halaman daftar artikel (/artikel, /kategori/[slug]).
 * `content` dikirim sebagai teks polos (untuk pencarian & cuplikan) agar payload ke browser kecil.
 */
export async function getTenantArticleListing(tenantId: string) {
  const [rawArticles, categories, menus] = await Promise.all([
    prisma.article.findMany({
      where: { tenantId, status: ContentStatus.PUBLISHED },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { name: true } },
        authorResident: { select: { nama: true } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.category.findMany({
      where: { tenantId },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    getTenantNavMenus(tenantId),
  ]);

  const articles = rawArticles.map((a) => ({
    id: a.id,
    tenantId: a.tenantId,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    content: stripHtml(a.content),
    coverImageUrl: a.coverImageUrl,
    status: a.status,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
    category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,
    author: {
      name: a.authorResident?.nama || a.author?.name || 'Pemerintah Desa',
    },
  }));

  return { articles, categories, menus };
}
