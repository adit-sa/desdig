import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

// GET /api/categories?tenant=...
export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant desa tidak ditemukan' }, { status: 404 });
    }

    // Default categories if empty for this tenant
    const count = await prisma.category.count({ where: { tenantId: tenant.id } });
    if (count === 0) {
      const defaultCategories = [
        { name: 'Kabar Desa', slug: 'kabar-desa' },
        { name: 'Pembangunan', slug: 'pembangunan' },
        { name: 'Pemberdayaan Warga', slug: 'pemberdayaan-warga' },
        { name: 'Kesehatan & Posyandu', slug: 'kesehatan-posyandu' },
        { name: 'Pendidikan & Pemuda', slug: 'pendidikan-pemuda' },
      ];

      for (const cat of defaultCategories) {
        await prisma.category.create({
          data: {
            tenantId: tenant.id,
            name: cat.name,
            slug: cat.slug,
          },
        }).catch(() => {});
      }
    }

    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id },
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat kategori' }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 404 });
    }

    const name = (body.name || '').trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Nama kategori minimal 2 karakter' }, { status: 400 });
    }

    let slug = (body.slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (!slug) slug = 'kategori-' + Date.now();

    // Check uniqueness within tenant
    const existing = await prisma.category.findFirst({
      where: { tenantId: tenant.id, slug },
    });

    if (existing) {
      return NextResponse.json({ error: 'Kategori dengan slug atau nama ini sudah ada' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name,
        slug,
      },
      include: {
        _count: {
          select: { articles: true },
        },
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat kategori' }, { status: 500 });
  }
}
