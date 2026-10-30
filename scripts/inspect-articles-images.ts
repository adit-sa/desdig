import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const salupangkang = await prisma.tenant.findUnique({
    where: { slug: 'salupangkang' },
  });
  if (!salupangkang) return;

  const articles = await prisma.article.findMany({
    where: { tenantId: salupangkang.id },
    select: {
      id: true,
      title: true,
      coverImageUrl: true,
      content: true,
    },
  });

  console.log(`Total artikel Salupangkang: ${articles.length}`);
  articles.forEach((a, i) => {
    console.log(`\n--- [${i + 1}] ID: ${a.id} | ${a.title} ---`);
    console.log(`Cover: ${a.coverImageUrl}`);
    const imgMatches = a.content ? a.content.match(/<img[^>]+src=["']([^"']+)["']/g) : null;
    if (imgMatches) {
      console.log(`Content images:`, imgMatches);
    }
  });
}

main().finally(() => prisma.$disconnect());
