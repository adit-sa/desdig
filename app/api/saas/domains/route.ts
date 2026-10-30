import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdminApi } from '@/lib/auth/rbac';

function sanitizeDomain(raw: string): string {
  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/\/.*$/, '');
  cleaned = cleaned.trim();
  return cleaned;
}

const DOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:[0-9]+)?$/;
const LOCALHOST_REGEX = /^[a-z0-9-]+(\.localhost)(:[0-9]+)?$/;

export async function GET(request: NextRequest) {
  const auth = requireSuperAdminApi(request);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    const domains = await prisma.domain.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        tenant: {
          select: {
            id: true,
            namaDesa: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({ domains });
  } catch (error: any) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireSuperAdminApi(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await request.json();
    const { tenantId, isPrimary = false, isVerified = true } = body;
    const rawDomain = body.domain || '';

    if (!tenantId || !rawDomain) {
      return NextResponse.json(
        { error: 'Tenant ID dan nama domain wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanDomain = sanitizeDomain(rawDomain);

    if (!DOMAIN_REGEX.test(cleanDomain) && !LOCALHOST_REGEX.test(cleanDomain)) {
      return NextResponse.json(
        { error: 'Format domain tidak valid. Contoh valid: salupangkang.desa.id atau salupangkang.desaku.id' },
        { status: 400 }
      );
    }

    // Pastikan tenant ada
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { domains: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant desa tidak ditemukan.' }, { status: 404 });
    }

    // Periksa apakah domain sudah terdaftar di sistem
    const existing = await prisma.domain.findUnique({
      where: { domain: cleanDomain },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Domain "${cleanDomain}" sudah terdaftar di sistem.` },
        { status: 400 }
      );
    }

    // Jika ini domain pertama untuk tenant ini, otomatis jadikan primary
    const willBePrimary = isPrimary || tenant.domains.length === 0;

    if (willBePrimary) {
      await prisma.domain.updateMany({
        where: { tenantId },
        data: { isPrimary: false },
      });
    }

    const newDomain = await prisma.domain.create({
      data: {
        tenantId,
        domain: cleanDomain,
        isPrimary: willBePrimary,
        isVerified: !!isVerified,
      },
    });

    return NextResponse.json({
      success: true,
      domain: newDomain,
      message: `Domain ${cleanDomain} berhasil didaftarkan untuk Desa ${tenant.namaDesa}.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating domain:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = requireSuperAdminApi(request);
  if (!auth.authorized) return auth.response!;

  try {
    const body = await request.json();
    const { id, isPrimary, isVerified } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID domain wajib disertakan.' }, { status: 400 });
    }

    const existingDomain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain tidak ditemukan.' }, { status: 404 });
    }

    // Jika dijadikan primary, non-aktifkan primary pada domain lain milik tenant yang sama
    if (isPrimary === true) {
      await prisma.domain.updateMany({
        where: { tenantId: existingDomain.tenantId },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.domain.update({
      where: { id },
      data: {
        ...(isPrimary !== undefined ? { isPrimary: !!isPrimary } : {}),
        ...(isVerified !== undefined ? { isVerified: !!isVerified } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      domain: updated,
      message: 'Status domain berhasil diperbarui.',
    });
  } catch (error: any) {
    console.error('Error updating domain:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireSuperAdminApi(request);
  if (!auth.authorized) return auth.response!;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID domain wajib disertakan.' }, { status: 400 });
    }

    const existingDomain = await prisma.domain.findUnique({
      where: { id },
    });

    if (!existingDomain) {
      return NextResponse.json({ error: 'Domain tidak ditemukan.' }, { status: 404 });
    }

    // Cek apakah ada domain lain untuk tenant ini
    const countOtherDomains = await prisma.domain.count({
      where: {
        tenantId: existingDomain.tenantId,
        id: { not: id },
      },
    });

    if (countOtherDomains === 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus domain terakhir. Setiap desa minimal harus memiliki 1 domain terdaftar.' },
        { status: 400 }
      );
    }

    await prisma.domain.delete({
      where: { id },
    });

    // Jika yang dihapus adalah primary domain, otomatis jadikan domain tertua yang tersisa sebagai primary
    if (existingDomain.isPrimary) {
      const oldestRemaining = await prisma.domain.findFirst({
        where: { tenantId: existingDomain.tenantId },
        orderBy: { createdAt: 'asc' },
      });
      if (oldestRemaining) {
        await prisma.domain.update({
          where: { id: oldestRemaining.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Domain ${existingDomain.domain} berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

