import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantFromRequest } from '@/lib/tenant/resolver';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const q = searchParams.get('q');

    const tenant = await getTenantFromRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    let photos: any[];
    if (category && category !== 'ALL') {
      if (q && q.trim()) {
        const searchPattern = `%${q.trim()}%`;
        photos = await prisma.$queryRaw<any[]>`
          SELECT id, "tenantId", title, "imageUrl", category, caption, "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt", "updatedAt"
          FROM "GalleryItem"
          WHERE "tenantId" = ${tenant.id}
            AND "category" = ${category}
            AND ("title" ILIKE ${searchPattern} OR "caption" ILIKE ${searchPattern})
          ORDER BY "createdAt" DESC
        `;
      } else {
        photos = await prisma.$queryRaw<any[]>`
          SELECT id, "tenantId", title, "imageUrl", category, caption, "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt", "updatedAt"
          FROM "GalleryItem"
          WHERE "tenantId" = ${tenant.id}
            AND "category" = ${category}
          ORDER BY "createdAt" DESC
        `;
      }
    } else {
      if (q && q.trim()) {
        const searchPattern = `%${q.trim()}%`;
        photos = await prisma.$queryRaw<any[]>`
          SELECT id, "tenantId", title, "imageUrl", category, caption, "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt", "updatedAt"
          FROM "GalleryItem"
          WHERE "tenantId" = ${tenant.id}
            AND ("title" ILIKE ${searchPattern} OR "caption" ILIKE ${searchPattern})
          ORDER BY "createdAt" DESC
        `;
      } else {
        photos = await prisma.$queryRaw<any[]>`
          SELECT id, "tenantId", title, "imageUrl", category, caption, "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt", "updatedAt"
          FROM "GalleryItem"
          WHERE "tenantId" = ${tenant.id}
          ORDER BY "createdAt" DESC
        `;
      }
    }

    const countRes = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM "GalleryItem" WHERE "tenantId" = ${tenant.id}
    `;
    const totalCount = countRes[0]?.count || 0;

    const allCategories = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT category FROM "GalleryItem" WHERE "tenantId" = ${tenant.id}
    `;

    return NextResponse.json({
      success: true,
      photos,
      totalCount,
      categories: allCategories.map((c) => c.category),
    });
  } catch (error: any) {
    console.error('Error fetching gallery:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat galeri' }, { status: 500 });
  }
}

import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantSlug,
      tenantId,
      title,
      imageUrl,
      category,
      caption,
      takenAt,
      mediaType = 'IMAGE',
      videoUrl = null,
      mediaUrls = null,
    } = body;

    if (!title || (!imageUrl && !videoUrl)) {
      return NextResponse.json({ error: 'Judul dan URL Foto/Video wajib diisi' }, { status: 400 });
    }

    const tenant = await getTenantFromRequest(request, tenantSlug || tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Desa tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, tenant.slug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const id = `gal_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const targetTakenAt = takenAt ? new Date(takenAt) : new Date();

    // Pastikan mediaUrls tersimpan sebagai valid JSON string jika disediakan
    const mediaUrlsJson = mediaUrls ? JSON.stringify(mediaUrls) : null;

    // Fallback cover image jika video YouTube tanpa upload
    let finalImageUrl = imageUrl;
    if (!finalImageUrl && videoUrl) {
      const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch) {
        finalImageUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      } else {
        finalImageUrl = '/images/desa_irigasi_pertanian.jpg';
      }
    }

    await prisma.$executeRaw`
      INSERT INTO "GalleryItem" (
        "id", "tenantId", "title", "imageUrl", "category", "caption", 
        "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${tenant.id}, ${title}, ${finalImageUrl}, ${category || 'Kegiatan'}, ${caption || null},
        ${mediaType}, ${videoUrl || null}, ${mediaUrlsJson}::jsonb,
        ${targetTakenAt}, NOW(), NOW()
      )
    `;

    const photo = {
      id,
      tenantId: tenant.id,
      title,
      imageUrl: finalImageUrl,
      category: category || 'Kegiatan',
      caption: caption || null,
      mediaType,
      videoUrl: videoUrl || null,
      mediaUrls: mediaUrls || null,
      takenAt: targetTakenAt,
      createdAt: new Date(),
    };

    return NextResponse.json({ success: true, photo });
  } catch (error: any) {
    console.error('Error creating gallery item:', error);
    return NextResponse.json({ error: error.message || 'Gagal menambahkan foto' }, { status: 500 });
  }
}
