import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { getTenantMediaUsageMap } from '../lib/media';

describe('desDig Audit Media & Integrasi Album Multi-Foto', () => {
  let testTenantId: string;
  const testSlug = 'desa-uji-media-audit';

  const photo1 = '/uploads/salupangkang/galeri/media_cover.webp';
  const photo2 = '/uploads/salupangkang/galeri/media_1793440277085_1.webp';
  const photo3 = '/uploads/salupangkang/galeri/media_1793440271236_1.webp';
  const articlePhoto1 = '/uploads/salupangkang/artikel/article_cover.webp';
  const articlePhoto2 = '/uploads/salupangkang/artikel/article_doc_2.webp';

  beforeAll(async () => {
    const existing = await prisma.tenant.findUnique({ where: { slug: testSlug } });
    if (existing) {
      await prisma.tenant.delete({ where: { id: existing.id } });
    }

    const tenant = await prisma.tenant.create({
      data: {
        namaDesa: 'Desa Uji Audit Media',
        slug: testSlug,
        kodeDesa: '32.05.11.2099',
        kecamatan: 'Ciawi',
        kabupaten: 'Tasikmalaya',
        provinsi: 'Jawa Barat',
      },
    });
    testTenantId = tenant.id;

    // 1. Buat Galeri dengan Multi-Foto (Album)
    await prisma.galleryItem.create({
      data: {
        tenantId: testTenantId,
        title: 'Penyaluran Bantuan Sosial',
        imageUrl: photo1,
        category: 'Kegiatan',
        mediaType: 'ALBUM',
        mediaUrls: [
          { type: 'IMAGE', url: photo1, caption: 'Foto Utama' },
          { type: 'IMAGE', url: photo2, caption: 'Dokumentasi 2' },
          { type: 'IMAGE', url: photo3, caption: 'Dokumentasi 3' },
        ],
      },
    });

    // 2. Buat Artikel dengan GalleryUrls
    await prisma.article.create({
      data: {
        tenantId: testTenantId,
        title: 'Musrenbang Desa 2026',
        slug: 'musrenbang-desa-2026-audit',
        content: '<p>Musyawarah perencanaan desa.</p>',
        coverImageUrl: articlePhoto1,
        galleryUrls: [
          { url: articlePhoto1, caption: 'Cover' },
          { url: articlePhoto2, caption: 'Suasana Rapat' },
        ],
      },
    });
  });

  afterAll(async () => {
    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    }
  });

  it('1. Memastikan seluruh foto album galeri (termasuk foto ke-2 & ke-3) terdaftar di usage map dan bukan file yatim', async () => {
    const usageMap = await getTenantMediaUsageMap(testTenantId, testSlug);

    // Foto ke-1 (Cover) harus terdaftar
    expect(usageMap.has(photo1)).toBe(true);
    expect(usageMap.get(photo1)?.[0]).toContain('Galeri: Penyaluran Bantuan Sosial');

    // Foto ke-2 harus terdaftar (bukan file yatim)
    expect(usageMap.has(photo2)).toBe(true);
    expect(usageMap.get(photo2)?.[0]).toContain('Album Galeri: Penyaluran Bantuan Sosial');

    // Foto ke-3 harus terdaftar (bukan file yatim)
    expect(usageMap.has(photo3)).toBe(true);
    expect(usageMap.get(photo3)?.[0]).toContain('Album Galeri: Penyaluran Bantuan Sosial');

    // Pencarian by filename juga harus cocok
    expect(usageMap.has('media_1793440277085_1.webp')).toBe(true);
    expect(usageMap.has('media_1793440271236_1.webp')).toBe(true);
  });

  it('2. Memastikan seluruh foto lampiran artikel (galleryUrls) terdaftar di usage map', async () => {
    const usageMap = await getTenantMediaUsageMap(testTenantId, testSlug);

    expect(usageMap.has(articlePhoto1)).toBe(true);
    expect(usageMap.has(articlePhoto2)).toBe(true);
    expect(usageMap.get(articlePhoto2)?.[0]).toContain('Album Artikel: Musrenbang Desa 2026');
  });

  it('3. Memastikan file fiktif yang tidak ada di database dikenali sebagai tidak terpakai (yatim)', async () => {
    const usageMap = await getTenantMediaUsageMap(testTenantId, testSlug);

    const unusedFile = '/uploads/salupangkang/galeri/foto_iseng_tidak_terpakai.webp';
    expect(usageMap.has(unusedFile)).toBe(false);
  });
});

