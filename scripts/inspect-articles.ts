import { prisma } from '../lib/prisma';

async function main() {
  const articles = await prisma.article.findMany({
    select: { id: true, title: true, coverImageUrl: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  console.log(`Found ${articles.length} sample articles:`);
  articles.forEach(a => {
    console.log(`- [${a.id}] ${a.title} -> coverImageUrl: ${a.coverImageUrl}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
