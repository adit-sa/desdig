import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { requireTenantManagerApi } from '@/lib/auth/rbac';
import { isTelegramConfigured, getTelegramBotMe, sendTelegramMessage } from '@/lib/telegram';

function generateRandomToken(prefix: string = 'TG'): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const bytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `${prefix}-${result}`;
}

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const botConfigured = isTelegramConfigured();
    const botMe = botConfigured ? await getTelegramBotMe() : null;

    // Ambil semua aparatur desa dengan relasi subscriber telegram
    const officials = await prisma.villageOfficial.findMany({
      where: { tenantId: tenant.id },
      include: {
        telegramUsers: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            pairedAt: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { orderIndex: 'asc' }],
    });

    // Ambil subscriber umum yang tidak tertaut ke pamong spesifik (operator umum)
    const unassignedSubscribers = await prisma.telegramSubscriber.findMany({
      where: {
        tenantId: tenant.id,
        villageOfficialId: null,
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        pairedAt: true,
      },
      orderBy: { pairedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        namaDesa: tenant.namaDesa,
        generalToken: tenant.telegramToken || tenant.id.slice(-6),
        hasCustomToken: Boolean(tenant.telegramToken),
        telegramAttachWindowMinutes: tenant.telegramAttachWindowMinutes ?? 5,
      },
      bot: {
        configured: botConfigured,
        username: botMe?.username || null,
        name: botMe?.first_name || 'desDig Bot',
      },
      officials: officials.map((off) => ({
        id: off.id,
        name: off.name,
        position: off.position,
        nip: off.nip,
        photoUrl: off.photoUrl,
        isActive: off.isActive,
        telegramToken: off.telegramToken,
        subscribers: off.telegramUsers,
      })),
      unassignedSubscribers,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_') || error?.message?.includes('bail out of prerendering')) {
      throw error;
    }
    console.error('Error in GET /api/telegram/officials:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) return auth.response!;

    const { action, officialId, token, subscriberId } = body;

    // 1. Acak / Generate Token Baru
    if (action === 'generate_token') {
      if (officialId) {
        // Cek pamong milik tenant ini
        const official = await prisma.villageOfficial.findFirst({
          where: { id: officialId, tenantId: tenant.id },
        });

        if (!official) {
          return NextResponse.json({ error: 'Aparatur desa tidak ditemukan' }, { status: 404 });
        }

        const newToken = generateRandomToken('PMG');
        const updated = await prisma.villageOfficial.update({
          where: { id: official.id },
          data: { telegramToken: newToken },
        });

        return NextResponse.json({
          success: true,
          message: `Kode token Telegram untuk ${official.name} berhasil dibuat.`,
          token: updated.telegramToken,
        });
      } else {
        // Generate Token Umum Desa
        const newToken = generateRandomToken('DESA');
        const updated = await prisma.tenant.update({
          where: { id: tenant.id },
          data: { telegramToken: newToken },
        });

        return NextResponse.json({
          success: true,
          message: `Kode token umum Desa ${tenant.namaDesa} berhasil diperbarui.`,
          token: updated.telegramToken,
        });
      }
    }

    // 2. Set Custom Token
    if (action === 'set_token') {
      const cleanToken = (token || '').trim();
      if (!cleanToken || cleanToken.length < 6) {
        return NextResponse.json(
          { error: 'Token rahasia minimal 6 karakter alfanumerik untuk keamanan optimal' },
          { status: 400 }
        );
      }

      if (officialId) {
        const official = await prisma.villageOfficial.findFirst({
          where: { id: officialId, tenantId: tenant.id },
        });

        if (!official) {
          return NextResponse.json({ error: 'Aparatur desa tidak ditemukan' }, { status: 404 });
        }

        const updated = await prisma.villageOfficial.update({
          where: { id: official.id },
          data: { telegramToken: cleanToken },
        });

        return NextResponse.json({
          success: true,
          message: `Kode token Telegram untuk ${official.name} berhasil disimpan.`,
          token: updated.telegramToken,
        });
      } else {
        const updated = await prisma.tenant.update({
          where: { id: tenant.id },
          data: { telegramToken: cleanToken },
        });

        return NextResponse.json({
          success: true,
          message: `Kode token umum Desa ${tenant.namaDesa} berhasil disimpan.`,
          token: updated.telegramToken,
        });
      }
    }

    // 3. Putuskan Sambungan (Unlink) Subscriber
    if (action === 'unlink_subscriber') {
      if (!subscriberId) {
        return NextResponse.json({ error: 'subscriberId diperlukan' }, { status: 400 });
      }

      const subscriber = await prisma.telegramSubscriber.findFirst({
        where: { id: subscriberId, tenantId: tenant.id },
      });

      if (!subscriber) {
        return NextResponse.json({ error: 'Data subscriber tidak ditemukan' }, { status: 404 });
      }

      // Beritahu pengguna di Telegram
      try {
        await sendTelegramMessage(
          subscriber.telegramId,
          `⚠️ <b>Pemberitahuan Sistem desDig</b>\n\n` +
          `Sambungan akun Telegram Anda dengan Desa <b>${tenant.namaDesa}</b> telah diputuskan oleh Administrator desa.\n\n` +
          `Untuk terhubung kembali, gunakan perintah <code>/login</code> dengan kode rahasia terbaru.`
        );
      } catch (err) {
        console.error('Failed to notify subscriber on unlink:', err);
      }

      await prisma.telegramSubscriber.delete({
        where: { id: subscriber.id },
      });

      return NextResponse.json({
        success: true,
        message: 'Sambungan akun Telegram berhasil diputuskan.',
      });
    }

    // 4. Update Jeda Waktu Foto Susulan Otomatis (Attach Window)
    if (action === 'update_attach_window') {
      const minutes = Math.max(0, Math.min(120, parseInt(body.minutes, 10) || 0));
      const updated = await prisma.tenant.update({
        where: { id: tenant.id },
        data: { telegramAttachWindowMinutes: minutes },
      });

      return NextResponse.json({
        success: true,
        message: minutes === 0
          ? 'Penyematan foto susulan otomatis dinonaktifkan (setiap foto akan diminta caption terpisah).'
          : `Jeda waktu penyematan foto susulan berhasil diatur ke ${minutes} menit.`,
        minutes: updated.telegramAttachWindowMinutes,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST /api/telegram/officials:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
