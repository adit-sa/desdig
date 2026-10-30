import { PrismaClient } from '../lib/prisma-client-v4';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    include: {
      officials: true,
      developmentProjects: true,
      articles: true,
    },
  });

  for (const t of tenants) {
    const residentCount = await prisma.resident.count({ where: { tenantId: t.id } });
    console.log(`\n=== DESA: ${t.namaDesa} (slug: ${t.slug}, kode: ${t.kodeDesa}) ===`);
    console.log(`- Total Aparatur: ${t.officials.length}`);
    console.log(`- Total Penduduk: ${residentCount}`);
    console.log(`- Total Pembangunan: ${t.developmentProjects.length}`);
    console.log(`- Total Berita: ${t.articles.length}`);
    if (t.officials.length > 0) {
      console.log('  Contoh Pamong:', t.officials.slice(0, 3).map(o => `${o.name} (${o.position})`));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
