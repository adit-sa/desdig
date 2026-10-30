const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('../lib/prisma-client-v2');
const prisma = new PrismaClient();

async function run() {
  const sourceDir = path.join(__dirname, '..', 'backup', 'Mepeed tradisi Budaya Bali');
  const targetDir = path.join(__dirname, '..', 'public', 'uploads', 'salupangkang', 'galeri');
  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir);
  console.log('Source files found:', files);

  const processedMedia = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const srcPath = path.join(sourceDir, file);
    const destName = `mepeed_tradisi_bali_${i + 1}_${Date.now()}.webp`;
    const destPath = path.join(targetDir, destName);

    const originalStat = fs.statSync(srcPath);
    const info = await sharp(srcPath)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(destPath);

    const savings = Math.round(((originalStat.size - info.size) / originalStat.size) * 100);
    console.log(`Compressed [${file}] (${(originalStat.size/1024).toFixed(1)} KB) -> [${destName}] (${(info.size/1024).toFixed(1)} KB) [Saved ${savings}%]`);

    const publicUrl = `/uploads/salupangkang/galeri/${destName}`;
    processedMedia.push({
      url: publicUrl,
      type: 'IMAGE',
      caption: `Tradisi Mepeed Budaya Bali di Salupangkang - Foto #${i + 1}`,
    });
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: 'salupangkang' } });
  if (!tenant) {
    console.error('Tenant salupangkang not found!');
    return;
  }

  const albumId = `gal_mepeed_${Date.now()}`;
  const title = 'Mepeed Tradisi Budaya Bali';
  const category = 'Budaya & Adat';
  const caption = 'Dokumentasi perayaan upacara dan tradisi Mepeed umat Hindu Paguyuban Adat Bali di Desa Salupangkang, memperlihatkan kekayaan harmoni budaya, kebersamaan, dan keindahan busana adat nusantara.';
  const mediaUrlsJson = JSON.stringify(processedMedia);

  await prisma.$executeRaw`
    INSERT INTO "GalleryItem" (
      "id", "tenantId", "title", "imageUrl", "category", "caption",
      "mediaType", "videoUrl", "mediaUrls", "takenAt", "createdAt", "updatedAt"
    )
    VALUES (
      ${albumId}, ${tenant.id}, ${title}, ${processedMedia[0].url}, ${category}, ${caption},
      'ALBUM', NULL, ${mediaUrlsJson}::jsonb,
      NOW(), NOW(), NOW()
    )
  `;

  console.log('✅ Successfully created gallery album entry:', albumId);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
