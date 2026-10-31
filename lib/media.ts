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
import { isR2Configured, getR2Client, R2_BUCKET_NAME } from './storage';
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
    const [articles, gallery, officials, residents, projects, docs, customPages, tenant] = await Promise.all([
      // 1. Artikel Berita (cover & content)
      prisma.article.findMany({
        where: { tenantId },
        select: { title: true, coverImageUrl: true, content: true },
      }),
      // 2. Galeri Foto
      prisma.galleryItem.findMany({
        where: { tenantId },
        select: { title: true, imageUrl: true },
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
    ]);

    // Daftarkan Artikel
    articles.forEach((a) => {
      registerUsage(a.coverImageUrl, `Artikel: ${a.title}`);
      if (a.content) {
        const matches = a.content.match(/\/uploads\/[^\s"')]+/g) || [];
        matches.forEach((m) => registerUsage(m, `Konten Artikel: ${a.title}`));
      }
    });

    // Daftarkan Galeri
    gallery.forEach((g) => {
      registerUsage(g.imageUrl, `Galeri: ${g.title}`);
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
    const localPath = path.join(process.cwd(), 'public', 'uploads', cleanTenant, subpath);
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
    const localPath = path.join(process.cwd(), 'public', 'uploads', cleanTenant, subpath);
    if (existsSync(localPath)) {
      inputBuffer = await fs.readFile(localPath);
    }
  }

  if (!inputBuffer) {
    throw new Error('Berkas asli tidak ditemukan di server penyimpanan');
  }

  const originalSize = inputBuffer.length;
  const maxWidth = isFace ? 1000 : 1920;
  const maxHeight = isFace ? 1000 : 1920;
  const quality = isFace ? 85 : targetQuality;

  const imagePipeline = sharp(inputBuffer).rotate();
  const metadata = await imagePipeline.metadata();

  if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
    imagePipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const compressedBuffer = await imagePipeline.webp({ quality, effort: 4 }).toBuffer();
  const newSize = compressedBuffer.length;
  const savingsBytes = Math.max(0, originalSize - newSize);
  const savingsPercent = originalSize > newSize ? Math.round((savingsBytes / originalSize) * 100) : 0;

  // Simpan kembali buffer terkompresi ke R2 jika terkonfigurasi
  if (isR2Configured()) {
    const s3 = getR2Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: compressedBuffer,
        ContentType: 'image/webp',
      })
    );
  }

  // Simpan juga ke disk lokal jika ada direktori
  const localDir = path.join(process.cwd(), 'public', 'uploads', cleanTenant, folder);
  if (existsSync(localDir)) {
    const localPath = path.join(process.cwd(), 'public', 'uploads', cleanTenant, subpath);
    await fs.writeFile(localPath, compressedBuffer);
  }

  return {
    success: true,
    originalSize,
    newSize,
    savingsBytes,
    savingsPercent,
    url: relativeUrl,
  };
}
