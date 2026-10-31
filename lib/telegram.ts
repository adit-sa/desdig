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
    },
  });
}

/**
 * Menautkan (Pairing) akun Telegram ke suatu desa dengan verifikasi token rahasia
 * Mendukung pencarian cerdas berdasarkan slug, nama desa dengan spasi, maupun awalan "Desa"
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
}): Promise<{ success: boolean; message: string; tenant?: any }> {
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

  // Verifikasi token pairing desa
  // Kunci bisa berasal dari:
  // 1. tenant.telegramToken jika sudah dibuat oleh admin desa di menu Identitas Desa
  // 2. Kunci rahasia master TELEGRAM_MASTER_KEY di .env
  // 3. Fallback default: 6 karakter terakhir id desa jika token khusus belum dibuat
  const masterKey = process.env.TELEGRAM_MASTER_KEY?.trim() || '';
  const validToken = tenant.telegramToken || tenant.id.slice(-6);

  const isTokenValid =
    (masterKey && cleanToken === masterKey) ||
    (cleanToken.toLowerCase() === validToken.toLowerCase());

  if (!isTokenValid) {
    return {
      success: false,
      message: `Kunci rahasia pairing salah untuk Desa <b>${tenant.namaDesa}</b>. Silakan periksa atau atur token pairing di menu <b>Identitas Desa</b> pada dashboard admin.`,
    };
  }

  // Upsert subscriber Telegram
  const tid = telegramId.toString();
  await prisma.telegramSubscriber.upsert({
    where: { telegramId: tid },
    update: {
      tenantId: tenant.id,
      username: username || null,
      firstName: firstName || null,
    },
    create: {
      telegramId: tid,
      tenantId: tenant.id,
      username: username || null,
      firstName: firstName || null,
    },
  });

  return {
    success: true,
    message: `Berhasil terhubung ke Desa <b>${tenant.namaDesa}</b>!`,
    tenant,
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

  // Coba hingga 3 kali untuk mengantisipasi race-condition P2002 jika 2 request pertama tiba di milidetik yang sama
  for (let attempt = 0; attempt < 3; attempt++) {
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
        await prisma.telegramMediaGroup.update({
          where: { mediaGroupId },
          data: {
            fileIds: currentFiles,
            ...(cleanCaption && { caption: cleanCaption }),
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
 * Mengklaim grup media Telegram secara atomik.
 * Menjamin hanya TEPAT 1 proses (worker) yang memproses album sehingga tidak terjadi duplikasi artikel / galeri.
 */
export async function claimTelegramMediaGroup(mediaGroupId: string): Promise<boolean> {
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


