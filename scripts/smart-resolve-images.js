const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const baseBackup = 'C:/app/opensid/backup/backup_folder_desa_salupangkang.desa.id_2026_10_23';
const publicSalupangkang = 'C:/app/opensid/public/uploads/salupangkang';

// Build index of all files in backup
const allBackupFiles = new Map(); // normalized key -> absolute path

function indexDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      indexDir(full);
    } else {
      const lower = item.toLowerCase();
      if (!allBackupFiles.has(lower)) {
        allBackupFiles.set(lower, full);
      }
      // Also index with underscores replaced by spaces and vice versa
      const withSpaces = lower.replace(/_/g, ' ');
      const withUnderscores = lower.replace(/\s+/g, '_');
      if (!allBackupFiles.has(withSpaces)) allBackupFiles.set(withSpaces, full);
      if (!allBackupFiles.has(withUnderscores)) allBackupFiles.set(withUnderscores, full);

      // Also strip sedang_ and kecil_ prefixes
      const stripped = lower.replace(/^(sedang_|kecil_)[0-9]+_/i, '');
      if (!allBackupFiles.has(stripped)) allBackupFiles.set(stripped, full);
    }
  }
}

indexDir(baseBackup);
console.log(`Indexed ${allBackupFiles.size} lookup keys from backup folder.`);

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, title: true, content: true }
  });

  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let resolvedCount = 0;
  let stillMissing = 0;

  for (const a of articles) {
    let match;
    while ((match = imgRegex.exec(a.content)) !== null) {
      const src = match[1];
      if (src.includes('kemendesa.go.id')) continue; // External government site

      // Extract filename from src
      let cleanSrc = src
        .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/assets\/\.\.\/desa\/upload\//gi, '')
        .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/desa\/upload\//gi, '')
        .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/upload\//gi, '')
        .replace(/\/assets\/\.\.\/desa\/upload\//gi, '')
        .replace(/\/desa\/upload\//gi, '')
        .replace(/^\/uploads\/salupangkang\//, '');

      try {
        cleanSrc = decodeURIComponent(cleanSrc);
      } catch (e) {}

      const expectedDiskPath = path.join(publicSalupangkang, cleanSrc);
      if (fs.existsSync(expectedDiskPath)) {
        resolvedCount++;
        continue;
      }

      // Try finding the file in the index
      const baseName = path.basename(cleanSrc).toLowerCase();
      let foundPath = allBackupFiles.get(baseName);

      if (!foundPath) {
        // Try stripping prefixes or matching partial
        const stripped = baseName.replace(/^[0-9]+[_\s]/, '');
        foundPath = allBackupFiles.get(stripped);
      }

      if (foundPath && fs.existsSync(foundPath)) {
        // Ensure destination dir exists
        const destDir = path.dirname(expectedDiskPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(foundPath, expectedDiskPath);
        resolvedCount++;
        // console.log(`Copied: ${foundPath} -> ${expectedDiskPath}`);
      } else {
        stillMissing++;
        console.log('Still missing:', cleanSrc, 'in [', a.title, ']');
      }
    }
  }

  console.log(`\nResults: Successfully Resolved/Exist: ${resolvedCount}, Still Missing: ${stillMissing}`);
}

main().finally(() => prisma.$disconnect());
