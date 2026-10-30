import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.error('❌ Kredensial R2 belum lengkap di .env!');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
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
    case '.svg':
      return 'image/svg+xml';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

async function uploadFileToR2(localPath: string, key: string): Promise<boolean> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const mimeType = getMimeType(localPath);

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
      })
    );
    return true;
  } catch (err: any) {
    console.error(`Gagal upload ${key}:`, err.message);
    return false;
  }
}

async function sync() {
  const uploadBaseDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadBaseDir)) {
    console.error('❌ Folder public/uploads tidak ditemukan!');
    return;
  }

  const allFiles = getAllFiles(uploadBaseDir);
  console.log(`🚀 Ditemukan ${allFiles.length} file di public/uploads untuk diunggah ke R2...`);

  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Upload dengan concurrency batch (10 file bersamaan agar cepat)
  const BATCH_SIZE = 10;
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (filePath) => {
        // Tentukan key R2 relatif dari public/uploads/
        // contoh: public/uploads/salupangkang/artikel/foto.jpg -> salupangkang/artikel/foto.jpg
        const relativeKey = path.relative(uploadBaseDir, filePath).replace(/\\/g, '/');

        const ok = await uploadFileToR2(filePath, relativeKey);
        if (ok) {
          successCount++;
        } else {
          failCount++;
        }
      })
    );

    if ((i + BATCH_SIZE) % 100 < BATCH_SIZE || i + BATCH_SIZE >= allFiles.length) {
      const progress = Math.min(i + BATCH_SIZE, allFiles.length);
      console.log(`⏳ Progress upload: ${progress} / ${allFiles.length} (${Math.round((progress / allFiles.length) * 100)}%)`);
    }
  }

  console.log(`\n🎉 SINKRONISASI SELESAI!`);
  console.log(`✅ Berhasil: ${successCount}`);
  console.log(`❌ Gagal: ${failCount}`);
}

sync().catch(console.error);

