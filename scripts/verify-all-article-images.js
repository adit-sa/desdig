const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function verifyAllArticleImages() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, title: true, coverImageUrl: true, content: true }
  });

  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let totalChecked = 0;
  let missing = [];

  for (const a of articles) {
    // Check cover
    if (a.coverImageUrl && a.coverImageUrl.startsWith('/')) {
      totalChecked++;
      const local = path.join('c:/app/opensid/public', decodeURIComponent(a.coverImageUrl));
      if (!fs.existsSync(local)) {
        missing.push({ type: 'cover', article: a.title, url: a.coverImageUrl });
      }
    }

    // Check content images
    let match;
    while ((match = imgRegex.exec(a.content)) !== null) {
      const src = match[1];
      if (src.startsWith('/')) {
        totalChecked++;
        const local = path.join('c:/app/opensid/public', decodeURIComponent(src));
        if (!fs.existsSync(local)) {
          missing.push({ type: 'content', article: a.title, url: src });
        }
      }
    }
  }

  console.log(`Total local images checked: ${totalChecked}`);
  console.log(`Missing count: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Sample missing (up to 15):', missing.slice(0, 15));
  }
}

verifyAllArticleImages().finally(() => prisma.$disconnect());
