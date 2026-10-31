/**
 * desDig Telegram Bot Engine
 * Layanan integrasi Telegram Bot resmi untuk publikasi instan (Artikel Berita, Galeri Foto, & Pengumuman Desa).
 * 
 * Sesuai Hukum Utama Multi-Tenancy:
 * Setiap pesan Telegram dipetakan secara terisolasi ke tenant (desa) yang telah terotentikasi.
 */

import { prisma } from './prisma';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_FILE_BASE = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}`;

export function isTelegramConfigured(): boolean {
  return Boolean(TELEGRAM_BOT_TOKEN);
}

/**
 * Kirim pesan teks ke chat/user Telegram
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  options: {
    parse_mode?: 'Markdown' | 'HTML';
    reply_to_message_id?: number;
    reply_markup?: any;
  } = { parse_mode: 'HTML' }
) {
  if (!isTelegramConfigured()) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options,
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending Telegram message:', err);
    return null;
  }
}

/**
 * Mengambil informasi berkas foto/dokumen dari Telegram
 */
export async function getTelegramFileInfo(fileId: string): Promise<{ file_path: string } | null> {
  if (!isTelegramConfigured()) return null;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (data.ok && data.result?.file_path) {
      return data.result;
    }
    return null;
  } catch (err) {
    console.error('Error getting Telegram file info:', err);
    return null;
  }
}

/**
 * Mengunduh buffer berkas langsung dari server Telegram
 */
export async function downloadTelegramFileBuffer(filePath: string): Promise<Buffer | null> {
  if (!isTelegramConfigured()) return null;

  try {
    const downloadUrl = `${TELEGRAM_FILE_BASE}/${filePath}`;
    const res = await fetch(downloadUrl);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('Error downloading Telegram file:', err);
    return null;
  }
}

/**
 * Mengatur URL Webhook Telegram Bot
 */
export async function setTelegramWebhookUrl(webhookUrl: string) {
  if (!isTelegramConfigured()) return { ok: false, description: 'TELEGRAM_BOT_TOKEN belum disetel di .env' };

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    return await res.json();
  } catch (err: any) {
    return { ok: false, description: err.message };
  }
}

/**
 * Mengambil info Webhook saat ini
 */
export async function getTelegramWebhookInfo() {
  if (!isTelegramConfigured()) return null;
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/getWebhookInfo`);
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Mengambil informasi bot saat ini (username, nama)
 */
export async function getTelegramBotMe(): Promise<{ id: number; is_bot: boolean; first_name: string; username?: string } | null> {
  if (!isTelegramConfigured()) return null;
  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return data.result;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Mencari data desa yang tertaut dengan akun Telegram ini
 */
export async function getLinkedTenantForTelegramUser(telegramId: string | number) {
  const tid = telegramId.toString();
  return prisma.telegramSubscriber.findUnique({
    where: { telegramId: tid },
    include: {
      tenant: {
        include: {
          domains: true,
        },
      },
      villageOfficial: true,
    },
  });
}

/**
 * Menautkan (Pairing) akun Telegram ke suatu desa dengan verifikasi token rahasia
 * Mendukung verifikasi token khusus Pamong/Perangkat Desa maupun token umum desa
 */
export async function pairTelegramUserWithTenant({
  telegramId,
  username,
  firstName,
  tenantSlug,
  token,
}: {
  telegramId: string | number;
  username?: string;
  firstName?: string;
  tenantSlug: string;
  token: string;
}): Promise<{ success: boolean; message: string; tenant?: any; official?: any }> {
  const rawIdentifier = tenantSlug.trim();
  const cleanLower = rawIdentifier.toLowerCase();
  const slugified = cleanLower.replace(/\s+/g, '-');
  const withoutDesaPrefix = cleanLower.replace(/^desa\s+|^desa-/i, '').trim();
  const withoutDesaSlugified = withoutDesaPrefix.replace(/\s+/g, '-');
  const cleanToken = token.trim();

  // Cari tenant secara cerdas dan fleksibel:
  // 1. Slug exact
  // 2. Slug yang dinormalisasi dengan tanda minus (contoh: "sinjai tengah" -> "sinjai-tengah")
  // 3. Slug tanpa awalan desa (contoh: "desa sinjai tengah" -> "sinjai-tengah")
  // 4. Nama desa exact (case-insensitive)
  // 5. Nama desa tanpa kata "Desa"
  // 6. Nama desa dengan awalan "Desa "
  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug: cleanLower },
        { slug: slugified },
        { slug: withoutDesaSlugified },
        { namaDesa: { equals: rawIdentifier, mode: 'insensitive' } },
        { namaDesa: { equals: withoutDesaPrefix, mode: 'insensitive' } },
        { namaDesa: { equals: `Desa ${withoutDesaPrefix}`, mode: 'insensitive' } },
      ],
    },
  });

  if (!tenant) {
    return {
      success: false,
      message: `Desa "<b>${rawIdentifier}</b>" tidak ditemukan. Periksa kembali nama desa atau slug Anda.`,
    };
  }

  // 1. Cek apakah token cocok dengan token khusus salah satu Pamong/Perangkat Desa
  const matchedOfficial = await prisma.villageOfficial.findFirst({
    where: {
      tenantId: tenant.id,
      isActive: true,
      telegramToken: { equals: cleanToken, mode: 'insensitive' },
    },
  });

  let officialId: string | null = null;
  let officialName: string | null = null;
  let officialPosition: string | null = null;

  if (matchedOfficial) {
    officialId = matchedOfficial.id;
    officialName = matchedOfficial.name;
    officialPosition = matchedOfficial.position;
  } else {
    // 2. Jika bukan token pamong, cek token umum desa / master key
    const masterKey = process.env.TELEGRAM_MASTER_KEY?.trim() || '';
    const validGeneralToken = tenant.telegramToken || tenant.id.slice(-6);

    const isGeneralTokenValid =
      (masterKey && cleanToken === masterKey) ||
      (cleanToken.toLowerCase() === validGeneralToken.toLowerCase());

    if (!isGeneralTokenValid) {
      return {
        success: false,
        message: `Kunci rahasia pairing salah untuk Desa <b>${tenant.namaDesa}</b>. Silakan periksa atau atur token pairing di menu <b>Bot Telegram</b> pada dashboard admin.`,
      };
    }

    officialName = 'Operator Desa';
    officialPosition = 'Staf Publikasi';
  }

  // Upsert subscriber Telegram dengan identitas pamong penanggung jawab
  const tid = telegramId.toString();
  await prisma.telegramSubscriber.upsert({
    where: { telegramId: tid },
    update: {
      tenantId: tenant.id,
      username: username || null,
      firstName: firstName || null,
      villageOfficialId: officialId,
      officialName,
      officialPosition,
    },
    create: {
      telegramId: tid,
      tenantId: tenant.id,
      username: username || null,
      firstName: firstName || null,
      villageOfficialId: officialId,
      officialName,
      officialPosition,
    },
  });

  const identityGreeting = officialId
    ? `Bapak/Ibu <b>${officialName}</b> (${officialPosition})`
    : `Operator Desa ${tenant.namaDesa}`;

  return {
    success: true,
    message: `Berhasil terhubung ke Desa <b>${tenant.namaDesa}</b> sebagai ${identityGreeting}!`,
    tenant,
    official: matchedOfficial || null,
  };
}

/**
 * Melepas tautan akun Telegram
 */
export async function unlinkTelegramUser(telegramId: string | number) {
  const tid = telegramId.toString();
  try {
    await prisma.telegramSubscriber.delete({
      where: { telegramId: tid },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Menambahkan foto ke Staging Buffer Telegram Media Group (Album Foto).
 * Menangani pengiriman banyak foto sekaligus (multi-photo album) dengan aman dari race-condition.
 */
export async function appendPhotoToMediaGroup({
  mediaGroupId,
  tenantId,
  telegramId,
  chatId,
  caption,
  fileId,
}: {
  mediaGroupId: string;
  tenantId: string;
  telegramId: string;
  chatId: string;
  caption?: string;
  fileId: string;
}) {
  const cleanCaption = caption?.trim();

  // Coba hingga 5 kali untuk mengantisipasi race-condition P2002 jika request tiba di milidetik yang sama
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const existing = await prisma.telegramMediaGroup.findUnique({
        where: { mediaGroupId },
      });

      if (!existing) {
        await prisma.telegramMediaGroup.create({
          data: {
            mediaGroupId,
            tenantId,
            telegramId,
            chatId,
            caption: cleanCaption || null,
            fileIds: [fileId],
            processedFiles: [],
            processed: false,
          },
        });
        return;
      } else {
        const currentFiles = Array.isArray(existing.fileIds)
          ? (existing.fileIds as string[])
          : [];
        if (!currentFiles.includes(fileId)) {
          currentFiles.push(fileId);
        }

        const processedFiles = Array.isArray(existing.processedFiles)
          ? (existing.processedFiles as string[])
          : [];
        // Jika ada fileId baru yang belum ada di processedFiles, reset processed = false agar diklaim oleh worker
        const hasUnprocessed = currentFiles.some((f) => !processedFiles.includes(f));

        await prisma.telegramMediaGroup.update({
          where: { mediaGroupId },
          data: {
            fileIds: currentFiles,
            ...(cleanCaption && { caption: cleanCaption }),
            ...(hasUnprocessed && { processed: false }),
          },
        });
        return;
      }
    } catch (err: any) {
      if (err.code === 'P2002') {
        // Record baru dibuat oleh worker paralel, jeda 100ms lalu ulangi untuk update
        await new Promise((r) => setTimeout(r, 100));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Mengklaim grup media Telegram secara atomik dan cerdas.
 * Mengembalikan daftar fileId yang BELUM diproses sehingga foto susulan tetap diproses tanpa ada yang hilang.
 */
export async function claimTelegramMediaGroup(mediaGroupId: string): Promise<boolean> {
  const group = await prisma.telegramMediaGroup.findUnique({
    where: { mediaGroupId },
  });

  if (!group) return false;

  const allFiles = Array.isArray(group.fileIds) ? (group.fileIds as string[]) : [];
  const processedFiles = Array.isArray(group.processedFiles) ? (group.processedFiles as string[]) : [];
  const unprocessed = allFiles.filter((f) => !processedFiles.includes(f));

  if (unprocessed.length === 0) return false;

  const res = await prisma.telegramMediaGroup.updateMany({
    where: {
      mediaGroupId,
      processed: false,
    },
    data: {
      processed: true,
    },
  });

  return res.count > 0;
}

/**
 * Mengambil data grup media Telegram yang sudah terkumpul
 */
export async function getTelegramMediaGroup(mediaGroupId: string) {
  return prisma.telegramMediaGroup.findUnique({
    where: { mediaGroupId },
  });
}

/**
 * Mencatat daftar berkas foto yang telah berhasil diproses / diunggah ke storage
 */
export async function recordProcessedMediaGroupFiles({
  mediaGroupId,
  newProcessedFiles,
  articleId,
  galleryId,
  targetType,
}: {
  mediaGroupId: string;
  newProcessedFiles: string[];
  articleId?: string;
  galleryId?: string;
  targetType?: 'ARTICLE' | 'GALLERY';
}) {
  const group = await prisma.telegramMediaGroup.findUnique({
    where: { mediaGroupId },
  });
  if (!group) return null;

  const currentProcessed = Array.isArray(group.processedFiles)
    ? (group.processedFiles as string[])
    : [];
  const allProcessed = Array.from(new Set([...currentProcessed, ...newProcessedFiles]));
  const allFiles = Array.isArray(group.fileIds) ? (group.fileIds as string[]) : [];
  const allDone = allFiles.every((f) => allProcessed.includes(f));

  return prisma.telegramMediaGroup.update({
    where: { mediaGroupId },
    data: {
      processedFiles: allProcessed,
      ...(articleId && { articleId }),
      ...(galleryId && { galleryId }),
      ...(targetType && { targetType }),
      processed: allDone,
    },
  });
}


