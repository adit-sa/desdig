import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await request.json();

    const existing = await prisma.merchantProduct.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    const { name, description, price, unit, category, imageUrl, isAvailable, expiresAt } = body;

    const updated = await prisma.merchantProduct.update({
      where: { id: productId },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        unit: unit ?? existing.unit,
        category: category ?? existing.category,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : existing.isAvailable,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : existing.expiresAt,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui produk' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    const existing = await prisma.merchantProduct.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    }

    await prisma.merchantProduct.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus produk' }, { status: 500 });
  }
}
