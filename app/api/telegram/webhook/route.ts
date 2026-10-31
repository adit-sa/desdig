import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
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
  appendPhotoToMediaGroup,
  claimTelegramMediaGroup,
  getTelegramMediaGroup,
  recordProcessedMediaGroupFiles,
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
    const authorName = linked.officialName
      ? (linked.officialPosition ? `${linked.officialName} (${linked.officialPosition})` : linked.officialName)
      : (from.first_name || 'Operator Desa');
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
        `• <b>Petugas Login:</b> ${authorName}\n` +
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
          authorName,
        },
      });

      await sendTelegramMessage(
        chatId,
        `📢 <b>Pengumuman Resmi Berhasil Diterbitkan!</b>\n\n` +
        `<b>Judul:</b> ${title}\n` +
        `<b>Desa:</b> ${tenant.namaDesa}\n` +
        `<b>Diumumkan Oleh:</b> ${authorName}\n\n` +
        `Pengumuman sudah langsung tayang di papan pengumuman portal warga: https://${primaryDomain}`
      );
      return NextResponse.json({ ok: true });
    }

    // 6. Proteksi Berkas Non-Foto: Batasi hanya menerima foto agar hemat ruang penyimpanan R2
    if (message.document || message.video || message.audio || message.voice || message.video_note) {
      await sendTelegramMessage(
        chatId,
        `⚠️ <b>Format Berkas Belum Didukung</b>\n\n` +
        `Untuk menghemat kuota dan kapasitas penyimpanan server desa, bot saat ini hanya menerima berkas <b>Foto / Gambar</b> (JPG, PNG, WebP).\n\n` +
        `Silakan kirimkan dokumentasi kegiatan dalam bentuk foto biasa.`
      );
      return NextResponse.json({ ok: true });
    }

    // 7. Pengunggahan Foto (Artikel Berita atau Galeri - Mendukung Multi-Foto / Album & Kompresi WebP)
    if (photos && photos.length > 0) {
      const highestResPhoto = photos[photos.length - 1];
      const fileId = highestResPhoto.file_id;
      const mediaGroupId = message.media_group_id ? String(message.media_group_id) : null;

      let fileIdsToProcess: string[] = [];
      let finalCaption = caption.trim();
      let isSubsequentAlbumPhoto = false;
      let existingArticleForGroup: any = null;

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

        // Jeda waktu 2200ms agar seluruh foto dalam album dari request paralel lain sempat ter-buffer di DB
        await new Promise((resolve) => setTimeout(resolve, 2200));

        // Klaim grup secara atomik
        const claimed = await claimTelegramMediaGroup(mediaGroupId);
        if (!claimed) {
          // Worker lain yang menang claim atau semua file sudah diproses
          return NextResponse.json({ ok: true });
        }

        // Ambil data final grup yang sudah lengkap
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

        if (groupData.articleId) {
          existingArticleForGroup = await prisma.article.findUnique({
            where: { id: groupData.articleId },
          });
          if (existingArticleForGroup) {
            isSubsequentAlbumPhoto = true;
          }
        }
      } else {
        // Foto tunggal (single photo tanpa media_group_id)
        fileIdsToProcess = [fileId];
      }

      // Validasi & Penanganan Cerdas Foto Tanpa Keterangan (Single Photo)
      if (!finalCaption && !mediaGroupId) {
        // Cek A: Apakah pamong/operator baru saja menerbitkan artikel berita dalam 5 menit terakhir?
        const recentArticle = await prisma.article.findFirst({
          where: {
            tenantId: tenant.id,
            createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (recentArticle) {
          // Lampirkan otomatis foto ini ke galeri artikel
          await sendTelegramMessage(
            chatId,
            `⏳ <i>Sedang mengompresi WebP & menambahkan foto ke dokumentasi artikel "${recentArticle.title}"...</i>`
          );

          const fileInfo = await getTelegramFileInfo(fileId);
          if (fileInfo?.file_path) {
            const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
            if (fileBuffer) {
              let optimizedBuffer = fileBuffer;
              try {
                const pipeline = sharp(fileBuffer).rotate();
                const meta = await pipeline.metadata();
                if ((meta.width && meta.width > 1920) || (meta.height && meta.height > 1920)) {
                  pipeline.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
                }
                optimizedBuffer = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
              } catch (e) {
                console.warn('Gagal kompresi foto lampiran:', e);
              }

              const filename = `berita_${Date.now()}_lampiran.webp`;
              const uploadRes = await uploadFile({
                buffer: optimizedBuffer,
                filename,
                mimeType: 'image/webp',
                tenantSlug: tenant.slug,
                folder: 'artikel',
              });

              const currentGallery = Array.isArray(recentArticle.galleryUrls)
                ? (recentArticle.galleryUrls as any[])
                : [];
              const updatedGallery = [
                ...currentGallery,
                { url: uploadRes.url, caption: `Dokumentasi ${currentGallery.length + 1}` },
              ];

              await prisma.article.update({
                where: { id: recentArticle.id },
                data: { galleryUrls: updatedGallery },
              });

              const articlePublicUrl = `https://${primaryDomain}/berita/${recentArticle.slug}?tenant=${tenant.slug}`;
              await sendTelegramMessage(
                chatId,
                `📸 <b>Foto Dokumentasi Berhasil Ditambahkan!</b>\n\n` +
                `Foto otomatis disematkan ke album berita:\n` +
                `<b>${recentArticle.title}</b>\n\n` +
                `• <b>Total Foto:</b> ${updatedGallery.length} Foto di Album\n` +
                `• <b>Penanggung Jawab:</b> ${authorName}\n\n` +
                `🔗 <a href="${articlePublicUrl}">Buka Artikel di Website</a>\n\n` +
                `💡 <i>Kirim foto baru dengan caption jika ingin membuat artikel berita baru terpisah.</i>`
              );
              return NextResponse.json({ ok: true });
            }
          }
        }

        // Cek B: Apakah ada galeri yang baru saja dibuat dalam 5 menit terakhir?
        const recentGallery = await prisma.galleryItem.findFirst({
          where: {
            tenantId: tenant.id,
            createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (recentGallery) {
          await sendTelegramMessage(
            chatId,
            `⏳ <i>Sedang menambahkan foto ke Galeri "${recentGallery.title}"...</i>`
          );

          const fileInfo = await getTelegramFileInfo(fileId);
          if (fileInfo?.file_path) {
            const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
            if (fileBuffer) {
              let optimizedBuffer = fileBuffer;
              try {
                const pipeline = sharp(fileBuffer).rotate();
                const meta = await pipeline.metadata();
                if ((meta.width && meta.width > 1920) || (meta.height && meta.height > 1920)) {
                  pipeline.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
                }
                optimizedBuffer = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
              } catch (e) {
                console.warn('Gagal kompresi foto galeri susulan:', e);
              }

              const filename = `galeri_${Date.now()}_lampiran.webp`;
              const uploadRes = await uploadFile({
                buffer: optimizedBuffer,
                filename,
                mimeType: 'image/webp',
                tenantSlug: tenant.slug,
                folder: 'galeri',
              });

              await prisma.galleryItem.create({
                data: {
                  tenantId: tenant.id,
                  title: recentGallery.title,
                  imageUrl: uploadRes.url,
                  category: recentGallery.category || 'Kegiatan',
                  caption: recentGallery.caption,
                  authorName,
                  takenAt: new Date(),
                },
              });

              await sendTelegramMessage(
                chatId,
                `🖼️ <b>Foto Tambahan Berhasil Masuk ke Galeri!</b>\n\n` +
                `<b>Judul:</b> ${recentGallery.title}\n` +
                `<b>Desa:</b> ${tenant.namaDesa}\n\n` +
                `🔗 https://${primaryDomain}/galeri`
              );
              return NextResponse.json({ ok: true });
            }
          }
        }

        // Cek C: Jika tidak ada postingan aktif sebelumnya, baru beri panduan ramah
        await sendTelegramMessage(
          chatId,
          `ℹ️ <b>Foto Diterima Tanpa Keterangan</b>\n\n` +
          `Untuk mempublikasikan ke website desa, silakan kirim foto dengan keterangan (caption):\n` +
          `• <b>Artikel Berita:</b> Tuliskan judul dan isi berita pada keterangan foto.\n` +
          `• <b>Galeri Desa:</b> Awali keterangan dengan <code>/galeri [Judul Foto]</code>.\n\n` +
          `💡 <i>Tips Praktis: Anda dapat memilih 2 hingga 10 foto sekaligus dari galeri HP untuk dikirim bersamaan!</i>`
        );
        return NextResponse.json({ ok: true });
      }

      // Penanganan Foto Susulan pada Media Group yang Artikelnya Sudah Terbit
      if (isSubsequentAlbumPhoto && existingArticleForGroup) {
        const newUploadedPhotos: { url: string; storage: string }[] = [];
        for (let i = 0; i < fileIdsToProcess.length; i++) {
          const fId = fileIdsToProcess[i];
          const fileInfo = await getTelegramFileInfo(fId);
          if (!fileInfo || !fileInfo.file_path) continue;

          const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
          if (!fileBuffer) continue;

          let optimizedBuffer = fileBuffer;
          try {
            const pipeline = sharp(fileBuffer).rotate();
            const meta = await pipeline.metadata();
            if ((meta.width && meta.width > 1920) || (meta.height && meta.height > 1920)) {
              pipeline.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
            }
            optimizedBuffer = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
          } catch (e) {
            console.warn(e);
          }

          const filename = `berita_${Date.now()}_${i + 1}.webp`;
          const uploadRes = await uploadFile({
            buffer: optimizedBuffer,
            filename,
            mimeType: 'image/webp',
            tenantSlug: tenant.slug,
            folder: 'artikel',
          });
          newUploadedPhotos.push(uploadRes);
        }

        if (newUploadedPhotos.length > 0) {
          const currentGallery = Array.isArray(existingArticleForGroup.galleryUrls)
            ? (existingArticleForGroup.galleryUrls as any[])
            : [];
          const updatedGallery = [
            ...currentGallery,
            ...newUploadedPhotos.map((p, idx) => ({
              url: p.url,
              caption: `Dokumentasi ${currentGallery.length + idx + 1}`,
            })),
          ];

          await prisma.article.update({
            where: { id: existingArticleForGroup.id },
            data: { galleryUrls: updatedGallery },
          });

          if (mediaGroupId) {
            await recordProcessedMediaGroupFiles({
              mediaGroupId,
              newProcessedFiles: fileIdsToProcess,
              articleId: existingArticleForGroup.id,
              targetType: 'ARTICLE',
            });
          }

          const articlePublicUrl = `https://${primaryDomain}/berita/${existingArticleForGroup.slug}?tenant=${tenant.slug}`;
          await sendTelegramMessage(
            chatId,
            `📸 <b>${newUploadedPhotos.length} Foto Tambahan Disematkan ke Album!</b>\n\n` +
            `<b>Artikel:</b> ${existingArticleForGroup.title}\n` +
            `<b>Total Album:</b> ${updatedGallery.length} Foto\n\n` +
            `🔗 <a href="${articlePublicUrl}">Buka Berita di Website</a>`
          );
        }
        return NextResponse.json({ ok: true });
      }

      // Tentukan tujuan: Galeri atau Berita
      const isGallery =
        finalCaption.startsWith('/galeri') ||
        finalCaption.startsWith('/album') ||
        (!finalCaption && fileIdsToProcess.length > 1); // Banyak foto tanpa caption otomatis diarahkan ke Galeri

      // A. ALUR GALERI FOTO (Bisa 1 atau banyak foto sekaligus dengan kompresi WebP)
      if (isGallery) {
        const baseTitle = finalCaption.replace(/^\/(?:galeri|album)\s*/i, '').trim() || 'Dokumentasi Kegiatan Desa';

        await sendTelegramMessage(
          chatId,
          `⏳ <i>Sedang mengompresi WebP & memproses ${fileIdsToProcess.length} foto ke Galeri Desa ${tenant.namaDesa}...</i>`
        );

        const savedItems = [];
        for (let i = 0; i < fileIdsToProcess.length; i++) {
          const fId = fileIdsToProcess[i];
          const fileInfo = await getTelegramFileInfo(fId);
          if (!fileInfo || !fileInfo.file_path) continue;

          const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
          if (!fileBuffer) continue;

          // Kompresi Sharp otomatis ke WebP ringan
          let optimizedBuffer = fileBuffer;
          try {
            const pipeline = sharp(fileBuffer).rotate();
            const meta = await pipeline.metadata();
            if ((meta.width && meta.width > 1920) || (meta.height && meta.height > 1920)) {
              pipeline.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
            }
            optimizedBuffer = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
          } catch (compErr) {
            console.warn('Gagal kompresi Sharp WebP galeri:', compErr);
          }

          const filename = `galeri_${Date.now()}_${i + 1}.webp`;
          const uploadRes = await uploadFile({
            buffer: optimizedBuffer,
            filename,
            mimeType: 'image/webp',
            tenantSlug: tenant.slug,
            folder: 'galeri',
          });

          const itemTitle = fileIdsToProcess.length > 1 ? `${baseTitle} (Foto ${i + 1})` : baseTitle;
          const galleryItem = await prisma.galleryItem.create({
            data: {
              tenantId: tenant.id,
              title: itemTitle,
              imageUrl: uploadRes.url,
              category: 'Kegiatan',
              caption: baseTitle,
              authorName,
              takenAt: new Date(),
            },
          });
          savedItems.push(galleryItem);
        }

        if (savedItems.length === 0) {
          await sendTelegramMessage(chatId, `❌ Gagal mengunggah foto ke Galeri. Silakan coba kembali.`);
          return NextResponse.json({ ok: true });
        }

        if (mediaGroupId) {
          await recordProcessedMediaGroupFiles({
            mediaGroupId,
            newProcessedFiles: fileIdsToProcess,
            targetType: 'GALLERY',
          });
        }

        await sendTelegramMessage(
          chatId,
          `🖼️ <b>${savedItems.length} Foto Berhasil Disimpan ke Galeri!</b>\n\n` +
          `<b>Judul:</b> ${baseTitle}\n` +
          `<b>Desa:</b> ${tenant.namaDesa}\n` +
          `<b>Diunggah Oleh:</b> ${authorName}\n` +
          `<b>Total Foto:</b> ${savedItems.length} Foto (Terkompresi WebP Ringan)\n` +
          `<b>Penyimpanan:</b> Cloud Storage R2\n\n` +
          `🔗 <b>Lihat di Galeri Desa:</b>\n` +
          `https://${primaryDomain}/galeri`
        );
        return NextResponse.json({ ok: true });
      }

      // B. ALUR ARTIKEL BERITA (Bisa 1 atau banyak foto sekaligus dengan kompresi WebP)
      const lines = finalCaption.split('\n').map((l: string) => l.trim()).filter(Boolean);
      const title = lines[0]?.slice(0, 150) || 'Warta Kegiatan Desa';
      const articleContent = lines.length > 1 ? lines.slice(1).join('\n\n') : finalCaption;

      await sendTelegramMessage(
        chatId,
        `⏳ <i>Sedang mengompresi WebP & menerbitkan berita dengan ${fileIdsToProcess.length} foto...</i>`
      );

      const uploadedPhotos: { url: string; storage: string }[] = [];
      for (let i = 0; i < fileIdsToProcess.length; i++) {
        const fId = fileIdsToProcess[i];
        const fileInfo = await getTelegramFileInfo(fId);
        if (!fileInfo || !fileInfo.file_path) continue;

        const fileBuffer = await downloadTelegramFileBuffer(fileInfo.file_path);
        if (!fileBuffer) continue;

        // Kompresi Sharp otomatis ke WebP ringan
        let optimizedBuffer = fileBuffer;
        try {
          const pipeline = sharp(fileBuffer).rotate();
          const meta = await pipeline.metadata();
          if ((meta.width && meta.width > 1920) || (meta.height && meta.height > 1920)) {
            pipeline.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true });
          }
          optimizedBuffer = await pipeline.webp({ quality: 80, effort: 4 }).toBuffer();
        } catch (compErr) {
          console.warn('Gagal kompresi Sharp WebP artikel:', compErr);
        }

        const filename = `berita_${Date.now()}_${i + 1}.webp`;
        const uploadRes = await uploadFile({
          buffer: optimizedBuffer,
          filename,
          mimeType: 'image/webp',
          tenantSlug: tenant.slug,
          folder: 'artikel',
        });
        uploadedPhotos.push(uploadRes);
      }

      if (uploadedPhotos.length === 0) {
        await sendTelegramMessage(chatId, `❌ Gagal mengunggah foto artikel. Silakan coba kembali.`);
        return NextResponse.json({ ok: true });
      }

      // Foto pertama adalah cover artikel
      const coverImageUrl = uploadedPhotos[0].url;

      // Seluruh foto masuk ke galleryUrls artikel
      const galleryUrls = uploadedPhotos.map((p, idx) => ({
        url: p.url,
        caption: idx === 0 ? 'Foto Utama' : `Dokumentasi ${idx + 1}`,
      }));

      // Format konten dengan paragraf HTML
      const htmlContent = articleContent
        .split('\n\n')
        .map((p: string) => `<p>${p}</p>`)
        .join('');

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

      if (mediaGroupId) {
        await recordProcessedMediaGroupFiles({
          mediaGroupId,
          newProcessedFiles: fileIdsToProcess,
          articleId: article.id,
          targetType: 'ARTICLE',
        });
      }

      const articlePublicUrl = `https://${primaryDomain}/berita/${article.slug}?tenant=${tenant.slug}`;

      await sendTelegramMessage(
        chatId,
        `📰 <b>Artikel Berita Berhasil Diterbitkan!</b>\n\n` +
        `<b>Judul:</b> ${article.title}\n` +
        `<b>Desa:</b> ${tenant.namaDesa}\n` +
        `<b>Penulis / Penanggung Jawab:</b> ${authorName}\n` +
        `<b>Kategori:</b> ${category.name}\n` +
        `<b>Foto:</b> ${uploadedPhotos.length} Foto (WebP Terkompresi)\n` +
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

