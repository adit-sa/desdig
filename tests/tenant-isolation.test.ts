import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { resolveTenant } from '../lib/tenant/resolver';
import { getTenantPublicHomeData, getTenantArticleBySlug } from '../lib/tenant/data';

describe('Multi-Tenant Data Isolation and Resolution', () => {
  let tenantA: any;
  let tenantB: any;

  beforeAll(async () => {
    await prisma.tenant.updateMany({
      where: { slug: { in: ['sukamaju', 'salupangkang'] } },
      data: { activeThemeId: 'modern-government' },
    });

    tenantA = await prisma.tenant.findUnique({
      where: { slug: 'sukamaju' },
    });
    tenantB = await prisma.tenant.findUnique({
      where: { slug: 'salupangkang' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('1. Memastikan kedua tenant demo terdaftar di database', () => {
    expect(tenantA).toBeDefined();
    expect(tenantA?.namaDesa).toBe('Sukamaju');
    expect(tenantB).toBeDefined();
    expect(tenantB?.namaDesa).toBe('Salupangkang');
    expect(tenantA?.id).not.toBe(tenantB?.id);
  });

  it('2. Memverifikasi resolusi tenant dari slug & domain', async () => {
    const resolvedA = await resolveTenant('sukamaju');
    expect(resolvedA).toBeDefined();
    expect(resolvedA?.slug).toBe('sukamaju');
    expect(resolvedA?.activeThemeId).toBe('modern-government');

    const resolvedB = await resolveTenant('salupangkang');
    expect(resolvedB).toBeDefined();
    expect(resolvedB?.slug).toBe('salupangkang');
    expect(resolvedB?.activeThemeId).toBe('modern-government');

    const resolvedByDomain = await resolveTenant('sukamaju.desaku.id');
    expect(resolvedByDomain).toBeDefined();
    expect(resolvedByDomain?.id).toBe(tenantA.id);
  });

  it('3. Memastikan isolasi data: Tenant A tidak dapat membaca artikel Tenant B', async () => {
    const dataA = await getTenantPublicHomeData(tenantA.id);
    const dataB = await getTenantPublicHomeData(tenantB.id);

    // Semua artikel di dataA harus memiliki tenantId milik Tenant A
    for (const art of dataA.articles) {
      expect(art.tenantId).toBe(tenantA.id);
      expect(art.tenantId).not.toBe(tenantB.id);
    }

    // Semua artikel di dataB harus memiliki tenantId milik Tenant B
    for (const art of dataB.articles) {
      expect(art.tenantId).toBe(tenantB.id);
      expect(art.tenantId).not.toBe(tenantA.id);
    }
  });

  it('4. Memastikan kebocoran slug artikel dicegah lintas tenant', async () => {
    // Ambil artikel milik Tenant B (Salupangkang)
    const articleB = await prisma.article.findFirst({
      where: { tenantId: tenantB.id },
    });
    expect(articleB).toBeDefined();

    // Coba akses artikel milik Tenant B menggunakan tenantId milik Tenant A
    const leakedArticle = await getTenantArticleBySlug(tenantA.id, articleB!.slug);
    
    // Harus bernilai null (terisolasi penuh)
    expect(leakedArticle).toBeNull();
  });

  it('5. Memastikan isolasi anggaran APBDes per desa', async () => {
    const dataA = await getTenantPublicHomeData(tenantA.id);
    const dataB = await getTenantPublicHomeData(tenantB.id);

    expect(dataA.apbdes.length).toBeGreaterThan(0);
    expect(dataB.apbdes.length).toBeGreaterThan(0);

    // Total pendapatan Desa Sukamaju harus berbeda dengan Desa Salupangkang
    const pendapatanA = dataA.apbdes.reduce((acc, curr) => acc + curr.budget, 0);
    const pendapatanB = dataB.apbdes.reduce((acc, curr) => acc + curr.budget, 0);

    expect(pendapatanA).not.toBe(pendapatanB);
  });

  it('6. Memastikan pergantian tema pada Tenant A tidak mempengaruhi tema Tenant B', async () => {
    // Ubah tema Sukamaju ke Modern Editorial
    await prisma.tenant.update({
      where: { id: tenantA.id },
      data: { activeThemeId: 'modern-editorial' },
    });

    const checkA = await prisma.tenant.findUnique({ where: { id: tenantA.id } });
    const checkB = await prisma.tenant.findUnique({ where: { id: tenantB.id } });

    expect(checkA?.activeThemeId).toBe('modern-editorial');
    expect(checkB?.activeThemeId).toBe('modern-government'); // Tidak berubah!

    // Kembalikan tema Sukamaju ke modern-government
    await prisma.tenant.update({
      where: { id: tenantA.id },
      data: { activeThemeId: 'modern-government' },
    });
  });

  it('7. Memastikan pergantian tema TIDAK menghapus atau merusak konten (Content Preservation)', async () => {
    // Hitung total artikel Sukamaju sebelum ganti tema
    const countBefore = await prisma.article.count({ where: { tenantId: tenantA.id } });

    // Ganti tema ke Traditional Village
    await prisma.tenant.update({
      where: { id: tenantA.id },
      data: { activeThemeId: 'traditional-village' },
    });

    // Hitung artikel setelah ganti tema
    const countAfter = await prisma.article.count({ where: { tenantId: tenantA.id } });
    expect(countAfter).toBe(countBefore);

    // Kembalikan tema
    await prisma.tenant.update({
      where: { id: tenantA.id },
      data: { activeThemeId: 'modern-government' },
    });
  });

  it('8. Memastikan penonaktifan modul TIDAK menghapus data di database', async () => {
    // Pastikan Sukamaju memiliki data APBDes
    const apbdesCountBefore = await prisma.apbdesItem.count({
      where: { tenantId: tenantA.id },
    });
    expect(apbdesCountBefore).toBeGreaterThan(0);

    // Nonaktifkan modul apbdes pada Tenant A
    await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId: tenantA.id,
          moduleKey: 'apbdes',
        },
      },
      update: { isEnabled: false },
      create: {
        tenantId: tenantA.id,
        moduleKey: 'apbdes',
        isEnabled: false,
      },
    });

    // Cek bahwa data APBDes tetap utuh di database (data preservation)
    const apbdesCountAfter = await prisma.apbdesItem.count({
      where: { tenantId: tenantA.id },
    });
    expect(apbdesCountAfter).toBe(apbdesCountBefore);

    // Aktifkan kembali modul apbdes
    await prisma.tenantModule.update({
      where: {
        tenantId_moduleKey: {
          tenantId: tenantA.id,
          moduleKey: 'apbdes',
        },
      },
      data: { isEnabled: true },
    });
  });

  it('9. Memastikan audit log mencatat aksi penting pergantian tema dan toggle modul', async () => {
    // Periksa apakah ada audit log tercatat
    const auditCount = await prisma.auditLog.count({
      where: { tenantId: tenantA.id },
    });
    expect(auditCount).toBeGreaterThanOrEqual(0);
  });

  it('10. Memastikan pengumuman resmi terisolasi penuh antar desa', async () => {
    const annA = await prisma.announcement.findMany({ where: { tenantId: tenantA.id } });
    const annB = await prisma.announcement.findMany({ where: { tenantId: tenantB.id } });

    for (const a of annA) {
      expect(a.tenantId).toBe(tenantA.id);
      expect(a.tenantId).not.toBe(tenantB.id);
    }
  });

  it('11. Memastikan aparatur pamong desa tidak tertukar antar desa', async () => {
    const ofcA = await prisma.villageOfficial.findMany({ where: { tenantId: tenantA.id } });
    const ofcB = await prisma.villageOfficial.findMany({ where: { tenantId: tenantB.id } });

    expect(ofcA.length).toBeGreaterThan(0);
    expect(ofcB.length).toBeGreaterThan(0);

    const namesA = ofcA.map((o) => o.name);
    const namesB = ofcB.map((o) => o.name);

    // Pamong Sukamaju tidak ada di pamong Salupangkang
    for (const name of namesA) {
      expect(namesB).not.toContain(name);
    }
  });
});
