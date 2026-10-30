import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenant');

    let page = null;
    if (tenantSlug) {
      // Cari via slug atau id
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { slug: tenantSlug },
            { id: tenantSlug },
          ],
        },
      });
      if (tenant) {
        page = await prisma.customPage.findFirst({
          where: {
            tenantId: tenant.id,
            OR: [{ id }, { slug: id }],
          },
        });
      }
    } else {
      page = await prisma.customPage.findUnique({
        where: { id },
      });
    }

    if (!page) {
      return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
    }

    // Increment viewCount
    await prisma.customPage.update({
      where: { id: page.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error('Error getting page:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat halaman' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, summary, content, coverImageUrl, galleryUrls, status } = body;

    const page = await prisma.customPage.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, page.tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    let finalSlug = page.slug;
    if (slug && slug.trim() !== page.slug) {
      finalSlug = slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const existing = await prisma.customPage.findFirst({
        where: {
          tenantId: page.tenantId,
          slug: finalSlug,
          NOT: { id: page.id },
        },
      });

      if (existing) {
        finalSlug = `${finalSlug}-${Math.floor(Math.random() * 900 + 100)}`;
      }
    }

    const updated = await prisma.customPage.update({
      where: { id },
      data: {
        title: title ? title.trim() : page.title,
        slug: finalSlug,
        summary: summary !== undefined ? (summary ? summary.trim() : null) : page.summary,
        content: content ? content.trim() : page.content,
        coverImageUrl: coverImageUrl !== undefined ? coverImageUrl : page.coverImageUrl,
        galleryUrls: galleryUrls !== undefined ? galleryUrls : (page as any).galleryUrls,
        status: status ? (status as any) : page.status,
      } as any,
    });

    return NextResponse.json({ success: true, page: updated });
  } catch (error: any) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui halaman' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const page = await prisma.customPage.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, page.tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.customPage.delete({
      where: { id },
    });
    return NextResponse.json({ success: true, message: 'Halaman berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus halaman' }, { status: 500 });
  }
}
