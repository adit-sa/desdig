import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import {
  pairTelegramUserWithTenant,
  getLinkedTenantForTelegramUser,
  unlinkTelegramUser,
  setSubscriberConversation,
  resetSubscriberConversation,
  getMainMenuKeyboard,
  getGalleryActionKeyboard,
  getPhotoChoiceKeyboard,
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

  it('10. Pamong-specific token pairing: Menautkan token khusus pamong dan mengikat identitas nama/jabatan', async () => {
    const pamongTelegramId = '888777666';

    // 1. Buat Aparatur Desa uji dengan token khusus pamong
    const official = await prisma.villageOfficial.create({
      data: {
        tenantId: testTenantId,
        name: 'Drs. H. Mulyadi',
        position: 'Kepala Seksi Pemerintahan',
        nip: '197505102005011002',
        telegramToken: 'PMG-MULYADI',
        orderIndex: 2,
        isActive: true,
      },
    });

    // 2. Lakukan pairing akun Telegram dengan token pamong
    const res = await pairTelegramUserWithTenant({
      telegramId: pamongTelegramId,
      username: 'mulyadi_pamong',
      firstName: 'Mulyadi',
      tenantSlug: testSlug,
      token: 'PMG-MULYADI',
    });

    expect(res.success).toBe(true);
    expect(res.official).not.toBeNull();
    expect(res.official?.name).toBe('Drs. H. Mulyadi');
    expect(res.message).toContain('Drs. H. Mulyadi');

    // 3. Verifikasi subscriber terikat langsung ke villageOfficialId
    const subscriber = await getLinkedTenantForTelegramUser(pamongTelegramId);
    expect(subscriber).not.toBeNull();
    expect(subscriber?.villageOfficialId).toBe(official.id);
    expect(subscriber?.officialName).toBe('Drs. H. Mulyadi');
    expect(subscriber?.officialPosition).toBe('Kepala Seksi Pemerintahan');

    // 4. Verifikasi bahwa posting artikel mencatat authorName pamong
    const article = await prisma.article.create({
      data: {
        tenantId: testTenantId,
        title: 'Musrenbang Desa 2026',
        slug: 'musrenbang-desa-2026-test',
        content: 'Isi warta musrenbang desa.',
        status: 'PUBLISHED',
        authorName: subscriber?.officialName,
      },
    });
    expect(article.authorName).toBe('Drs. H. Mulyadi');

    // 5. Verifikasi pengumuman mencatat authorName pamong
    const announcement = await prisma.announcement.create({
      data: {
        tenantId: testTenantId,
        title: 'Jadwal Gotong Royong',
        content: 'Gotong royong serentak.',
        status: 'PUBLISHED',
        authorName: subscriber?.officialName,
      },
    });
    expect(announcement.authorName).toBe('Drs. H. Mulyadi');

    // 6. Verifikasi galeri mencatat authorName pamong
    const gallery = await prisma.galleryItem.create({
      data: {
        tenantId: testTenantId,
        title: 'Dokumentasi Kerja Bakti',
        imageUrl: '/uploads/test/sample.webp',
        authorName: subscriber?.officialName,
      },
    });
    expect(gallery.authorName).toBe('Drs. H. Mulyadi');

    // Bersihkan data uji
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.announcement.delete({ where: { id: announcement.id } });
    await prisma.galleryItem.delete({ where: { id: gallery.id } });
    await prisma.telegramSubscriber.deleteMany({ where: { telegramId: pamongTelegramId } });
    await prisma.villageOfficial.delete({ where: { id: official.id } });
  });

  it('11. Incremental Multi-Foto Processing: Menjamin foto susulan pada album tetap terproses tanpa hilang', async () => {
    const {
      appendPhotoToMediaGroup,
      claimTelegramMediaGroup,
      getTelegramMediaGroup,
      recordProcessedMediaGroupFiles,
    } = await import('../lib/telegram');
    const testGroupId = 'mg_test_incremental_123';

    // Bersihkan data lama
    await prisma.telegramMediaGroup.deleteMany({ where: { mediaGroupId: testGroupId } });

    // Tahap 1: Foto 1 & Foto 2 tiba
    await appendPhotoToMediaGroup({
      mediaGroupId: testGroupId,
      tenantId: testTenantId,
      telegramId: testTelegramId,
      chatId: '12345',
      caption: 'Berita Musrenbang Akbar',
      fileId: 'file_foto_1',
    });
    await appendPhotoToMediaGroup({
      mediaGroupId: testGroupId,
      tenantId: testTenantId,
      telegramId: testTelegramId,
      chatId: '12345',
      fileId: 'file_foto_2',
    });

    // Worker 1 mengklaim dan memproses 2 foto pertama
    const claimed1 = await claimTelegramMediaGroup(testGroupId);
    expect(claimed1).toBe(true);

    const groupStep1 = await getTelegramMediaGroup(testGroupId);
    expect(groupStep1).not.toBeNull();
    const filesStep1 = Array.isArray(groupStep1?.fileIds) ? (groupStep1?.fileIds as string[]) : [];
    expect(filesStep1.length).toBe(2);

    // Simulasi pembuatan artikel untuk 2 foto pertama
    const article = await prisma.article.create({
      data: {
        tenantId: testTenantId,
        title: 'Berita Musrenbang Akbar',
        slug: 'musrenbang-akbar-test-incremental',
        content: '<p>Isi berita</p>',
        status: 'PUBLISHED',
        coverImageUrl: '/uploads/test/foto1.webp',
        galleryUrls: [
          { url: '/uploads/test/foto1.webp', caption: 'Foto Utama' },
          { url: '/uploads/test/foto2.webp', caption: 'Dokumentasi 2' },
        ],
      },
    });

    // Catat bahwa foto 1 dan 2 sudah selesai diproses
    await recordProcessedMediaGroupFiles({
      mediaGroupId: testGroupId,
      newProcessedFiles: ['file_foto_1', 'file_foto_2'],
      articleId: article.id,
      targetType: 'ARTICLE',
    });

    // Tahap 2: Foto 3 tiba terlambat (misal karena delay jaringan Telegram)
    await appendPhotoToMediaGroup({
      mediaGroupId: testGroupId,
      tenantId: testTenantId,
      telegramId: testTelegramId,
      chatId: '12345',
      fileId: 'file_foto_3_late',
    });

    // Worker 2 harus bisa mengklaim ulang grup karena ada foto baru yang belum diproses!
    const claimed2 = await claimTelegramMediaGroup(testGroupId);
    expect(claimed2).toBe(true);

    const groupStep2 = await getTelegramMediaGroup(testGroupId);
    expect(groupStep2).not.toBeNull();
    expect(groupStep2?.articleId).toBe(article.id);

    const allFilesStep2 = Array.isArray(groupStep2?.fileIds) ? (groupStep2?.fileIds as string[]) : [];
    const processedFilesStep2 = Array.isArray(groupStep2?.processedFiles) ? (groupStep2?.processedFiles as string[]) : [];
    const unprocessedStep2 = allFilesStep2.filter((f) => !processedFilesStep2.includes(f));

    // Memastikan hanya foto 3 yang masuk ke antrean belum diproses
    expect(unprocessedStep2.length).toBe(1);
    expect(unprocessedStep2[0]).toBe('file_foto_3_late');

    // Catat foto 3 selesai diproses
    await recordProcessedMediaGroupFiles({
      mediaGroupId: testGroupId,
      newProcessedFiles: ['file_foto_3_late'],
      articleId: article.id,
      targetType: 'ARTICLE',
    });

    // Verifikasi status final grup: semua 3 foto tercatat lengkap dan processed = true
    const finalGroup = await getTelegramMediaGroup(testGroupId);
    expect(finalGroup?.processed).toBe(true);
    expect((finalGroup?.processedFiles as string[]).length).toBe(3);

    // Bersihkan data uji
    await prisma.article.delete({ where: { id: article.id } });
    await prisma.telegramMediaGroup.deleteMany({ where: { mediaGroupId: testGroupId } });
  }, 30000);

  it('12. Konfigurasi jeda waktu foto susulan otomatis (telegramAttachWindowMinutes) tersimpan per-tenant', async () => {
    // Default harus 5 menit (atau null/default)
    const initialTenant = await prisma.tenant.findUnique({
      where: { id: testTenantId },
      select: { telegramAttachWindowMinutes: true },
    });
    expect(initialTenant?.telegramAttachWindowMinutes ?? 5).toBe(5);

    // Update jeda waktu menjadi 15 menit
    await prisma.tenant.update({
      where: { id: testTenantId },
      data: { telegramAttachWindowMinutes: 15 },
    });

    const updatedTenant = await prisma.tenant.findUnique({
      where: { id: testTenantId },
      select: { telegramAttachWindowMinutes: true },
    });
    expect(updatedTenant?.telegramAttachWindowMinutes).toBe(15);

    // Kembalikan ke 10 menit
    await prisma.tenant.update({
      where: { id: testTenantId },
      data: { telegramAttachWindowMinutes: 10 },
    });
    const finalTenant = await prisma.tenant.findUnique({
      where: { id: testTenantId },
      select: { telegramAttachWindowMinutes: true },
    });
    expect(finalTenant?.telegramAttachWindowMinutes).toBe(10);
  });

  it('13. Multi-Foto Galeri & Lampiran Susulan: Menggabungkan foto ke 1 GalleryItem album tanpa membuat galeri baru', async () => {
    // Buat 1 gallery item dengan 3 foto album
    const initialPhotos = [
      { type: 'IMAGE', url: 'https://r2.desdig.id/galeri_1.webp', caption: 'Foto Utama' },
      { type: 'IMAGE', url: 'https://r2.desdig.id/galeri_2.webp', caption: 'Dokumentasi 2' },
      { type: 'IMAGE', url: 'https://r2.desdig.id/galeri_3.webp', caption: 'Dokumentasi 3' },
    ];

    const gallery = await prisma.galleryItem.create({
      data: {
        tenantId: testTenantId,
        title: 'Kerja Bakti Bersama Warga',
        imageUrl: initialPhotos[0].url,
        category: 'Kegiatan',
        caption: 'Kerja Bakti Bersama Warga',
        authorName: 'Budi Pamong',
        mediaType: 'ALBUM',
        mediaUrls: initialPhotos,
        takenAt: new Date(),
      },
    });

    expect(gallery.id).toBeDefined();
    expect(gallery.mediaType).toBe('ALBUM');

    // Simulasikan foto susulan yang datang: disematkan ke album yang sama, TIDAK boleh create galleryItem baru
    const existingMedia = Array.isArray(gallery.mediaUrls) ? (gallery.mediaUrls as any[]) : [];
    const updatedMedia = [
      ...existingMedia,
      { type: 'IMAGE', url: 'https://r2.desdig.id/galeri_4_lampiran.webp', caption: `Dokumentasi ${existingMedia.length + 1}` },
    ];

    await prisma.galleryItem.update({
      where: { id: gallery.id },
      data: {
        mediaUrls: updatedMedia,
        mediaType: 'ALBUM',
      },
    });

    // Verifikasi jumlah galleryItem tetap 1 di database (tidak membuat baris/kartu baru)
    const totalGalleries = await prisma.galleryItem.count({
      where: { tenantId: testTenantId, title: 'Kerja Bakti Bersama Warga' },
    });
    expect(totalGalleries).toBe(1);

    // Verifikasi album sekarang berisi 4 foto
    const updatedGallery = await prisma.galleryItem.findUnique({
      where: { id: gallery.id },
    });
    const finalMediaList = Array.isArray(updatedGallery?.mediaUrls) ? (updatedGallery?.mediaUrls as any[]) : [];
    expect(finalMediaList.length).toBe(4);
    expect(finalMediaList[3].url).toBe('https://r2.desdig.id/galeri_4_lampiran.webp');

    // Bersihkan
    await prisma.galleryItem.delete({ where: { id: gallery.id } });
  });

  it('14. Mode Dialog Interaktif (Wizard Mode): Transisi state, pengumpulan foto draft, dan penerbitan album galeri tanpa ambigu', async () => {
    // 1. Verifikasi keyboard helper
    const menuKb = getMainMenuKeyboard();
    expect(menuKb.keyboard.length).toBe(2);
    expect(menuKb.keyboard[0][1].text).toBe('🖼️ Galeri Kegiatan');

    const galleryActionKb = getGalleryActionKeyboard();
    expect(galleryActionKb.inline_keyboard[0][0].callback_data).toBe('publish_gallery');

    const choiceKb = getPhotoChoiceKeyboard();
    expect(choiceKb.inline_keyboard[0][1].callback_data).toBe('choice_gallery');

    // 2. Hubungkan akun telegram uji terlebih dahulu
    await pairTelegramUserWithTenant({
      telegramId: testTelegramId,
      username: 'wizard_tester',
      firstName: 'Budi Wizard',
      tenantSlug: testSlug,
      token: 'tokenrahasia123',
    });

    // 3. Masuk ke mode dialog galeri: AWAITING_GALLERY_TITLE
    await setSubscriberConversation(testTelegramId, 'AWAITING_GALLERY_TITLE', { photos: [] });
    let subscriber = await getLinkedTenantForTelegramUser(testTelegramId);
    expect(subscriber?.conversationState).toBe('AWAITING_GALLERY_TITLE');

    // 4. Pengguna memasukkan judul: transisi ke COLLECTING_GALLERY_PHOTOS
    const galleryTitle = 'Festival Panen Raya Desa';
    await setSubscriberConversation(testTelegramId, 'COLLECTING_GALLERY_PHOTOS', {
      title: galleryTitle,
      photos: [
        { type: 'IMAGE', url: 'https://r2.desdig.id/wizard_foto1.webp', caption: 'Foto Utama' },
        { type: 'IMAGE', url: 'https://r2.desdig.id/wizard_foto2.webp', caption: 'Dokumentasi 2' },
      ],
    });

    subscriber = await getLinkedTenantForTelegramUser(testTelegramId);
    expect(subscriber?.conversationState).toBe('COLLECTING_GALLERY_PHOTOS');
    const draft = subscriber?.pendingDraft as any;
    expect(draft.title).toBe(galleryTitle);
    expect(draft.photos.length).toBe(2);

    // 5. Terbitkan galeri dari draft interaktif
    const newGallery = await prisma.galleryItem.create({
      data: {
        tenantId: testTenantId,
        title: draft.title,
        imageUrl: draft.photos[0].url,
        category: 'Kegiatan',
        caption: draft.title,
        authorName: subscriber?.officialName || 'Operator Desa',
        mediaType: 'ALBUM',
        mediaUrls: draft.photos,
        takenAt: new Date(),
      },
    });

    expect(newGallery.id).toBeDefined();
    expect(newGallery.title).toBe(galleryTitle);
    expect(Array.isArray(newGallery.mediaUrls)).toBe(true);

    // 6. Reset percakapan setelah terbit
    await resetSubscriberConversation(testTelegramId);
    subscriber = await getLinkedTenantForTelegramUser(testTelegramId);
    expect(subscriber?.conversationState).toBeNull();
    expect(subscriber?.pendingDraft).toBeNull();

    // Bersihkan
    await prisma.galleryItem.delete({ where: { id: newGallery.id } });
  });

  it('15. Format Pesan Bersih: stripHtmlTags membersihkan seluruh kode tag HTML mentah menjadi format teks rapi & aman', async () => {
    const { stripHtmlTags } = await import('../lib/telegram');
    const dirtyText = `🎉 <b>Alhamdulillah! Album Galeri Berhasil Diterbitkan!</b>\n\n• <b>Judul:</b> Bansos &amp; BLT\n• <b>Penanggung Jawab:</b> H. Sapiil\n\nKetik <code>/batal</code> jika ingin membatalkan.\n<i>(Tips: Kirim foto sekaligus)</i>`;
    const cleanText = stripHtmlTags(dirtyText);

    expect(cleanText).not.toContain('<b>');
    expect(cleanText).not.toContain('</b>');
    expect(cleanText).not.toContain('<code>');
    expect(cleanText).not.toContain('</code>');
    expect(cleanText).not.toContain('<i>');
    expect(cleanText).not.toContain('</i>');
    expect(cleanText).toContain('Bansos & BLT');
    expect(cleanText).toContain('Ketik /batal jika ingin membatalkan.');
    expect(cleanText).toContain('Alhamdulillah! Album Galeri Berhasil Diterbitkan!');
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

