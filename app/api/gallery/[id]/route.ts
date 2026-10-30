import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantManagerApi } from '@/lib/auth/rbac';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.$queryRaw<any[]>`
      SELECT gi."id", gi."tenantId", t."slug" as "tenantSlug"
      FROM "GalleryItem" gi
      JOIN "Tenant" t ON gi."tenantId" = t."id"
      WHERE gi."id" = ${id}
    `;

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Dokumentasi tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing[0].tenantSlug);
    if (!auth.authorized) {
      return auth.response!;
    }

    await prisma.$executeRaw`DELETE FROM "GalleryItem" WHERE "id" = ${id}`;
    return NextResponse.json({ success: true, message: 'Dokumentasi berhasil dihapus dari galeri' });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus dokumentasi' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.$queryRaw<any[]>`
      SELECT gi."id", gi."tenantId", t."slug" as "tenantSlug"
      FROM "GalleryItem" gi
      JOIN "Tenant" t ON gi."tenantId" = t."id"
      WHERE gi."id" = ${id}
    `;

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Dokumentasi tidak ditemukan' }, { status: 404 });
    }

    const auth = requireTenantManagerApi(request, existing[0].tenantSlug);
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await request.json();

    const targetTakenAt = body.takenAt ? new Date(body.takenAt) : null;
    const mediaUrlsJson = body.mediaUrls ? JSON.stringify(body.mediaUrls) : null;

    let finalImageUrl = body.imageUrl;
    if (!finalImageUrl && body.videoUrl) {
      const ytMatch = body.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (ytMatch) {
        finalImageUrl = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }

    if (targetTakenAt) {
      await prisma.$executeRaw`
        UPDATE "GalleryItem"
        SET "title" = ${body.title},
            "imageUrl" = ${finalImageUrl},
            "category" = ${body.category || 'Kegiatan'},
            "caption" = ${body.caption || null},
            "mediaType" = ${body.mediaType || 'IMAGE'},
            "videoUrl" = ${body.videoUrl || null},
            "mediaUrls" = ${mediaUrlsJson}::jsonb,
            "takenAt" = ${targetTakenAt},
            "updatedAt" = NOW()
        WHERE "id" = ${id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "GalleryItem"
        SET "title" = ${body.title},
            "imageUrl" = ${finalImageUrl},
            "category" = ${body.category || 'Kegiatan'},
            "caption" = ${body.caption || null},
            "mediaType" = ${body.mediaType || 'IMAGE'},
            "videoUrl" = ${body.videoUrl || null},
            "mediaUrls" = ${mediaUrlsJson}::jsonb,
            "updatedAt" = NOW()
        WHERE "id" = ${id}
      `;
    }

    return NextResponse.json({ success: true, message: 'Dokumentasi berhasil diperbarui' });
  } catch (error: any) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui dokumentasi' }, { status: 500 });
  }
}
