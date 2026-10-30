const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function testRewriteImages() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, title: true, content: true }
  });

  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let totalImgs = 0;
  let matchedFiles = 0;
  let missingFiles = [];

  for (const a of articles) {
    let match;
    while ((match = imgRegex.exec(a.content)) !== null) {
      totalImgs++;
      const originalSrc = match[1];
      
      // Clean and normalize URL
      let cleanSrc = originalSrc
        .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/assets\/\.\.\/desa\/upload\//gi, '/uploads/salupangkang/')
        .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/desa\/upload\//gi, '/uploads/salupangkang/')
        .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/upload\//gi, '/uploads/salupangkang/')
        .replace(/\/assets\/\.\.\/desa\/upload\//gi, '/uploads/salupangkang/')
        .replace(/\/desa\/upload\//gi, '/uploads/salupangkang/');

      // Decode URI components (e.g. %20 -> space)
      let decodedPath = cleanSrc;
      try {
        decodedPath = decodeURIComponent(cleanSrc);
      } catch (e) {}

      if (decodedPath.startsWith('/uploads/salupangkang/')) {
        const localPath = path.join('c:/app/opensid/public', decodedPath);
        if (fs.existsSync(localPath)) {
          matchedFiles++;
        } else {
          missingFiles.push({
            article: a.title,
            original: originalSrc,
            cleaned: decodedPath,
          });
        }
      } else {
        missingFiles.push({
          article: a.title,
          original: originalSrc,
          cleaned: decodedPath,
        });
      }
    }
  }

  console.log(`Total images found: ${totalImgs}`);
  console.log(`Matched on disk after rewrite: ${matchedFiles}`);
  console.log(`Missing or external: ${missingFiles.length}`);
  console.log('\nSample missing or external (up to 20):');
  missingFiles.slice(0, 20).forEach(m => console.log(' -', m.cleaned, '(', m.original, ') in [', m.article, ']'));
}

testRewriteImages().finally(() => prisma.$disconnect());
