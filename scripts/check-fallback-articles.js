const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function checkFallbackArticles() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'salupangkang' } });
  const articles = await prisma.article.findMany({
    where: {
      tenantId: tenant.id,
      OR: [
        { coverImageUrl: null },
        { coverImageUrl: '/images/salupangkang_heritage.jpg' }
      ]
    },
    select: { id: true, title: true, slug: true, content: true, coverImageUrl: true }
  });

  console.log(`Found ${articles.length} articles with fallback / missing cover image.`);
  
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  let hasImageInContent = 0;

  for (const a of articles) {
    const match = imgRegex.exec(a.content);
    if (match) {
      hasImageInContent++;
      console.log(`[HAS CONTENT IMAGE] "${a.title}" -> ${match[1]}`);
    } else {
      console.log(`[NO IMAGE IN CONTENT] "${a.title}" (slug: ${a.slug})`);
    }
  }

  console.log(`Summary: ${hasImageInContent} out of ${articles.length} have images in content.`);
}

checkFallbackArticles().finally(() => prisma.$disconnect());
