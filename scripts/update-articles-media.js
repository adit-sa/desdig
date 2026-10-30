const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function updateArticlesContentAndCovers() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articles = await prisma.article.findMany({
    where: { tenantId: tenant.id },
  });

  console.log(`Processing ${articles.length} articles for tenant ${tenant.namaDesa}...`);

  let updatedContentCount = 0;
  let updatedCoverCount = 0;

  for (const article of articles) {
    let content = article.content;
    let originalContent = content;

    // Replace all variations of legacy/external domains in content img src and a href
    content = content
      .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/assets\/\.\.\/desa\/upload\//gi, '/uploads/salupangkang/')
      .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/desa\/upload\//gi, '/uploads/salupangkang/')
      .replace(/https?:\/\/(v[1-3]\.)?salupangkang\.desa\.id\/upload\//gi, '/uploads/salupangkang/')
      .replace(/\/assets\/\.\.\/desa\/upload\//gi, '/uploads/salupangkang/')
      .replace(/\/desa\/upload\//gi, '/uploads/salupangkang/');

    // Check if coverImageUrl can be updated
    let coverImageUrl = article.coverImageUrl;
    if (!coverImageUrl || coverImageUrl === '/images/salupangkang_heritage.jpg') {
      // Check if there is an img in content
      const imgMatch = /<img[^>]+src=["']([^"']+)["']/i.exec(content);
      if (imgMatch && imgMatch[1]) {
        const potentialCover = imgMatch[1];
        // If it's a local upload, check if exists or use it
        coverImageUrl = potentialCover;
        updatedCoverCount++;
        console.log(`Updated cover for "${article.title}" -> ${coverImageUrl}`);
      }
    }

    if (content !== originalContent || coverImageUrl !== article.coverImageUrl) {
      await prisma.article.update({
        where: { id: article.id },
        data: {
          content,
          coverImageUrl,
        },
      });
      if (content !== originalContent) updatedContentCount++;
    }
  }

  console.log(`Finished: ${updatedContentCount} articles had content updated.`);
  console.log(`Finished: ${updatedCoverCount} articles had coverImageUrl updated.`);
}

updateArticlesContentAndCovers().finally(() => prisma.$disconnect());
