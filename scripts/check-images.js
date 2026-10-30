const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id },
    select: { id: true, title: true, content: true, coverImageUrl: true }
  });

  const imgSources = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;

  for (const a of articles) {
    let match;
    while ((match = regex.exec(a.content)) !== null) {
      imgSources.push({
        articleId: a.id,
        title: a.title,
        src: match[1],
      });
    }
  }

  console.log('Total articles:', articles.length);
  console.log('Total img tags in article content:', imgSources.length);
  const uniqueSrc = Array.from(new Set(imgSources.map(i => i.src)));
  console.log('Total unique src:', uniqueSrc.length);
  console.log('Sample src (first 30):');
  uniqueSrc.slice(0, 30).forEach(s => console.log(' -', s));

  // Check how many coverImageUrl point to /images/salupangkang_heritage.jpg
  const defaultCovers = articles.filter(a => a.coverImageUrl === '/images/salupangkang_heritage.jpg');
  console.log('Articles with fallback /images/salupangkang_heritage.jpg cover:', defaultCovers.length);

  // Check how many coverImageUrl point to actual images that exist vs not exist
  let existsCount = 0;
  let missingCount = 0;
  for (const a of articles) {
    if (!a.coverImageUrl) continue;
    if (a.coverImageUrl.startsWith('/uploads/')) {
      const localPath = path.join('c:/app/opensid/public', a.coverImageUrl);
      if (fs.existsSync(localPath)) {
        existsCount++;
      } else {
        missingCount++;
        console.log('Missing cover file:', a.coverImageUrl, 'for article:', a.title);
      }
    }
  }
  console.log('Cover files check: Exists:', existsCount, 'Missing:', missingCount);
}

main().finally(() => prisma.$disconnect());
