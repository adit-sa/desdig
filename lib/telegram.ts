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
  const cleanSlug = tenantSlug.trim().toLowerCase();
  const cleanToken = token.trim();

  // Cari tenant berdasarkan slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug: cleanSlug },
  });

  if (!tenant) {
    return {
      success: false,
      message: `Desa dengan slug "<b>${cleanSlug}</b>" tidak ditemukan. Periksa kembali nama slug desa Anda.`,
    };
  }

  // Verifikasi token pairing desa
  // Kunci bisa berasal dari:
  // 1. tenant.telegramToken jika sudah disetel
  // 2. Kunci rahasia master TELEGRAM_MASTER_KEY di .env
  // 3. Fallback: 6 karakter awal id desa jika token belum pernah dibuat
  const masterKey = process.env.TELEGRAM_MASTER_KEY?.trim() || '';
  const validToken = tenant.telegramToken || tenant.id.slice(-6);

  const isTokenValid =
    (masterKey && cleanToken === masterKey) ||
    (cleanToken.toLowerCase() === validToken.toLowerCase());

  if (!isTokenValid) {
    return {
      success: false,
      message: `Kunci rahasia pairing salah untuk Desa <b>${tenant.namaDesa}</b>. Hubungi Administrator desa untuk mendapatkan kode pairing resmi.`,
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

