import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const products = await prisma.merchantProduct.findMany({
      where: { merchantId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Error fetching merchant products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const merchant = await prisma.merchant.findUnique({
      where: { id },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Pelapak tidak ditemukan' }, { status: 404 });
    }

    const { name, description, price, unit, category, imageUrl, isAvailable, expiresAt } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { error: 'Nama produk dan harga wajib diisi' },
        { status: 400 }
      );
    }

    const newProduct = await prisma.merchantProduct.create({
      data: {
        merchantId: id,
        name,
        description: description || null,
        price: Number(price) || 0,
        unit: unit || 'pcs',
        category: category || 'Makanan & Minuman',
        imageUrl: imageUrl || null,
        isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan produk' }, { status: 500 });
  }
}
