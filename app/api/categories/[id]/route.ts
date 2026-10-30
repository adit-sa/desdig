import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const name = (body.name || '').trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nama kategori minimal 2 karakter' }, { status: 400 });
    }

    let slug = body.slug
      ? body.slug
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
      : existing.slug;

    // Check conflict
    if (slug !== existing.slug) {
      const conflict = await prisma.category.findFirst({
        where: {
          tenantId: existing.tenantId,
          slug,
          NOT: { id: existing.id },
        },
      });
      if (conflict) {
        return NextResponse.json({ error: 'Slug sudah digunakan oleh kategori lain' }, { status: 400 });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    // Unlink any articles first
    await prisma.article.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus kategori' }, { status: 500 });
  }
}
