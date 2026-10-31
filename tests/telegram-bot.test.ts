import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import {
  pairTelegramUserWithTenant,
  getLinkedTenantForTelegramUser,
  unlinkTelegramUser,
} from '../lib/telegram';

describe('desDig Telegram Bot Multi-Tenant Publishing Tests', () => {
  let testTenantId: string;
  const testSlug = 'desa-uji-telegram';
  const testTelegramId = '999888777';

  beforeAll(async () => {
    // Bersihkan data uji sebelumnya jika ada
    await prisma.telegramSubscriber.deleteMany({
      where: { telegramId: testTelegramId },
    });
    const existing = await prisma.tenant.findUnique({ where: { slug: testSlug } });
    if (existing) {
      await prisma.tenant.delete({ where: { id: existing.id } });
    }

    // Buat tenant uji dengan token pairing khusus
    const tenant = await prisma.tenant.create({
      data: {
        namaDesa: 'Desa Uji Telegram',
        slug: testSlug,
        kodeDesa: '32.05.11.2088',
        kecamatan: 'Ciawi',
        kabupaten: 'Tasikmalaya',
        provinsi: 'Jawa Barat',
        telegramToken: 'tokenrahasia123',
      },
    });
    testTenantId = tenant.id;
  });

  it('1. Menolak pairing jika token rahasia salah', async () => {
    const res = await pairTelegramUserWithTenant({
      telegramId: testTelegramId,
      tenantSlug: testSlug,
      token: 'tokensalah',
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('Kunci rahasia pairing salah');
  });

  it('2. Menolak pairing jika slug desa tidak terdaftar', async () => {
    const res = await pairTelegramUserWithTenant({
      telegramId: testTelegramId,
      tenantSlug: 'desa-fiktif-tidak-ada',
      token: 'tokenrahasia123',
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('tidak ditemukan');
  });

  it('3. Berhasil menautkan (pairing) akun Telegram saat token dan slug valid', async () => {
    const res = await pairTelegramUserWithTenant({
      telegramId: testTelegramId,
      username: 'operator_uji',
      firstName: 'Budi Operator',
      tenantSlug: testSlug,
      token: 'tokenrahasia123',
    });

    expect(res.success).toBe(true);
    expect(res.tenant?.slug).toBe(testSlug);

    // Verifikasi di database
    const subscriber = await getLinkedTenantForTelegramUser(testTelegramId);
    expect(subscriber).not.toBeNull();
    expect(subscriber?.tenant.slug).toBe(testSlug);
    expect(subscriber?.username).toBe('operator_uji');
  });

  it('4. Memastikan isolasi multi-tenant: Telegram subscriber terikat hanya ke tenant bersangkutan', async () => {
    const otherTenant = await prisma.tenant.findFirst({
      where: { slug: { not: testSlug } },
    });

    if (otherTenant) {
      const subscriberOther = await prisma.telegramSubscriber.findFirst({
        where: { tenantId: otherTenant.id, telegramId: testTelegramId },
      });
      expect(subscriberOther).toBeNull();
    }
  });

  it('5. Berhasil melepas tautan akun Telegram (/logout)', async () => {
    const unlinked = await unlinkTelegramUser(testTelegramId);
    expect(unlinked).toBe(true);

    const subscriber = await getLinkedTenantForTelegramUser(testTelegramId);
    expect(subscriber).toBeNull();
  });

  it('6. Berhasil menautkan akun menggunakan nama desa ber-spasi ("Desa Uji Telegram")', async () => {
    const res = await pairTelegramUserWithTenant({
      telegramId: testTelegramId,
      username: 'operator_spasi',
      firstName: 'Ahmad',
      tenantSlug: 'Desa Uji Telegram', // Menggunakan nama lengkap dengan spasi
      token: 'tokenrahasia123',
    });

    expect(res.success).toBe(true);
    expect(res.tenant?.slug).toBe(testSlug);

    const subscriber = await getLinkedTenantForTelegramUser(testTelegramId);
    expect(subscriber).not.toBeNull();
    expect(subscriber?.tenant.namaDesa).toBe('Desa Uji Telegram');
  });

  it('7. Admin desa dapat mengubah token mandiri dan token baru langsung berlaku', async () => {
    // Simulasi admin desa mengubah token di menu Identitas Desa
    const newToken = 'token-baru-kades-2026';
    await prisma.tenant.update({
      where: { id: testTenantId },
      data: { telegramToken: newToken },
    });

    // Coba login dengan token lama -> harus gagal
    const resOld = await pairTelegramUserWithTenant({
      telegramId: '111222333',
      tenantSlug: 'uji telegram', // variasi spasi tanpa kata Desa
      token: 'tokenrahasia123', // token lama
    });
    expect(resOld.success).toBe(false);
    expect(resOld.message).toContain('Kunci rahasia pairing salah');

    // Coba login dengan token baru -> harus berhasil
    const resNew = await pairTelegramUserWithTenant({
      telegramId: '111222333',
      tenantSlug: 'uji telegram',
      token: newToken,
    });
    expect(resNew.success).toBe(true);
    expect(resNew.tenant?.slug).toBe(testSlug);

    // Bersihkan subscriber uji tambahan
    await prisma.telegramSubscriber.deleteMany({
      where: { telegramId: '111222333' },
    });
  });

  afterAll(async () => {
    await prisma.telegramSubscriber.deleteMany({
      where: { telegramId: testTelegramId },
    });
    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    }
  });
});

