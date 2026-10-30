import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
});

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

async function main() {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'salupangkang', 'pembangunan');
  if (!fs.existsSync(dir)) {
    console.error('Folder tidak ditemukan:', dir);
    return;
  }

  const files = fs.readdirSync(dir);
  console.log(`🚀 Mengunggah ${files.length} file pembangunan Salupangkang ke R2 (salupangkang/pembangunan)...`);

  let count = 0;
  for (let i = 0; i < files.length; i += 10) {
    const batch = files.slice(i, i + 10);
    await Promise.all(
      batch.map(async (file) => {
        const fullPath = path.join(dir, file);
        const key = `salupangkang/pembangunan/${file}`;
        const buffer = fs.readFileSync(fullPath);
        const mimeType = getMimeType(file);

        await s3.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        count++;
      })
    );
    console.log(`⏳ Progress: ${count} / ${files.length}`);
  }

  console.log(`✅ Seluruh ${count} file pembangunan Salupangkang berhasil diunggah ke Cloudflare R2!`);
}

main().catch(console.error);

