import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import sharp from 'sharp';
import {
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { isR2Configured, getR2Client, R2_BUCKET_NAME, resolveUploadPath } from './storage';
import { prisma } from './prisma';

export interface MediaFileItem {
  id: string;
  name: string;
  folder: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  isImage: boolean;
  isUsed: boolean;
  usedIn: string[];
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function extractUrlsFromJson(jsonValue: any): string[] {
  if (!jsonValue) return [];
  const urls: string[] = [];
  if (Array.isArray(jsonValue)) {
    for (const item of jsonValue) {
      if (typeof item === 'string') {
        urls.push(item);
      } else if (item && typeof item === 'object') {
        if (typeof item.url === 'string') urls.push(item.url);
        if (typeof item.imageUrl === 'string') urls.push(item.imageUrl);
        if (typeof item.src === 'string') urls.push(item.src);
      }
    }
  } else if (typeof jsonValue === 'object') {
    if (typeof jsonValue.url === 'string') urls.push(jsonValue.url);
  }
  return urls;
}

/**
 * Mengambil peta penggunaan seluruh file media di database untuk tenant tertentu.
 * Menghasilkan Map key (nama file atau URL relatif) -> list judul/posisi penggunaan.
 */
export async function getTenantMediaUsageMap(tenantId: string, tenantSlug: string): Promise<Map<string, string[]>> {
  const usageMap = new Map<string, string[]>();

  const registerUsage = (rawUrl: string | null | undefined, label: string) => {
    if (!rawUrl) return;
    const cleanUrl = rawUrl.trim();
    if (!cleanUrl) return;

    // Ekstrak nama file atau path kanonik
    const filename = path.basename(cleanUrl);

    // Daftarkan by full path dan by filename
    const listByPath = usageMap.get(cleanUrl) || [];
    if (!listByPath.includes(label)) listByPath.push(label);
    usageMap.set(cleanUrl, listByPath);

    const listByFilename = usageMap.get(filename) || [];
    if (!listByFilename.includes(label)) listByFilename.push(label);
    usageMap.set(filename, listByFilename);
  };

  try {
    const [articles, gallery, officials, residents, projects, docs, customPages, tenant, merchants, products, publicDocs] = await Promise.all([
      // 1. Artikel Berita (cover, content & gallery album)
      prisma.article.findMany({
        where: { tenantId },
        select: { title: true, coverImageUrl: true, content: true, galleryUrls: true },
      }),
      // 2. Galeri Foto (cover & seluruh mediaUrls album)
      prisma.galleryItem.findMany({
        where: { tenantId },
        select: { title: true, imageUrl: true, mediaUrls: true },
      }),
      // 3. Aparatur Pamong
      prisma.villageOfficial.findMany({
        where: { tenantId },
        select: { name: true, position: true, photoUrl: true },
      }),
      // 4. Penduduk dengan foto
      prisma.resident.findMany({
        where: { tenantId, fotoUrl: { not: null } },
        select: { nama: true, fotoUrl: true },
        take: 2000,
      }),
      // 5. Proyek Pembangunan
      prisma.developmentProject.findMany({
        where: { tenantId },
        select: { judul: true, foto: true },
      }),
      // 6. Dokumentasi Progres Pembangunan
      prisma.developmentDocumentation.findMany({
        where: { project: { tenantId } },
        select: { keterangan: true, gambar: true },
      }),
      // 7. Halaman Kustom
      prisma.customPage.findMany({
        where: { tenantId },
        select: { title: true, coverImageUrl: true, content: true },
      }),
      // 8. Logo & Banner Desa
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { logoUrl: true, heroImageUrl: true },
      }),
      // 9. Lapak UMKM Warga
      prisma.merchant.findMany({
        where: { tenantId },
        select: { shopName: true, avatarUrl: true, bannerUrl: true },
      }),
      // 10. Produk Lapak UMKM
      prisma.merchantProduct.findMany({
        where: { merchant: { tenantId } },
        select: { name: true, imageUrl: true },
      }),
      // 11. Dokumen Publik
      prisma.publicDocument.findMany({
        where: { tenantId },
        select: { title: true, fileUrl: true },
      }),
    ]);

    // Daftarkan Artikel
    articles.forEach((a) => {
      registerUsage(a.coverImageUrl, `Artikel: ${a.title}`);
      if (a.content) {
        const matches = a.content.match(/\/uploads\/[^\s"')]+/g) || [];
        matches.forEach((m) => registerUsage(m, `Konten Artikel: ${a.title}`));
      }
      const galleryList = extractUrlsFromJson(a.galleryUrls);
      galleryList.forEach((u) => registerUsage(u, `Album Artikel: ${a.title}`));
    });

    // Daftarkan Galeri (termasuk seluruh foto dalam album multi-photo)
    gallery.forEach((g) => {
      registerUsage(g.imageUrl, `Galeri: ${g.title}`);
      const albumList = extractUrlsFromJson(g.mediaUrls);
      albumList.forEach((u) => registerUsage(u, `Album Galeri: ${g.title}`));
    });

    // Daftarkan Pamong
    officials.forEach((o) => {
      registerUsage(o.photoUrl, `Pamong: ${o.name} (${o.position})`);
    });

    // Daftarkan Penduduk
    residents.forEach((r) => {
      registerUsage(r.fotoUrl, `Penduduk: ${r.nama}`);
    });

    // Daftarkan Pembangunan
    projects.forEach((p) => {
      registerUsage(p.foto, `Proyek: ${p.judul}`);
    });
    docs.forEach((d) => {
      registerUsage(d.gambar, `Dokumentasi Fisik: ${d.keterangan || 'Tahapan Proyek'}`);
    });

    // Daftarkan Halaman Kustom
    customPages.forEach((cp) => {
      registerUsage(cp.coverImageUrl, `Halaman: ${cp.title}`);
      if (cp.content) {
        const matches = cp.content.match(/\/uploads\/[^\s"')]+/g) || [];
        matches.forEach((m) => registerUsage(m, `Konten Halaman: ${cp.title}`));
      }
    });

    // Daftarkan Identitas Desa
    if (tenant) {
      registerUsage(tenant.logoUrl, 'Logo Resmi Desa');
      registerUsage(tenant.heroImageUrl, 'Banner Utama Beranda');
    }

    // Daftarkan Lapak UMKM
    merchants.forEach((m) => {
      registerUsage(m.avatarUrl, `Profil Toko: ${m.shopName}`);
      registerUsage(m.bannerUrl, `Banner Toko: ${m.shopName}`);
    });

    // Daftarkan Produk Lapak UMKM
    products.forEach((p) => {
      registerUsage(p.imageUrl, `Produk UMKM: ${p.name}`);
    });

    // Daftarkan Dokumen Publik
    publicDocs.forEach((doc) => {
      registerUsage(doc.fileUrl, `Dokumen Publik: ${doc.title}`);
    });
  } catch (err) {
    console.warn('Gagal memindai penggunaan media di database:', err);
  }

  return usageMap;
}

/**
 * Memindai seluruh berkas media milik tenant dari Cloudflare R2 (produksi) dan disk lokal (fallback).
 */
export async function getTenantMediaFiles(tenantSlug: string, tenantId: string): Promise<{
  files: MediaFileItem[];
  folders: string[];
  stats: {
    totalFiles: number;
    totalSize: number;
    totalSizeFormatted: string;
    totalUsed: number;
    totalUnused: number;
  };
}> {
  const cleanTenant = tenantSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'default';
  const usageMap = await getTenantMediaUsageMap(tenantId, cleanTenant);

  const rawFilesMap = new Map<string, {
    name: string;
    folder: string;
    url: string;
    size: number;
    createdAt: string;
    isImage: boolean;
  }>();

  const discoveredFolders = new Set<string>();

  // 1. Ambil berkas dari Cloudflare R2 jika terkonfigurasi
  if (isR2Configured()) {
    try {
      const s3 = getR2Client();
      let isTruncated = true;
      let token: string | undefined = undefined;

      while (isTruncated) {
        const res: any = await s3.send(
          new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: `${cleanTenant}/`,
            ContinuationToken: token,
          })
        );

        if (res.Contents) {
          for (const item of res.Contents) {
            if (!item.Key) continue;
            // Key format: salupangkang/folder/filename.ext
            const parts = item.Key.split('/');
            if (parts.length < 3) continue;

            const folder = parts[1].toLowerCase();
            const filename = parts.slice(2).join('/');
            if (!filename || filename.endsWith('_thumb.webp')) continue;

            const ext = path.extname(filename).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);
            const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);

            // Hanya sertakan gambar atau video
            if (!isImage && !isVideo) continue;

            discoveredFolders.add(folder);
            const relativeUrl = `/uploads/${cleanTenant}/${folder}/${filename}`;

            rawFilesMap.set(relativeUrl, {
              name: filename,
              folder,
              url: relativeUrl,
              size: item.Size || 0,
              createdAt: item.LastModified ? item.LastModified.toISOString() : new Date().toISOString(),
              isImage,
            });
          }
        }

        isTruncated = !!res.IsTruncated;
        token = res.NextContinuationToken;
      }
    } catch (r2Err) {
      console.warn('Gagal memindai R2 bucket:', r2Err);
    }
  }

  // 2. Fallback / gabungkan dengan disk lokal jika ada (development mode / file lokal)
  const localBaseDir = path.join(process.cwd(), 'public', 'uploads', cleanTenant);
  if (existsSync(localBaseDir)) {
    const scanLocal = async (dirPath: string, subfolder: string, depth = 0) => {
      if (depth > 4) return;
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            const nextSub = subfolder ? `${subfolder}/${entry.name}` : entry.name;
            discoveredFolders.add(nextSub);
            await scanLocal(fullPath, nextSub, depth + 1);
          } else if (entry.isFile()) {
            if (entry.name.endsWith('_thumb.webp')) continue;

            const ext = path.extname(entry.name).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);
            const isVideo = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext);
            if (!isImage && !isVideo) continue;

            const folder = subfolder || 'galeri';
            discoveredFolders.add(folder);
            const relativeUrl = `/uploads/${cleanTenant}/${folder}/${entry.name}`;

            if (!rawFilesMap.has(relativeUrl)) {
              try {
                const stat = await fs.stat(fullPath);
                rawFilesMap.set(relativeUrl, {
                  name: entry.name,
                  folder,
                  url: relativeUrl,
                  size: stat.size,
                  createdAt: stat.birthtime ? stat.birthtime.toISOString() : stat.mtime.toISOString(),
                  isImage,
                });
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('Error reading local directory:', err);
      }
    };

    await scanLocal(localBaseDir, '');
  }

  // 3. Petakan ke MediaFileItem dengan deteksi integrasi DB
  let totalSize = 0;
  let totalUsed = 0;
  let totalUnused = 0;

  const files: MediaFileItem[] = [];

  for (const [url, item] of rawFilesMap.entries()) {
    const usagesByUrl = usageMap.get(url) || [];
    const usagesByName = usageMap.get(item.name) || [];
    const combinedUsages = Array.from(new Set([...usagesByUrl, ...usagesByName]));

    const isUsed = combinedUsages.length > 0;
    if (isUsed) {
      totalUsed += 1;
    } else {
      totalUnused += 1;
    }

    totalSize += item.size;

    files.push({
      id: `${cleanTenant}_${item.folder}_${item.name}`,
      name: item.name,
      folder: item.folder,
      url: item.url,
      thumbnailUrl: item.url,
      size: item.size,
      sizeFormatted: formatBytes(item.size),
      createdAt: item.createdAt,
      isImage: item.isImage,
      isUsed,
      usedIn: combinedUsages,
    });
  }

  // Default urutkan dari yang terbaru diunggah
  files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    files,
    folders: Array.from(discoveredFolders).sort(),
    stats: {
      totalFiles: files.length,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      totalUsed,
      totalUnused,
    },
  };
}

/**
 * Menghapus satu atau banyak berkas dari Cloudflare R2 dan filesystem lokal.
 */
export async function deleteTenantMediaFiles(tenantSlug: string, relativeUrls: string[]): Promise<number> {
  const cleanTenant = tenantSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'default';
  const prefix = `/uploads/${cleanTenant}/`;

  let deletedCount = 0;
  const r2KeysToDelete: { Key: string }[] = [];

  for (const url of relativeUrls) {
    if (!url.startsWith(prefix)) continue;
    const subpath = url.slice(prefix.length);
    if (subpath.includes('..')) continue;

    const key = `${cleanTenant}/${subpath}`;
    r2KeysToDelete.push({ Key: key });

    // Hapus juga thumbnail jika ada
    const ext = path.extname(key);
    const thumbKey = key.replace(new RegExp(`${ext}$`), '_thumb.webp');
    r2KeysToDelete.push({ Key: thumbKey });

    // Hapus lokal jika ada
    const localPath = resolveUploadPath(cleanTenant, subpath);
    if (existsSync(localPath)) {
      try {
        await fs.unlink(localPath);
      } catch {}
    }
    const localThumb = localPath.replace(new RegExp(`${ext}$`), '_thumb.webp');
    if (existsSync(localThumb)) {
      try {
        await fs.unlink(localThumb);
      } catch {}
    }

    deletedCount += 1;
  }

  // Hapus dari R2
  if (isR2Configured() && r2KeysToDelete.length > 0) {
    try {
      const s3 = getR2Client();
      // DeleteObjectsCommand handles up to 1000 objects per call
      for (let i = 0; i < r2KeysToDelete.length; i += 1000) {
        const batch = r2KeysToDelete.slice(i, i + 1000);
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: { Objects: batch },
          })
        );
      }
    } catch (err) {
      console.error('Error deleting from R2:', err);
    }
  }

  return deletedCount;
}

/**
 * Membersihkan secara massal seluruh berkas yatim (yang tidak terintegrasi di database) untuk tenant tertentu.
 * Mengembalikan total file yang terhapus dan kapasitas storage yang berhasil dibebaskan.
 */
export async function cleanupTenantOrphanFiles(tenantSlug: string, tenantId: string): Promise<{
  deletedCount: number;
  freedBytes: number;
  freedBytesFormatted: string;
}> {
  const scanResult = await getTenantMediaFiles(tenantSlug, tenantId);
  const orphanFiles = scanResult.files.filter((f) => !f.isUsed);

  if (orphanFiles.length === 0) {
    return {
      deletedCount: 0,
      freedBytes: 0,
      freedBytesFormatted: '0 B',
    };
  }

  const freedBytes = orphanFiles.reduce((acc, cur) => acc + cur.size, 0);
  const orphanUrls = orphanFiles.map((f) => f.url);

  const deletedCount = await deleteTenantMediaFiles(tenantSlug, orphanUrls);

  return {
    deletedCount,
    freedBytes,
    freedBytesFormatted: formatBytes(freedBytes),
  };
}

export interface ImageOptimizationResult {
  buffer: Buffer;
  mimeType: string;
  format: string;
  isCompressed: boolean;
  originalSize: number;
  finalSize: number;
  savingsBytes: number;
  savingsPercent: number;
}

/**
 * Kompresi cerdas adaptif dengan Sharp:
 * 1. Otomatis rotasi sesuai orientasi EXIF kamera HP.
 * 2. Skala dimensi maksimal (default 1600px untuk warta/galeri, 1000px untuk foto pamong).
 * 3. Enkoding WebP kualitas efisien (quality 75, effort 6) untuk rasio kompresi optimal.
 * 4. SAFEGUARD MUTLAK: Jika WebP hasil kompresi ternyata lebih besar dari sumbernya
 *    (sering terjadi pada foto Telegram yang sudah dikompresi sangat hemat di HP pengguna),
 *    sistem mencoba pass kedua (quality 65) atau mempertahankan buffer asli agar ukuran TIDAK PERNAH MEMBENGKAK.
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    effort?: number;
    isFace?: boolean;
  } = {}
): Promise<ImageOptimizationResult> {
  const originalSize = inputBuffer.length;
  const isFace = options.isFace || false;
  const maxWidth = options.maxWidth || (isFace ? 1000 : 1600);
  const maxHeight = options.maxHeight || (isFace ? 1000 : 1600);
  const targetQuality = options.quality || (isFace ? 78 : 75);
  const effort = options.effort || 6;

  try {
    const pipeline = sharp(inputBuffer).rotate();
    const meta = await pipeline.metadata();

    if ((meta.width && meta.width > maxWidth) || (meta.height && meta.height > maxHeight)) {
      pipeline.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Pass 1: Enkoding WebP efisien (effort 6)
    let resultBuffer = await pipeline
      .webp({ quality: targetQuality, effort })
      .toBuffer();

    // Pass 2: Jika ukuran hasil lebih besar dari ukuran asli
    if (resultBuffer.length >= originalSize) {
      const pass2 = await sharp(inputBuffer)
        .rotate()
        .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 65, effort })
        .toBuffer();

      if (pass2.length < resultBuffer.length) {
        resultBuffer = pass2;
      }
    }

    // Safeguard: Jika hasil kompresi WebP lebih hemat, gunakan WebP.
    // Jika tidak lebih hemat (misal foto asli sudah sangat kecil/terkompresi), pertahankan buffer asli.
    if (resultBuffer.length < originalSize) {
      const savingsBytes = originalSize - resultBuffer.length;
      const savingsPercent = Math.round((savingsBytes / originalSize) * 100);
      return {
        buffer: resultBuffer,
        mimeType: 'image/webp',
        format: 'webp',
        isCompressed: true,
        originalSize,
        finalSize: resultBuffer.length,
        savingsBytes,
        savingsPercent,
      };
    } else {
      const detectedExt = meta.format || 'jpg';
      const mime = detectedExt === 'webp' ? 'image/webp' : detectedExt === 'png' ? 'image/png' : 'image/jpeg';
      return {
        buffer: inputBuffer,
        mimeType: mime,
        format: detectedExt,
        isCompressed: false,
        originalSize,
        finalSize: originalSize,
        savingsBytes: 0,
        savingsPercent: 0,
      };
    }
  } catch (err) {
    console.warn('Gagal optimasi gambar dengan Sharp:', err);
    return {
      buffer: inputBuffer,
      mimeType: 'image/jpeg',
      format: 'jpg',
      isCompressed: false,
      originalSize,
      finalSize: originalSize,
      savingsBytes: 0,
      savingsPercent: 0,
    };
  }
}

/**
 * Mengompresi berkas gambar ke format modern WebP kualitas tinggi.
 */
export async function compressTenantMediaFile(
  tenantSlug: string,
  relativeUrl: string,
  targetQuality = 82
): Promise<{
  success: boolean;
  originalSize: number;
  newSize: number;
  savingsBytes: number;
  savingsPercent: number;
  url: string;
}> {
  const cleanTenant = tenantSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'default';
  const prefix = `/uploads/${cleanTenant}/`;

  if (!relativeUrl.startsWith(prefix)) {
    throw new Error('Berkas tidak berada dalam direktori desa ini');
  }

  const subpath = relativeUrl.slice(prefix.length);
  const key = `${cleanTenant}/${subpath}`;
  const parts = subpath.split('/');
  const folder = parts[0] || 'galeri';
  const isFace = folder === 'user_pict';

  let inputBuffer: Buffer | null = null;

  // 1. Ambil buffer dari R2 jika terkonfigurasi
  if (isR2Configured()) {
    try {
      const s3 = getR2Client();
      const getRes = await s3.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
        })
      );
      if (getRes.Body) {
        const bytes = await getRes.Body.transformToByteArray();
        inputBuffer = Buffer.from(bytes);
      }
    } catch (err) {
      console.warn('Could not read from R2, trying local:', err);
    }
  }

  // Fallback lokal
  if (!inputBuffer) {
    const localPath = resolveUploadPath(cleanTenant, subpath);
    if (existsSync(localPath)) {
      inputBuffer = await fs.readFile(localPath);
    }
  }

  if (!inputBuffer) {
    throw new Error('Berkas asli tidak ditemukan di server penyimpanan');
  }

  const originalSize = inputBuffer.length;
  const opt = await optimizeImageBuffer(inputBuffer, {
    isFace,
    quality: isFace ? 78 : targetQuality,
  });

  // Jika kompresi menghasilkan file yang lebih hemat, simpan ke storage
  if (opt.isCompressed) {
    if (isR2Configured()) {
      const s3 = getR2Client();
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: opt.buffer,
          ContentType: opt.mimeType,
        })
      );
    }

    const localDir = resolveUploadPath(cleanTenant, folder);
    if (existsSync(localDir)) {
      const localPath = resolveUploadPath(cleanTenant, subpath);
      await fs.writeFile(localPath, opt.buffer);
    }
  }

  return {
    success: true,
    originalSize,
    newSize: opt.finalSize,
    savingsBytes: opt.savingsBytes,
    savingsPercent: opt.savingsPercent,
    url: relativeUrl,
  };
}
