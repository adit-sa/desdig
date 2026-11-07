import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';

export interface UploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  tenantSlug: string;
  folder?: string;
}

export interface UploadResult {
  url: string;
  storage: 'r2' | 'local';
  key: string;
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_R2_URL;

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

export function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Helper resolusi path upload lokal tanpa memicu Turbopack AST dynamic glob bundling scanner
 */
export function resolveUploadPath(...segments: string[]): string {
  const baseUploadDir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
  return path.resolve(/*turbopackIgnore: true*/ baseUploadDir, ...segments);
}

/**
 * Upload berkas ke Cloudflare R2 (jika env R2 dikonfigurasi),
 * atau fallback ke filesystem lokal public/uploads (untuk pengembangan lokal / VPS).
 */
export async function uploadFile({
  buffer,
  filename,
  mimeType,
  tenantSlug,
  folder = 'galeri',
}: UploadOptions): Promise<UploadResult> {
  const cleanTenant = tenantSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'common';
  const cleanFolder = folder.toLowerCase().replace(/[^a-z0-9-_]/g, '') || 'galeri';
  const key = `${cleanTenant}/${cleanFolder}/${filename}`;

  // 1. Opsi A: Cloudflare R2 Storage (Vercel Serverless / Cloud Production)
  if (isR2Configured()) {
    const s3 = getR2Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    // Format URL publik standar /uploads/${key} yang di-rewrite oleh next.config.ts ke Cloudflare R2
    return {
      url: `/uploads/${key}`,
      storage: 'r2',
      key,
    };
  }

  // 2. Opsi B: Local Disk Fallback (Pengembangan Lokal / Standalone Server)
  const localDir = resolveUploadPath(cleanTenant, cleanFolder);
  await fs.mkdir(localDir, { recursive: true });
  const localFilePath = resolveUploadPath(cleanTenant, cleanFolder, filename);
  await fs.writeFile(localFilePath, buffer);

  return {
    url: `/uploads/${cleanTenant}/${cleanFolder}/${filename}`,
    storage: 'local',
    key,
  };
}
