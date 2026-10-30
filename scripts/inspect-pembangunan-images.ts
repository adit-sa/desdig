import { prisma } from '../lib/prisma';

async function main() {
  const p = await prisma.$queryRawUnsafe<any[]>(`SELECT id, judul, "tahunAnggaran" FROM "DevelopmentProject" ORDER BY "tahunAnggaran" DESC, "createdAt" DESC LIMIT 15`);
  console.log('Top 15 projects:', p);
}

main().catch(console.error).finally(() => prisma.$disconnect());
