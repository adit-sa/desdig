import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/storage';
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
    const update = await request.json();
    const message = update.message;

    if (!message) {
      return NextResponse.json({ ok: true, note: 'No message in update' });
    }

    const chatId = message.chat.id;
    const from = message.from;
    const text = (message.text || '').trim();
    const caption = (message.caption || '').trim();
    const photos = message.photo;

    // 1. Perintah /start atau /help
    if (text.startsWith('/start') || text.startsWith('/help')) {
      const linked = await getLinkedTenantForTelegramUser(from.id);

      if (!linked) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Halo, ${from.first_name || 'Rekan Desa'}!</b>\n\n` +
          `Selamat datang di <b>Bot Publikasi Resmi desDig (desa Digital)</b>.\n\n` +
          `Bot ini memungkinkan Anda menerbitkan <b>Berita, Galeri Kegiatan, & Pengumuman</b> ke portal website desa langsung dari HP Anda.\n\n` +
          `🔐 <b>Langkah Awal: Hubungkan Bot dengan Desa Anda</b>\n` +
          `Ketik perintah:\n` +
          `<code>/login [nama_atau_slug_desa] [kode_rahasia]</code>\n\n` +
          `<i>Contoh dengan spasi:</i>\n` +
          `<code>/login Sinjai Tengah rahasia123</code>\n\n` +
          `<i>Contoh dengan slug:</i>\n` +
          `<code>/login sinjai-tengah rahasia123</code>\n\n` +
          `💡 <i>Admin desa dapat melihat atau mengganti kode pairing kapan saja di menu <b>Identitas Desa</b> pada dashboard admin.</i>`
        );
        return NextResponse.json({ ok: true });
      }

      const tenant = linked.tenant;
      await sendTelegramMessage(
        chatId,
        `🏛️ <b>Anda Terhubung ke: Desa ${tenant.namaDesa}</b> (<code>${tenant.slug}</code>)\n\n` +
        `<b>Cara Publikasi Cepat dari Telegram:</b>\n\n` +
        `📰 <b>1. Terbitkan Berita Kegiatan:</b>\n` +
        `Kirim foto kegiatan dari HP dengan <i>caption</i>:\n` +
        `<code>Judul Berita\n` +
        `Isi ringkasan atau penjelasan berita secara lengkap...</code>\n\n` +
        `🖼️ <b>2. Tambah Galeri Foto:</b>\n` +
        `Kirim foto dengan caption diawali:\n` +
        `<code>/galeri Judul Dokumentasi Foto</code>\n\n` +
        `📢 <b>3. Buat Pengumuman Warga:</b>\n` +
        `Ketik:\n` +
        `<code>/pengumuman Isi pengumuman penting untuk warga...</code>\n\n` +
        `ℹ️ <i>Ketik /status untuk melihat ringkasan desa atau /logout untuk melepas tautan akun ini.</i>`
      );
      return NextResponse.json({ ok: true });
    }

    // 2. Perintah /login [nama_atau_slug_desa] [token]
    // Mendukung nama desa ber-spasi, misal: /login Sinjai Tengah rahasia123
    if (text.startsWith('/login')) {
      const parts = text.split(/\s+/);
      if (parts.length < 3) {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Format Login Salah</b>\n\n` +
          `Gunakan format:\n` +
          `<code>/login [nama_atau_slug_desa] [kode_rahasia]</code>\n\n` +
          `<i>Contoh dengan spasi:</i> <code>/login Sinjai Tengah rahasia123</code>\n` +
          `<i>Contoh dengan slug:</i> <code>/login sinjai-tengah rahasia123</code>\n\n` +
          `💡 <i>Kode pairing rahasia desa dapat dilihat atau diubah di menu <b>Identitas Desa</b> pada panel admin.</i>`
        );
        return NextResponse.json({ ok: true });
      }

      // Kata terakhir adalah token pairing
      const pairingToken = parts[parts.length - 1];
      // Kata di antara /login dan token digabung kembali menjadi nama/slug desa
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

      await sendTelegramMessage(
        chatId,
        `🎉 <b>Selamat! Akun Telegram Anda Berhasil Terhubung.</b>\n\n` +
        `Anda sekarang dapat mempublikasikan Berita, Galeri, dan Pengumuman langsung ke website resmi <b>Desa ${pairResult.tenant.namaDesa}</b>.\n\n` +
        `Coba kirim foto kegiatan sekarang dengan caption berita! 📸`
      );
      return NextResponse.json({ ok: true });
    }

    // 3. Perintah /logout
    if (text.startsWith('/logout')) {
      await unlinkTelegramUser(from.id);
      await sendTelegramMessage(
        chatId,
        `👋 Akun Telegram Anda telah dilepas dari desa. Anda dapat menghubungkan kembali kapan saja menggunakan perintah <code>/login</code>.`
      );
      return NextResponse.json({ ok: true });
    }

    // Dapatkan data desa yang ditautkan untuk aksi berikutnya
    const linked = await getLinkedTenantForTelegramUser(from.id);
    if (!linked) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Akun Belum Terhubung ke Desa</b>\n\n` +
        `Silakan tautkan akun Anda terlebih dahulu dengan mengetik:\n` +
        `<code>/login [slug_desa] [kode_rahasia]</code>`
      );
      return NextResponse.json({ ok: true });
    }

    const tenant = linked.tenant;
    const primaryDomain = tenant.domains?.find((d: any) => d.isPrimary)?.domain || `${tenant.slug}.desdig.id`;

    // 4. Perintah /status
    if (text.startsWith('/status')) {
      const [articleCount, residentCount, officialCount] = await Promise.all([
        prisma.article.count({ where: { tenantId: tenant.id } }),
        prisma.resident.count({ where: { tenantId: tenant.id } }),
        prisma.villageOfficial.count({ where: { tenantId: tenant.id, isActive: true } }),
      ]);

      await sendTelegramMessage(
        chatId,
        `🏛️ <b>Profil Desa: ${tenant.namaDesa}</b>\n\n` +
        `• <b>Kecamatan:</b> ${tenant.kecamatan}\n` +
        `• <b>Kabupaten:</b> ${tenant.kabupaten}\n` +
        `• <b>Kepala Desa:</b> ${tenant.kepalaDesa || '-'}\n` +
        `• <b>Total Warga:</b> ${residentCount.toLocaleString('id-ID')} Jiwa\n` +
        `• <b>Total Berita:</b> ${articleCount} Artikel\n` +
        `• <b>Pamong Aktif:</b> ${officialCount} Aparatur\n\n` +
        `🌐 <b>Portal Website:</b> https://${primaryDomain}`
      );
      return NextResponse.json({ ok: true });
    }

    // 5. Perintah /pengumuman [isi]
    if (text.startsWith('/pengumuman')) {
      const announcementContent = text.replace(/^\/pengumuman\s*/i, '').trim();
      if (!announcementContent) {
        await sendTelegramMessage(
          chatId,
          `ℹ️ Tuliskan isi pengumuman setelah perintah.\nContoh: <code>/pengumuman Besok pagi jam 08.00 kerja bakti di Dusun 1.</code>`
        );
        return NextResponse.json({ ok: true });
      }

      // Ambil baris pertama sebagai judul (maksimal 80 karakter)
      const firstLine = announcementContent.split('\n')[0].trim();
      const title = firstLine.length > 80 ? firstLine.slice(0, 77) + '...' : firstLine;

      await prisma.announcement.create({
        data: {
          tenantId: tenant.id,
          title,
          content: announcementContent,
          status: 'PUBLISHED',
          isPinned: true,
        },
      });

      await sendTelegramMessage(
        chatId,
        `📢 <b>Pengumuman Resmi Berhasil Diterbitkan!</b>\n\n` +
        `<b>Judul:</b> ${title}\n` +
        `<b>Desa:</b> ${tenant.namaDesa}\n\n` +
        `Pengumuman sudah langsung tayang di beranda portal warga: https://${primaryDomain}`
      );
      return NextResponse.json({ ok: true });
    }

    // 6. Pengunggahan Foto (Artikel Berita atau Galeri)
    if (photos && photos.length > 0) {
      // Ambil foto dengan resolusi tertinggi (elemen terakhir array)
      const highestResPhoto = photos[photos.length - 1];
      const fileId = highestResPhoto.file_id;

      // Beri tanda bot sedang memproses
      await sendTelegramMessage(chatId, `⏳ <i>Sedang mengunduh foto & mengonversi ke format WebP ringan...</i>`);

      const fileInfo = await getTelegramFileInfo(fileId);
      if (!fileInfo || !fileInfo.file_path) {
        await sendTelegramMessage(chatId, `❌ Gagal mengambil berkas foto dari server Telegram.`);
        return NextResponse.json({ ok: true });
      }

      const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
      if (!fileBuffer) {
        await sendTelegramMessage(chatId, `❌ Gagal mengunduh isi foto.`);
        return NextResponse.json({ ok: true });
      }

      // A. JIKA CAPTION DIAWALI /galeri -> Simpan ke Galeri Desa
      if (caption.startsWith('/galeri') || caption.startsWith('/album')) {
        const galleryTitle = caption.replace(/^\/(?:galeri|album)\s*/i, '').trim() || 'Dokumentasi Kegiatan Desa';
        const filename = `galeri_${Date.now()}.jpg`;

        const uploadRes = await uploadFile({
          buffer: fileBuffer,
          filename,
          mimeType: 'image/jpeg',
          tenantSlug: tenant.slug,
          folder: 'galeri',
        });

        const galleryItem = await prisma.galleryItem.create({
          data: {
            tenantId: tenant.id,
            title: galleryTitle,
            imageUrl: uploadRes.url,
            category: 'Kegiatan',
            caption: galleryTitle,
            takenAt: new Date(),
          },
        });

        await sendTelegramMessage(
          chatId,
          `🖼️ <b>Dokumentasi Galeri Berhasil Disimpan!</b>\n\n` +
          `<b>Judul:</b> ${galleryItem.title}\n` +
          `<b>Desa:</b> ${tenant.namaDesa}\n` +
          `<b>Penyimpanan:</b> Cloud Storage R2 (${uploadRes.storage})\n\n` +
          `🔗 <b>Lihat di Galeri:</b> https://${primaryDomain}/galeri`
        );
        return NextResponse.json({ ok: true });
      }

      // B. JIKA FOTO DENGAN CAPTION BIASA -> Terbitkan sebagai Artikel Berita
      const rawCaption = caption || 'Warta Kegiatan Desa';
      const lines = rawCaption.split('\n').map((l: string) => l.trim()).filter(Boolean);

      const title = lines[0].slice(0, 150);
      const articleContent = lines.length > 1 ? lines.slice(1).join('\n\n') : rawCaption;

      // Upload foto cover artikel
      const filename = `berita_${Date.now()}.jpg`;
      const uploadRes = await uploadFile({
        buffer: fileBuffer,
        filename,
        mimeType: 'image/jpeg',
        tenantSlug: tenant.slug,
        folder: 'artikel',
      });

      // Cari atau buat kategori "Warta Desa"
      let category = await prisma.category.findFirst({
        where: { tenantId: tenant.id, slug: 'warta-desa' },
      });
      if (!category) {
        category = await prisma.category.create({
          data: {
            tenantId: tenant.id,
            name: 'Warta Desa',
            slug: 'warta-desa',
          },
        });
      }

      // Generate slug artikel
      let baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      if (!baseSlug) baseSlug = `berita-${Date.now()}`;

      let articleSlug = baseSlug;
      let counter = 1;
      while (
        await prisma.article.findFirst({
          where: { tenantId: tenant.id, slug: articleSlug },
        })
      ) {
        articleSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Format konten dengan paragraf HTML
      const htmlContent = articleContent
        .split('\n\n')
        .map((p: string) => `<p>${p}</p>`)
        .join('');

      const article = await prisma.article.create({
        data: {
          tenantId: tenant.id,
          categoryId: category.id,
          title,
          slug: articleSlug,
          summary: articleContent.slice(0, 160) + '...',
          content: htmlContent,
          coverImageUrl: uploadRes.url,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      const articlePublicUrl = `https://${primaryDomain}/berita/${article.slug}?tenant=${tenant.slug}`;

      await sendTelegramMessage(
        chatId,
        `📰 <b>Artikel Berita Berhasil Diterbitkan!</b>\n\n` +
        `<b>Judul:</b> ${article.title}\n` +
        `<b>Desa:</b> ${tenant.namaDesa}\n` +
        `<b>Kategori:</b> ${category.name}\n` +
        `<b>Cover:</b> WebP di R2 Cloud Storage\n` +
        `<b>Status:</b> 🟢 Live di Website Resmi\n\n` +
        `🔗 <b>Baca Berita Sekarang:</b>\n` +
        `<a href="${articlePublicUrl}">${articlePublicUrl}</a>`
      );
      return NextResponse.json({ ok: true });
    }

    // Balasan default jika ada teks lain yang tidak dikenali
    if (text) {
      await sendTelegramMessage(
        chatId,
        `💡 <b>Perintah Tidak Dikenali</b>\n\n` +
        `• Untuk memposting berita: <b>Kirim Foto + Caption teks berita</b>\n` +
        `• Untuk menambah galeri: <b>Kirim Foto + Caption /galeri [Judul]</b>\n` +
        `• Untuk pengumuman: <code>/pengumuman [Isi Pengumuman]</code>\n` +
        `• Cek status desa: <code>/status</code>`
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

