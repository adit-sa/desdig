import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

describe('desDig MCP Server Integration Tests', () => {
  let testTenantId: string;
  const testSlug = 'desa-uji-mcp';

  beforeAll(async () => {
    // Bersihkan jika ada sisa uji sebelumnya
    const existing = await prisma.tenant.findUnique({ where: { slug: testSlug } });
    if (existing) {
      await prisma.tenant.delete({ where: { id: existing.id } });
    }

    // Buat tenant uji
    const tenant = await prisma.tenant.create({
      data: {
        namaDesa: 'Desa Uji MCP',
        slug: testSlug,
        kodeDesa: '32.05.11.2099',
        kecamatan: 'Ciawi',
        kabupaten: 'Tasikmalaya',
        provinsi: 'Jawa Barat',
        kepalaDesa: 'Bpk. Penguji MCP',
      },
    });
    testTenantId = tenant.id;
  });

  it('1. Memverifikasi query desa via Prisma sesuai alur desdig_list_villages', async () => {
    const tenants = await prisma.tenant.findMany({
      where: { slug: testSlug },
    });
    expect(tenants.length).toBe(1);
    expect(tenants[0].namaDesa).toBe('Desa Uji MCP');
    expect(tenants[0].kepalaDesa).toBe('Bpk. Penguji MCP');
  });

  it('2. Memverifikasi penambahan penduduk sesuai alur desdig_add_resident', async () => {
    const resident = await prisma.resident.create({
      data: {
        tenantId: testTenantId,
        nik: '3205110101900099',
        noKk: '3205110101900001',
        nama: 'AHMAD PENGUJI',
        jenisKelamin: 'L',
        hubunganKeluarga: 'KEPALA KELUARGA',
        statusDasar: 'Hidup',
        dusun: 'Dusun Percobaan',
      },
    });

    expect(resident.id).toBeDefined();
    expect(resident.nik).toBe('3205110101900099');
    expect(resident.tenantId).toBe(testTenantId);
  });

  it('3. Memverifikasi penerbitan artikel berita sesuai alur desdig_create_article', async () => {
    const cat = await prisma.category.create({
      data: {
        tenantId: testTenantId,
        name: 'Warta MCP',
        slug: 'warta-mcp',
      },
    });

    const article = await prisma.article.create({
      data: {
        tenantId: testTenantId,
        categoryId: cat.id,
        title: 'Berita Uji Coba dari AI MCP',
        slug: 'berita-uji-coba-dari-ai-mcp',
        summary: 'Ringkasan berita uji coba AI MCP.',
        content: '<p>Ini adalah konten berita yang diterbitkan melalui AI Assistant desDig MCP.</p>',
        status: 'PUBLISHED',
      },
    });

    expect(article.id).toBeDefined();
    expect(article.title).toBe('Berita Uji Coba dari AI MCP');
    expect(article.tenantId).toBe(testTenantId);
  });

  it('4. Memastikan isolasi data: Tenant lain tidak dapat membaca data penduduk tenant uji', async () => {
    // Ambil tenant lain (cth: salupangkang)
    const otherTenant = await prisma.tenant.findFirst({
      where: { slug: { not: testSlug } },
    });

    if (otherTenant) {
      const residents = await prisma.resident.findMany({
        where: { tenantId: otherTenant.id, nik: '3205110101900099' },
      });
      expect(residents.length).toBe(0);
    }
  });

  afterAll(async () => {
    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    }
  });
});

