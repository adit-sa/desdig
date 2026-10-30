import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { articleSchema } from '@/lib/validations/cms';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const categoryId = searchParams.get('categoryId') || '';

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
    }

    const whereClause: any = {
      tenantId: tenant.id,
    };

    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (categoryId && categoryId !== 'ALL') {
      whereClause.categoryId = categoryId;
    }

    const [articles, categories] = await Promise.all([
      prisma.article.findMany({
        where: whereClause,
        include: {
          category: true,
          author: { select: { name: true, email: true } },
          authorResident: { select: { id: true, nik: true, nama: true, dusun: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.category.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ articles, categories });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = await getTenantFromRequest(request, body.tenantSlug || body.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant tidak valid' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug, ['VILLAGE_ADMIN', 'EDITOR', 'AUTHOR']);
    if (!auth.authorized) {
      return auth.response!;
    }

    // Validasi input dengan Zod
    const validationResult = articleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Cek keunikan slug di dalam tenant yang sama
    const existingSlug = await prisma.article.findFirst({
      where: {
        tenantId: tenant.id,
        slug: data.slug,
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: `Slug "${data.slug}" sudah digunakan di desa ini. Silakan gunakan slug lain.` },
        { status: 400 }
      );
    }

    // Ambil author default admin jika belum ada
    const author = await prisma.user.findFirst({
      where: {
        memberships: {
          some: { tenantId: tenant.id },
        },
      },
    });

    const newArticle = await prisma.article.create({
      data: {
        tenantId: tenant.id,
        authorId: author?.id,
        authorResidentId: data.authorResidentId || null,
        categoryId: data.categoryId || null,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        content: data.content,
        coverImageUrl: data.coverImageUrl || null,
        galleryUrls: body.galleryUrls || null,
        status: data.status,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        category: true,
        author: true,
        authorResident: true,
      },
    });

    return NextResponse.json({ success: true, article: newArticle }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan artikel' }, { status: 500 });
  }
}
