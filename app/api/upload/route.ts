import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import sharp from 'sharp';

import { getTenantFromRequest } from '@/lib/tenant/resolver';
import { uploadFile } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // Multi-tenant isolation parameter
    let tenantSlug =
      (formData.get('tenant') as string) ||
      (formData.get('tenantSlug') as string) ||
      request.headers.get('x-tenant-slug') ||
      '';

    if (!tenantSlug) {
      const resolvedTenant = await getTenantFromRequest(request);
      tenantSlug = resolvedTenant?.slug || 'common';
    }

    const cleanTenant = tenantSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'common';
    
    // Subfolder category (default to "galeri" or custom like "dokumen", "pembangunan", "media")
    const folderParam = (formData.get('folder') as string) || 'galeri';
    const cleanFolder = folderParam.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'galeri';

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada berkas yang diunggah' }, { status: 400 });
    }

    const rawName = file.name || 'unnamed';
    const ext = path.extname(rawName).toLowerCase();

    // Validasi tipe berkas
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.jpg'];
    const vectorOrAnim = ['.gif', '.svg'];
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];

    const isImage = imageExtensions.includes(ext) || file.type.startsWith('image/');
    const isVectorOrAnim = vectorOrAnim.includes(ext) || file.type === 'image/svg+xml' || file.type === 'image/gif';
    const isVideo = videoExtensions.includes(ext) || file.type.startsWith('video/');

    if (!isImage && !isVectorOrAnim && !isVideo) {
      return NextResponse.json(
        {
          error:
            'Format berkas tidak didukung. Harap unggah foto (JPG, PNG, WebP), SVG/GIF, atau video (MP4, WebM)',
        },
        { status: 400 }
      );
    }

    // Batas ukuran: 15MB untuk foto, 50MB untuk video
    const maxSizeBytes = isVideo ? 50 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `Ukuran berkas (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${
            isVideo ? '50 MB' : '15 MB'
          }`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    let finalBuffer: Buffer;
    let finalFilename: string;
    let outputMime = file.type;
    let isCompressed = false;

    // Bersihkan nama berkas dasar
    const baseSlug = rawName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '_')
      .substring(0, 30);

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);

    if (isImage && !isVectorOrAnim) {
      // 1. KOMPRESI GAMBAR STANDAR WEBSITE KE MODERN WEBP (Ringan, Cepat, Kualitas Tinggi)
      try {
        const imagePipeline = sharp(inputBuffer).rotate(); // auto-orient by EXIF
        const metadata = await imagePipeline.metadata();

        // Batasi dimensi maksimal 1920x1920 (tetap mempertahankan aspect ratio asli)
        const maxWidth = 1920;
        const maxHeight = 1920;
        if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
          imagePipeline.resize({
            width: maxWidth,
            height: maxHeight,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // Kompresi ke WebP kualitas 82 (sweet spot rasio ukuran vs ketajaman visual untuk web modern)
        finalBuffer = await imagePipeline
          .webp({
            quality: 82,
            effort: 4,
          })
          .toBuffer();

        finalFilename = `${baseSlug}_${timestamp}_${randomSuffix}.webp`;
        outputMime = 'image/webp';
        isCompressed = true;
      } catch (sharpError) {
        console.warn('Sharp compression warning, falling back to original buffer:', sharpError);
        finalBuffer = inputBuffer;
        finalFilename = `${baseSlug}_${timestamp}_${randomSuffix}${ext || '.jpg'}`;
      }
    } else {
      // 2. Berkas Video / SVG / GIF disimpan langsung
      finalBuffer = inputBuffer;
      const safeExt = ext || (isVideo ? '.mp4' : '.png');
      finalFilename = `${baseSlug}_${timestamp}_${randomSuffix}${safeExt}`;
    }

    const uploadRes = await uploadFile({
      buffer: finalBuffer,
      filename: finalFilename,
      mimeType: outputMime,
      tenantSlug: cleanTenant,
      folder: cleanFolder,
    });
    const publicUrl = uploadRes.url;

    const originalSize = file.size;
    const finalSize = finalBuffer.length;
    const savingsPercent =
      originalSize > finalSize
        ? Math.round(((originalSize - finalSize) / originalSize) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      storage: uploadRes.storage,
      tenant: cleanTenant,
      folder: cleanFolder,
      filename: finalFilename,
      originalName: rawName,
      originalSize,
      size: finalSize,
      savingsPercent,
      mimeType: outputMime,
      isCompressed,
      type: isVideo ? 'video' : 'image',
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan saat memproses unggahan berkas' },
      { status: 500 }
    );
  }
}
