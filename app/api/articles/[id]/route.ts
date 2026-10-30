import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { articleSchema } from '@/lib/validations/cms';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!article) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, article.tenant.slug, ['VILLAGE_ADMIN', 'EDITOR', 'AUTHOR']);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.article.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Artikel berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus artikel' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingArticle = await prisma.article.findUnique({
      where: { id },
      include: { tenant: true },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existingArticle.tenant.slug, ['VILLAGE_ADMIN', 'EDITOR', 'AUTHOR']);
    if (!auth.authorized) {
      return auth.response!;
    }

    const validationResult = articleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Cek jika slug diubah dan bentrok
    if (data.slug !== existingArticle.slug) {
      const slugClash = await prisma.article.findFirst({
        where: {
          tenantId: existingArticle.tenantId,
          slug: data.slug,
          id: { not: id },
        },
      });

      if (slugClash) {
        return NextResponse.json(
          { error: `Slug "${data.slug}" sudah digunakan di desa ini.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.article.update({
      where: { id },
      data: {
        authorResidentId: data.authorResidentId !== undefined ? (data.authorResidentId || null) : (existingArticle as any).authorResidentId,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        categoryId: data.categoryId || null,
        status: data.status,
        coverImageUrl: data.coverImageUrl || null,
        galleryUrls: body.galleryUrls !== undefined ? body.galleryUrls : (existingArticle as any).galleryUrls,
        publishedAt:
          data.status === 'PUBLISHED' && !existingArticle.publishedAt
            ? new Date()
            : existingArticle.publishedAt,
      },
      include: {
        category: true,
        author: true,
        authorResident: true,
      },
    });

    return NextResponse.json({ success: true, article: updated });
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui artikel' }, { status: 500 });
  }
}
