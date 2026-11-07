import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';
import { optimizeImageBuffer } from '@/lib/media';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';
import { revalidateTenantCache } from '@/lib/tenant/cache-revalidate';
import {
  isTelegramConfigured,
  sendTelegramMessage,
  getTelegramFileInfo,
  downloadTelegramFileBuffer,
  getLinkedTenantForTelegramUser,
  pairTelegramUserWithTenant,
  unlinkTelegramUser,
  getTelegramWebhookInfo,
  setTelegramWebhookUrl,
  appendPhotoToMediaGroup,
  claimTelegramMediaGroup,
  getTelegramMediaGroup,
  recordProcessedMediaGroupFiles,
  answerTelegramCallbackQuery,
  getMainMenuKeyboard,
  getGalleryActionKeyboard,
  getArticleActionKeyboard,
  getPhotoChoiceKeyboard,
  setSubscriberConversation,
  resetSubscriberConversation,
} from '@/lib/telegram';

// GET /api/telegram/webhook - Cek status bot & registrasi webhook
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const setUrl = searchParams.get('url');

    if (action === 'set' && setUrl) {
      const setResult = await setTelegramWebhookUrl(setUrl);
      return NextResponse.json(setResult);
    }

    const webhookInfo = await getTelegramWebhookInfo();

    return NextResponse.json({
      configured: isTelegramConfigured(),
      service: 'desDig Telegram Publishing Bot',
      status: 'active',
      webhookInfo,
      panduan: {
        setWebhook: 'Buka /api/telegram/webhook?action=set&url=https://domain-anda.com/api/telegram/webhook',
        perintah: [
          '/login [slug_desa] [kode_rahasia]',
          '/pengumuman [isi teks pengumuman]',
          '/galeri [judul foto]',
          '/status',
          '/logout',
        ],
      },
    });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_') || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('Telegram GET webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/telegram/webhook - Penerima pembaruan instan dari Telegram Bot API
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`tg-webhook:${ip}`, 120, 60_000);
    if (!rateCheck.success) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const update = await request.json();

    // =========================================================================
    // 1. PENANGANAN INTERAKSI TOMBOL INLINE (CALLBACK QUERY)
    // =========================================================================
    if (update.callback_query) {
      const cb = update.callback_query;
      const from = cb.from;
      const chatId = cb.message?.chat?.id || from.id;
      const data = cb.data;
      const queryId = cb.id;

      const linked = await getLinkedTenantForTelegramUser(from.id);
      if (!linked) {
        await answerTelegramCallbackQuery(queryId, 'Akun belum terhubung ke desa', true);
        return NextResponse.json({ ok: true });
      }

      const tenant = linked.tenant;
      const authorName = linked.officialName
        ? (linked.officialPosition ? `${linked.officialName} (${linked.officialPosition})` : linked.officialName)
        : (from.first_name || 'Operator Desa');
      const primaryDomain = tenant.domains?.find((d: any) => d.isPrimary)?.domain || `${tenant.slug}.desdig.id`;

      // A. Batalkan Draft
      if (data === 'cancel_draft') {
        await answerTelegramCallbackQuery(queryId, 'Draft dibatalkan');
        await resetSubscriberConversation(from.id);
        await sendTelegramMessage(
          chatId,
          `❌ Draft dibatalkan. Kembali ke menu utama. Silakan pilih menu di bawah jika ingin memulai kembali:`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // B. Pengguna Memilih "Masukkan ke Galeri" dari foto yang dikirim
      if (data === 'choice_gallery') {
        await answerTelegramCallbackQuery(queryId, 'Mode Galeri Dipilih');
        await setSubscriberConversation(from.id, 'AWAITING_GALLERY_TITLE');
        await sendTelegramMessage(
          chatId,
          `🖼️ Mode Galeri Dipilih!\n\nSilakan ketikkan Judul / Nama Kegiatan untuk galeri ini:\n(Contoh: Kerja Bakti Saluran Irigasi Dusun 2)\n\nKetik /batal jika ingin membatalkan.`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // C. Pengguna Memilih "Jadikan Berita" dari foto yang dikirim
      if (data === 'choice_article') {
        await answerTelegramCallbackQuery(queryId, 'Mode Berita Dipilih');
        await setSubscriberConversation(from.id, 'AWAITING_ARTICLE_TEXT');
        await sendTelegramMessage(
          chatId,
          `📰 Mode Berita Dipilih!\n\nSilakan ketikkan Teks Berita Anda:\n(Baris pertama otomatis menjadi Judul Berita, baris berikutnya adalah isi penjelasan berita)\n\nKetik /batal jika ingin membatalkan.`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // D. Terbitkan Galeri dari Draft
      if (data === 'publish_gallery') {
        const draft = (linked.pendingDraft || {}) as any;
        const photos = Array.isArray(draft.photos) ? draft.photos : [];
        const title = draft.title?.trim() || 'Dokumentasi Kegiatan Desa';

        if (photos.length === 0) {
          await answerTelegramCallbackQuery(queryId, 'Belum ada foto yang diunggah!', true);
          return NextResponse.json({ ok: true });
        }

        await answerTelegramCallbackQuery(queryId, 'Menerbitkan Galeri...');
        const coverImageUrl = photos[0].url;
        const mediaUrls = photos.map((p: any, idx: number) => ({
          type: 'IMAGE',
          url: p.url,
          caption: p.caption || (idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`),
        }));

        await prisma.galleryItem.create({
          data: {
            tenantId: tenant.id,
            title,
            imageUrl: coverImageUrl,
            category: 'Kegiatan',
            caption: title,
            authorName,
            mediaType: photos.length > 1 ? 'ALBUM' : 'IMAGE',
            mediaUrls,
            takenAt: new Date(),
          },
        });

        revalidateTenantCache(tenant.id);
        await resetSubscriberConversation(from.id);
        await sendTelegramMessage(
          chatId,
          `🎉 Alhamdulillah! Album Galeri Berhasil Diterbitkan!\n\n` +
          `• Judul: ${title}\n` +
          `• Total Foto: ${photos.length} Foto di Album\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Penanggung Jawab: ${authorName}\n\n` +
          `🔗 Lihat di Website:\nhttps://${primaryDomain}/galeri`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // E. Terbitkan Berita dari Draft
      if (data === 'publish_article') {
        const draft = (linked.pendingDraft || {}) as any;
        const photos = Array.isArray(draft.photos) ? draft.photos : [];
        const title = draft.title?.trim() || 'Warta Kegiatan Desa';
        const articleContent = draft.content?.trim() || title;

        await answerTelegramCallbackQuery(queryId, 'Menerbitkan Berita...');
        const coverImageUrl = photos.length > 0 ? photos[0].url : '/images/desa_irigasi_pertanian.jpg';
        const galleryUrls = photos.map((p: any, idx: number) => ({
          url: p.url,
          caption: idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`,
        }));

        let category = await prisma.category.findFirst({
          where: { tenantId: tenant.id, slug: 'warta-desa' },
        });
        if (!category) {
          category = await prisma.category.create({
            data: { tenantId: tenant.id, name: 'Warta Desa', slug: 'warta-desa' },
          });
        }

        let baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        if (!baseSlug) baseSlug = `berita-${Date.now()}`;
        let articleSlug = baseSlug;
        let counter = 1;
        while (await prisma.article.findFirst({ where: { tenantId: tenant.id, slug: articleSlug } })) {
          articleSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        const htmlContent = articleContent.split('\n\n').map((p: string) => `<p>${p}</p>`).join('');

        const article = await prisma.article.create({
          data: {
            tenantId: tenant.id,
            categoryId: category.id,
            title,
            slug: articleSlug,
            summary: articleContent.slice(0, 160) + '...',
            content: htmlContent,
            coverImageUrl,
            galleryUrls,
            authorName,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        revalidateTenantCache(tenant.id);
        await resetSubscriberConversation(from.id);
        const articlePublicUrl = `https://${primaryDomain}/berita/${article.slug}?tenant=${tenant.slug}`;
        await sendTelegramMessage(
          chatId,
          `📰 Artikel Berita Berhasil Diterbitkan!\n\n` +
          `• Judul: ${article.title}\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Penulis: ${authorName}\n` +
          `• Total Foto: ${photos.length} Foto\n\n` +
          `🔗 Buka Artikel di Website:\n${articlePublicUrl}`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // 2. PENANGANAN PESAN TEKS & FOTO
    // =========================================================================
    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true, note: 'No message in update' });
    }

    const chatId = message.chat.id;
    const from = message.from;
    const text = (message.text || '').trim();
    const caption = (message.caption || '').trim();
    const photos = message.photo;

    // Perintah /start, /help, atau /menu
    if (text.startsWith('/start') || text.startsWith('/help') || text === '/menu') {
      const linked = await getLinkedTenantForTelegramUser(from.id);

      if (!linked) {
        await sendTelegramMessage(
          chatId,
          `👋 Halo, ${from.first_name || 'Rekan Desa'}!\n\n` +
          `Selamat datang di Bot Publikasi Resmi desDig (desa Digital).\n\n` +
          `Bot ini memungkinkan Anda menerbitkan Berita, Galeri Kegiatan, & Pengumuman ke portal website desa langsung dari HP Anda.\n\n` +
          `🔐 Langkah Awal: Hubungkan Bot dengan Desa Anda\n` +
          `Ketik perintah:\n` +
          `/login [nama_atau_slug_desa] [kode_rahasia]\n\n` +
          `Contoh dengan nama desa:\n` +
          `/login Sinjai Tengah rahasia123\n\n` +
          `Contoh dengan slug:\n` +
          `/login sinjai-tengah rahasia123\n\n` +
          `💡 Tips: Admin desa dapat melihat atau mengganti kode pairing kapan saja di menu Bot Telegram pada dashboard admin.`
        );
        return NextResponse.json({ ok: true });
      }

      const tenant = linked.tenant;
      await sendTelegramMessage(
        chatId,
        `🏛️ Halo, ${linked.officialName ? `${linked.officialName} (${linked.officialPosition})` : 'Pamong Desa'}!\n` +
        `Anda terhubung ke Desa ${tenant.namaDesa} (${tenant.slug}).\n\n` +
        `Pilih menu di tombol keyboard bawah untuk mempublikasikan konten:\n` +
        `• 📰 Tulis Berita: Panduan langkah demi langkah menulis berita & upload foto.\n` +
        `• 🖼️ Galeri Kegiatan: Masukkan judul kegiatan lalu kirim foto-fotonya.\n` +
        `• 📢 Buat Pengumuman: Menerbitkan pengumuman resmi ke portal warga.\n` +
        `• ❌ Batal / Menu Utama: Membatalkan draft yang sedang berjalan.\n` +
        `• 🚪 Keluar / Logout: Melepas tautan akun Telegram dari desa.`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // Perintah /login [nama_atau_slug_desa] [token]
    if (text.startsWith('/login')) {
      const parts = text.split(/\s+/);
      if (parts.length < 3) {
        await sendTelegramMessage(
          chatId,
          `⚠️ Format Login Salah\n\n` +
          `Gunakan format:\n` +
          `/login [nama_atau_slug_desa] [kode_rahasia]\n\n` +
          `Contoh dengan spasi: /login Sinjai Tengah rahasia123\n` +
          `Contoh dengan slug: /login sinjai-tengah rahasia123\n\n` +
          `💡 Tips: Kode pairing rahasia desa dapat dilihat atau diubah di menu Bot Telegram pada panel admin.`
        );
        return NextResponse.json({ ok: true });
      }

      const pairingToken = parts[parts.length - 1];
      const targetIdentifier = parts.slice(1, -1).join(' ');

      const pairResult = await pairTelegramUserWithTenant({
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name,
        tenantSlug: targetIdentifier,
        token: pairingToken,
      });

      if (!pairResult.success) {
        await sendTelegramMessage(chatId, `❌ ${pairResult.message}`);
        return NextResponse.json({ ok: true });
      }

      const official = pairResult.official;
      const pamongName = official?.name || from.first_name || 'Aparatur Desa';
      const pamongPosition = official?.position ? ` (${official.position})` : '';
      const villageName = pairResult.tenant?.namaDesa || 'Desa';

      await sendTelegramMessage(
        chatId,
        `🎉 Selamat Datang, ${pamongName}!\n` +
        `Akun Telegram Anda Berhasil Terhubung ke Desa ${villageName}.\n\n` +
        `• Penanggung Jawab: ${pamongName}${pamongPosition}\n` +
        `• Desa Resmi: ${villageName}\n` +
        `• Status: Terautentikasi\n\n` +
        `Anda sekarang dapat mempublikasikan Berita, Galeri, dan Pengumuman langsung ke website resmi Desa ${villageName}.\n\n` +
        `Gunakan menu tombol di bawah ini untuk memulai publikasi, atau tekan tombol "🚪 Keluar / Logout" untuk keluar kapan saja! 👇`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // Perintah /logout atau tombol Keluar
    if (text.startsWith('/logout') || text === '🚪 Keluar / Logout' || text === '/keluar') {
      await unlinkTelegramUser(from.id);
      await sendTelegramMessage(
        chatId,
        `👋 Akun Telegram Anda telah berhasil keluar (logout) dari desa.\n\n` +
        `Anda dapat menghubungkan akun kembali kapan saja menggunakan perintah:\n` +
        `/login [nama_desa] [kode_rahasia]`,
        { reply_markup: { remove_keyboard: true } }
      );
      return NextResponse.json({ ok: true });
    }

    // Dapatkan data desa yang ditautkan untuk aksi berikutnya
    const linked = await getLinkedTenantForTelegramUser(from.id);
    if (!linked) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Akun Belum Terhubung ke Desa\n\n` +
        `Silakan tautkan akun Anda terlebih dahulu dengan mengetik:\n` +
        `/login [nama_atau_slug_desa] [kode_rahasia]`
      );
      return NextResponse.json({ ok: true });
    }

    const tenant = linked.tenant;
    const authorName = linked.officialName
      ? (linked.officialPosition ? `${linked.officialName} (${linked.officialPosition})` : linked.officialName)
      : (from.first_name || 'Operator Desa');
    const primaryDomain = tenant.domains?.find((d: any) => d.isPrimary)?.domain || `${tenant.slug}.desdig.id`;

    // Perintah /status
    if (text.startsWith('/status')) {
      const [articleCount, residentCount, officialCount, galleryCount] = await Promise.all([
        prisma.article.count({ where: { tenantId: tenant.id } }),
        prisma.resident.count({ where: { tenantId: tenant.id } }),
        prisma.villageOfficial.count({ where: { tenantId: tenant.id, isActive: true } }),
        prisma.galleryItem.count({ where: { tenantId: tenant.id } }),
      ]);

      await sendTelegramMessage(
        chatId,
        `🏛️ Profil Desa: ${tenant.namaDesa}\n\n` +
        `• Petugas Login: ${authorName}\n` +
        `• Kecamatan: ${tenant.kecamatan}\n` +
        `• Kabupaten: ${tenant.kabupaten}\n` +
        `• Kepala Desa: ${tenant.kepalaDesa || '-'}\n` +
        `• Total Warga: ${residentCount.toLocaleString('id-ID')} Jiwa\n` +
        `• Total Berita: ${articleCount} Artikel\n` +
        `• Total Galeri: ${galleryCount} Album\n` +
        `• Pamong Aktif: ${officialCount} Aparatur\n\n` +
        `🌐 Portal Website: https://${primaryDomain}`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // Proteksi Berkas Non-Foto: Batasi hanya menerima foto agar hemat ruang penyimpanan R2
    if (message.document || message.video || message.audio || message.voice || message.video_note) {
      await sendTelegramMessage(
        chatId,
        `⚠️ Format Berkas Belum Didukung\n\n` +
        `Untuk menghemat kuota dan kapasitas penyimpanan server desa, bot saat ini hanya menerima berkas Foto / Gambar (JPG, PNG, WebP).\n\n` +
        `Silakan kirimkan dokumentasi kegiatan dalam bentuk foto biasa.`
      );
      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // 3. KONTROL MENU & PERINTAH DIALOG INTERAKTIF
    // =========================================================================

    // A. Batal / Reset
    if (text === '❌ Batal / Menu Utama' || text === '/batal' || text === '/reset') {
      await resetSubscriberConversation(from.id);
      await sendTelegramMessage(
        chatId,
        `🔄 Mode dialog dibatalkan. Kembali ke menu utama.\n\nSilakan pilih salah satu tombol menu di bawah:`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // B. Masuk Mode Galeri Kegiatan
    if (text === '🖼️ Galeri Kegiatan' || text === '/galeri') {
      await setSubscriberConversation(from.id, 'AWAITING_GALLERY_TITLE', { photos: [] });
      await sendTelegramMessage(
        chatId,
        `🖼️ Mode Galeri Kegiatan Aktif\n\n` +
        `Silakan ketikkan Judul / Nama Kegiatan untuk album galeri ini:\n` +
        `(Contoh: Kerja Bakti Saluran Irigasi Dusun 2)\n\n` +
        `Ketik /batal jika ingin membatalkan.`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // C. Masuk Mode Tulis Berita
    if (text === '📰 Tulis Berita' || text === '/berita') {
      await setSubscriberConversation(from.id, 'AWAITING_ARTICLE_TEXT', { photos: [] });
      await sendTelegramMessage(
        chatId,
        `📰 Mode Tulis Berita Aktif\n\n` +
        `Silakan kirimkan Teks Berita Anda:\n` +
        `(Tips: Baris pertama otomatis menjadi Judul Berita, baris berikutnya adalah isi penjelasan berita)\n\n` +
        `Ketik /batal jika ingin membatalkan.`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // D. Masuk Mode Pengumuman Warga
    if (text === '📢 Buat Pengumuman' || text === '/pengumuman') {
      await setSubscriberConversation(from.id, 'AWAITING_ANNOUNCEMENT_TEXT');
      await sendTelegramMessage(
        chatId,
        `📢 Mode Pengumuman Warga Aktif\n\n` +
        `Silakan ketikkan Teks Pengumuman yang ingin diterbitkan di portal desa:\n\n` +
        `Ketik /batal jika ingin membatalkan.`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // E. Selesai & Terbitkan (Perintah /selesai)
    if (text === '/selesai') {
      if (linked.conversationState === 'COLLECTING_GALLERY_PHOTOS') {
        const draft = (linked.pendingDraft || {}) as any;
        const photos = Array.isArray(draft.photos) ? draft.photos : [];
        const title = draft.title?.trim() || 'Dokumentasi Kegiatan Desa';

        if (photos.length === 0) {
          await sendTelegramMessage(
            chatId,
            `⚠️ Anda belum mengirimkan foto untuk galeri "${title}". Silakan kirim minimal 1 foto terlebih dahulu.`
          );
          return NextResponse.json({ ok: true });
        }

        const coverImageUrl = photos[0].url;
        const mediaUrls = photos.map((p: any, idx: number) => ({
          type: 'IMAGE',
          url: p.url,
          caption: p.caption || (idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`),
        }));

        await prisma.galleryItem.create({
          data: {
            tenantId: tenant.id,
            title,
            imageUrl: coverImageUrl,
            category: 'Kegiatan',
            caption: title,
            authorName,
            mediaType: photos.length > 1 ? 'ALBUM' : 'IMAGE',
            mediaUrls,
            takenAt: new Date(),
          },
        });

        revalidateTenantCache(tenant.id);
        await resetSubscriberConversation(from.id);
        await sendTelegramMessage(
          chatId,
          `🎉 Alhamdulillah! Album Galeri Berhasil Diterbitkan!\n\n` +
          `• Judul: ${title}\n` +
          `• Total Foto: ${photos.length} Foto di Album\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Penanggung Jawab: ${authorName}\n\n` +
          `🔗 Lihat di Website:\nhttps://${primaryDomain}/galeri`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      if (linked.conversationState === 'COLLECTING_ARTICLE_PHOTOS') {
        const draft = (linked.pendingDraft || {}) as any;
        const photos = Array.isArray(draft.photos) ? draft.photos : [];
        const title = draft.title?.trim() || 'Warta Kegiatan Desa';
        const articleContent = draft.content?.trim() || title;

        const coverImageUrl = photos.length > 0 ? photos[0].url : '/images/desa_irigasi_pertanian.jpg';
        const galleryUrls = photos.map((p: any, idx: number) => ({
          url: p.url,
          caption: idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`,
        }));

        let category = await prisma.category.findFirst({
          where: { tenantId: tenant.id, slug: 'warta-desa' },
        });
        if (!category) {
          category = await prisma.category.create({
            data: { tenantId: tenant.id, name: 'Warta Desa', slug: 'warta-desa' },
          });
        }

        let baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        if (!baseSlug) baseSlug = `berita-${Date.now()}`;
        let articleSlug = baseSlug;
        let counter = 1;
        while (await prisma.article.findFirst({ where: { tenantId: tenant.id, slug: articleSlug } })) {
          articleSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        const htmlContent = articleContent.split('\n\n').map((p: string) => `<p>${p}</p>`).join('');

        const article = await prisma.article.create({
          data: {
            tenantId: tenant.id,
            categoryId: category.id,
            title,
            slug: articleSlug,
            summary: articleContent.slice(0, 160) + '...',
            content: htmlContent,
            coverImageUrl,
            galleryUrls,
            authorName,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        revalidateTenantCache(tenant.id);
        await resetSubscriberConversation(from.id);
        const articlePublicUrl = `https://${primaryDomain}/berita/${article.slug}?tenant=${tenant.slug}`;
        await sendTelegramMessage(
          chatId,
          `📰 Artikel Berita Berhasil Diterbitkan!\n\n` +
          `• Judul: ${article.title}\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Penulis: ${authorName}\n` +
          `• Total Foto: ${photos.length} Foto\n\n` +
          `🔗 Buka Artikel di Website:\n${articlePublicUrl}`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      await sendTelegramMessage(
        chatId,
        `ℹ️ Tidak ada draft yang sedang aktif. Silakan pilih menu di bawah untuk mulai memposting:`,
        { reply_markup: getMainMenuKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // 4. PENANGANAN INPUT TEKS DALAM STATE DIALOG
    // =========================================================================
    if (text && (!photos || photos.length === 0)) {
      // A. Menunggu Judul Galeri
      if (linked.conversationState === 'AWAITING_GALLERY_TITLE') {
        const title = text.trim();
        const currentDraft = (linked.pendingDraft || {}) as any;
        const existingPhotos = Array.isArray(currentDraft.photos) ? currentDraft.photos : [];

        await setSubscriberConversation(from.id, 'COLLECTING_GALLERY_PHOTOS', {
          ...currentDraft,
          title,
        });

        if (existingPhotos.length > 0) {
          await sendTelegramMessage(
            chatId,
            `✅ Judul dicatat: ${title}\n\n` +
            `Saat ini sudah ada ${existingPhotos.length} foto tersimpan di draft album ini.\n` +
            `Anda dapat mengirim foto tambahan lagi, atau klik tombol di bawah untuk langsung menerbitkan album:`,
            { reply_markup: getGalleryActionKeyboard() }
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ Judul dicatat: ${title}\n\n` +
            `📸 Sekarang silakan kirimkan foto-foto dokumentasinya!\n` +
            `(Anda bisa mengirim 1, 2, atau banyak foto sekaligus dari galeri HP)\n\n` +
            `Setelah selesai, klik tombol di bawah atau ketik /selesai.`,
            { reply_markup: getGalleryActionKeyboard() }
          );
        }
        return NextResponse.json({ ok: true });
      }

      // B. Menunggu Teks Berita
      if (linked.conversationState === 'AWAITING_ARTICLE_TEXT') {
        const lines = text.trim().split('\n').filter(Boolean);
        const title = lines[0]?.slice(0, 150) || 'Warta Kegiatan Desa';
        const content = lines.length > 1 ? lines.slice(1).join('\n\n') : text.trim();
        const currentDraft = (linked.pendingDraft || {}) as any;
        const existingPhotos = Array.isArray(currentDraft.photos) ? currentDraft.photos : [];

        await setSubscriberConversation(from.id, 'COLLECTING_ARTICLE_PHOTOS', {
          ...currentDraft,
          title,
          content,
        });

        if (existingPhotos.length > 0) {
          await sendTelegramMessage(
            chatId,
            `✅ Berita dicatat: ${title}\n\n` +
            `Saat ini sudah ada ${existingPhotos.length} foto tersimpan.\n` +
            `Anda dapat mengirim foto tambahan lagi, atau klik tombol di bawah untuk langsung menerbitkan berita:`,
            { reply_markup: getArticleActionKeyboard() }
          );
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ Teks berita dicatat: ${title}\n\n` +
            `📸 Sekarang silakan kirimkan foto dokumentasinya!\n` +
            `(Foto pertama otomatis dijadikan cover utama berita)\n\n` +
            `Setelah selesai, klik tombol di bawah atau ketik /selesai.`,
            { reply_markup: getArticleActionKeyboard() }
          );
        }
        return NextResponse.json({ ok: true });
      }

      // C. Menunggu Teks Pengumuman
      if (linked.conversationState === 'AWAITING_ANNOUNCEMENT_TEXT') {
        const announcementContent = text.trim();
        const firstLine = announcementContent.split('\n')[0].trim();
        const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;

        await prisma.announcement.create({
          data: {
            tenantId: tenant.id,
            title,
            content: announcementContent,
            status: 'PUBLISHED',
            isPinned: true,
            authorName,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 1 bulan masa tayang
          },
        });

        revalidateTenantCache(tenant.id);
        await resetSubscriberConversation(from.id);
        await sendTelegramMessage(
          chatId,
          `📢 Pengumuman Resmi Berhasil Diterbitkan!\n\n` +
          `• Judul: ${title}\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Diumumkan Oleh: ${authorName}\n\n` +
          `Pengumuman sudah langsung tayang di papan pengumuman portal warga: https://${primaryDomain}`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }
    }

    // =========================================================================
    // 5. PENANGANAN PENGUNGGAHAN FOTO (DENGAN KOMPRESI SHARP WEBP KE R2)
    // =========================================================================
    if (photos && photos.length > 0) {
      const highestResPhoto = photos[photos.length - 1];
      const fileId = highestResPhoto.file_id;
      const mediaGroupId = message.media_group_id ? String(message.media_group_id) : null;

      let fileIdsToProcess: string[] = [];
      let finalCaption = caption.trim();

      if (mediaGroupId) {
        // Multi-photo album (dikirim bersamaan oleh Telegram)
        await appendPhotoToMediaGroup({
          mediaGroupId,
          tenantId: tenant.id,
          telegramId: from.id.toString(),
          chatId: chatId.toString(),
          caption: finalCaption || undefined,
          fileId,
        });

        // Jeda waktu 2200ms agar seluruh foto dalam album sempat ter-buffer
        await new Promise((resolve) => setTimeout(resolve, 2200));

        const claimed = await claimTelegramMediaGroup(mediaGroupId);
        if (!claimed) {
          return NextResponse.json({ ok: true });
        }

        const groupData = await getTelegramMediaGroup(mediaGroupId);
        if (!groupData) return NextResponse.json({ ok: true });

        const allFiles = Array.isArray(groupData.fileIds) ? (groupData.fileIds as string[]) : [];
        const processedFiles = Array.isArray(groupData.processedFiles) ? (groupData.processedFiles as string[]) : [];
        fileIdsToProcess = allFiles.filter((f) => !processedFiles.includes(f));

        if (fileIdsToProcess.length === 0) {
          return NextResponse.json({ ok: true });
        }

        if (groupData.caption) {
          finalCaption = groupData.caption.trim();
        }
      } else {
        fileIdsToProcess = [fileId];
      }

      // Unggah & kompresi seluruh berkas foto ke WebP di Cloudflare R2
      const newUploadedPhotos: { url: string; storage: string }[] = [];
      for (let i = 0; i < fileIdsToProcess.length; i++) {
        const fId = fileIdsToProcess[i];
        const fileInfo = await getTelegramFileInfo(fId);
        if (!fileInfo || !fileInfo.file_path) continue;

        const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
        if (!fileBuffer) continue;

        // Kompresi cerdas: skala maks 1600px, WebP efisien (effort 6), dengan safeguard agar ukuran tidak membengkak
        const opt = await optimizeImageBuffer(fileBuffer, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 75,
          effort: 6,
        });

        const ext = opt.format === 'webp' ? 'webp' : 'jpg';
        const filename = `media_${Date.now()}_${i + 1}.${ext}`;
        const uploadRes = await uploadFile({
          buffer: opt.buffer,
          filename,
          mimeType: opt.mimeType,
          tenantSlug: tenant.slug,
          folder: 'galeri',
        });
        newUploadedPhotos.push(uploadRes);
      }

      if (newUploadedPhotos.length === 0) {
        await sendTelegramMessage(chatId, `❌ Gagal memproses foto. Silakan coba kembali.`);
        return NextResponse.json({ ok: true });
      }

      if (mediaGroupId) {
        await recordProcessedMediaGroupFiles({
          mediaGroupId,
          newProcessedFiles: fileIdsToProcess,
        });
      }

      // KASUS 1: Subscriber sedang dalam mode pengumpulan foto galeri
      if (linked.conversationState === 'COLLECTING_GALLERY_PHOTOS') {
        const currentDraft = (linked.pendingDraft || {}) as any;
        const existingPhotos = Array.isArray(currentDraft.photos) ? currentDraft.photos : [];
        const updatedPhotos = [...existingPhotos, ...newUploadedPhotos];

        await setSubscriberConversation(from.id, 'COLLECTING_GALLERY_PHOTOS', {
          ...currentDraft,
          photos: updatedPhotos,
        });

        await sendTelegramMessage(
          chatId,
          `📸 ${newUploadedPhotos.length} Foto Diterima!\n` +
          `Total saat ini: ${updatedPhotos.length} foto di album '${currentDraft.title || 'Galeri Kegiatan'}'.\n\n` +
          `Kirim foto tambahan lagi jika ada, atau klik tombol di bawah untuk menerbitkan:`,
          { reply_markup: getGalleryActionKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // KASUS 2: Subscriber sedang dalam mode pengumpulan foto berita
      if (linked.conversationState === 'COLLECTING_ARTICLE_PHOTOS') {
        const currentDraft = (linked.pendingDraft || {}) as any;
        const existingPhotos = Array.isArray(currentDraft.photos) ? currentDraft.photos : [];
        const updatedPhotos = [...existingPhotos, ...newUploadedPhotos];

        await setSubscriberConversation(from.id, 'COLLECTING_ARTICLE_PHOTOS', {
          ...currentDraft,
          photos: updatedPhotos,
        });

        await sendTelegramMessage(
          chatId,
          `📸 ${newUploadedPhotos.length} Foto Berita Diterima!\n` +
          `Total: ${updatedPhotos.length} foto untuk berita '${currentDraft.title || 'Warta Desa'}'.\n\n` +
          `Kirim foto tambahan lagi jika ada, atau klik tombol di bawah untuk menerbitkan:`,
          { reply_markup: getArticleActionKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // KASUS 3: Subscriber sedang menunggu pilihan jenis postingan (AWAITING_CHOICE)
      if (linked.conversationState === 'AWAITING_CHOICE') {
        const currentDraft = (linked.pendingDraft || {}) as any;
        const existingPhotos = Array.isArray(currentDraft.photos) ? currentDraft.photos : [];
        const updatedPhotos = [...existingPhotos, ...newUploadedPhotos];

        await setSubscriberConversation(from.id, 'AWAITING_CHOICE', {
          ...currentDraft,
          photos: updatedPhotos,
        });

        await sendTelegramMessage(
          chatId,
          `📸 Foto Tambahan Diterima! (Total: ${updatedPhotos.length} foto tersimpan di draft sementara).\n\n` +
          `Ingin dipublikasikan sebagai apa? Silakan pilih tombol di bawah:`,
          { reply_markup: getPhotoChoiceKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // KASUS 4: Foto dikirim saat IDLE (Tidak dalam mode aktif)
      // Cek apakah ada caption eksplisit perintah
      if (finalCaption.startsWith('/galeri') || finalCaption.startsWith('/album')) {
        const baseTitle = finalCaption.replace(/^\/(?:galeri|album)\s*/i, '').trim() || 'Dokumentasi Kegiatan Desa';
        const coverImageUrl = newUploadedPhotos[0].url;
        const mediaUrls = newUploadedPhotos.map((p, idx) => ({
          type: 'IMAGE',
          url: p.url,
          caption: idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`,
        }));

        await prisma.galleryItem.create({
          data: {
            tenantId: tenant.id,
            title: baseTitle,
            imageUrl: coverImageUrl,
            category: 'Kegiatan',
            caption: baseTitle,
            authorName,
            mediaType: newUploadedPhotos.length > 1 ? 'ALBUM' : 'IMAGE',
            mediaUrls,
            takenAt: new Date(),
          },
        });

        await sendTelegramMessage(
          chatId,
          `🖼️ ${newUploadedPhotos.length > 1 ? `${newUploadedPhotos.length} Foto Berhasil Disimpan ke Album Galeri!` : 'Foto Berhasil Disimpan ke Galeri!'}\n\n` +
          `• Judul: ${baseTitle}\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Diunggah Oleh: ${authorName}\n` +
          `• Total Foto: ${newUploadedPhotos.length} Foto (WebP Terkompresi)\n\n` +
          `🔗 Lihat di Galeri Desa:\nhttps://${primaryDomain}/galeri`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // Cek apakah ada caption teks berita lengkap (multi-line)
      if (finalCaption && !finalCaption.startsWith('/')) {
        const lines = finalCaption.split('\n').map((l: string) => l.trim()).filter(Boolean);
        const title = lines[0]?.slice(0, 150) || 'Warta Kegiatan Desa';
        const articleContent = lines.length > 1 ? lines.slice(1).join('\n\n') : finalCaption;

        const coverImageUrl = newUploadedPhotos[0].url;
        const galleryUrls = newUploadedPhotos.map((p, idx) => ({
          url: p.url,
          caption: idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`,
        }));

        let category = await prisma.category.findFirst({
          where: { tenantId: tenant.id, slug: 'warta-desa' },
        });
        if (!category) {
          category = await prisma.category.create({
            data: { tenantId: tenant.id, name: 'Warta Desa', slug: 'warta-desa' },
          });
        }

        let baseSlug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        if (!baseSlug) baseSlug = `berita-${Date.now()}`;
        let articleSlug = baseSlug;
        let counter = 1;
        while (await prisma.article.findFirst({ where: { tenantId: tenant.id, slug: articleSlug } })) {
          articleSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        const htmlContent = articleContent.split('\n\n').map((p: string) => `<p>${p}</p>`).join('');

        const article = await prisma.article.create({
          data: {
            tenantId: tenant.id,
            categoryId: category.id,
            title,
            slug: articleSlug,
            summary: articleContent.slice(0, 160) + '...',
            content: htmlContent,
            coverImageUrl,
            galleryUrls,
            authorName,
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });

        const articlePublicUrl = `https://${primaryDomain}/berita/${article.slug}?tenant=${tenant.slug}`;
        await sendTelegramMessage(
          chatId,
          `📰 Artikel Berita Berhasil Diterbitkan!\n\n` +
          `• Judul: ${article.title}\n` +
          `• Desa: ${tenant.namaDesa}\n` +
          `• Penulis: ${authorName}\n` +
          `• Total Foto: ${newUploadedPhotos.length} Foto\n\n` +
          `🔗 Baca Berita Sekarang:\n${articlePublicUrl}`,
          { reply_markup: getMainMenuKeyboard() }
        );
        return NextResponse.json({ ok: true });
      }

      // KASUS 5: Foto dikirim langsung TANPA caption dan tanpa mode aktif -> TANYA PENGGUNA VIA TOMBOL INTERAKTIF!
      await setSubscriberConversation(from.id, 'AWAITING_CHOICE', {
        photos: newUploadedPhotos,
      });

      await sendTelegramMessage(
        chatId,
        `📸 ${newUploadedPhotos.length} Foto Diterima!\n\n` +
        `Ingin dipublikasikan sebagai apa?\n` +
        `Silakan pilih salah satu opsi tombol di bawah ini:`,
        { reply_markup: getPhotoChoiceKeyboard() }
      );
      return NextResponse.json({ ok: true });
    }

    // Balasan default jika ada teks lain yang tidak dikenali
    if (text) {
      await sendTelegramMessage(
        chatId,
        `💡 Pilih Menu Publikasi\n\n` +
        `Gunakan tombol menu di bawah layar untuk memulai publikasi:\n` +
        `• 📰 Tulis Berita\n` +
        `• 🖼️ Galeri Kegiatan\n` +
        `• 📢 Buat Pengumuman\n` +
        `• ❌ Batal / Menu Utama`,
        { reply_markup: getMainMenuKeyboard() }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_') || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('Telegram POST webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
