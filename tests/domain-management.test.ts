import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { resolveTenant } from '../lib/tenant/resolver';

describe('Domain Management and Custom Domain Resolution', () => {
  let tenantSalupangkang: any;
  let testDomainRecord: any;

  beforeAll(async () => {
    tenantSalupangkang = await prisma.tenant.findUnique({
      where: { slug: 'salupangkang' },
    });

    if (!tenantSalupangkang) {
      throw new Error('Tenant salupangkang tidak ditemukan di database test.');
    }

    // Bersihkan domain uji coba jika sebelumnya ada
    await prisma.domain.deleteMany({
      where: { domain: 'salupangkang.desa.id' },
    });
  });

  afterAll(async () => {
    // Bersihkan domain uji coba setelah test selesai
    await prisma.domain.deleteMany({
      where: { domain: 'salupangkang.desa.id' },
    });
    await prisma.$disconnect();
  });

  it('1. Memastikan desa Salupangkang terdaftar di database', () => {
    expect(tenantSalupangkang).toBeDefined();
    expect(tenantSalupangkang.namaDesa).toBe('Salupangkang');
  });

  it('2. Berhasil mendaftarkan custom domain baru (salupangkang.desa.id) untuk desa', async () => {
    testDomainRecord = await prisma.domain.create({
      data: {
        tenantId: tenantSalupangkang.id,
        domain: 'salupangkang.desa.id',
        isPrimary: true,
        isVerified: true,
      },
    });

    expect(testDomainRecord).toBeDefined();
    expect(testDomainRecord.domain).toBe('salupangkang.desa.id');
    expect(testDomainRecord.tenantId).toBe(tenantSalupangkang.id);
  });

  it('3. Resolver mengenali request masuk dari domain salupangkang.desa.id', async () => {
    const resolved = await resolveTenant('salupangkang.desa.id');
    expect(resolved).toBeDefined();
    expect(resolved?.id).toBe(tenantSalupangkang.id);
    expect(resolved?.namaDesa).toBe('Salupangkang');
  });

  it('4. Menolak duplikasi domain yang sama untuk desa lain', async () => {
    let duplicateError = false;
    try {
      // Coba daftarkan domain yang sama
      await prisma.domain.create({
        data: {
          tenantId: 'some-other-id',
          domain: 'salupangkang.desa.id',
        },
      });
    } catch {
      duplicateError = true;
    }
    expect(duplicateError).toBe(true);
  });

  it('5. Memastikan isolasi: domain mengarah tepat ke tenant pemiliknya', async () => {
    const tenantSukamaju = await prisma.tenant.findUnique({
      where: { slug: 'sukamaju' },
    });

    const resolved = await resolveTenant('salupangkang.desa.id');
    expect(resolved?.id).not.toBe(tenantSukamaju?.id);
    expect(resolved?.id).toBe(tenantSalupangkang.id);
  });
});

