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

  it('8. Staging multi-foto Telegram (Media Group): Berhasil mengumpulkan banyak foto ke dalam 1 grup buffer', async () => {
    const { appendPhotoToMediaGroup, getTelegramMediaGroup } = await import('../lib/telegram');
    const testGroupId = 'mg_test_99999';

    // Bersihkan data uji sebelumnya
    await prisma.telegramMediaGroup.deleteMany({ where: { mediaGroupId: testGroupId } });

    // Request 1: Foto A (tanpa caption)
    await appendPhotoToMediaGroup({
      mediaGroupId: testGroupId,
      tenantId: testTenantId,
      telegramId: testTelegramId,
      chatId: '12345',
      fileId: 'file_id_aaa',
    });

    // Request 2: Foto B (dengan caption)
    await appendPhotoToMediaGroup({
      mediaGroupId: testGroupId,
      tenantId: testTenantId,
      telegramId: testTelegramId,
      chatId: '12345',
      caption: 'Kerja Bakti Akbar di Dusun 1\nWarga bergotong royong membersihkan parit.',
      fileId: 'file_id_bbb',
    });

    const group = await getTelegramMediaGroup(testGroupId);
    expect(group).not.toBeNull();
    expect(Array.isArray(group?.fileIds)).toBe(true);
    expect((group?.fileIds as string[]).length).toBe(2);
    expect((group?.fileIds as string[])).toContain('file_id_aaa');
    expect((group?.fileIds as string[])).toContain('file_id_bbb');
    expect(group?.caption).toContain('Kerja Bakti Akbar');
  });

  it('9. Atomic claim grup media Telegram: Menjamin tepat 1 worker yang memproses album', async () => {
    const { claimTelegramMediaGroup } = await import('../lib/telegram');
    const testGroupId = 'mg_test_99999';

    // Worker 1 mencoba klaim -> harus berhasil
    const claimWorker1 = await claimTelegramMediaGroup(testGroupId);
    expect(claimWorker1).toBe(true);

    // Worker 2 mencoba klaim grup yang sama -> harus ditolak (false)
    const claimWorker2 = await claimTelegramMediaGroup(testGroupId);
    expect(claimWorker2).toBe(false);

    // Bersihkan data uji media group
    await prisma.telegramMediaGroup.deleteMany({ where: { mediaGroupId: testGroupId } });
  });

  afterAll(async () => {
    await prisma.telegramSubscriber.deleteMany({
      where: { telegramId: testTelegramId },
    });
    await prisma.telegramMediaGroup.deleteMany({
      where: { tenantId: testTenantId },
    });
    if (testTenantId) {
      await prisma.tenant.delete({ where: { id: testTenantId } });
    }
  });
});

